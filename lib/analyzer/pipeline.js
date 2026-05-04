import { extractReport } from './extract.js';
import { classifyExtractedReport } from './classify.js';
import { enrichClassifiedItems } from './llmEnrich.js';
import { buildValidatedFindings } from './validate.js';
import { reduceStatus, buildDiagnostics } from './diagnostics.js';
import {
  PIPELINE_VERSION,
  ANALYSIS_RESULT_SCHEMA_VERSION,
  REPORT_STATUS_V1,
  FINDING_CATEGORIES_V1,
} from './types.js';
import {
  BANKING_CLEAN_REPORT_TITLE,
  CLEAN_REPORT_BODY,
  CREDIT_CLEAN_REPORT_TITLE,
  LOW_QUALITY_TEXT_MESSAGE,
} from '@/lib/creditReportAnalysis';

const MIN_LLM_REMAINING_BUDGET_MS = 3_000;
const DEFAULT_FAST_ENRICH_TIMEOUT_MS = 3_000;
const LLM_SKIPPED_FAST_PATH_REASON = 'llm_skipped_fast_path';

/**
 * Run the full v2 analyzer pipeline. Returns an object compatible with the
 * v1 AnalysisResult shape (so the existing mobile app keeps working) PLUS
 * additive v2 fields: `extracted`, `classifications`, `diagnostics`,
 * `summary.suspectedUncertain`, `schemaVersion`.
 *
 * @param {string} text  Verbatim PDF-extracted text.
 * @param {Object} [options]
 * @param {Object} [options.anthropic] - Anthropic client (optional; pipeline runs without LLM if absent).
 * @param {string} [options.model]
 * @param {AbortSignal} [options.signal]
 * @param {number} [options.enrichTimeoutMs]
 * @param {number} [options.budgetMs]
 * @param {Function} [options.now=Date.now]
 * @returns {Promise<Object>}
 */
export async function runAnalyzerPipeline(text, options = {}) {
  const now = options.now || Date.now;
  const totalStart = now();
  const budgetMs = typeof options.budgetMs === 'number' && Number.isFinite(options.budgetMs)
    ? options.budgetMs
    : null;

  // Stage 1: deterministic extraction
  const extractStart = now();
  const extracted = extractReport(text);
  const extractMs = now() - extractStart;

  // Stage 2: deterministic classification
  const classifyStart = now();
  const classified = classifyExtractedReport(extracted);
  const classifyMs = now() - classifyStart;

  // Stage 3: LLM enrichment (optional — pipeline still produces useful output if it fails)
  let enrichResult = { annotations: new Map(), error: null };
  let enrichMs = 0;
  let fastPath = false;
  let llmSkippedFastPath = false;
  const remainingBudgetMs = budgetMs === null ? Infinity : budgetMs - (now() - totalStart);
  if (budgetMs !== null && remainingBudgetMs <= MIN_LLM_REMAINING_BUDGET_MS) {
    fastPath = true;
    llmSkippedFastPath = true;
  } else {
    const enrichTimeoutMs = budgetMs === null
      ? options.enrichTimeoutMs
      : Math.max(
          1,
          Math.min(
            options.enrichTimeoutMs ?? DEFAULT_FAST_ENRICH_TIMEOUT_MS,
            DEFAULT_FAST_ENRICH_TIMEOUT_MS,
            remainingBudgetMs - MIN_LLM_REMAINING_BUDGET_MS,
          ),
        );
    const enrichStart = now();
    enrichResult = await enrichClassifiedItems({
      items: classified,
      anthropic: options.anthropic,
      model: options.model,
      signal: options.signal,
      timeoutMs: enrichTimeoutMs,
      now,
    });
    enrichMs = now() - enrichStart;
    if (budgetMs !== null && enrichResult.error) {
      fastPath = true;
      llmSkippedFastPath = true;
    }
  }
  const enrichError = enrichResult.error || null;

  // Stage 4: validation + final v1 finding shape
  const validateStart = now();
  const { findings: rawFindings, reviewOnly, suspectedUncertain, suppressions } = buildValidatedFindings({
    classified,
    annotations: enrichResult.annotations,
  });
  const findings = ensureAccountPresenceFindings({
    findings: rawFindings,
    extracted,
    suppressions,
  });
  const validateMs = now() - validateStart;

  // Stage 5: status reduction + diagnostics
  const { reportStatus, suspectedUncertain: suspectedFlag } = reduceStatus({
    findings, reviewOnly, suspectedUncertain, extracted, classified,
  });

  const totalMs = now() - totalStart;
  const diagnosticSuppressions = [...suppressions];
  if (llmSkippedFastPath) {
    diagnosticSuppressions.push({ itemId: '', stage: 'llm', reason: LLM_SKIPPED_FAST_PATH_REASON });
  }
  const diagnostics = buildDiagnostics({
    pipelineMs: { extract: extractMs, classify: classifyMs, llm: enrichMs, validate: validateMs, total: totalMs },
    extracted,
    classified,
    findings,
    reviewOnly,
    suspectedUncertain,
    suppressions: diagnosticSuppressions,
    reportStatus,
  });
  if (enrichError && !llmSkippedFastPath) {
    diagnostics.suppressions = [
      ...diagnostics.suppressions,
      { itemId: '', stage: 'llm', reason: `enrich_failed: ${enrichError}` },
    ];
  }

  return buildPipelineResult({
    extracted,
    classified,
    findings,
    reviewOnly,
    suspectedUncertain,
    suspectedFlag,
    reportStatus,
    diagnostics,
    fastPath,
  });
}

export function stripLLMEnrichment(analysis) {
  if (!analysis?.extracted || !Array.isArray(analysis.classifications)) {
    return analysis;
  }

  const { findings: rawFindings, reviewOnly, suspectedUncertain, suppressions } = buildValidatedFindings({
    classified: analysis.classifications,
    annotations: new Map(),
  });
  const findings = ensureAccountPresenceFindings({
    findings: rawFindings,
    extracted: analysis.extracted,
    suppressions,
  });
  const { reportStatus, suspectedUncertain: suspectedFlag } = reduceStatus({
    findings,
    reviewOnly,
    suspectedUncertain,
    extracted: analysis.extracted,
    classified: analysis.classifications,
  });
  const diagnostics = buildDiagnostics({
    pipelineMs: analysis.diagnostics?.pipelineMs || { extract: 0, classify: 0, llm: 0, validate: 0, total: 0 },
    extracted: analysis.extracted,
    classified: analysis.classifications,
    findings,
    reviewOnly,
    suspectedUncertain,
    suppressions: [
      ...suppressions,
      { itemId: '', stage: 'llm', reason: LLM_SKIPPED_FAST_PATH_REASON },
    ],
    reportStatus,
  });

  return buildPipelineResult({
    extracted: analysis.extracted,
    classified: analysis.classifications,
    findings,
    reviewOnly,
    suspectedUncertain,
    suspectedFlag,
    reportStatus,
    diagnostics,
    fastPath: true,
  });
}

function buildPipelineResult({
  extracted,
  classified,
  findings,
  reviewOnly,
  suspectedUncertain,
  suspectedFlag,
  reportStatus,
  diagnostics,
  fastPath,
}) {
  // === Build v1-compatible result ===
  // cleanReport strictly tracks the reduced status. If anything ended up in
  // reviewOnly or suspectedUncertain, we report cleanReport=false so the
  // mobile UI's hero banner can degrade to "review your report" instead of
  // showing a green "no issues" message.
  const cleanReport = reportStatus === REPORT_STATUS_V1.CLEAN;

  const evidenceQuotes = findings.map((f) => f.evidence_quote).filter(Boolean);
  const positiveFactors = buildPositiveFactors(extracted);
  const personalInfo = extracted.personalInfo || {};
  const overallAssessment = buildOverallAssessment({
    reportType: extracted.reportType,
    findings,
    reviewOnly,
    suspectedUncertain,
    suspectedFlag,
  });

  const visibleFindings = findings.map(stripV2Internal);
  const visibleReviewOnly = [...reviewOnly, ...suspectedUncertain].map(stripV2Internal);

  const overallConfidence =
    visibleFindings.length === 0 && visibleReviewOnly.length === 0
      ? 1
      : Math.min(...[...visibleFindings, ...visibleReviewOnly].map((f) => f.confidence ?? 1));
  const analysisConfidence = overallConfidence >= 0.9 ? 'high' : overallConfidence >= 0.75 ? 'medium' : 'low';

  return {
    schemaVersion: ANALYSIS_RESULT_SCHEMA_VERSION,
    pipelineVersion: PIPELINE_VERSION,

    reportType: extracted.reportType,
    reportSource: extracted.reportSource,
    parserType: extracted.parserType,
    extractionConfidence: extracted.extractionConfidence,
    needsManualReview: extracted.needsManualReview === true,
    cleanReport,
    confidence: overallConfidence,
    evidenceQuotes,
    summary: {
      reportStatus,
      overallAssessment: extracted.needsManualReview
        ? 'We could not confidently read all account details from this report. Please review manually or upload a clearer PDF.'
        : overallAssessment,
      potentialIssues: findings.filter(
        (f) =>
          f.category === FINDING_CATEGORIES_V1.POTENTIAL_ISSUE ||
          f.category === FINDING_CATEGORIES_V1.HIGH_PRIORITY_ISSUE ||
          f.category === FINDING_CATEGORIES_V1.INFORMATIONAL,
      ).length,
      highPriorityItems: findings.filter((f) => f.category === FINDING_CATEGORIES_V1.HIGH_PRIORITY_ISSUE).length,
      reviewItems: visibleReviewOnly.length,
      reportDate: extracted.reportDate || null,
      cleanReport,
      analysisConfidence,
      suspectedUncertain: suspectedFlag,
      operationalBlocks: diagnostics.operationalBlocks.length > 0,
      parserType: extracted.parserType,
      extractionConfidence: extracted.extractionConfidence,
      needsManualReview: extracted.needsManualReview === true,
      ...(fastPath ? { fastPath: true } : {}),
    },
    findings: visibleFindings,
    reviewOnly: visibleReviewOnly,
    positiveFactors,
    crossBureauInconsistencies: [],
    personalInfo,
    actionPlan: findings.length > 0 ? buildActionPlan(findings) : [],

    // v2 additive fields. Mobile ignores fields it does not know about.
    extracted,
    classifications: classified,
    diagnostics,
  };
}

function stripV2Internal(finding) {
  const { itemId, suspectedUncertain, ...rest } = finding;
  void itemId; void suspectedUncertain;
  return rest;
}

function buildPositiveFactors(extracted) {
  const positives = [];
  for (const acc of extracted.accounts) {
    const ps = (acc.paymentStatus || '').toLowerCase();
    if (/pays as agreed|paid as agreed|never late|good standing/.test(ps)) {
      positives.push(`${acc.accountName || 'Account'} — ${acc.paymentStatus || acc.status}`);
    }
  }
  for (const item of extracted.bankingItems) {
    if ((item.status || '').toLowerCase().includes('good standing')) {
      positives.push(`${item.fields?.['Financial Institution'] || item.source} — ${item.status}`);
    }
  }
  return positives.slice(0, 15);
}

function buildOverallAssessment({ reportType, findings, reviewOnly, suspectedUncertain, suspectedFlag }) {
  const actionableCount = findings.filter(
    (f) =>
      f.category === FINDING_CATEGORIES_V1.POTENTIAL_ISSUE ||
      f.category === FINDING_CATEGORIES_V1.HIGH_PRIORITY_ISSUE,
  ).length;
  const informationalCount = findings.filter((f) => f.category === FINDING_CATEGORIES_V1.INFORMATIONAL).length;

  if (findings.length === 0 && reviewOnly.length === 0 && !suspectedFlag) {
    const title = reportType === 'chexsystems' || reportType === 'early_warning_services'
      ? BANKING_CLEAN_REPORT_TITLE
      : CREDIT_CLEAN_REPORT_TITLE;
    return `${title} No action appears necessary based on this report. ${CLEAN_REPORT_BODY}`;
  }
  if (suspectedFlag && findings.length === 0) {
    return 'We saw potential issues we could not fully confirm — please review the items below manually before deciding on next steps.';
  }
  if (actionableCount > 0) {
    const high = findings.filter((f) => f.category === FINDING_CATEGORIES_V1.HIGH_PRIORITY_ISSUE).length;
    return high > 0
      ? `Found ${actionableCount} potential issue(s) including ${high} high-priority item(s). Review each item carefully.`
      : `Found ${actionableCount} potential issue(s) for review.`;
  }
  if (informationalCount > 0) {
    return `Analysis completed. We detected ${informationalCount} reported account item(s); review details for accuracy.`;
  }
  void suspectedUncertain;
  return 'Analysis completed.';
}

function buildActionPlan(findings) {
  return findings.slice(0, 5).map((f) => f.recommendation).filter(Boolean);
}

function ensureAccountPresenceFindings({ findings, extracted, suppressions }) {
  if (findings.length > 0 || (extracted.accounts || []).length === 0) {
    return findings;
  }

  const informational = extracted.accounts.slice(0, 25).map((account, idx) => {
    const displayTitle = normalizeTitle(account);
    const accountMask = maskAccountNumber(
      account.accountNumber ||
      account.accountNumberMasked ||
      account.fields?.['Account Number'] ||
      account.fields?.['Account #'] ||
      account.fields?.['Acct #'] ||
      '',
    );
    const accountType = normalizeText(account.accountType || account.loanType || account.fields?.['Account Type'] || account.fields?.Type);
    const subtitleParts = [accountType, accountMask ? `acct ${accountMask}` : ''].filter(Boolean);
    return {
      id: `finding-informational-${idx + 1}`,
      accountId: account.itemId || `extracted-account-${idx + 1}`,
      type: 'account',
      issueType: 'account.present',
      category: FINDING_CATEGORIES_V1.INFORMATIONAL,
      severity: 'low',
      confidence: typeof account.confidence === 'number' ? account.confidence : 0.7,
      bureau: account.bureau || '',
      source: account.source || account.bureau || '',
      account: displayTitle,
      accountName: displayTitle,
      accountMask,
      accountContext: pruneEmpty({
        creditorName: normalizeText(account.originalCreditor),
        furnisherName: normalizeText(account.furnisher),
        companyName: normalizeText(account.creditor),
        accountName: normalizeText(account.accountName),
        accountNumberMasked: accountMask,
        accountType,
        status: normalizeText(account.status || account.paymentStatus || account.accountStatus),
        balance: normalizeText(account.balance || account.pastDue || account.amountOwed),
        openedDate: normalizeText(account.dateOpened),
        reportedDate: normalizeText(account.dateReported),
        sourceSection: normalizeText(account.source || account.bureau || account.itemKind),
        evidenceSnippet: normalizeText(account.span?.text, 500),
      }),
      displayTitle,
      displaySubtitle: subtitleParts.length > 0 ? subtitleParts.join(' · ') : 'Account detected from report tradelines',
      issue: `Account detected: ${displayTitle}`,
      evidence_quote: account.span?.text || '',
      statute: '',
      recommendation: 'Review account details for accuracy and monitor for unexpected changes.',
      recommendedTemplateId: '611-standard',
      recommendedTemplateReason: 'Standard dispute template available if account details are inaccurate.',
      recommendedTemplate: {
        id: '611-standard',
        name: 'Standard Dispute',
        reason: 'Standard dispute template available if account details are inaccurate.',
        appliesToAccountId: account.itemId || `extracted-account-${idx + 1}`,
        appliesToDisplayName: displayTitle,
        appliesToMaskedAccount: accountMask,
      },
      reason: 'Tradeline present in extracted account data.',
      reasoning: 'Tradeline present in extracted account data.',
      successLikelihood: 'Informational',
      suspectedUncertain: false,
    };
  });

  suppressions.push({
    itemId: '',
    stage: 'validate',
    reason: 'informational_fallback_injected_accounts_present',
  });

  return informational;
}

function normalizeTitle(account) {
  const title =
    normalizeText(account.originalCreditor) ||
    normalizeText(account.furnisher) ||
    normalizeText(account.creditor) ||
    normalizeText(account.accountName) ||
    'Account detected';
  return title;
}

function normalizeText(value, maxLength = 120) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function pruneEmpty(obj) {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => typeof value === 'string' && value.trim().length > 0),
  );
}

function maskAccountNumber(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (raw.includes('*')) return raw.replace(/\s+/g, ' ');
  const digits = raw.replace(/\D/g, '');
  if (digits.length >= 4) return `****${digits.slice(-4)}`;
  return '';
}

export { LOW_QUALITY_TEXT_MESSAGE };
