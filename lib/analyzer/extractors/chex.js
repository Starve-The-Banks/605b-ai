import {
  makeItemId,
  makeSpan,
  splitTopLevelSections,
  parseKeyValueLines,
  getField,
  isNoneMarker,
  detectFraudMarkers,
} from './utils.js';

/**
 * ChexSystems extractor. Layout is section-based:
 *   "Reported Information:", "Inquiries Viewed By Others:",
 *   "Source of Information:", "Identity Information:".
 *
 * Account abuse is the key signal: "Reported For: Account Abuse" inside the
 * Reported Information section becomes a high-confidence banking item.
 */
export function extractChexReport(text, ctx) {
  const inquiries = [];
  const bankingItems = [];
  const fraudMarkers = [];
  const personalInfo = { names: [], addresses: [], partialSSNs: [], dobs: [] };
  const sectionsFound = [];

  let reportDate = null;
  const reportDateMatch = text.match(/Report\s*Date:\s*([^\n]+)/i);
  if (reportDateMatch) reportDate = reportDateMatch[1].trim();

  let consumerId = null;
  const consumerIdMatch = text.match(/Consumer\s*ID:\s*([^\n]+)/i);
  if (consumerIdMatch) consumerId = consumerIdMatch[1].trim();

  const sections = splitTopLevelSections(text);
  for (const section of sections) {
    sectionsFound.push(section.label);
    const labelLower = section.label.toLowerCase();

    if (/^reported information/.test(labelLower)) {
      const body = section.text.trim();
      if (body && !isNoneMarker(body)) {
        const fields = parseKeyValueLines(section.text);
        const span = makeSpan(text, section.start, section.end);
        bankingItems.push({
          itemId: makeItemId('banking', span),
          itemKind: 'banking',
          span,
          bureau: 'ChexSystems',
          source: getField(fields, 'Source of Information', 'Financial Institution') || 'ChexSystems',
          furnisher: getField(fields, 'Source of Information', 'Financial Institution'),
          reportedFor: getField(fields, 'Reported For'),
          amountOwed: getField(fields, 'Amount Owed'),
          accountType: getField(fields, 'Account Type'),
          status: getField(fields, 'Status'),
          dateReported: getField(fields, 'Date Reported'),
          fields,
        });
      }
    } else if (/^source of information/.test(labelLower)) {
      const body = section.text.trim();
      // Most often "No sources currently reporting negative information." — captured for diagnostics.
      if (body && !isNoneMarker(body)) {
        const fields = parseKeyValueLines(section.text);
        const span = makeSpan(text, section.start, section.end);
        bankingItems.push({
          itemId: makeItemId('banking', span),
          itemKind: 'banking',
          span,
          bureau: 'ChexSystems',
          source: getField(fields, 'Source of Information', 'Financial Institution') || 'ChexSystems',
          furnisher: getField(fields, 'Source of Information', 'Financial Institution'),
          reportedFor: getField(fields, 'Reported For'),
          amountOwed: getField(fields, 'Amount Owed'),
          accountType: getField(fields, 'Account Type'),
          status: getField(fields, 'Status'),
          dateReported: getField(fields, 'Date Reported'),
          fields,
        });
      }
    } else if (/^inquiries viewed by others/.test(labelLower) || /^inquiries/.test(labelLower)) {
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
        const creditor = trimmed.replace(/inquiry.*$/i, '').trim() || trimmed;
        inquiries.push({
          itemId: makeItemId('inquiry', span),
          itemKind: 'inquiry',
          span,
          bureau: 'ChexSystems',
          source: 'ChexSystems',
          creditor,
          inquiryDate: dateMatch ? dateMatch[1] : '',
          fraudMarker: /\b(fraud|identity theft|unauthorized|not mine|did not authorize|suspicious)\b/i.test(trimmed),
          fields: { line: trimmed },
        });
        cursor += lineLength;
      }
    } else if (/^identity information/.test(labelLower)) {
      const fields = parseKeyValueLines(section.text);
      const name = getField(fields, 'Name');
      const address = getField(fields, 'Address');
      if (name) personalInfo.names.push(name);
      if (address) personalInfo.addresses.push(address);
    }
  }

  if (bankingItems.length === 0 && /\b(reported for|account abuse|amount owed|financial institution)\s*:/i.test(text)) {
    const fields = parseKeyValueLines(text);
    const span = makeSpan(text, 0, text.length);
    bankingItems.push({
      itemId: makeItemId('banking', span),
      itemKind: 'banking',
      span,
      bureau: 'ChexSystems',
      source: getField(fields, 'Source of Information', 'Financial Institution') || 'ChexSystems',
      furnisher: getField(fields, 'Source of Information', 'Financial Institution'),
      reportedFor: getField(fields, 'Reported For'),
      amountOwed: getField(fields, 'Amount Owed'),
      accountType: getField(fields, 'Account Type'),
      status: getField(fields, 'Status'),
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
      bureau: 'ChexSystems',
      source: 'ChexSystems',
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
    consumerId,
    personalInfo,
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
