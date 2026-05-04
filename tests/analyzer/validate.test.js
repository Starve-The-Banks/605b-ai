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

describe('validator — account context display', () => {
  test('finding preserves creditor/tradeline context and title does not use parser labels', () => {
    const item = {
      itemId: 'it_collection_context',
      itemKind: 'collection',
      span: {
        start: 0,
        end: 'JEFFERSON CAPITAL\nAccount Type: Debt Buyer\nAccount Number: 12345926\nStatus: Collection\nBalance: $842'.length,
        text: 'JEFFERSON CAPITAL\nAccount Type: Debt Buyer\nAccount Number: 12345926\nStatus: Collection\nBalance: $842',
      },
      bureau: 'TransUnion',
      source: 'TransUnion',
      accountName: 'TypeDebt Buyer',
      furnisher: 'Jefferson Capital',
      accountType: 'Debt Buyer',
      status: 'Collection',
      balance: '$842',
      accountNumberSuffix: '5926',
      fields: {
        'Account Type': 'Debt Buyer',
        'Account Number': '12345926',
        Status: 'Collection',
        Balance: '$842',
      },
      classification: CLASSIFICATIONS.HIGH_PRIORITY,
      classifierConfidence: 0.96,
      classifierRule: 'collection.is_collection',
      classifierReason: 'Account is reported as a collection account.',
      isNegativeMarker: true,
    };

    const out = buildValidatedFindings({ classified: [item], annotations: new Map() });
    const finding = out.findings[0];

    expect(finding.account).toBe('Jefferson Capital');
    expect(finding.account).not.toMatch(/TypeDebt Buyer/);
    expect(finding.accountContext).toMatchObject({
      furnisherName: 'Jefferson Capital',
      accountType: 'Debt Buyer',
      accountNumberMasked: '****5926',
      status: 'Collection',
      balance: '$842',
      sourceSection: 'TransUnion',
    });
    expect(finding.accountContext.evidenceSnippet).toContain('JEFFERSON CAPITAL');
  });

  test('finding falls back to unidentified review title instead of parser garbage', () => {
    const item = {
      itemId: 'it_unknown_context',
      itemKind: 'account',
      span: {
        start: 0,
        end: 'TypeSecured Loan\nStatus: Collection'.length,
        text: 'TypeSecured Loan\nStatus: Collection',
      },
      bureau: 'Experian',
      source: 'Experian',
      accountName: 'TypeSecured Loan',
      fields: { Type: 'Secured Loan', Status: 'Collection' },
      classification: CLASSIFICATIONS.HIGH_PRIORITY,
      classifierConfidence: 0.9,
      classifierRule: 'account.collection',
      classifierReason: 'Account status indicates a collection.',
      isNegativeMarker: true,
    };

    const out = buildValidatedFindings({ classified: [item], annotations: new Map() });
    const finding = out.findings[0];

    expect(finding.account).toBe('Collection account');
    expect(finding.account).not.toMatch(/TypeSecured Loan/);
    expect(finding.accountContext.accountType).toBe('Secured Loan');
  });

  test('normalizes concatenated account fields and never surfaces TypeDebt Buyer labels', () => {
    const item = {
      itemId: 'it_concat_collection',
      itemKind: 'account',
      span: {
        start: 0,
        end: 220,
        text: 'Account TypeDebt Buyer ResponsibilityIndividual Date Opened08/20/2024 StatusCollection account. Balance$1,667',
      },
      bureau: 'Experian',
      source: 'Experian',
      accountName: 'TypeDebt Buyer',
      fields: {},
      classification: CLASSIFICATIONS.HIGH_PRIORITY,
      classifierConfidence: 0.95,
      classifierRule: 'account.collection',
      classifierReason: 'Account status indicates a collection.',
      isNegativeMarker: true,
      subtype: 'collection',
      accountType: 'Debt Buyer',
      status: 'Collection account',
      balance: '$1,667',
    };

    const out = buildValidatedFindings({ classified: [item], annotations: new Map() });
    const finding = out.findings[0];

    expect(finding.displayTitle).not.toBe('TypeDebt Buyer');
    expect(finding.displayTitle).toBe('Collection account');
    expect(finding.accountContext.accountType).toBe('Debt Buyer');
    expect(finding.accountContext.status).toBe('Collection account');
    expect(finding.accountContext.balance).toMatch(/\$1,667|\$1667/);
    expect(finding.accountContext.evidenceSnippet).toContain('Account Type: Debt Buyer');
    expect(finding.accountContext.evidenceSnippet).toContain('Responsibility: Individual');
    expect(finding.accountContext.evidenceSnippet).toContain('Date Opened: 08/20/2024');
  });
});
