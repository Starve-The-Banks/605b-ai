export const CLEAN_REPORT_TITLE = 'No obvious issues found';
export const CLEAN_REPORT_BODY =
  'This report does not appear to show negative or suspicious items that need immediate attention. You can still review your accounts for accuracy.';
export const LOW_QUALITY_TEXT_MESSAGE =
  'We could not confidently analyze this report. Please upload a clearer PDF.';

const MAX_FINDINGS = 30;
const MAX_POSITIVE_FACTORS = 15;
const MAX_CROSS_BUREAU_ITEMS = 10;
const MAX_ACTION_PLAN_ITEMS = 10;
const MIN_ISSUE_CONFIDENCE = 0.75;

const REPORT_TYPES = new Set([
  'Equifax',
  'Experian',
  'TransUnion',
  'ChexSystems',
  'LexisNexis',
  'EWS',
  'Innovis',
  'SageStream',
  'NCTUE',
  'Unknown',
]);

const FINDING_CATEGORIES = new Set([
  'review_only',
  'potential_issue',
  'high_priority_issue',
]);

const FINDING_TYPES = new Set([
  'accuracy',
  'identity',
  'timeliness',
  'completeness',
  'inquiry',
  'personal-info',
  'collection',
  'late-payment',
  'public-record',
  'other',
]);

const NEGATIVE_EVIDENCE_PATTERN =
  /\b(collection|collections|charged?\s*off|charge[-\s]?off|derogatory|late|delinquent|past due|repossession|foreclosure|bankruptcy|fraud|identity theft|unauthorized|not mine|disputed|dispute|inaccurate|incorrect|mismatch|inconsistent|unknown account|public record|judgment|lien|settled for less|profit and loss|written off|placed for collection|days late|30 days|60 days|90 days)\b/i;

const POSITIVE_EVIDENCE_PATTERN =
  /\b(pays as agreed|paid as agreed|never late|current|good standing|closed\s*\/?\s*paid|paid satisfactorily|satisfactory|balance:\s*\$?0\b|derogatory accounts:\s*none|collections:\s*none|public records:\s*none)\b/i;

const FRAUD_INQUIRY_PATTERN =
  /\b(fraud|identity theft|unauthorized|not mine|did not authorize|unknown inquiry|suspicious inquiry)\b/i;

const REPORT_TEXT_TERMS_PATTERN =
  /\b(account|bureau|credit|report|payment|balance|status|inquiry|collection|tradeline|derogatory|public record|chexsystems|lexisnexis|transunion|equifax|experian)\b/i;

export const ANALYSIS_SYSTEM_PROMPT = `You are an evidence-first financial document review system for consumer credit and specialty reports. Your job is to identify candidate findings ONLY when the uploaded report text directly supports them.

Core standard:
- A clean report is a valid successful outcome.
- It is acceptable and often correct to return zero findings.
- Do not create a finding to be thorough. Accuracy and restraint matter more than volume.
- Treat the report like a financial document, not a creative writing task.

Report type detection:
- Identify the source as Equifax, Experian, TransUnion, ChexSystems, LexisNexis, EWS, Innovis, SageStream, NCTUE, or Unknown.
- If the report text does not make the source clear, use "Unknown".

Strict anti-hallucination rules:
- Every finding MUST cite an exact "evidence_quote" copied verbatim from the report text.
- Do not create issues unless the report text clearly supports the issue.
- Do not treat normal positive accounts as disputes.
- Do not flag paid/current/accounts in good standing unless the same report text marks them derogatory, late, charged off, collection, disputed, fraud, unknown, inaccurate, or inconsistent.
- Do not infer identity theft from normal inquiries or ordinary open accounts.
- Do not recommend disputes for accurate positive accounts.
- Inquiries alone are "review_only", not disputes, unless the report text clearly says fraud, unauthorized, not mine, identity theft, or similar.
- If evidence is weak, classify as "review_only" or return no finding.
- If confidence is below 0.75, do not classify the item as "potential_issue" or "high_priority_issue".
- If the report is clean, return "findings": [].
- If extracted PDF text is weak or garbled, return zero findings and set summary.overallAssessment to "${LOW_QUALITY_TEXT_MESSAGE}"

Finding categories:
- "review_only": something the user may want to manually check, but not an issue or dispute recommendation.
- "potential_issue": directly supported negative, suspicious, inconsistent, or inaccurate item with confidence >= 0.75.
- "high_priority_issue": directly supported serious derogatory, fraud, identity-theft, collection, charge-off, public-record, or clear legal-timing issue with confidence >= 0.75.

Confidence scoring:
- 0.90-1.00: high confidence; report text directly and specifically supports the finding.
- 0.75-0.89: medium confidence; report text supports concern but may need user confirmation.
- Below 0.75: low confidence; use "review_only" or omit.

Clean-report language:
- When no potential_issue or high_priority_issue exists, say "No obvious errors found."
- When no action appears necessary, say "No action appears necessary based on this report."
- Do not force action steps for a clean report.

Output format:
Return ONLY a valid JSON object. No markdown, no code fences, no explanation outside JSON.
Use this structure exactly:
{
  "reportType": "Equifax" | "Experian" | "TransUnion" | "ChexSystems" | "LexisNexis" | "EWS" | "Innovis" | "SageStream" | "NCTUE" | "Unknown",
  "summary": {
    "reportStatus": "clean" | "review_only" | "potential_issue" | "high_priority_issue",
    "overallAssessment": "brief evidence-based summary; for clean reports include No obvious errors found and No action appears necessary based on this report",
    "potentialIssues": <number of potential_issue + high_priority_issue findings>,
    "highPriorityItems": <number of high_priority_issue findings>,
    "reviewItems": <number of review_only findings>,
    "reportDate": "extracted date if visible, or null"
  },
  "findings": [
    {
      "id": "finding-1",
      "type": "accuracy" | "identity" | "timeliness" | "completeness" | "inquiry" | "personal-info" | "collection" | "late-payment" | "public-record" | "other",
      "category": "review_only" | "potential_issue" | "high_priority_issue",
      "severity": "high" | "medium" | "low",
      "confidence": 0.0,
      "bureau": "bureau/source name when available",
      "source": "report source or data source when available",
      "account": "creditor/account/source identifier when available",
      "issue": "specific finding supported by the evidence quote",
      "evidence_quote": "exact quote copied from the report text",
      "statute": "FCRA/FDCPA statute only when relevant; otherwise empty string",
      "recommendation": "specific conservative next step; do not recommend disputes for review_only items",
      "reason": "why the evidence supports this category",
      "reasoning": "same as reason for backward compatibility",
      "successLikelihood": "Strong" | "Moderate" | "Possible" | "Review only"
    }
  ],
  "positiveFactors": ["positive accounts or good-standing facts from the report", ...],
  "crossBureauInconsistencies": [
    {
      "item": "Account or data point",
      "details": "Only include if the uploaded report directly shows the inconsistency"
    }
  ],
  "personalInfo": {
    "namesFound": ["name variations found"],
    "addressesFound": ["addresses found"],
    "issues": ["only direct personal-info issues supported by report text"]
  },
  "actionPlan": [
    "Only include action steps for potential_issue or high_priority_issue findings. For clean reports, use []"
  ]
}`;

function cleanString(value, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback;
}

function normalizeWhitespace(value) {
  return cleanString(value).replace(/\s+/g, ' ').trim();
}

function normalizeForEvidence(value) {
  return normalizeWhitespace(value).toLowerCase();
}

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeReportType(value) {
  const reportType = cleanString(value, 'Unknown');
  return REPORT_TYPES.has(reportType) ? reportType : 'Unknown';
}

function normalizeType(value) {
  const type = cleanString(value, 'other');
  return FINDING_TYPES.has(type) ? type : 'other';
}

function normalizeCategory(value, severity) {
  const category = cleanString(value);
  if (FINDING_CATEGORIES.has(category)) return category;
  if (severity === 'high') return 'high_priority_issue';
  if (severity === 'medium') return 'potential_issue';
  return 'review_only';
}

function normalizeSeverity(value, category) {
  const severity = cleanString(value).toLowerCase();
  if (severity === 'high' || severity === 'medium' || severity === 'low') return severity;
  if (category === 'high_priority_issue') return 'high';
  if (category === 'potential_issue') return 'medium';
  return 'low';
}

function normalizeConfidence(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    if (value > 1 && value <= 100) return Math.max(0, Math.min(1, value / 100));
    return Math.max(0, Math.min(1, value));
  }

  const text = cleanString(value).toLowerCase();
  if (text === 'high' || text === 'strong') return 0.9;
  if (text === 'medium' || text === 'moderate') return 0.75;
  if (text === 'low' || text === 'possible') return 0.5;
  return null;
}

function evidenceExists(extractedText, evidenceQuote) {
  const quote = normalizeForEvidence(evidenceQuote);
  if (quote.length < 8) return false;
  return normalizeForEvidence(extractedText).includes(quote);
}

function hasNegativeEvidence(text) {
  return NEGATIVE_EVIDENCE_PATTERN.test(text);
}

function hasPositiveOnlyEvidence(text) {
  return POSITIVE_EVIDENCE_PATTERN.test(text) && !hasNegativeEvidence(text);
}

function isInquiryFinding(finding, evidenceQuote) {
  return (
    finding.type === 'inquiry' ||
    /\binquir(y|ies)\b/i.test(`${finding.issue} ${finding.account} ${evidenceQuote}`)
  );
}

function categoryFromAllowedEvidence(finding, evidenceQuote) {
  const currentCategory = finding.category;
  const confidence = finding.confidence;

  if (confidence < MIN_ISSUE_CONFIDENCE) return 'review_only';

  if (isInquiryFinding(finding, evidenceQuote) && !FRAUD_INQUIRY_PATTERN.test(evidenceQuote)) {
    return 'review_only';
  }

  if (currentCategory === 'high_priority_issue') return 'high_priority_issue';
  if (currentCategory === 'potential_issue') return 'potential_issue';
  return 'review_only';
}

function summarizeStatus(findings) {
  if (findings.some((finding) => finding.category === 'high_priority_issue')) {
    return 'high_priority_issue';
  }
  if (findings.some((finding) => finding.category === 'potential_issue')) {
    return 'potential_issue';
  }
  if (findings.some((finding) => finding.category === 'review_only')) {
    return 'review_only';
  }
  return 'clean';
}

function countByCategory(findings, category) {
  return findings.filter((finding) => finding.category === category).length;
}

function cleanAssessment(parsedAssessment, findings) {
  const assessment = cleanString(parsedAssessment);
  if (findings.length > 0) return assessment || 'Analysis completed.';
  if (assessment === LOW_QUALITY_TEXT_MESSAGE) return assessment;
  return `${CLEAN_REPORT_TITLE}. No action appears necessary based on this report. ${CLEAN_REPORT_BODY}`;
}

function normalizeFinding(rawFinding, index, parsed, extractedText) {
  if (!isRecord(rawFinding)) return null;

  const initialSeverity = normalizeSeverity(rawFinding.severity, rawFinding.category);
  const initialCategory = normalizeCategory(rawFinding.category, initialSeverity);
  const confidence = normalizeConfidence(rawFinding.confidence);
  const evidenceQuote = cleanString(
    rawFinding.evidence_quote || rawFinding.evidenceQuote || rawFinding.evidence || rawFinding.sourceText
  );
  const issue = cleanString(rawFinding.issue);
  const reason = cleanString(rawFinding.reason || rawFinding.reasoning);
  const account = cleanString(rawFinding.account || rawFinding.source || rawFinding.bureau, 'Credit report');
  const reportType = normalizeReportType(parsed.reportType);
  const bureau = cleanString(rawFinding.bureau || rawFinding.source || (reportType !== 'Unknown' ? reportType : ''));
  const source = cleanString(rawFinding.source || rawFinding.bureau || (reportType !== 'Unknown' ? reportType : ''));

  if (!issue || !reason || confidence === null || !evidenceQuote) return null;
  if (!bureau && !source) return null;
  if (!evidenceExists(extractedText, evidenceQuote)) return null;
  if (hasPositiveOnlyEvidence(evidenceQuote)) return null;

  const type = normalizeType(rawFinding.type);
  const candidate = {
    id: cleanString(rawFinding.id, `finding-${index + 1}`),
    type,
    category: initialCategory,
    severity: initialSeverity,
    confidence,
    bureau,
    source,
    account,
    issue,
    evidence_quote: evidenceQuote,
    statute: cleanString(rawFinding.statute),
    recommendation: cleanString(rawFinding.recommendation),
    reason,
    reasoning: reason,
    successLikelihood: cleanString(rawFinding.successLikelihood, 'Review only'),
  };

  if (!hasNegativeEvidence(evidenceQuote) && candidate.category !== 'review_only') {
    if (isInquiryFinding(candidate, evidenceQuote)) {
      candidate.category = 'review_only';
    } else {
      return null;
    }
  }

  candidate.category = categoryFromAllowedEvidence(candidate, evidenceQuote);
  candidate.severity = normalizeSeverity(candidate.severity, candidate.category);

  if (candidate.category === 'review_only') {
    candidate.severity = 'low';
    candidate.successLikelihood = 'Review only';
    if (/dispute/i.test(candidate.recommendation) && !FRAUD_INQUIRY_PATTERN.test(evidenceQuote)) {
      candidate.recommendation = 'Review this item for accuracy before deciding whether any action is needed.';
    }
  }

  return candidate;
}

function dedupeFindings(findings) {
  const seen = new Set();
  const deduped = [];

  for (const finding of findings) {
    const key = normalizeForEvidence(`${finding.account}|${finding.evidence_quote}|${finding.issue}`);
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(finding);
  }

  return deduped;
}

export function assessExtractedTextQuality(extractedText) {
  const text = cleanString(extractedText);
  const words = text.split(/\s+/).filter((word) => /[A-Za-z0-9]{3,}/.test(word));
  const alphaNumericChars = (text.match(/[A-Za-z0-9]/g) || []).length;
  const visibleChars = text.replace(/\s/g, '').length;
  const alphaNumericRatio = visibleChars === 0 ? 0 : alphaNumericChars / visibleChars;

  if (text.length < 50 || words.length < 10) {
    return { analyzable: false, reason: 'too_short' };
  }
  if (alphaNumericRatio < 0.55) {
    return { analyzable: false, reason: 'garbled_text' };
  }
  if (!REPORT_TEXT_TERMS_PATTERN.test(text)) {
    return { analyzable: false, reason: 'missing_report_terms' };
  }

  return { analyzable: true, reason: null };
}

export function normalizeAnalysisResult({ parsed, extractedText }) {
  const safeParsed = isRecord(parsed) ? parsed : {};
  const reportType = normalizeReportType(safeParsed.reportType);

  const findings = dedupeFindings(
    asArray(safeParsed.findings)
      .slice(0, MAX_FINDINGS)
      .map((finding, index) => normalizeFinding(finding, index, { ...safeParsed, reportType }, extractedText))
      .filter(Boolean)
  );

  const reportStatus = summarizeStatus(findings);
  const potentialIssues =
    countByCategory(findings, 'potential_issue') + countByCategory(findings, 'high_priority_issue');
  const highPriorityItems = countByCategory(findings, 'high_priority_issue');
  const reviewItems = countByCategory(findings, 'review_only');
  const parsedSummary = isRecord(safeParsed.summary) ? safeParsed.summary : {};

  return {
    reportType,
    summary: {
      reportStatus,
      overallAssessment: cleanAssessment(parsedSummary.overallAssessment, findings),
      potentialIssues,
      highPriorityItems,
      reviewItems,
      reportDate: parsedSummary.reportDate || null,
      cleanReport: potentialIssues === 0,
      analysisConfidence: findings.length === 0 ? 'high' : 'evidence_based',
    },
    findings,
    positiveFactors: asArray(safeParsed.positiveFactors)
      .filter((item) => typeof item === 'string' && item.trim().length > 0)
      .slice(0, MAX_POSITIVE_FACTORS),
    crossBureauInconsistencies: asArray(safeParsed.crossBureauInconsistencies)
      .slice(0, MAX_CROSS_BUREAU_ITEMS)
      .map((item) => ({
        item: cleanString(item?.item),
        details: cleanString(item?.details),
      }))
      .filter((item) => item.item && item.details),
    personalInfo: isRecord(safeParsed.personalInfo) ? safeParsed.personalInfo : {},
    actionPlan: potentialIssues > 0
      ? asArray(safeParsed.actionPlan)
        .filter((item) => typeof item === 'string' && item.trim().length > 0)
        .slice(0, MAX_ACTION_PLAN_ITEMS)
      : [],
  };
}

function fallbackTextParse(text) {
  return {
    reportType: 'Unknown',
    summary: {
      overallAssessment: cleanString(text).slice(0, 1000) || 'Analysis completed.',
      reportDate: null,
    },
    findings: [],
    positiveFactors: [],
    crossBureauInconsistencies: [],
    personalInfo: {},
    actionPlan: [],
  };
}

export function parseAnalysisResponse(aiResponse, extractedText) {
  const maxResponseLength = 80000;
  const text = cleanString(aiResponse).length > maxResponseLength
    ? cleanString(aiResponse).slice(0, maxResponseLength)
    : cleanString(aiResponse);

  const cleaned = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (jsonErr) {
    console.warn('[Analyze] JSON parse failed, falling back to conservative empty parse:', jsonErr.message);
    parsed = fallbackTextParse(text);
  }

  return normalizeAnalysisResult({ parsed, extractedText });
}
