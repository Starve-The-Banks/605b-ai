import { buildValidatedFindings } from '../../lib/analyzer/validate.js';
import { CLASSIFICATIONS, OPERATIONAL_SUBTYPE } from '../../lib/analyzer/types.js';

/** Build a synthetic ClassifiedItem so we can drive validate.js directly. */
function makeFreezeItem(overrides = {}) {
  return {
    itemId: 'it_test_freeze_1',
    itemKind: 'fraud',
    type: 'freeze',
    span: {
      start: 0,
      end: 'Security Freeze: Security freeze active on this file as of 03/14/2026.'.length,
      text: 'Security Freeze: Security freeze active on this file as of 03/14/2026.',
    },
    bureau: 'Experian',
    source: 'consumer report',
    marker: 'Security Freeze',
    context: 'Security Freeze: Security freeze active on this file as of 03/14/2026.',
    confidence: 0.95,
    fields: { line: 'Security Freeze' },
    classification: CLASSIFICATIONS.REVIEW_ONLY,
    classifierConfidence: 0.95,
    classifierRule: 'operational.freeze',
    classifierReason: 'Credit file restriction detected (security freeze).',
    isNegativeMarker: false,
    subtype: OPERATIONAL_SUBTYPE,
    ...overrides,
  };
}

describe('validator — operational blocker invariants', () => {
  test('LLM contextLine missing safe-action phrase falls back to template default', () => {
    const item = makeFreezeItem();
    const annotations = new Map([
      [item.itemId, {
        itemId: item.itemId,
        contextLine: 'Your Experian file shows a freeze.', // no safe-action phrase
      }],
    ]);

    const out = buildValidatedFindings({ classified: [item], annotations });
    const finding = out.reviewOnly[0];
    expect(finding.subtype).toBe(OPERATIONAL_SUBTYPE);
    expect(finding.operationalGuidance.contextLine).toMatch(
      /temporarily lift|temporarily unlock|restore it afterward/i,
    );
    // The fallback was logged as a suppression so diagnostics keep a paper trail.
    const suppression = out.suppressions.find(
      (s) => s.itemId === item.itemId && s.reason === 'operational_context_line_missing_safe_phrase',
    );
    expect(suppression).toBeTruthy();
  });

  test('LLM contextLine with a forbidden word falls back to template default', () => {
    const item = makeFreezeItem();
    const annotations = new Map([
      [item.itemId, {
        itemId: item.itemId,
        contextLine: 'You should remove this freeze permanently to apply for credit.',
      }],
    ]);

    const out = buildValidatedFindings({ classified: [item], annotations });
    const finding = out.reviewOnly[0];
    expect(finding.operationalGuidance.contextLine.toLowerCase()).not.toMatch(
      /\b(remove|removal|delete|deletion|permanent|permanently)\b/,
    );
    const suppression = out.suppressions.find(
      (s) => s.reason === 'operational_context_line_forbidden_word',
    );
    expect(suppression).toBeTruthy();
  });

  test('LLM contextLine that is well-formed passes through untouched', () => {
    const item = makeFreezeItem();
    const annotations = new Map([
      [item.itemId, {
        itemId: item.itemId,
        contextLine: 'Your Experian file has a security freeze placed 03/14/2026 — temporarily lift before applying for credit, then restore it afterward.',
      }],
    ]);

    const out = buildValidatedFindings({ classified: [item], annotations });
    const finding = out.reviewOnly[0];
    expect(finding.operationalGuidance.contextLine).toContain('temporarily lift');
    // No fallback suppression should fire when the contextLine is valid.
    const fallbacks = out.suppressions.filter(
      (s) => s.itemId === item.itemId && s.reason.startsWith('operational_context_line_'),
    );
    expect(fallbacks).toHaveLength(0);
  });

  test('classified operational item with HIGH_PRIORITY is suppressed via operational_promotion_blocked', () => {
    const promoted = makeFreezeItem({
      classification: CLASSIFICATIONS.HIGH_PRIORITY,
      classifierConfidence: 0.95,
    });
    const annotations = new Map();

    const out = buildValidatedFindings({ classified: [promoted], annotations });
    const promotionBlocked = out.suppressions.find(
      (s) => s.itemId === promoted.itemId && s.reason === 'operational_promotion_blocked',
    );
    expect(promotionBlocked).toBeTruthy();

    // Even though the classification was elevated, the finding is force-clamped
    // to review_only with the operational subtype.
    expect(out.findings).toHaveLength(0);
    const reviewOrSuspect = [...out.reviewOnly, ...out.suspectedUncertain];
    expect(reviewOrSuspect).toHaveLength(1);
    expect(reviewOrSuspect[0].category).toBe('review_only');
    expect(reviewOrSuspect[0].subtype).toBe(OPERATIONAL_SUBTYPE);
  });

  test('LLM cannot inject contextLine for a non-existent item', () => {
    const item = makeFreezeItem();
    const annotations = new Map([
      ['it_fake_unknown_id', {
        itemId: 'it_fake_unknown_id',
        contextLine: 'Hallucinated freeze, please ignore.',
      }],
    ]);

    const out = buildValidatedFindings({ classified: [item], annotations });
    const unknownSuppression = out.suppressions.find(
      (s) => s.itemId === 'it_fake_unknown_id' && s.reason === 'llm_introduced_unknown_item',
    );
    expect(unknownSuppression).toBeTruthy();
  });
});
