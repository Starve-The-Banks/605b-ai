import { PIPELINE_VERSION, REPORT_STATUS_V1, FINDING_CATEGORIES_V1, CLASSIFICATIONS } from './types.js';

/**
 * Reduce final findings + suspected_uncertain + extracted state to a v1
 * compatible reportStatus, with the `suspectedUncertain` flag and a
 * human-readable `whyStatus` string.
 *
 * Hard invariants enforced here:
 *  - If extraction found ANY operational fraud markers (freeze / lock / alert /
 *    consumer statement), the status cannot be 'clean'. We force at least
 *    'review_only' so the user always sees the operational guidance.
 *  - If extraction found derogatory items (collections / public records) but
 *    classification was uncertain, status is 'review_only' with the
 *    suspectedUncertain flag — never 'clean'.
 */
export function reduceStatus({ findings, reviewOnly, suspectedUncertain, extracted, classified = [] }) {
  const hasHighPriority = findings.some((f) => f.category === FINDING_CATEGORIES_V1.HIGH_PRIORITY_ISSUE);
  const hasPotential = findings.some((f) => f.category === FINDING_CATEGORIES_V1.POTENTIAL_ISSUE);
  const hasClassifiedHighSeverity = classified.some((c) => c.classification === CLASSIFICATIONS.HIGH_PRIORITY);
  const hasClassifiedActionable = classified.some((c) => c.classification === CLASSIFICATIONS.ACTIONABLE);
  const hasSuspected = suspectedUncertain.length > 0;
  const hasReview = reviewOnly.length > 0;
  const hasOperational = (extracted.fraudMarkers || []).length > 0;
  const hasNegativeMarker = classified.some((c) => c.isNegativeMarker);
  const needsManualReview = extracted.needsManualReview === true || extracted.extractionConfidence < 0.5;

  if (hasHighPriority || hasClassifiedHighSeverity) {
    return { reportStatus: REPORT_STATUS_V1.HIGH_PRIORITY_ISSUE, suspectedUncertain: false };
  }
  if (hasPotential || hasClassifiedActionable) {
    return { reportStatus: REPORT_STATUS_V1.POTENTIAL_ISSUE, suspectedUncertain: false };
  }
  if (hasSuspected) return { reportStatus: REPORT_STATUS_V1.REVIEW_ONLY, suspectedUncertain: true };
  if (hasReview) return { reportStatus: REPORT_STATUS_V1.REVIEW_ONLY, suspectedUncertain: false };
  if (needsManualReview) return { reportStatus: REPORT_STATUS_V1.NEEDS_REVIEW, suspectedUncertain: true };

  // Final invariant: extractor/classifier negative state cannot be hidden by
  // validation gaps. Operational markers force at least review_only; real
  // derogatory markers force review_only with suspectedUncertain=true.
  if (hasOperational || extracted.collections.length > 0 || extracted.publicRecords.length > 0 || hasNegativeMarker) {
    return {
      reportStatus: hasOperational && !hasNegativeMarker
        ? REPORT_STATUS_V1.REVIEW_ONLY
        : REPORT_STATUS_V1.POTENTIAL_ISSUE,
      // Operational markers are not "uncertain" — they are detected state.
      // Only set suspectedUncertain if the trigger was a derogatory item we
      // couldn't classify cleanly.
      suspectedUncertain: !hasOperational,
    };
  }
  return { reportStatus: REPORT_STATUS_V1.CLEAN, suspectedUncertain: false };
}

export function buildDiagnostics({
  pipelineMs,
  extracted,
  classified,
  findings,
  reviewOnly,
  suspectedUncertain,
  suppressions,
  reportStatus,
}) {
  const negativeMarkerCount = classified.filter((c) => c.isNegativeMarker).length;
  const candidateIssueCount = classified.filter((c) =>
    c.classification === CLASSIFICATIONS.ACTIONABLE ||
    c.classification === CLASSIFICATIONS.HIGH_PRIORITY ||
    c.classification === CLASSIFICATIONS.SUSPECTED_UNCERTAIN
  ).length;
  const finalIssueCount = findings.length;
  const suspectedFlag = suspectedUncertain.length > 0;

  const operationalBlocks = (extracted.fraudMarkers || [])
    .filter((m) => Boolean(m.type))
    .map((m) => ({
      type: m.type,
      detected: true,
      confidence: typeof m.confidence === 'number' ? m.confidence : 0.9,
    }));

  const reasoningLog = composeReasoningLog({
    extracted,
    classified,
    findings,
    reviewOnly,
    suspectedUncertain,
    suppressions,
    reportStatus,
    operationalBlocks,
  });

  const whyStatus = composeWhyStatus({
    reportStatus,
    extracted,
    findings,
    reviewOnly,
    suspectedUncertain,
    negativeMarkerCount,
    suppressions,
    operationalBlocks,
  });

  return {
    pipelineVersion: PIPELINE_VERSION,
    pipelineMs,
    extractedCount: {
      accounts: extracted.accounts.length,
      collections: extracted.collections.length,
      inquiries: extracted.inquiries.length,
      publicRecords: extracted.publicRecords.length,
      bankingItems: extracted.bankingItems.length,
      remarks: extracted.remarks.length,
      fraudMarkers: extracted.fraudMarkers.length,
    },
    negativeMarkerCount,
    candidateIssueCount,
    finalIssueCount,
    suppressions,
    whyStatus,
    suspectedUncertain: suspectedFlag,
    operationalBlocks,
    parser: {
      parserType: extracted.parserType || 'unknown',
      extractionConfidence: extracted.extractionConfidence,
      needsManualReview: extracted.needsManualReview === true,
      reportSource: extracted.reportSource || '',
    },
    reasoningLog,
  };
}

function composeWhyStatus({
  reportStatus, extracted, findings, reviewOnly, suspectedUncertain,
  negativeMarkerCount, suppressions, operationalBlocks,
}) {
  const collectionWord = extracted.collections.length === 1 ? 'collection' : 'collections';
  const inquiryWord = extracted.inquiries.length === 1 ? 'inquiry' : 'inquiries';
  const findingWord = findings.length === 1 ? 'issue' : 'issues';

  const parts = [];
  parts.push(`Status: ${reportStatus}.`);
  parts.push(
    `Extracted ${extracted.accounts.length} accounts, ${extracted.collections.length} ${collectionWord}, ${extracted.inquiries.length} ${inquiryWord}, ${extracted.publicRecords.length} public records, ${extracted.bankingItems.length} banking items.`,
  );
  parts.push(`Negative markers: ${negativeMarkerCount}.`);
  if (operationalBlocks.length > 0) {
    parts.push(`Operational blocks: ${operationalBlocks.map((b) => b.type).join(', ')}.`);
  }
  if (findings.length > 0) parts.push(`Final ${findingWord}: ${findings.length}.`);
  if (reviewOnly.length > 0) parts.push(`Review-only: ${reviewOnly.length}.`);
  if (suspectedUncertain.length > 0) parts.push(`Suspected uncertain: ${suspectedUncertain.length}.`);
  if (suppressions.length > 0) parts.push(`Suppressed: ${suppressions.length}.`);
  return parts.join(' ');
}

function composeReasoningLog({
  extracted, classified, findings, reviewOnly, suspectedUncertain,
  suppressions, reportStatus, operationalBlocks,
}) {
  const log = [];
  log.push(
    `extract: ${extracted.accounts.length} account(s), ${extracted.collections.length} collection(s), ${extracted.inquiries.length} inquiry(ies), ${extracted.publicRecords.length} public record(s), ${extracted.fraudMarkers.length} fraud marker(s).`,
  );
  if (operationalBlocks.length > 0) {
    log.push(`extract.operational: detected ${operationalBlocks.map((b) => b.type).join(', ')}.`);
  }
  // Group classifier rule fires for the log.
  const ruleCounts = new Map();
  for (const c of classified) {
    ruleCounts.set(c.classifierRule, (ruleCounts.get(c.classifierRule) || 0) + 1);
  }
  if (ruleCounts.size > 0) {
    const ruleSummary = [...ruleCounts.entries()]
      .map(([rule, count]) => `${rule}×${count}`)
      .join(', ');
    log.push(`classify: ${ruleSummary}.`);
  }
  log.push(
    `validate: kept ${findings.length} finding(s), ${reviewOnly.length} review-only, ${suspectedUncertain.length} suspected-uncertain; suppressed ${suppressions.length}.`,
  );
  log.push(`reduce: status=${reportStatus}.`);
  if (operationalBlocks.length > 0 && reportStatus === REPORT_STATUS_V1.CLEAN) {
    log.push('reduce.operational_force_noclean: would have been clean but operational marker forced review_only.');
  }
  return log;
}
