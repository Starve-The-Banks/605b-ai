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
  for (const block of blocks) {
    const firstLine = block.text.split('\n', 1)[0] || '';
    const accountMatch = firstLine.match(/^Account:\s*(.+?)\s*$/);
    if (!accountMatch) continue;
    const accountName = accountMatch[1].trim();
    const fields = parseKeyValueLines(block.text);

    const span = makeSpan(text, block.start, block.end);
    const bureau = getField(fields, 'Bureau');
    const status = getField(fields, 'Status');
    const accountType = getField(fields, 'Account Type');
    const paymentStatus = getField(fields, 'Payment Status');
    const balance = getField(fields, 'Balance');
    const creditLimit = getField(fields, 'Credit Limit');
    const paymentHistory = getField(fields, 'Payment History');
    const originalCreditor = getField(fields, 'Original Creditor');

    const isCollectionAccount =
      /collection/i.test(accountType) ||
      /collection/i.test(status) ||
      /collection/i.test(paymentStatus);

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
        balance,
        dateAssigned: getField(fields, 'Date Assigned', 'Date Reported'),
        paymentStatus,
        fields,
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
        paymentStatus,
        balance,
        creditLimit,
        paymentHistory,
        fields,
      });
    }
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
