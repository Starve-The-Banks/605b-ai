import { CLASSIFICATIONS, OPERATIONAL_SUBTYPE, FRAUD_MARKER_TYPES } from './types.js';
import { hasNegativeMarker, NEGATIVE_MARKER_RE } from './extractors/utils.js';

/**
 * Deterministic per-item classifier.
 *
 * Returns a ClassifiedItem for every ExtractedItem in the report. Each item
 * carries a `classifierRule` name so diagnostics can show exactly why an
 * item was treated the way it was.
 *
 * Classification states:
 *  - positive:            paid as agreed, never late, $0 balance, etc.
 *  - neutral:             not negative, not actionable (informational)
 *  - review_only:         user may want to manually check (e.g. ordinary inquiry)
 *  - actionable:          medium-confidence negative marker
 *  - high_priority:       strong direct negative marker (collection, charge-off, account abuse)
 *  - suspected_uncertain: negative marker present but classification is ambiguous
 */
export function classifyExtractedReport(extracted) {
  const out = [];

  for (const item of extracted.accounts) out.push(classifyAccount(item));
  for (const item of extracted.collections) out.push(classifyCollection(item));
  for (const item of extracted.inquiries) out.push(classifyInquiry(item));
  for (const item of extracted.publicRecords) out.push(classifyPublicRecord(item));
  for (const item of extracted.bankingItems) {
    out.push(classifyBankingItem(item, extracted.reportType));
  }
  for (const item of extracted.fraudMarkers) out.push(classifyFraudMarker(item));
  for (const item of extracted.remarks) out.push(classifyRemark(item));

  return out;
}

function negative(item) {
  return hasNegativeMarker(item.span?.text || '');
}

function parseMoney(value) {
  if (!value) return 0;
  const normalized = String(value).replace(/[$,\s]/g, '');
  const n = Number.parseFloat(normalized);
  return Number.isFinite(n) ? n : 0;
}

function withClassification(item, classification, rule, reason, confidence, extras = {}) {
  return {
    ...item,
    classification,
    classifierRule: rule,
    classifierReason: reason,
    classifierConfidence: confidence,
    isNegativeMarker: classification === CLASSIFICATIONS.ACTIONABLE ||
      classification === CLASSIFICATIONS.HIGH_PRIORITY ||
      classification === CLASSIFICATIONS.SUSPECTED_UNCERTAIN ||
      negative(item),
    ...extras,
  };
}

function classifyAccount(item) {
  const status = (item.status || '').toLowerCase();
  const paymentStatus = (item.paymentStatus || '').toLowerCase();
  const paymentHistory = (item.paymentHistory || '').toLowerCase();
  const remarks = (item.remarks || item.fields?.Remarks || item.fields?.Comments || '').toLowerCase();
  const span = item.span?.text || '';
  const combinedStatus = `${status} ${paymentStatus}`;
  const combinedNegativeText = `${combinedStatus} ${paymentHistory} ${remarks} ${span.toLowerCase()}`;

  if (/charge[-\s]?off|charged\s*off|collection|placed for collection/.test(combinedNegativeText)) {
    return withClassification(item, CLASSIFICATIONS.HIGH_PRIORITY, 'account.charge_off',
      'Account status, payment status, or remarks indicate a charge-off or collection.', 0.95);
  }
  if (/repossession|foreclosure|profit and loss/.test(combinedNegativeText)) {
    return withClassification(item, CLASSIFICATIONS.HIGH_PRIORITY, 'account.severe_derogatory',
      'Severe derogatory marker on the account.', 0.92);
  }
  if (/\b(30|60|90|120)\s*days?\s*late\b/.test(combinedNegativeText) ||
      /\b(late|past due|delinquent)\b/.test(`${paymentStatus} ${remarks}`)) {
    return withClassification(item, CLASSIFICATIONS.ACTIONABLE, 'account.late_payment',
      'Payment history shows a late-payment notation.', 0.85);
  }
  if (parseMoney(item.balance) > 0 && !/\b(current|pays as agreed|paid as agreed|good standing)\b/.test(combinedStatus)) {
    return withClassification(item, CLASSIFICATIONS.ACTIONABLE, 'account.balance_not_current',
      'Account shows a balance while status is not current.', 0.82);
  }
  if (/disputed|dispute/.test(span)) {
    return withClassification(item, CLASSIFICATIONS.REVIEW_ONLY, 'account.dispute_marker',
      'Account text mentions an open or prior dispute.', 0.7);
  }
  if (/pays as agreed|paid as agreed|never late|good standing|current/.test(`${paymentStatus} ${paymentHistory} ${status}`) &&
      !negative(item)) {
    return withClassification(item, CLASSIFICATIONS.POSITIVE, 'account.positive',
      'Account is in good standing with no negative markers.', 0.95);
  }

  // Has negative-language somewhere but no rule matched cleanly.
  if (negative(item)) {
    return withClassification(item, CLASSIFICATIONS.SUSPECTED_UNCERTAIN, 'account.uncertain_negative',
      'Account text contains negative language but no rule matched cleanly.', 0.55);
  }

  return withClassification(item, CLASSIFICATIONS.NEUTRAL, 'account.neutral',
    'Account has no positive or negative marker.', 0.6);
}

function classifyCollection(item) {
  const text = `${item.status || ''} ${item.paymentStatus || ''} ${item.remarks || ''} ${item.span?.text || ''}`;
  if (/charge[-\s]?off|charged\s*off/.test(text)) {
    return withClassification(item, CLASSIFICATIONS.HIGH_PRIORITY, 'collection.charge_off',
      'Account is reported as charged off.', 0.97);
  }
  return withClassification(item, CLASSIFICATIONS.HIGH_PRIORITY, 'collection.is_collection',
    'Account is reported as a collection account.', 0.96);
}

function classifyInquiry(item) {
  if (item.fraudMarker) {
    return withClassification(item, CLASSIFICATIONS.HIGH_PRIORITY, 'inquiry.fraud',
      'Inquiry text contains fraud language.', 0.9);
  }
  // EWS "Participating bank inquiry" lines are routine bank-account activity
  // (not the same signal as a credit-bureau hard inquiry). Treat them as
  // informational so a clean EWS report stays clean.
  if ((item.bureau || '').toLowerCase().includes('early warning services')) {
    return withClassification(item, CLASSIFICATIONS.NEUTRAL, 'inquiry.ews_routine',
      'EWS participating-bank inquiry — routine, informational.', 0.7);
  }
  return withClassification(item, CLASSIFICATIONS.REVIEW_ONLY, 'inquiry.normal',
    'Ordinary inquiry — eligible for manual review only.', 0.8);
}

function classifyPublicRecord(item) {
  return withClassification(item, CLASSIFICATIONS.HIGH_PRIORITY, 'public_record.present',
    'Public record present on the report.', 0.93);
}

function classifyBankingItem(item, reportType) {
  const reportedFor = (item.reportedFor || '').toLowerCase();
  const status = (item.status || '').toLowerCase();
  const suspectedFraud = (item.suspectedFraud || '').toLowerCase();
  const accountAbuse = (item.accountAbuse || '').toLowerCase();
  const unpaidBalance = (item.unpaidBalance || '').toLowerCase();
  const amountOwed = (item.amountOwed || '').toLowerCase();
  const span = item.span?.text || '';

  if (/account abuse/.test(reportedFor)) {
    return withClassification(item, CLASSIFICATIONS.HIGH_PRIORITY, 'banking.account_abuse',
      'Reported For indicates account abuse.', 0.96);
  }
  if (/closed by financial institution|closed by bank|involuntary closure/.test(`${status} ${span.toLowerCase()}`)) {
    return withClassification(item, CLASSIFICATIONS.HIGH_PRIORITY, 'banking.involuntary_closure',
      'Account was closed by the financial institution.', 0.94);
  }
  if (/^yes\b/.test(suspectedFraud) || /^yes\b/.test(accountAbuse)) {
    return withClassification(item, CLASSIFICATIONS.HIGH_PRIORITY, 'banking.fraud_or_abuse_yes',
      'Suspected fraud or account abuse marked YES.', 0.93);
  }
  // Positive: explicit good standing / $0 / None
  const positiveSignals =
    /good standing/.test(status) ||
    /^\$?0/.test(unpaidBalance) ||
    /^\$?0/.test(amountOwed) ||
    suspectedFraud === 'none' ||
    accountAbuse === 'none';
  if (positiveSignals && !hasNegativeMarker(span)) {
    return withClassification(item, CLASSIFICATIONS.POSITIVE, 'banking.positive',
      'Banking item is positive (good standing, $0 balance, no fraud/abuse).', 0.92);
  }
  if (hasNegativeMarker(span)) {
    return withClassification(item, CLASSIFICATIONS.SUSPECTED_UNCERTAIN, 'banking.uncertain_negative',
      'Banking item contains negative language but no specific rule matched.', 0.55);
  }
  void reportType;
  return withClassification(item, CLASSIFICATIONS.NEUTRAL, 'banking.neutral',
    'Banking item has no clear positive or negative marker.', 0.6);
}

/**
 * Operational/security markers (freeze, lock, fraud alert, extended alert,
 * active duty alert, consumer statement) are never derogatory. They are
 * informational state about the file's accessibility. Hard rule: any typed
 * fraud marker maps to REVIEW_ONLY with subtype 'operational_blocker'.
 *
 * The legacy "untyped fraud marker" path keeps HIGH_PRIORITY for back-compat
 * (no current extractor produces an untyped marker after the v2.1 wiring,
 * but the safety branch stays so a malformed input cannot silently downgrade).
 */
function classifyFraudMarker(item) {
  const type = item.type;
  if (type && Object.values(FRAUD_MARKER_TYPES).includes(type)) {
    const reasonByType = {
      [FRAUD_MARKER_TYPES.FREEZE]: 'Credit file restriction detected (security freeze).',
      [FRAUD_MARKER_TYPES.LOCK]: 'Credit file restriction detected (credit lock).',
      [FRAUD_MARKER_TYPES.FRAUD_ALERT]: 'Active fraud alert on file — informational, not derogatory.',
      [FRAUD_MARKER_TYPES.EXTENDED_ALERT]: 'Extended (7-year) fraud alert on file — informational, not derogatory.',
      [FRAUD_MARKER_TYPES.ACTIVE_DUTY_ALERT]: 'Active duty military alert on file — informational, not derogatory.',
      [FRAUD_MARKER_TYPES.CONSUMER_STATEMENT]: 'Consumer statement may restrict creditor access — informational.',
    };
    const confidence = typeof item.confidence === 'number' ? item.confidence : 0.9;
    return withClassification(
      item,
      CLASSIFICATIONS.REVIEW_ONLY,
      `operational.${type}`,
      reasonByType[type],
      confidence,
      { subtype: OPERATIONAL_SUBTYPE },
    );
  }
  // Untyped legacy marker — keep the high-priority safety net but flag it.
  return withClassification(item, CLASSIFICATIONS.HIGH_PRIORITY, 'fraud.present',
    'Fraud or identity-theft marker present in the report.', 0.95);
}

function classifyRemark(item) {
  const text = item.span?.text || '';
  if (/\b(late|past due|delinquent)\b/i.test(text)) {
    return withClassification(item, CLASSIFICATIONS.ACTIONABLE, 'remark.late_or_past_due',
      'Remarks section contains late, past-due, or delinquency language.', 0.82);
  }
  if (/charge[-\s]?off|charged\s*off|collection|placed for collection/i.test(text)) {
    return withClassification(item, CLASSIFICATIONS.HIGH_PRIORITY, 'remark.high_priority_negative',
      'Remarks section contains charge-off or collection language.', 0.9);
  }
  if (NEGATIVE_MARKER_RE.test(text)) {
    return withClassification(item, CLASSIFICATIONS.SUSPECTED_UNCERTAIN, 'remark.negative',
      'Remarks section contains negative language.', 0.5);
  }
  return withClassification(item, CLASSIFICATIONS.REVIEW_ONLY, 'remark.review',
    'Free-text remark — surface for manual review.', 0.6);
}
