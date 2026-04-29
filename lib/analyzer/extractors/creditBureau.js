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

  // Real reports emit dense account-history sections where a full tradeline
  // spans many lines. Group each full block first, then classify fields from
  // the block. This prevents address/contact fragments from becoming accounts.
  for (const block of splitStructuredTradelineBlocks(text, parsedAccountSpans)) {
    pushTradeline({ text, blockText: block.text, span: block.span, accountName: block.accountName, accounts, collections });
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
const ISSUER_KEYWORD_RE = /\b(BANK|CARD|CAPITAL\s+ONE|SYNCB|WELLS\s+FARGO|KOVO|CHASE|CITI|DISCOVER|AMEX|AMERICAN\s+EXPRESS|CAP\s+ONE|NAVY\s+FCU|CREDIT\s+ONE|ONEMAIN|ALLY|SANTANDER|TD\s+BANK|US\s+BANK|WFBNA)\b/i;
const SECTION_STOP_RE = /^(?:Public Information|Public Records|Collections|Inquiries|Creditor Contacts?|Contact|SUMMARY OF RIGHTS|FRAUD VICTIM RIGHTS|Satisfactory Accounts)\b/i;
const FIELD_LINE_RE = /^(?:Account Information|Account Holder|Account Type|Account Condition|Account Number|Address|Phone|Date Opened|Responsibility|Loan Type|Balance|Date Updated|Last Payment Made|Pay Status|Terms|Date Closed|High Balance|Credit Limit|Payment History|Status|Account Status|Payment Status|Amount Past Due|Past Due|Comments?|Remarks?|Contact|Location|Requested On)\b/i;
const NON_ACCOUNT_LINE_RE = /\b(PO\s*BOX|P\.?\s*O\.?\s*BOX|ATTN|FCRA|DISPUTES?|Prepared for|Confirmation\s*#|Narrative Code)\b|Page\s+\d+\s+of\b|\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}/i;
const ADDRESS_STATE_RE = /,\s*(?:A[LKZR]|C[AOT]|D[CE]|FL|GA|HI|I[ADLN]|K[SY]|LA|M[ADEINOST]|N[CDEHJMVY]|O[HKR]|PA|RI|S[CD]|T[NX]|UT|V[AIT]|W[AIVY])\s+\d{5}(?:-\d{4})?\b/i;
const PAYMENT_LEGEND_RE = /OKCurrent3030 Days Late|COCharge-Off|No Data Available|NGNegativeNANot Available/i;
const STATUS_KEYWORD_RE = /\b(charge[_-\s]?off|charged\s*off|collection|past due|delinquent|pays as agreed|paid as agreed|repossession|foreclosure|30\s*days?\s*late|60\s*days?\s*late|90\s*days?\s*late|120\s*days?\s*late)\b/i;

function isNonAccountLine(line) {
  const trimmed = String(line || '').trim();
  return !trimmed ||
    NON_ACCOUNT_LINE_RE.test(trimmed) ||
    ADDRESS_STATE_RE.test(trimmed) ||
    PAYMENT_LEGEND_RE.test(trimmed);
}

function compactCreditorName(value) {
  const cleaned = String(value || '')
    .replace(/\b(?:Account|Creditor|Furnisher|Subscriber|Company|Name)\s*:?\s*/ig, '')
    .replace(/\d[\dXx* -]{2,}.*$/, '')
    .replace(/\s*\((?:closed|open)\)\s*$/i, '')
    .replace(/[^A-Za-z0-9 &/.'-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned.length >= 3 ? cleaned : '';
}

function extractTradelineStartName(line) {
  const trimmed = String(line || '').trim();
  if (!trimmed || isNonAccountLine(trimmed) || SECTION_STOP_RE.test(trimmed) || FIELD_LINE_RE.test(trimmed)) return null;

  let match = trimmed.match(/^Account\s*:\s*(.+?)\s*$/i);
  if (match) return compactCreditorName(match[1]);

  match = trimmed.match(/^(?:Account|Creditor|Furnisher|Subscriber|Company|Account Name|Creditor Name)\s*:?\s*(.+?)\s*$/i);
  if (match) return compactCreditorName(match[1]);

  match = trimmed.match(/^\d+\.\d+\s+(.+?)\s*$/);
  if (match) return compactCreditorName(match[1]);

  match = trimmed.match(/^Account\s+\d+.*$/i);
  if (match) return null;

  match = trimmed.match(/^Account([A-Z][A-Z0-9 &/.'-]{2,})(?:$|\d|[A-Z]{2,})/);
  if (match) return compactCreditorName(match[1]);

  match = trimmed.match(/^([A-Z][A-Z0-9 &/.'-]{2,}?)(?:\d|x|X|\*){3,}.*$/);
  if (match) return compactCreditorName(match[1]);

  const allCapsCreditor = /^[A-Z0-9 &/.'-]{5,80}$/.test(trimmed) && ISSUER_KEYWORD_RE.test(trimmed);
  if (allCapsCreditor) return compactCreditorName(trimmed);

  return null;
}

function buildStructuredBlock(text, current) {
  const rawLines = current.lines.map((entry) => entry.raw);
  const accountName = current.accountName ||
    rawLines.map(extractTradelineStartName).find(Boolean) ||
    '';
  if (!accountName) return null;

  const filteredLines = rawLines.filter((line, index) =>
    index === 0 ||
    !isNonAccountLine(line)
  );
  const usefulLines = filteredLines.filter((line) => {
    const trimmed = line.trim();
    return trimmed &&
      !SECTION_STOP_RE.test(trimmed) &&
      !/^Creditor NameAddressPhone Number$/i.test(trimmed);
  });
  if (usefulLines.length < 2) return null;

  const blockText = usefulLines.join('\n');
  if (!/\b(Status|Pay Status|Account Status|Balance|Account Type|Loan Type|Payment History|Past Due|Charge[-\s]?Off|Collection|Delinquent)\b/i.test(blockText)) {
    return null;
  }

  return {
    start: current.start,
    end: current.end,
    text: blockText,
    accountName,
    rawLines,
    span: { start: current.start, end: current.end, text: blockText },
  };
}

function splitStructuredTradelineBlocks(text, existingSpans = []) {
  const blocks = [];
  const lines = String(text || '').split('\n');
  let cursor = 0;
  let current = null;
  let blankCount = 0;
  let inContactSection = false;

  for (const rawLine of lines) {
    const lineLength = rawLine.length + 1;
    const trimmed = rawLine.trim();
    const lineStart = cursor;
    const lineEnd = cursor + rawLine.length;

    if (/^(?:Creditor Contacts?|Contact|Location)$/i.test(trimmed)) {
      inContactSection = true;
    }
    if (/^(?:Account History|Accounts with Adverse Information|Credit Accounts|Derogatory Information|Satisfactory Accounts)\b/i.test(trimmed)) {
      inContactSection = false;
    }

    if (!trimmed) {
      blankCount += 1;
      if (current && blankCount >= 2) {
        const block = buildStructuredBlock(text, current);
        if (block) blocks.push(block);
        current = null;
      }
      cursor += lineLength;
      continue;
    }

    const possibleStartName = extractTradelineStartName(trimmed);
    const strongAccountAnchor =
      /^\d+\.\d+\s+/.test(trimmed) ||
      /^Account\s+\d+/i.test(trimmed) ||
      /^Account[A-Z]/.test(trimmed) ||
      /(?:\d|x|X|\*){3,}/.test(trimmed);
    const startName = inContactSection && !strongAccountAnchor ? null : possibleStartName;
    if (startName && strongAccountAnchor) {
      inContactSection = false;
    }
    if (startName && current) {
      const block = buildStructuredBlock(text, current);
      if (block) blocks.push(block);
      current = null;
    }
    if (startName) {
      current = { start: lineStart, end: lineEnd, accountName: startName, lines: [{ raw: rawLine, start: lineStart, end: lineEnd }] };
      blankCount = 0;
      cursor += lineLength;
      continue;
    }

    if (current) {
      current.lines.push({ raw: rawLine, start: lineStart, end: lineEnd });
      current.end = lineEnd;
    }
    blankCount = 0;
    cursor += lineLength;
  }

  if (current) {
    const block = buildStructuredBlock(text, current);
    if (block) blocks.push(block);
  }

  return blocks.filter((block) =>
    block.text.trim().length > 0 &&
    !existingSpans.some((span) => block.start >= span.start && block.start < span.end)
  );
}

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

function extractStrictStatus(blockText, fields) {
  const fieldStatus = getField(fields, 'Status', 'Account Status', 'Account Condition', 'Pay Status', 'Payment Status');
  if (fieldStatus) return fieldStatus.toLowerCase().replace(/_/g, ' ');

  for (const rawLine of String(blockText || '').split('\n')) {
    const line = rawLine.trim();
    if (!line || isNonAccountLine(line) || PAYMENT_LEGEND_RE.test(line)) continue;
    const explicitStatus = line.match(/(?:Status|Pay Status|Payment Status|Account Status|Account Condition)\s*:?\s*(.+)$/i);
    if (explicitStatus?.[1]) return explicitStatus[1].trim().toLowerCase().replace(/_/g, ' ');
    const keyword = line.match(STATUS_KEYWORD_RE);
    if (keyword) return keyword[0].trim().toLowerCase().replace(/_/g, ' ');
  }
  return '';
}

function extractStrictBalance(blockText, fields) {
  const fieldBalance = getField(fields, 'Balance', 'Current Balance', 'Balance Owed', 'Amount Owed', 'Reported Balance', 'Account Balance');
  if (fieldBalance) return fieldBalance;
  for (const rawLine of String(blockText || '').split('\n')) {
    const line = rawLine.trim();
    if (!line || isNonAccountLine(line)) continue;
    if (/\$[\d,]+(?:\.\d{2})?/.test(line)) {
      const match = line.match(/\$[\d,]+(?:\.\d{2})?/);
      if (match) return match[0];
    }
  }
  return '';
}

export function pushTradeline({ blockText, span, accountName, accounts, collections, defaultBureau = '' }) {
  const fields = parseKeyValueLines(blockText);
  const bureau = getField(fields, 'Bureau') || defaultBureau;
  const status = extractStrictStatus(blockText, fields);
  const accountType = getField(fields, 'Account Type', 'Type') ||
    getLooseField(blockText, ['Account Type', 'Type', 'Loan Type']);
  const paymentStatus = getField(fields, 'Payment Status', 'Pay Status', 'Status Details', 'Payment Rating') ||
    getLooseField(blockText, ['Payment Status', 'Pay Status', 'Payment Rating']);
  const remarks = getField(fields, 'Remarks', 'Remark', 'Comments', 'Comment', 'Account Remarks') ||
    getLooseField(blockText, ['Remarks', 'Remark', 'Comments', 'Comment']);
  const balance = extractStrictBalance(blockText, fields);
  const pastDue = getField(fields, 'Past Due', 'Past Due Amount', 'Amount Past Due') ||
    getLooseField(blockText, ['Amount Past Due', 'Past Due']);
  const creditLimit = getField(fields, 'Credit Limit', 'High Credit', 'Credit Line');
  const accountNumber = getField(fields, 'Account Number', 'Account #', 'Acct #');
  const paymentHistory = getField(fields, 'Payment History', 'Pay History', 'Payment Pattern', 'Payment Record') ||
    getLooseField(blockText, ['Payment History', 'Payment Record']) ||
    (/(\b(?:30|60|90|120)\s*days?\s*late\b|past due|delinquent)/i.test(paymentStatus) ? paymentStatus : '') ||
    (/(\b(?:30|60|90|120)\s*days?\s*late\b|past due|delinquent)/i.test(remarks) ? remarks : '');
  const originalCreditor = getField(fields, 'Original Creditor');
  const combined = `${accountType} ${status} ${paymentStatus} ${remarks}`;
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

  const isCollectionAccount = status.includes('collection');

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
