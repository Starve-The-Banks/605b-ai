import { OPERATIONAL_FORBIDDEN_WORDS } from './types.js';

/**
 * Operational-blocker guidance templates.
 *
 * Compliance constraints (enforced by validate.js):
 *   - Never instruct the user to "remove" or "delete" a freeze/lock/alert.
 *   - Always frame as "temporarily lift" or "temporarily unlock", with
 *     restoration afterward.
 *   - Never imply the security feature is bad for credit.
 *
 * The LLM does not author any of this copy. It may only contribute a short
 * `contextLine` per item that ties the specific evidence span to the guidance
 * (e.g. "Your Experian file has a security freeze placed 03/14/2026.").
 */

const BUREAU_INSTRUCTIONS = Object.freeze({
  experian: 'Experian: temporarily lift via your account on experian.com under Freeze Center.',
  equifax: 'Equifax: temporarily lift via the Security Freeze page on equifax.com.',
  transunion: 'TransUnion: temporarily lift via the Service Center on transunion.com.',
});

const FREEZE_MESSAGE =
  'This report indicates a credit freeze, lock, or alert. This is a security feature and does not negatively impact your credit. However, it may prevent lenders or financial institutions from accessing your report. If you plan to apply for credit or complete identity verification, temporarily lift or unlock it, then restore it afterward.';

const ALERT_MESSAGE =
  'This report indicates an active fraud alert. Alerts ask creditors to verify your identity before opening new accounts and do not negatively impact your credit. If a creditor reaches out for verification, respond promptly. The alert can stay in place; you do not need to take it down to apply for credit, but expect extra verification steps.';

const EXTENDED_ALERT_MESSAGE =
  'This report indicates an extended (7-year) fraud alert. Extended alerts require creditors to take reasonable steps to verify your identity before granting credit and do not negatively impact your credit. Keep your contact information current with each bureau so verification calls reach you.';

const ACTIVE_DUTY_MESSAGE =
  'This report indicates an active duty military alert. Active duty alerts require creditors to verify your identity before granting credit while you are deployed and do not negatively impact your credit. Keep your contact information current so verification calls reach you.';

const CONSUMER_STATEMENT_MESSAGE =
  'This report includes a consumer statement that may restrict creditor access. The statement is your own filed note and does not negatively impact your credit, but it can prompt creditors to perform extra verification. Review the statement to ensure it still reflects your wishes.';

export const OPERATIONAL_BLOCKER_TEMPLATES = Object.freeze({
  freeze: {
    title: 'Credit file freeze or alert detected',
    message: FREEZE_MESSAGE,
    bureauInstructions: BUREAU_INSTRUCTIONS,
    severity: 'low',
    confidence: 0.95,
    defaultContextLine: 'This file shows an active security restriction. Temporarily lift it before applying for credit, then restore it afterward.',
  },
  lock: {
    title: 'Credit lock detected',
    message: FREEZE_MESSAGE,
    bureauInstructions: BUREAU_INSTRUCTIONS,
    severity: 'low',
    confidence: 0.92,
    defaultContextLine: 'This file shows an active credit lock. Temporarily unlock before applying for credit, then re-lock afterward.',
  },
  fraud_alert: {
    title: 'Fraud alert detected',
    message: ALERT_MESSAGE,
    bureauInstructions: BUREAU_INSTRUCTIONS,
    severity: 'low',
    confidence: 0.92,
    defaultContextLine: 'This file shows an active fraud alert. Expect extra identity verification when applying for credit.',
  },
  extended_alert: {
    title: 'Extended fraud alert detected',
    message: EXTENDED_ALERT_MESSAGE,
    bureauInstructions: BUREAU_INSTRUCTIONS,
    severity: 'low',
    confidence: 0.93,
    defaultContextLine: 'This file shows an active extended (7-year) fraud alert. Expect extra identity verification when applying for credit.',
  },
  active_duty_alert: {
    title: 'Active duty alert detected',
    message: ACTIVE_DUTY_MESSAGE,
    bureauInstructions: BUREAU_INSTRUCTIONS,
    severity: 'low',
    confidence: 0.93,
    defaultContextLine: 'This file shows an active duty military alert. Expect extra identity verification while you are deployed.',
  },
  consumer_statement: {
    title: 'Consumer statement on file',
    message: CONSUMER_STATEMENT_MESSAGE,
    bureauInstructions: BUREAU_INSTRUCTIONS,
    severity: 'low',
    confidence: 0.85,
    defaultContextLine: 'This file shows a consumer statement that may instruct creditors to verify your identity before granting credit.',
  },
});

/** Returns a defensive deep copy so callers cannot mutate template state. */
export function getOperationalTemplate(type) {
  const tmpl = OPERATIONAL_BLOCKER_TEMPLATES[type];
  if (!tmpl) return null;
  return {
    title: tmpl.title,
    message: tmpl.message,
    bureauInstructions: { ...tmpl.bureauInstructions },
    severity: tmpl.severity,
    confidence: tmpl.confidence,
    defaultContextLine: tmpl.defaultContextLine,
  };
}

/**
 * Type-aware safe-action phrases that any operational guidance/contextLine
 * MUST contain at least one of, in addition to the forbidden-word guard.
 *
 * Freeze and lock are the sensitive cases — telling a user to "remove" a
 * freeze is dangerous, so we positively require that the contextLine guides
 * the user toward a temporary lift/unlock with restoration afterward.
 *
 * Alert / statement types do not get lifted; for them the safe-language
 * pattern is verification-oriented ("verify your identity",
 * "extra verification"). Both lists are checked at module load and at
 * runtime by validate.js when an LLM-authored contextLine arrives.
 */
export const SAFE_ACTION_PHRASES_BY_TYPE = Object.freeze({
  freeze: [
    'temporarily lift',
    'temporarily unlock',
    'lift the freeze',
    'unlock your credit',
    'restore it afterward',
    'restore afterward',
  ],
  lock: [
    'temporarily lift',
    'temporarily unlock',
    'unlock your credit',
    're-lock afterward',
    'restore it afterward',
    'restore afterward',
  ],
  fraud_alert: [
    'verify your identity',
    'extra verification',
    'extra identity verification',
    'verification steps',
    'verification calls',
  ],
  extended_alert: [
    'verify your identity',
    'extra verification',
    'extra identity verification',
    'verification calls',
  ],
  active_duty_alert: [
    'verify your identity',
    'extra verification',
    'extra identity verification',
    'verification calls',
  ],
  consumer_statement: [
    'verify your identity',
    'extra verification',
    'verification',
  ],
});

/**
 * True if the supplied string contains any of the OPERATIONAL_FORBIDDEN_WORDS.
 * Used by validate.js to strip non-compliant LLM-authored contextLines.
 */
export function containsForbiddenWord(text) {
  if (!text) return false;
  const lower = String(text).toLowerCase();
  return OPERATIONAL_FORBIDDEN_WORDS.some((w) => lower.includes(w));
}

/**
 * True if `text` contains at least one safe-action phrase for the given
 * operational type. Returns false for unknown types so callers can choose
 * to fail-closed.
 */
export function containsSafeActionPhrase(text, type) {
  if (!text || !type) return false;
  const phrases = SAFE_ACTION_PHRASES_BY_TYPE[type];
  if (!phrases || phrases.length === 0) return false;
  const lower = String(text).toLowerCase();
  return phrases.some((p) => lower.includes(p));
}

/**
 * Build-time / lint-time guard. Every template body must be:
 *   1. free of OPERATIONAL_FORBIDDEN_WORDS, AND
 *   2. contain at least one type-appropriate safe-action phrase
 *      in either `message` or `defaultContextLine`.
 * Throws synchronously at module load if any template is non-compliant.
 */
for (const [type, tmpl] of Object.entries(OPERATIONAL_BLOCKER_TEMPLATES)) {
  for (const field of ['title', 'message', 'defaultContextLine']) {
    if (containsForbiddenWord(tmpl[field])) {
      throw new Error(`[operationalTemplates] Forbidden word in ${type}.${field}: "${tmpl[field]}"`);
    }
  }
  for (const [bureau, instruction] of Object.entries(tmpl.bureauInstructions)) {
    if (containsForbiddenWord(instruction)) {
      throw new Error(`[operationalTemplates] Forbidden word in ${type}.bureauInstructions.${bureau}: "${instruction}"`);
    }
  }
  // Safe-action audit: at least one of the type's safe phrases must appear
  // in either message or defaultContextLine. (BureauInstructions for
  // freeze/lock already use "temporarily lift" — this is the runtime
  // copy users see.)
  const haystack = `${tmpl.message} ${tmpl.defaultContextLine}`.toLowerCase();
  const phrases = SAFE_ACTION_PHRASES_BY_TYPE[type] || [];
  const hasSafe = phrases.some((p) => haystack.includes(p));
  if (!hasSafe) {
    throw new Error(
      `[operationalTemplates] ${type} template lacks any safe-action phrase. Required one of: ${phrases.join(', ')}`,
    );
  }
}
