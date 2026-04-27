/**
 * Analyzer Pipeline v2 — schema typedefs (JSDoc only; runtime is JS).
 *
 * Pipeline stages:
 *   1. extract   → ExtractedReport with verbatim source spans
 *   2. classify  → ClassifiedItem[] using deterministic rules
 *   3. enrich    → EnrichedFinding[] via LLM, structured input only
 *   4. validate  → drop anything LLM introduced or whose span no longer matches
 *   5. diagnose  → AnalyzerDiagnostics with whyStatus and suppression log
 *
 * Hard invariants:
 *   - Every finding's evidence_quote === its source span (set by extractor, not LLM).
 *   - LLM never introduces items; only annotates items already extracted.
 *   - If extracted negative-marker count > 0, status cannot be 'clean'.
 */

/**
 * @typedef {Object} SourceSpan
 * @property {number} start
 * @property {number} end
 * @property {string} text
 */

/**
 * @typedef {Object} ExtractedItemBase
 * @property {string} itemId
 * @property {'account'|'collection'|'inquiry'|'public_record'|'banking'|'fraud'|'remark'|'personal_info'} itemKind
 * @property {SourceSpan} span
 * @property {string} bureau
 * @property {string} source
 * @property {string} [furnisher]
 * @property {Object<string,string>} fields
 */

/**
 * @typedef {ExtractedItemBase & {
 *   accountName: string,
 *   status?: string,
 *   paymentStatus?: string,
 *   balance?: string,
 *   creditLimit?: string,
 *   paymentHistory?: string,
 * }} ExtractedAccount
 */

/**
 * @typedef {ExtractedItemBase & {
 *   accountName: string,
 *   originalCreditor?: string,
 *   status?: string,
 *   balance?: string,
 *   dateAssigned?: string,
 *   paymentStatus?: string,
 * }} ExtractedCollection
 */

/**
 * @typedef {ExtractedItemBase & {
 *   creditor: string,
 *   inquiryDate?: string,
 *   inquiryType?: string,
 *   fraudMarker?: boolean,
 * }} ExtractedInquiry
 */

/**
 * @typedef {ExtractedItemBase & {
 *   recordType: string,
 *   amount?: string,
 *   filedDate?: string,
 *   status?: string,
 * }} ExtractedPublicRecord
 */

/**
 * @typedef {ExtractedItemBase & {
 *   reportedFor?: string,
 *   amountOwed?: string,
 *   accountType?: string,
 *   status?: string,
 *   dateReported?: string,
 *   suspectedFraud?: string,
 *   accountAbuse?: string,
 *   unpaidBalance?: string,
 * }} ExtractedBankingItem
 */

/**
 * @typedef {ExtractedItemBase & { marker: string, context: string }} ExtractedFraudMarker
 */

/**
 * @typedef {ExtractedItemBase & { remarkText: string }} ExtractedRemark
 */

/**
 * @typedef {Object} ExtractedReport
 * @property {string} reportType
 * @property {string} reportSource
 * @property {string|null} reportDate
 * @property {string|null} consumerId
 * @property {{ names: string[], addresses: string[], partialSSNs: string[], dobs: string[] }} personalInfo
 * @property {ExtractedAccount[]} accounts
 * @property {ExtractedCollection[]} collections
 * @property {ExtractedInquiry[]} inquiries
 * @property {ExtractedPublicRecord[]} publicRecords
 * @property {ExtractedBankingItem[]} bankingItems
 * @property {ExtractedRemark[]} remarks
 * @property {ExtractedFraudMarker[]} fraudMarkers
 * @property {number} rawTextLength
 * @property {{ totalItems: number, sectionsFound: string[] }} summary
 */

/**
 * @typedef {ExtractedItemBase & {
 *   classification: 'positive'|'neutral'|'review_only'|'actionable'|'high_priority'|'suspected_uncertain',
 *   classifierConfidence: number,
 *   classifierRule: string,
 *   classifierReason: string,
 *   isNegativeMarker: boolean
 * }} ClassifiedItem
 */

/**
 * @typedef {Object} EnrichedFinding
 * @property {string} id
 * @property {string} itemId
 * @property {string} type
 * @property {'review_only'|'potential_issue'|'high_priority_issue'} category
 * @property {boolean} suspectedUncertain
 * @property {'high'|'medium'|'low'} severity
 * @property {number} confidence
 * @property {string} bureau
 * @property {string} source
 * @property {string} account
 * @property {string} issue
 * @property {string} evidence_quote
 * @property {string} statute
 * @property {string} recommendation
 * @property {string} reason
 * @property {string} reasoning
 * @property {'Strong'|'Moderate'|'Possible'|'Review only'} successLikelihood
 */

/**
 * @typedef {Object} AnalyzerDiagnostics
 * @property {{ extract: number, classify: number, llm: number, validate: number, total: number }} pipelineMs
 * @property {{ accounts: number, collections: number, inquiries: number, publicRecords: number, bankingItems: number, remarks: number, fraudMarkers: number }} extractedCount
 * @property {number} negativeMarkerCount
 * @property {number} candidateIssueCount
 * @property {number} finalIssueCount
 * @property {Array<{ itemId: string, stage: string, reason: string }>} suppressions
 * @property {string} whyStatus
 * @property {boolean} suspectedUncertain
 * @property {string} pipelineVersion
 */

export const PIPELINE_VERSION = '2.0.0';
export const ANALYSIS_RESULT_SCHEMA_VERSION = 2;

export const CLASSIFICATIONS = Object.freeze({
  POSITIVE: 'positive',
  NEUTRAL: 'neutral',
  REVIEW_ONLY: 'review_only',
  ACTIONABLE: 'actionable',
  HIGH_PRIORITY: 'high_priority',
  SUSPECTED_UNCERTAIN: 'suspected_uncertain',
});

export const FINDING_CATEGORIES_V1 = Object.freeze({
  REVIEW_ONLY: 'review_only',
  POTENTIAL_ISSUE: 'potential_issue',
  HIGH_PRIORITY_ISSUE: 'high_priority_issue',
});

export const REPORT_STATUS_V1 = Object.freeze({
  CLEAN: 'clean',
  REVIEW_ONLY: 'review_only',
  POTENTIAL_ISSUE: 'potential_issue',
  HIGH_PRIORITY_ISSUE: 'high_priority_issue',
});
