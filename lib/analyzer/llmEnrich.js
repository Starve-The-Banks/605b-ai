import { CLASSIFICATIONS } from './types.js';

const ENRICH_TIMEOUT_MS_DEFAULT = 25_000;

const ENRICH_SYSTEM_PROMPT = `You are an enrichment annotator for a credit-report analysis pipeline.

You will receive a JSON array of pre-extracted items that the deterministic
pipeline has already identified as candidates. For each item:
- Add a one-sentence "issue" describing what is wrong with the item.
- Add a one-sentence "reason" explaining why the evidence supports that issue.
- Add a "statute" string (FCRA/FDCPA section) only when relevant; otherwise "".
- Add a "recommendation" — one conservative, non-promissory next step.
- Provide a confidence number between 0 and 1.

You MUST NOT:
- Introduce new items (only annotate the items provided).
- Change the itemId, span, or evidence_quote.
- Promise outcomes, claim deletion, or use credit-repair language.
- Speculate beyond what the item's source span says.

Return ONLY a JSON array. Each element must be:
{
  "itemId": "<verbatim itemId from input>",
  "issue": "<<= 200 chars>",
  "reason": "<<= 200 chars>",
  "statute": "FCRA §...",
  "recommendation": "<<= 200 chars>",
  "confidence": 0.0-1.0
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
  const candidates = items.filter((it) =>
    it.classification === CLASSIFICATIONS.ACTIONABLE ||
    it.classification === CLASSIFICATIONS.HIGH_PRIORITY ||
    it.classification === CLASSIFICATIONS.SUSPECTED_UNCERTAIN
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
 */
