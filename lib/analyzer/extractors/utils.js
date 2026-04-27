import crypto from 'node:crypto';

/**
 * Stable per-item id derived from its kind and source span. Two runs against
 * the same input always produce the same itemIds, which makes the validator
 * able to confirm "this LLM-enriched finding came from this extracted item".
 */
export function makeItemId(itemKind, span) {
  const seed = `${itemKind}|${span.start}|${span.end}|${span.text}`;
  return `it_${crypto.createHash('sha1').update(seed).digest('hex').slice(0, 12)}`;
}

/** Build a SourceSpan covering [start, end) of the original text. */
export function makeSpan(text, start, end) {
  const safeStart = Math.max(0, Math.min(start, text.length));
  const safeEnd = Math.max(safeStart, Math.min(end, text.length));
  return {
    start: safeStart,
    end: safeEnd,
    text: text.slice(safeStart, safeEnd),
  };
}

/**
 * Split the text into "blocks" separated by blank lines, preserving each
 * block's start offset so we can build SourceSpans that point at the
 * original characters verbatim.
 */
export function splitBlocks(text) {
  const blocks = [];
  let cursor = 0;
  const blankRe = /\n\s*\n/g;
  let match;
  let lastEnd = 0;
  while ((match = blankRe.exec(text)) !== null) {
    const blockText = text.slice(cursor, match.index);
    if (blockText.trim().length > 0) {
      blocks.push({ start: cursor, end: match.index, text: blockText });
    }
    cursor = match.index + match[0].length;
    lastEnd = cursor;
  }
  if (lastEnd < text.length) {
    const trailing = text.slice(lastEnd);
    if (trailing.trim().length > 0) {
      blocks.push({ start: lastEnd, end: text.length, text: trailing });
    }
  }
  return blocks;
}

/**
 * Parse a block's "Key: Value" lines into a plain object. Keys are kept
 * verbatim (no lowercasing) so the classifier can match exact labels like
 * "Reported For" without ambiguity.
 */
export function parseKeyValueLines(blockText) {
  const fields = {};
  const lines = blockText.split(/\n/);
  for (const line of lines) {
    const m = line.match(/^([^:]{1,80}?):\s*(.*?)\s*$/);
    if (!m) continue;
    const key = m[1].trim();
    const value = m[2].trim();
    if (!key) continue;
    if (!(key in fields)) {
      fields[key] = value;
    } else {
      fields[key] = `${fields[key]}\n${value}`;
    }
  }
  return fields;
}

const HEADER_LINE_RE = /^([A-Z][A-Za-z0-9 \-/]{1,60}):\s*$/;

/**
 * Find sections introduced by a header line ending in colon at column 0.
 * Returns each section's header label and a SourceSpan over the body that
 * follows up to the next header or end-of-text.
 */
export function splitTopLevelSections(text) {
  const lines = text.split('\n');
  const sections = [];
  let cursor = 0;
  let current = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineLength = line.length + 1;
    const headerMatch = line.match(HEADER_LINE_RE);
    const isLikelyHeader =
      headerMatch &&
      // exclude lines that look like a key:value pair within an account block
      !/^(Account|Bureau|Status|Balance|Credit Limit|Payment Status|Payment History|Account Type|Original Creditor|Date Assigned|Date Reported|Source of Information|Reported For|Amount Owed|Unpaid Balance|Suspected Fraud|Account Abuse|Consumer ID|Report Date|Financial Institution|Name|Address|DOB)$/i.test(headerMatch[1]);
    if (isLikelyHeader) {
      if (current) {
        sections.push({
          label: current.label,
          start: current.start,
          end: cursor,
          text: text.slice(current.start, cursor),
        });
      }
      current = {
        label: headerMatch[1].trim(),
        start: cursor + lineLength,
      };
    }
    cursor += lineLength;
  }
  if (current) {
    sections.push({
      label: current.label,
      start: current.start,
      end: text.length,
      text: text.slice(current.start, text.length),
    });
  }
  return sections;
}

/** Match a single field within already-parsed fields by case-insensitive key. */
export function getField(fields, ...candidates) {
  for (const key of Object.keys(fields)) {
    for (const candidate of candidates) {
      if (key.toLowerCase() === candidate.toLowerCase()) {
        return fields[key];
      }
    }
  }
  return '';
}

/** Detect a "None" / negative-information-not-present marker. */
export function isNoneMarker(value) {
  if (!value) return false;
  const v = String(value).trim().toLowerCase();
  return (
    v === 'none' ||
    v === 'no negative banking history is reported.' ||
    v === 'no reported information found.' ||
    v === 'no sources currently reporting negative information.' ||
    /^no\s+(reported|negative|sources)/i.test(v)
  );
}

/**
 * Negative-marker pattern shared by the extractor (for diagnostics counts)
 * and the classifier (for review_only vs actionable vs high_priority gating).
 * Mirrors the v1 NEGATIVE_EVIDENCE_PATTERN with one addition: we keep
 * "amount owed: $0" out of the negatives.
 */
export const NEGATIVE_MARKER_RE = /\b(collection|collections|charged?\s*off|charge[-\s]?off|derogatory|late|delinquent|past due|repossession|foreclosure|bankruptcy|fraud|identity theft|unauthorized|not mine|disputed|inaccurate|incorrect|mismatch|inconsistent|public record|judgment|lien|settled for less|profit and loss|written off|placed for collection|days late|30 days|60 days|90 days|120 days|account abuse|suspected fraud|closed by financial institution|closed by bank|involuntary closure|overdraft|non-sufficient funds|nsf|deposit account abuse|checking account closed)\b/i;

/**
 * Typed fraud / operational marker patterns. Each pattern detects a specific
 * security feature (freeze, lock, fraud alert, etc.) that the spec requires
 * to flow through the operational-blocker classification path — NOT the
 * derogatory path. Patterns are negation-guarded against "Fraud Alerts: None"
 * and similar clean-report idioms.
 */
const FRAUD_MARKER_PATTERNS = [
  {
    type: 'freeze',
    confidence: 0.95,
    re: /\b(security freeze|credit freeze|file is frozen|file frozen|freeze (is )?(active|placed)|freeze placed)\b/i,
  },
  {
    type: 'lock',
    confidence: 0.92,
    re: /\b(credit lock|file is locked|file locked|lock (is )?(active|enabled)|lock enabled)\b/i,
  },
  {
    type: 'extended_alert',
    confidence: 0.93,
    re: /\b(extended (fraud )?alert|7[\- ]year (fraud )?alert)\b/i,
  },
  {
    type: 'active_duty_alert',
    confidence: 0.93,
    re: /\b(active duty (military )?alert|military alert)\b/i,
  },
  {
    type: 'fraud_alert',
    confidence: 0.92,
    re: /\b(fraud alert|initial fraud alert|active fraud alert)\b/i,
  },
  {
    type: 'consumer_statement',
    confidence: 0.85,
    re: /\bconsumer statement\b[\s\S]{0,200}?(do not extend credit|restrict|contact (?:consumer|me) before)/i,
  },
];

/** Lines/phrases that mean "no marker present" — used as a negation guard. */
const FRAUD_NEGATION_RE = /\b(fraud alerts?|consumer statements?|fraud)\s*:\s*(none|n\/a|no\b)/i;

/**
 * Detect typed operational/fraud markers anywhere in the report text.
 * Returns one entry per matched pattern with a SourceSpan over the matched
 * substring, plus a small surrounding context window.
 *
 * Negation guard: if the same line/phrase is also captured by FRAUD_NEGATION_RE
 * (e.g. "Fraud Alerts: None"), no marker is emitted for that match.
 *
 * @param {string} text
 * @returns {Array<{
 *   type: string,
 *   span: { start: number, end: number, text: string },
 *   marker: string,
 *   context: string,
 *   confidence: number,
 * }>}
 */
export function detectFraudMarkers(text) {
  if (!text) return [];
  const out = [];
  const seenSpans = new Set();
  for (const { type, re, confidence } of FRAUD_MARKER_PATTERNS) {
    const flags = re.flags.includes('g') ? re.flags : `${re.flags}g`;
    const globalRe = new RegExp(re.source, flags);
    let match;
    while ((match = globalRe.exec(text)) !== null) {
      const start = match.index;
      const end = start + match[0].length;
      const lineStart = text.lastIndexOf('\n', start - 1) + 1;
      const lineEndIdx = text.indexOf('\n', end);
      const lineEnd = lineEndIdx === -1 ? text.length : lineEndIdx;
      const lineText = text.slice(lineStart, lineEnd);
      // Negation guard: skip "Fraud Alerts: None" and friends.
      if (FRAUD_NEGATION_RE.test(lineText)) continue;
      // Dedupe by line — multiple regex hits on the same line collapse to one
      // marker whose span covers the entire line. This makes the evidence
      // quote more useful (full sentence instead of a 2-word fragment) and
      // prevents emitting two separate markers when, e.g., both
      // "Security Freeze:" and "Security freeze active" appear on one line.
      const key = `${type}|${lineStart}|${lineEnd}`;
      if (seenSpans.has(key)) continue;
      seenSpans.add(key);
      const ctxStart = Math.max(0, start - 60);
      const ctxEnd = Math.min(text.length, end + 60);
      out.push({
        type,
        span: makeSpan(text, lineStart, lineEnd),
        marker: text.slice(start, end),
        context: text.slice(ctxStart, ctxEnd),
        confidence,
      });
    }
  }
  return out;
}

/** Filter the marker pattern through a "marker but explicitly NONE" guard. */
export function hasNegativeMarker(text) {
  if (!text) return false;
  const neutralized = String(text)
    // "<Section>: None" — "Late Payments: None", "Suspected Fraud: None", etc.
    .replace(/(suspected fraud|account abuse|fraud alerts|public records|collections|derogatory accounts|late payments|reported information|consumer (disputes|statements)):\s*none/gi, '')
    // "Never late" / "no late" / "never delinquent" / "no past due" — common in clean reports.
    .replace(/\b(never|no)\s+(late|delinquent|past\s*due|disputes?|collections?|derogatory|negative)\b/gi, '')
    .replace(/\bno\s+30\s+days\b/gi, '')
    .replace(/no negative banking history/gi, '')
    .replace(/no reported information found/gi, '')
    .replace(/no sources currently reporting negative information/gi, '')
    // "Past Due Amount: $0" — $0 is not actually past due.
    .replace(/past\s*due\s*(amount)?:\s*\$?0\b/gi, '');
  return NEGATIVE_MARKER_RE.test(neutralized);
}
