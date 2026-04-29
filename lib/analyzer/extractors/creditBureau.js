import {
  makeItemId,
  makeSpan,
  splitBlocks,
  parseKeyValueLines,
  splitTopLevelSections,
  getField,
  isNoneMarker,
  detectFraudMarkers,
} from './utils.js';

/**
 * Credit-bureau extractor. Handles the canonical Equifax / Experian / TransUnion
 * layout used by the existing fixtures and most real reports we have seen:
 *   "Account: <name>" anchors a block of "Key: Value" lines separated by
 *   blank lines, with optional trailing summary headers like
 *   "Public Records:", "Collections:", "Derogatory Accounts:", "Inquiries:".
 *
 * Returns an ExtractedReport (without reportType/reportSource — the dispatcher
 * fills those in based on detectConsumerReportType).
 */
export function extractCreditBureauReport(text, ctx) {
  const accounts = [];
  const collections = [];
  const inquiries = [];
  const publicRecords = [];
  const fraudMarkers = [];
  const remarks = [];
  const sectionsFound = [];

  let reportDate = null;
  const reportDateMatch = text.match(/Report\s*Date:\s*([^\n]+)/i);
  if (reportDateMatch) reportDate = reportDateMatch[1].trim();

  // === per-account blocks anchored by "Account: <name>" ===
  const blocks = splitBlocks(text);
  const parsedAccountSpans = [];
  for (const block of blocks) {
    const firstLine = block.text.split('\n', 1)[0] || '';
    const accountMatch = firstLine.match(/^Account:\s*(.+?)\s*$/);
    if (!accountMatch) continue;
    const accountName = accountMatch[1].trim();
    const span = makeSpan(text, block.start, block.end);
    parsedAccountSpans.push(span);
    pushTradeline({ text, blockText: block.text, span, accountName, accounts, collections });
  }

  // Real reports often emit dense tradeline sections without blank lines and
  // without the exact "Account:" anchor. Scan line-by-line for common account
  // name labels, then group until the next account label.
  for (const block of splitDenseTradelineBlocks(text, parsedAccountSpans)) {
    const fields = parseKeyValueLines(block.text);
    const accountName = getAccountName(fields);
    if (!accountName) continue;
    pushTradeline({ text, blockText: block.text, span: makeSpan(text, block.start, block.end), accountName, accounts, collections });
  }
  for (const block of splitNumberedAccountBlocks(text, parsedAccountSpans)) {
    pushTradeline({ text, blockText: block.text, span: makeSpan(text, block.start, block.end), accountName: block.accountName, accounts, collections });
  }
  for (const block of splitMaskedAccountBlocks(text, parsedAccountSpans)) {
    pushTradeline({ text, blockText: block.text, span: makeSpan(text, block.start, block.end), accountName: block.accountName, accounts, collections });
  }

  // === top-level summary sections (Inquiries, Public Records, Collections, Fraud Alerts) ===
  const sections = splitTopLevelSections(text);
  for (const section of sections) {
    sectionsFound.push(section.label);
    const labelLower = section.label.toLowerCase();

    if (/^inquiries/.test(labelLower)) {
      // Each non-blank line is one inquiry. We skip:
      //  - "None" markers
      //  - "<Key>: <Value>" trailing summary lines (e.g. "Fraud Alerts: None")
      //    that follow the inquiry list when no further header is present.
      let cursor = section.start;
      for (const rawLine of section.text.split('\n')) {
        const lineLength = rawLine.length + 1;
        const trimmed = rawLine.trim();
        if (!trimmed || isNoneMarker(trimmed)) {
          cursor += lineLength;
          continue;
        }
        // Lines like "Fraud Alerts: None" / "Consumer Disputes: None" are
        // trailing summary lines that lived past our header detection.
        if (/^[A-Z][A-Za-z ]{2,40}:\s*\S/.test(trimmed) && !/inquiry/i.test(trimmed)) {
          cursor += lineLength;
          continue;
        }
        const lineStart = cursor;
        const lineEnd = cursor + rawLine.length;
        const span = makeSpan(text, lineStart, lineEnd);
        const dateMatch = trimmed.match(/(\d{2}\/\d{2}\/\d{2,4})/);
        const creditor = trimmed.replace(/(?:hard|soft)?\s*inquiry.*$/i, '').trim() || trimmed;
        inquiries.push({
          itemId: makeItemId('inquiry', span),
          itemKind: 'inquiry',
          span,
          bureau: '',
          source: '',
          creditor,
          inquiryDate: dateMatch ? dateMatch[1] : '',
          inquiryType: /soft/i.test(trimmed) ? 'soft' : /hard/i.test(trimmed) ? 'hard' : '',
          fraudMarker: /\b(fraud|identity theft|unauthorized|not mine|did not authorize|unknown inquiry|suspicious)\b/i.test(trimmed),
          fields: { line: trimmed },
        });
        cursor += lineLength;
      }
    } else if (/^public records/.test(labelLower)) {
      const body = section.text.trim();
      if (body && !isNoneMarker(body)) {
        const span = makeSpan(text, section.start, section.end);
        publicRecords.push({
          itemId: makeItemId('public_record', span),
          itemKind: 'public_record',
          span,
          bureau: '',
          source: 'public records',
          recordType: body.split('\n')[0].slice(0, 80),
          status: '',
          fields: { body },
        });
      }
    } else if (/^remarks/.test(labelLower)) {
      const body = section.text.trim();
      if (body) {
        const span = makeSpan(text, section.start, section.end);
        remarks.push({
          itemId: makeItemId('remark', span),
          itemKind: 'remark',
          span,
          bureau: '',
          source: 'remarks',
          remarkText: body.slice(0, 400),
          fields: { body },
        });
      }
    }
  }

  // Global typed-marker detection. Replaces the legacy per-section parser
  // so freezes / locks / alerts are caught no matter where they appear.
  for (const detected of detectFraudMarkers(text)) {
    fraudMarkers.push({
      itemId: makeItemId('fraud', detected.span),
      itemKind: 'fraud',
      span: detected.span,
      bureau: '',
      source: 'consumer report',
      type: detected.type,
      marker: detected.marker,
      context: detected.context,
      confidence: detected.confidence,
      fields: { line: detected.marker },
    });
  }

  void ctx;
  return {
    reportDate,
    consumerId: null,
    personalInfo: { names: [], addresses: [], partialSSNs: [], dobs: [] },
    accounts,
    collections,
    inquiries,
    publicRecords,
    bankingItems: [],
    remarks,
    fraudMarkers,
    sectionsFound,
  };
}

const ACCOUNT_ANCHOR_RE = /^(?:Account\s*:\s*(.+?)|Account Name\s*:?\s*(.+?)|Creditor Name\s*:?\s*(.+?)|Creditor\s*:?\s*(.+?)|Furnisher\s*:?\s*(.+?)|Subscriber\s*:?\s*(.+?)|Company\s*:?\s*(.+?))\s*$/i;

export function splitDenseTradelineBlocks(text, existingSpans = []) {
  const blocks = [];
  const lines = String(text || '').split('\n');
  let cursor = 0;
  let current = null;

  for (const rawLine of lines) {
    const lineLength = rawLine.length + 1;
    const trimmed = rawLine.trim();
    const isAnchor = ACCOUNT_ANCHOR_RE.test(trimmed);
    const isSummary = /^(Public Records|Collections|Fraud Alerts|Security Freeze|Credit Freeze|Inquiries)\s*:/i.test(trimmed);

    if ((isAnchor || isSummary) && current) {
      blocks.push({ start: current.start, end: cursor, text: text.slice(current.start, cursor) });
      current = null;
    }
    if (isAnchor) {
      current = { start: cursor };
    }
    cursor += lineLength;
  }

  if (current) {
    blocks.push({ start: current.start, end: text.length, text: text.slice(current.start, text.length) });
  }

  return blocks.filter((block) =>
    block.text.trim().length > 0 &&
    !existingSpans.some((span) => block.start >= span.start && block.start < span.end)
  );
}

export function getAccountName(fields) {
  return getField(fields, 'Account', 'Account Name', 'Creditor Name', 'Creditor', 'Furnisher', 'Subscriber', 'Company');
}

function splitNumberedAccountBlocks(text, existingSpans) {
  return splitByAnchor(text, existingSpans, (line) => {
    const match = line.match(/^\d+\.\d+\s+(.+?)\s*$/);
    if (!match) return null;
    const name = match[1].replace(/\s*\((?:closed|open)\)\s*$/i, '').trim();
    return name.length > 1 ? name : null;
  });
}

function splitMaskedAccountBlocks(text, existingSpans) {
  return splitByAnchor(text, existingSpans, (line) => {
    if (/^(Account Name|Account Information|Payment History|Rating|Balance|Past Due|Address|Phone)\b/i.test(line)) return null;
    const match = line.match(/^([A-Z][A-Z0-9 &/.'-]{2,}?)(?:\d|x|X|\*){3,}.*$/);
    return match ? match[1].trim() : null;
  });
}

function splitByAnchor(text, existingSpans, getAnchorName) {
  const blocks = [];
  const lines = String(text || '').split('\n');
  let cursor = 0;
  let current = null;

  for (const rawLine of lines) {
    const lineLength = rawLine.length + 1;
    const trimmed = rawLine.trim();
    const anchorName = getAnchorName(trimmed);
    if (anchorName && current) {
      blocks.push({ ...current, end: cursor, text: text.slice(current.start, cursor) });
      current = null;
    }
    if (anchorName) {
      current = { start: cursor, accountName: anchorName };
    }
    cursor += lineLength;
  }
  if (current) {
    blocks.push({ ...current, end: text.length, text: text.slice(current.start, text.length) });
  }
  return blocks.filter((block) =>
    block.text.trim().length > 0 &&
    !existingSpans.some((span) => block.start >= span.start && block.start < span.end)
  );
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getLooseField(blockText, labels) {
  for (const label of labels) {
    const pattern = new RegExp(`${escapeRegExp(label)}\\\\s*:?\\\\s*([\\\\s\\\\S]*?)(?=\\\\n?(?:Account Number|Account Type|Responsibility|Date Opened|Status Updated|Status|Balance Updated|Balance|Recent Payment|Monthly Payment|Credit Limit|Highest Balance|High Credit|Terms|On Record Until|Payment History|Comments?|Remarks?|Date Updated|Last Payment Made|Pay Status|Date Closed|Past Due|Amount Past Due|Date Reported|Loan Type|Activity Designator|Deferred Payment Start Date|Balloon Payment Date|$))`, 'i');
    const match = blockText.match(pattern);
    if (match?.[1]) {
      return match[1].replace(/\n/g, ' ').trim();
    }
  }
  return '';
}

export function pushTradeline({ blockText, span, accountName, accounts, collections, defaultBureau = '' }) {
  const fields = parseKeyValueLines(blockText);
  const bureau = getField(fields, 'Bureau') || defaultBureau;
  const status = getField(fields, 'Status', 'Account Status', 'Account Condition') ||
    getLooseField(blockText, ['Account Status', 'Status', 'Pay Status']);
  const accountType = getField(fields, 'Account Type', 'Type') ||
    getLooseField(blockText, ['Account Type', 'Type', 'Loan Type']);
  const paymentStatus = getField(fields, 'Payment Status', 'Pay Status', 'Status Details', 'Payment Rating') ||
    getLooseField(blockText, ['Payment Status', 'Pay Status', 'Payment Rating']);
  const remarks = getField(fields, 'Remarks', 'Remark', 'Comments', 'Comment', 'Account Remarks') ||
    getLooseField(blockText, ['Remarks', 'Remark', 'Comments', 'Comment']);
  const balance = getField(fields, 'Balance', 'Current Balance', 'Balance Owed', 'Amount Owed') ||
    getLooseField(blockText, ['Reported Balance', 'Current Balance', 'Balance']);
  const pastDue = getField(fields, 'Past Due', 'Past Due Amount', 'Amount Past Due') ||
    getLooseField(blockText, ['Amount Past Due', 'Past Due']);
  const creditLimit = getField(fields, 'Credit Limit', 'High Credit', 'Credit Line');
  const accountNumber = getField(fields, 'Account Number', 'Account #', 'Acct #');
  const paymentHistory = getField(fields, 'Payment History', 'Pay History', 'Payment Pattern', 'Payment Record') ||
    getLooseField(blockText, ['Payment History', 'Payment Record']) ||
    (/(\b(?:30|60|90|120)\s*days?\s*late\b|past due|delinquent)/i.test(paymentStatus) ? paymentStatus : '') ||
    (/(\b(?:30|60|90|120)\s*days?\s*late\b|past due|delinquent)/i.test(remarks) ? remarks : '');
  const originalCreditor = getField(fields, 'Original Creditor');
  const combined = `${accountType} ${status} ${paymentStatus} ${remarks} ${span.text}`;
  const confidenceSignals = [accountName, status || paymentStatus, balance || pastDue || paymentHistory || remarks]
    .filter((value) => typeof value === 'string' && value.trim()).length;
  const extractionConfidence = confidenceSignals >= 3 ? 0.9 : confidenceSignals >= 2 ? 0.72 : 0.45;
  const normalized = {
    bureau,
    accountType,
    accountStatus: status,
    payStatus: paymentStatus,
    pastDue,
    paymentHistory,
    remarks,
    accountNumberSuffix: accountNumber ? accountNumber.slice(-4) : '',
    sourceSpan: span.text,
    sourceOffset: span.start,
    extractionConfidence,
  };

  const isCollectionAccount =
    /collection|placed for collection/i.test(combined) ||
    /charge[-\s]?off|charged\s*off/i.test(combined);

  if (isCollectionAccount) {
    collections.push({
      itemId: makeItemId('collection', span),
      itemKind: 'collection',
      span,
      bureau,
      source: bureau,
      furnisher: originalCreditor || accountName,
      accountName,
      originalCreditor,
      status,
      accountType,
      balance,
      pastDue,
      dateAssigned: getField(fields, 'Date Assigned', 'Date Reported'),
      dateOpened: getField(fields, 'Date Opened', 'Opened'),
      dateReported: getField(fields, 'Date Reported', 'Reported'),
      paymentStatus,
      remarks,
      fields,
      ...normalized,
    });
  } else {
    accounts.push({
      itemId: makeItemId('account', span),
      itemKind: 'account',
      span,
      bureau,
      source: bureau,
      furnisher: accountName,
      accountName,
      status,
      accountType,
      paymentStatus,
      balance,
      pastDue,
      creditLimit,
      dateOpened: getField(fields, 'Date Opened', 'Opened'),
      dateReported: getField(fields, 'Date Reported', 'Reported'),
      paymentHistory,
      remarks,
      fields,
      ...normalized,
    });
  }
}
