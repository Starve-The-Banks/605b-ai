import { CLASSIFICATIONS, OPERATIONAL_SUBTYPE } from './types.js';

const ENRICH_TIMEOUT_MS_DEFAULT = 25_000;

const ENRICH_SYSTEM_PROMPT = `You are an enrichment annotator for a credit-report analysis pipeline.

You will receive a JSON array of pre-extracted items that the deterministic
pipeline has already identified as candidates. Two kinds of items exist:

1. STANDARD items (no "operational" flag). For these, add:
   - "issue":           one-sentence description of what is wrong.
   - "reason":          one-sentence explanation of why the evidence supports the issue.
   - "statute":         FCRA/FDCPA section if relevant, otherwise "".
   - "recommendation":  one conservative, non-promissory next step.
   - "confidence":      number between 0 and 1.

2. OPERATIONAL items (item.operational === true). These are credit freezes,
   credit locks, or fraud alerts. They are NOT derogatory items. For these,
   add ONLY a single field:
   - "contextLine":     <= 120 chars; one short sentence that ties the
                        evidence span to the user's situation
                        (e.g. "Your Equifax file has an active fraud alert").
                        DO NOT include the words "remove", "delete",
                        "deletion", or "permanent". Always frame freezes/locks
                        as something to "temporarily lift" or "temporarily
                        unlock" — never as something to take down for good.

You MUST NOT:
- Introduce new items (only annotate the items provided).
- Change the itemId, span, or evidence_quote.
- Author the title, message, or bureau instructions for operational items —
  those come from a deterministic template, not from you.
- Promise outcomes, claim deletion, or use credit-repair language.
- Speculate beyond what the item's source span says.

Conservative review standard:
- Treat charge-offs, collections, repossessions, foreclosures, late-payment
  markers, past-due balances, suspicious/unknown accounts, unauthorized or
  identity-theft language, duplicate/unknown creditors, and inconsistent
  balances/statuses as candidate issues when the provided sourceSpan directly
  supports them.
- Only annotate a "no issue" posture by omission when the sourceSpan is a
  positive/current account and does not contain suspicious or negative markers.
- Every STANDARD annotation must explain why the exact sourceSpan supports the
  issue. If the sourceSpan is insufficient, omit the annotation; do not invent.

Return ONLY a JSON array. Each element matches its input shape:

For STANDARD items:
{
  "itemId": "<verbatim itemId from input>",
  "issue": "<<= 200 chars>",
  "reason": "<<= 200 chars>",
  "statute": "FCRA §...",
  "recommendation": "<<= 200 chars>",
  "confidence": 0.0-1.0
}

For OPERATIONAL items:
{
  "itemId": "<verbatim itemId from input>",
  "contextLine": "<<= 120 chars, no forbidden words>"
}`;

/**
 * Enrich candidate classified items with statute/recommendation/issue/reason
 * via the LLM. The LLM receives a small structured payload (NOT raw PDF text)
 * and is constrained to annotate only items already in the array.
 *
 * @param {Object} args
 * @param {import('./types.js').ClassifiedItem[]} args.items
 * @param {Object} args.anthropic - Anthropic client instance
 * @param {string} args.model
 * @param {AbortSignal} [args.signal]
 * @param {number} [args.timeoutMs]
 * @param {Function} [args.now]
 * @returns {Promise<{ annotations: Map<string, EnrichmentAnnotation>, ms: number, error?: string }>}
 */
export async function enrichClassifiedItems({ items, anthropic, model, signal, timeoutMs = ENRICH_TIMEOUT_MS_DEFAULT, now = Date.now }) {
  const isOperational = (it) => it.subtype === OPERATIONAL_SUBTYPE;
  const candidates = items.filter((it) =>
    it.classification === CLASSIFICATIONS.ACTIONABLE ||
    it.classification === CLASSIFICATIONS.HIGH_PRIORITY ||
    it.classification === CLASSIFICATIONS.SUSPECTED_UNCERTAIN ||
    isOperational(it)
  );

  const start = now();
  const annotations = new Map();

  if (candidates.length === 0 || !anthropic) {
    return { annotations, ms: now() - start };
  }

  const payload = candidates.map((it) => ({
    itemId: it.itemId,
    itemKind: it.itemKind,
    classification: it.classification,
    operational: isOperational(it),
    operationalType: isOperational(it) ? it.type : undefined,
    bureau: it.bureau || '',
    source: it.source || '',
    sourceSpan: it.span?.text || '',
    classifierRule: it.classifierRule,
    classifierReason: it.classifierReason,
  }));

  let aiController = null;
  let aiTimeout = null;
  try {
    aiController = new AbortController();
    aiTimeout = setTimeout(() => aiController.abort(), timeoutMs);
    if (signal) {
      if (signal.aborted) aiController.abort();
      else signal.addEventListener('abort', () => aiController.abort(), { once: true });
    }

    const response = await anthropic.messages.create({
      model,
      max_tokens: 1500,
      system: ENRICH_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `Annotate these items. Return ONLY a JSON array.\n\n${JSON.stringify(payload)}` }],
    }, { signal: aiController.signal });

    const aiText = response?.content?.[0]?.text || '';
    const cleaned = aiText.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '');
    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (parseErr) {
      // Try to grab the first JSON array within the response.
      const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
      parsed = arrayMatch ? JSON.parse(arrayMatch[0]) : [];
      void parseErr;
    }
    if (!Array.isArray(parsed)) parsed = [];

    for (const annotation of parsed) {
      if (!annotation || typeof annotation !== 'object') continue;
      const itemId = String(annotation.itemId || '');
      if (!itemId) continue;
      annotations.set(itemId, {
        itemId,
        issue: String(annotation.issue || '').slice(0, 400),
        reason: String(annotation.reason || '').slice(0, 400),
        statute: String(annotation.statute || '').slice(0, 80),
        recommendation: String(annotation.recommendation || '').slice(0, 400),
        confidence: clampNumber(annotation.confidence, 0, 1),
        contextLine: typeof annotation.contextLine === 'string'
          ? annotation.contextLine.slice(0, 240)
          : undefined,
      });
    }
    return { annotations, ms: now() - start };
  } catch (err) {
    return { annotations, ms: now() - start, error: err?.message || String(err) };
  } finally {
    if (aiTimeout) clearTimeout(aiTimeout);
  }
}

function clampNumber(value, min, max) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  if (value > 1 && value <= 100) value = value / 100;
  return Math.max(min, Math.min(max, value));
}

/**
 * @typedef {Object} EnrichmentAnnotation
 * @property {string} itemId
 * @property {string} issue
 * @property {string} reason
 * @property {string} statute
 * @property {string} recommendation
 * @property {number|null} confidence
 * @property {string} [contextLine]  // operational items only
 */
