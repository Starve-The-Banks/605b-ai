import { PIPELINE_VERSION, REPORT_STATUS_V1, FINDING_CATEGORIES_V1, CLASSIFICATIONS } from './types.js';

/**
 * Reduce final findings + suspected_uncertain to a v1-compatible reportStatus
 * with a `suspectedUncertain` flag and a human-readable `whyStatus` string.
 */
export function reduceStatus({ findings, reviewOnly, suspectedUncertain, extracted }) {
  const hasHighPriority = findings.some((f) => f.category === FINDING_CATEGORIES_V1.HIGH_PRIORITY_ISSUE);
  const hasPotential = findings.some((f) => f.category === FINDING_CATEGORIES_V1.POTENTIAL_ISSUE);
  const hasSuspected = suspectedUncertain.length > 0;
  const hasReview = reviewOnly.length > 0;

  if (hasHighPriority) return { reportStatus: REPORT_STATUS_V1.HIGH_PRIORITY_ISSUE, suspectedUncertain: false };
  if (hasPotential) return { reportStatus: REPORT_STATUS_V1.POTENTIAL_ISSUE, suspectedUncertain: false };

  // Hard invariant: if extraction found negative markers but classification
  // didn't promote them to high/potential, status is review_only with the
  // suspectedUncertain flag set. The mobile UI shows it as Optional Review;
  // the new flag lets future UIs show a yellow banner.
  if (hasSuspected) return { reportStatus: REPORT_STATUS_V1.REVIEW_ONLY, suspectedUncertain: true };
  if (hasReview) return { reportStatus: REPORT_STATUS_V1.REVIEW_ONLY, suspectedUncertain: false };

  // Final invariant: extracted.fraudMarkers shouldn't survive past validation
  // as anything but findings. If they somehow did (data anomaly), we still
  // refuse to call it clean.
  if (extracted.fraudMarkers.length > 0 || extracted.collections.length > 0 || extracted.publicRecords.length > 0) {
    return { reportStatus: REPORT_STATUS_V1.REVIEW_ONLY, suspectedUncertain: true };
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

  const whyStatus = composeWhyStatus({
    reportStatus,
    extracted,
    findings,
    reviewOnly,
    suspectedUncertain,
    negativeMarkerCount,
    suppressions,
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
  };
}

function composeWhyStatus({ reportStatus, extracted, findings, reviewOnly, suspectedUncertain, negativeMarkerCount, suppressions }) {
  const collectionWord = extracted.collections.length === 1 ? 'collection' : 'collections';
  const inquiryWord = extracted.inquiries.length === 1 ? 'inquiry' : 'inquiries';
  const findingWord = findings.length === 1 ? 'issue' : 'issues';

  const parts = [];
  parts.push(`Status: ${reportStatus}.`);
  parts.push(
    `Extracted ${extracted.accounts.length} accounts, ${extracted.collections.length} ${collectionWord}, ${extracted.inquiries.length} ${inquiryWord}, ${extracted.publicRecords.length} public records, ${extracted.bankingItems.length} banking items.`,
  );
  parts.push(`Negative markers: ${negativeMarkerCount}.`);
  if (findings.length > 0) parts.push(`Final ${findingWord}: ${findings.length}.`);
  if (reviewOnly.length > 0) parts.push(`Review-only: ${reviewOnly.length}.`);
  if (suspectedUncertain.length > 0) parts.push(`Suspected uncertain: ${suspectedUncertain.length}.`);
  if (suppressions.length > 0) parts.push(`Suppressed: ${suppressions.length}.`);
  return parts.join(' ');
}
