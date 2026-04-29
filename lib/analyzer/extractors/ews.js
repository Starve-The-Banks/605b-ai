import {
  makeItemId,
  makeSpan,
  splitTopLevelSections,
  parseKeyValueLines,
  getField,
  isNoneMarker,
  hasNegativeMarker,
  detectFraudMarkers,
} from './utils.js';

/**
 * Early Warning Services extractor. Layout:
 *   "Banking history:", "Deposit Account Information:",
 *   "Participating bank inquiry:".
 *
 * Positive markers: "Status: Open and in good standing", "Unpaid Balance: $0",
 * "Suspected Fraud: None", "Account Abuse: None".
 * Negative markers: anything in NEGATIVE_MARKER_RE inside Banking history or
 * Deposit Account sections after the "None" guard is applied.
 */
export function extractEwsReport(text, ctx) {
  const inquiries = [];
  const bankingItems = [];
  const fraudMarkers = [];
  const sectionsFound = [];

  let reportDate = null;
  const reportDateMatch = text.match(/Report\s*Date:\s*([^\n]+)/i);
  if (reportDateMatch) reportDate = reportDateMatch[1].trim();

  const sections = splitTopLevelSections(text);
  for (const section of sections) {
    sectionsFound.push(section.label);
    const labelLower = section.label.toLowerCase();

    if (/^banking history/.test(labelLower) || /^deposit account/.test(labelLower)) {
      const body = section.text.trim();
      if (!body) continue;
      const fields = parseKeyValueLines(section.text);
      const span = makeSpan(text, section.start, section.end);
      const item = {
        itemId: makeItemId('banking', span),
        itemKind: 'banking',
        span,
        bureau: 'Early Warning Services',
        source: 'Early Warning Services',
        furnisher: getField(fields, 'Source of Information', 'Financial Institution'),
        status: getField(fields, 'Status'),
        unpaidBalance: getField(fields, 'Unpaid Balance'),
        suspectedFraud: getField(fields, 'Suspected Fraud'),
        accountAbuse: getField(fields, 'Account Abuse'),
        amountOwed: getField(fields, 'Amount Owed'),
        accountType: getField(fields, 'Account Type'),
        reportedFor: getField(fields, 'Reported For'),
        dateReported: getField(fields, 'Date Reported'),
        fields,
      };
      bankingItems.push(item);

      if (hasNegativeMarker(body) && !isNoneMarker(body)) {
        fraudMarkers.push({
          itemId: makeItemId('fraud', span),
          itemKind: 'fraud',
          span,
          bureau: 'Early Warning Services',
          source: 'Early Warning Services',
          marker: section.label,
          context: body.slice(0, 200),
          fields,
        });
      }
    } else if (/inquiry/.test(labelLower) || /participating bank/.test(labelLower)) {
      const lines = section.text.split('\n').map((l) => l.trim()).filter(Boolean);
      let cursor = section.start;
      for (const rawLine of section.text.split('\n')) {
        const lineLength = rawLine.length + 1;
        const trimmed = rawLine.trim();
        if (!trimmed) {
          cursor += lineLength;
          continue;
        }
        const span = makeSpan(text, cursor, cursor + rawLine.length);
        const dateMatch = trimmed.match(/(\d{2}\/\d{2}\/\d{2,4})/);
        const creditor = trimmed.replace(/(reviewed this consumer report|inquiry).*$/i, '').trim() || trimmed;
        inquiries.push({
          itemId: makeItemId('inquiry', span),
          itemKind: 'inquiry',
          span,
          bureau: 'Early Warning Services',
          source: 'Early Warning Services',
          creditor,
          inquiryDate: dateMatch ? dateMatch[1] : '',
          fraudMarker: /\b(fraud|identity theft|unauthorized|not mine|did not authorize|suspicious)\b/i.test(trimmed),
          fields: { line: trimmed },
        });
        cursor += lineLength;
      }
      void lines;
    }
  }

  if (bankingItems.length === 0 && /\b(financial institution|account type|unpaid balance|suspected fraud|account abuse)\s*:/i.test(text)) {
    const fields = parseKeyValueLines(text);
    const span = makeSpan(text, 0, text.length);
    bankingItems.push({
      itemId: makeItemId('banking', span),
      itemKind: 'banking',
      span,
      bureau: 'Early Warning Services',
      source: 'Early Warning Services',
      furnisher: getField(fields, 'Source of Information', 'Financial Institution'),
      status: getField(fields, 'Status'),
      unpaidBalance: getField(fields, 'Unpaid Balance'),
      suspectedFraud: getField(fields, 'Suspected Fraud'),
      accountAbuse: getField(fields, 'Account Abuse'),
      amountOwed: getField(fields, 'Amount Owed'),
      accountType: getField(fields, 'Account Type'),
      reportedFor: getField(fields, 'Reported For'),
      dateReported: getField(fields, 'Date Reported'),
      extractionConfidence: 0.88,
      sourceSpan: span.text,
      sourceOffset: span.start,
      fields,
    });
  }

  for (const detected of detectFraudMarkers(text)) {
    fraudMarkers.push({
      itemId: makeItemId('fraud', detected.span),
      itemKind: 'fraud',
      span: detected.span,
      bureau: 'Early Warning Services',
      source: 'Early Warning Services',
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
    accounts: [],
    collections: [],
    inquiries,
    publicRecords: [],
    bankingItems,
    remarks: [],
    fraudMarkers,
    sectionsFound,
  };
}
