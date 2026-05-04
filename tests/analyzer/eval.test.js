import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';

import { runAnalyzerPipeline } from '../../lib/analyzer/pipeline.js';

const expectationsDir = join(process.cwd(), 'tests/analyzer/expectations');
const expectations = readdirSync(expectationsDir)
  .filter((f) => f.endsWith('.json'))
  .map((f) => {
    const data = JSON.parse(readFileSync(join(expectationsDir, f), 'utf8'));
    const fixturePath = resolve(expectationsDir, data.fixture);
    const text = readFileSync(fixturePath, 'utf8');
    return { name: f.replace(/\.json$/, ''), expectation: data, text };
  });

/**
 * Mock Anthropic client that returns "annotations" for any candidate item.
 * It MUST NOT introduce new items — the validator drops anything whose
 * itemId isn't in the deterministic Stage-1 set.
 */
function makeMockAnthropic({ introduceUnknownItem = false } = {}) {
  return {
    messages: {
      create: async ({ messages }) => {
        const last = messages[messages.length - 1]?.content || '';
        const arrayMatch = last.match(/\[\s*\{[\s\S]*\}\s*\]/);
        const items = arrayMatch ? JSON.parse(arrayMatch[0]) : [];
        const annotations = items.map((it) => ({
          itemId: it.itemId,
          issue: 'Mock issue',
          reason: 'Mock evidence-based reason',
          statute: 'FCRA §611',
          recommendation: 'Mock recommendation: review the item.',
          confidence: 0.9,
        }));
        if (introduceUnknownItem) {
          annotations.push({
            itemId: 'it_fake_unknown_id',
            issue: 'Hallucinated item',
            reason: 'Should be suppressed',
            statute: 'FCRA §611',
            recommendation: 'This should not appear in findings.',
            confidence: 0.99,
          });
        }
        return { content: [{ text: JSON.stringify(annotations) }] };
      },
    },
  };
}

const useLive = process.env.EVAL_USE_LIVE_LLM === '1';
let liveClient = null;
async function getClient() {
  if (!useLive) return makeMockAnthropic();
  if (liveClient) return liveClient;
  const mod = await import('@anthropic-ai/sdk');
  liveClient = new mod.default({ apiKey: process.env.ANTHROPIC_API_KEY });
  return liveClient;
}

describe('analyzer golden evaluator', () => {
  for (const { name, expectation, text } of expectations) {
    test(`${name}: matches expectations`, async () => {
      const anthropic = await getClient();
      const result = await runAnalyzerPipeline(text, {
        anthropic,
        model: useLive ? (process.env.ANTHROPIC_ANALYZE_MODEL || 'claude-sonnet-4-20250514') : 'mock',
      });

      expect(result.reportType).toBe(expectation.expectedReportType);
      expect(result.summary.reportStatus).toBe(expectation.expectedStatus);
      expect(Boolean(result.summary.suspectedUncertain)).toBe(Boolean(expectation.expectedSuspectedUncertain));

      if (expectation.forbidClean) {
        expect(result.cleanReport).toBe(false);
        expect(result.summary.reportStatus).not.toBe('clean');
      }

      if (typeof expectation.minActionableIssues === 'number') {
        const actionable = result.findings.filter(
          (f) => f.category === 'potential_issue' || f.category === 'high_priority_issue'
        );
        expect(actionable.length).toBeGreaterThanOrEqual(expectation.minActionableIssues);
      }
      if (typeof expectation.maxActionableIssues === 'number') {
        const actionable = result.findings.filter(
          (f) => f.category === 'potential_issue' || f.category === 'high_priority_issue'
        );
        expect(actionable.length).toBeLessThanOrEqual(expectation.maxActionableIssues);
      }
      if (typeof expectation.minReviewItems === 'number') {
        const reviewEquivalentCount =
          result.reviewOnly.length +
          result.findings.filter(
            (f) => f.category === 'review_only' || (f.category === 'informational' && f.type === 'inquiry')
          ).length;
        expect(reviewEquivalentCount).toBeGreaterThanOrEqual(expectation.minReviewItems);
      }

      if (expectation.minExtractedAccounts) {
        expect(result.extracted.accounts.length).toBeGreaterThanOrEqual(expectation.minExtractedAccounts);
      }
      if (typeof expectation.maxExtractedCollections === 'number') {
        expect(result.extracted.collections.length).toBeLessThanOrEqual(expectation.maxExtractedCollections);
      }
      if (expectation.minExtractedCollections) {
        expect(result.extracted.collections.length).toBeGreaterThanOrEqual(expectation.minExtractedCollections);
      }
      if (expectation.minExtractedBankingItems) {
        expect(result.extracted.bankingItems.length).toBeGreaterThanOrEqual(expectation.minExtractedBankingItems);
      }

      if (Array.isArray(expectation.mustContainEvidence)) {
        for (const phrase of expectation.mustContainEvidence) {
          const found =
            result.evidenceQuotes.some((q) => q.includes(phrase)) ||
            result.findings.some((f) => f.evidence_quote?.includes(phrase)) ||
            result.reviewOnly.some((f) => f.evidence_quote?.includes(phrase));
          expect(found).toBe(true);
        }
      }

      // Diagnostics presence is non-negotiable.
      expect(result.diagnostics).toBeTruthy();
      expect(typeof result.diagnostics.whyStatus).toBe('string');
      expect(result.diagnostics.whyStatus.length).toBeGreaterThan(0);
      expect(result.diagnostics.pipelineVersion).toMatch(/^\d+\.\d+\.\d+$/);
      expect(Array.isArray(result.diagnostics.operationalBlocks)).toBe(true);
      expect(Array.isArray(result.diagnostics.reasoningLog)).toBe(true);
      expect(result.diagnostics.reasoningLog.length).toBeGreaterThan(0);

      // Operational-blocks expectations (additive; defaults to []).
      const expectedBlocks = expectation.expectedOperationalBlocks ?? [];
      expect(result.diagnostics.operationalBlocks.length).toBe(expectedBlocks.length);
      for (const expectedBlock of expectedBlocks) {
        const found = result.diagnostics.operationalBlocks.find((b) => b.type === expectedBlock.type);
        expect(found).toBeTruthy();
        expect(found.detected).toBe(true);
        expect(typeof found.confidence).toBe('number');
      }

      // Operational items must carry subtype + operationalGuidance and never
      // appear in actionable findings.
      const operationalReviewItems = result.reviewOnly.filter((f) => f.subtype === 'operational_blocker');
      expect(operationalReviewItems.length).toBe(expectedBlocks.length);
      for (const item of operationalReviewItems) {
        expect(item.category).toBe('review_only');
        expect(item.operationalGuidance).toBeTruthy();
        expect(item.operationalGuidance.title.length).toBeGreaterThan(0);
        expect(item.operationalGuidance.message.length).toBeGreaterThan(0);
        expect(item.operationalGuidance.bureauInstructions.experian).toMatch(/temporarily lift|lift via/i);
        // Compliance: never instruct the user to remove protection permanently.
        const text = `${item.operationalGuidance.title} ${item.operationalGuidance.message} ${item.operationalGuidance.contextLine || ''} ${Object.values(item.operationalGuidance.bureauInstructions).join(' ')}`;
        expect(text.toLowerCase()).not.toMatch(/\b(remove|removal|delete|deletion|permanent|permanently)\b/);
      }
      const operationalActionable = result.findings.filter((f) => f.subtype === 'operational_blocker');
      expect(operationalActionable.length).toBe(0);
    });
  }

  test('hard invariant: extractor finding negative markers cannot return clean', async () => {
    const collectionText = readFileSync(
      join(process.cwd(), 'tests/fixtures/analyze/one-real-collection.txt'),
      'utf8'
    );
    const result = await runAnalyzerPipeline(collectionText, { anthropic: await getClient(), model: 'mock' });
    expect(result.summary.reportStatus).not.toBe('clean');
    expect(result.cleanReport).toBe(false);
    expect(result.diagnostics.negativeMarkerCount).toBeGreaterThan(0);
  });

  test('hard invariant: LLM cannot introduce unknown items', async () => {
    const text = readFileSync(
      join(process.cwd(), 'tests/fixtures/analyze/one-real-collection.txt'),
      'utf8'
    );
    const result = await runAnalyzerPipeline(text, {
      anthropic: makeMockAnthropic({ introduceUnknownItem: true }),
      model: 'mock',
    });
    const knownIds = new Set(result.classifications.map((c) => c.itemId));
    for (const f of result.findings) {
      expect(knownIds.has(f.itemId ?? '')).toBe(false); // findings have itemId stripped on output
    }
    // The diagnostics must record the suppression.
    const introducedSuppression = result.diagnostics.suppressions.find(
      (s) => s.itemId === 'it_fake_unknown_id' && s.reason === 'llm_introduced_unknown_item'
    );
    expect(introducedSuppression).toBeTruthy();
  });

  test('hard invariant: extractor finding fraud markers cannot return clean', async () => {
    const text = readFileSync(
      join(process.cwd(), 'tests/analyzer/fixtures/freeze-only.txt'),
      'utf8'
    );
    const result = await runAnalyzerPipeline(text, { anthropic: await getClient(), model: 'mock' });
    expect(result.summary.reportStatus).not.toBe('clean');
    expect(result.cleanReport).toBe(false);
    expect(result.summary.operationalBlocks).toBe(true);
    expect(result.diagnostics.operationalBlocks.length).toBeGreaterThan(0);
    // Diagnostics sanity: reasoningLog must explain why the report isn't
    // clean. For an operational-only fixture, that's the operational marker.
    expect(result.diagnostics.reasoningLog.join(' ')).toMatch(/operational|freeze|review_only/i);
  });

  test('clean report containing "Fraud Alerts: None" does not trigger operational blocker', async () => {
    const text = readFileSync(
      join(process.cwd(), 'tests/fixtures/analyze/clean-perfect-report.txt'),
      'utf8'
    );
    const result = await runAnalyzerPipeline(text, { anthropic: await getClient(), model: 'mock' });
    expect(result.summary.operationalBlocks).toBe(false);
    expect(result.diagnostics.operationalBlocks).toEqual([]);
    expect(result.summary.reportStatus).toBe('clean');
    // No operational suppression entries should fire on a clean fixture.
    const operationalSuppressions = result.diagnostics.suppressions.filter(
      (s) => typeof s.reason === 'string' && s.reason.startsWith('operational_'),
    );
    expect(operationalSuppressions).toHaveLength(0);
  });

  test('operational LLM contextLine without safe-action phrase falls back to template default', async () => {
    const text = readFileSync(
      join(process.cwd(), 'tests/analyzer/fixtures/freeze-only.txt'),
      'utf8'
    );
    const driftAnthropic = {
      messages: {
        create: async ({ messages }) => {
          const last = messages[messages.length - 1]?.content || '';
          const arrayMatch = last.match(/\[\s*\{[\s\S]*\}\s*\]/);
          const items = arrayMatch ? JSON.parse(arrayMatch[0]) : [];
          // The LLM "drifts" — returns a contextLine without a safe-action phrase.
          const annotations = items.map((it) => ({
            itemId: it.itemId,
            contextLine: 'There is a freeze on this file.',
          }));
          return { content: [{ text: JSON.stringify(annotations) }] };
        },
      },
    };
    const result = await runAnalyzerPipeline(text, { anthropic: driftAnthropic, model: 'mock' });
    const operational = result.reviewOnly.find((f) => f.subtype === 'operational_blocker');
    expect(operational).toBeTruthy();
    expect(operational.operationalGuidance.contextLine.toLowerCase()).toMatch(
      /temporarily lift|temporarily unlock|restore it afterward/,
    );
    const fallback = result.diagnostics.suppressions.find(
      (s) => s.reason === 'operational_context_line_missing_safe_phrase',
    );
    expect(fallback).toBeTruthy();
  });

  test('operational LLM contextLine with forbidden words falls back to template default', async () => {
    const text = readFileSync(
      join(process.cwd(), 'tests/analyzer/fixtures/freeze-only.txt'),
      'utf8'
    );
    const dangerousAnthropic = {
      messages: {
        create: async ({ messages }) => {
          const last = messages[messages.length - 1]?.content || '';
          const arrayMatch = last.match(/\[\s*\{[\s\S]*\}\s*\]/);
          const items = arrayMatch ? JSON.parse(arrayMatch[0]) : [];
          const annotations = items.map((it) => ({
            itemId: it.itemId,
            contextLine: 'Remove this freeze permanently before applying for credit.',
          }));
          return { content: [{ text: JSON.stringify(annotations) }] };
        },
      },
    };
    const result = await runAnalyzerPipeline(text, { anthropic: dangerousAnthropic, model: 'mock' });
    const operational = result.reviewOnly.find((f) => f.subtype === 'operational_blocker');
    expect(operational).toBeTruthy();
    expect(operational.operationalGuidance.contextLine.toLowerCase()).not.toMatch(
      /\b(remove|removal|delete|deletion|permanent|permanently)\b/,
    );
    const fallback = result.diagnostics.suppressions.find(
      (s) => s.reason === 'operational_context_line_forbidden_word',
    );
    expect(fallback).toBeTruthy();
  });

  test('hard invariant: freeze + collection keeps high_priority and adds operational review item', async () => {
    const text = readFileSync(
      join(process.cwd(), 'tests/analyzer/fixtures/freeze-and-collection.txt'),
      'utf8'
    );
    const result = await runAnalyzerPipeline(text, { anthropic: await getClient(), model: 'mock' });
    expect(result.summary.reportStatus).toBe('high_priority_issue');
    const operational = result.reviewOnly.find((f) => f.subtype === 'operational_blocker');
    expect(operational).toBeTruthy();
    const collection = result.findings.find((f) => f.type === 'collection');
    expect(collection).toBeTruthy();
    expect(collection.category).toBe('high_priority_issue');
  });

  test('hard invariant: fraud alert does not suppress account findings', async () => {
    const text = [
      'Experian Credit Report',
      'Report Date: 04/01/2026',
      '',
      'Fraud Alert: Active fraud alert is on this file.',
      '',
      'Account: Capital One',
      'Bureau: Experian',
      'Status: Charge Off',
      'Account Number: 123456789',
      'Balance: $1,234',
      'Payment Status: Charged Off',
      '',
      'Collections: None',
    ].join('\n');
    const result = await runAnalyzerPipeline(text, { anthropic: await getClient(), model: 'mock' });
    const operational = result.reviewOnly.find((f) => f.subtype === 'operational_blocker');
    const accountFinding = result.findings.find((f) => /capital one/i.test(`${f.displayTitle} ${f.account}`));

    expect(operational).toBeTruthy();
    expect(accountFinding).toBeTruthy();
    expect(accountFinding.category).toBe('high_priority_issue');
  });

  test('clean report emits informational account findings', async () => {
    const text = readFileSync(
      join(process.cwd(), 'tests/fixtures/analyze/clean-perfect-report.txt'),
      'utf8'
    );
    const result = await runAnalyzerPipeline(text, { anthropic: await getClient(), model: 'mock' });
    const informationalFindings = result.findings.filter((f) => f.category === 'informational');
    expect(result.summary.reportStatus).toBe('clean');
    expect(informationalFindings.length).toBeGreaterThan(0);
    for (const finding of informationalFindings) {
      expect(finding.displayTitle).toBeTruthy();
      expect(finding.displaySubtitle).toBeTruthy();
      expect(finding.accountContext).toBeTruthy();
      expect(finding.issueType).toBeTruthy();
    }
  });

  test('fraud-only report emits review_only signals without account findings', async () => {
    const text = [
      'Experian Credit Report',
      'Report Date: 04/01/2026',
      '',
      'Fraud Alert: Active fraud alert is on this file.',
      'Security Freeze: Present',
    ].join('\n');
    const result = await runAnalyzerPipeline(text, { anthropic: await getClient(), model: 'mock' });
    expect(result.findings.length).toBe(0);
    expect(result.reviewOnly.length).toBeGreaterThan(0);
    expect(result.reviewOnly.every((f) => f.category === 'review_only')).toBe(true);
    expect(result.summary.reportStatus).toBe('review_only');
  });

  test('equifax freeze + tradelines includes collection finding with required shape', async () => {
    const text = readFileSync(
      join(process.cwd(), 'tests/analyzer/fixtures/equifax-freeze-three-accounts-one-collection.txt'),
      'utf8'
    );
    const result = await runAnalyzerPipeline(text, { anthropic: await getClient(), model: 'mock' });
    const collectionFinding = result.findings.find(
      (f) =>
        f.issueType === 'collection.account_reported' &&
        (f.category === 'high_priority_issue' || f.category === 'potential_issue')
    );
    expect(result.summary.operationalBlocks).toBe(true);
    expect(result.extracted.accounts.length + result.extracted.collections.length).toBeGreaterThanOrEqual(3);
    expect(collectionFinding).toBeTruthy();
    expect(result.summary.potentialIssues).toBeGreaterThanOrEqual(1);
    expect(collectionFinding.displayTitle).toBeTruthy();
    expect(collectionFinding.displayTitle).not.toMatch(/^Type[A-Z]/);
    expect(collectionFinding.displaySubtitle).toMatch(/Collection account/i);
    expect(collectionFinding.accountContext).toBeTruthy();
    expect(collectionFinding.recommendedTemplate).toBeTruthy();
  });

  test('real-world dense tradelines with late and charge-off never return clean', async () => {
    const text = readFileSync(
      join(process.cwd(), 'tests/analyzer/fixtures/real-world-dense-tradelines.txt'),
      'utf8'
    );
    const result = await runAnalyzerPipeline(text, { anthropic: await getClient(), model: 'mock' });
    expect(result.summary.reportStatus).toBe('high_priority_issue');
    expect(result.cleanReport).toBe(false);
    expect(result.findings.length).toBeGreaterThanOrEqual(2);
    expect(result.diagnostics.negativeMarkerCount).toBeGreaterThan(0);
  });

  test('slow LLM enrichment returns deterministic fast-path result without timing out', async () => {
    const text = readFileSync(
      join(process.cwd(), 'tests/analyzer/fixtures/freeze-only.txt'),
      'utf8'
    );
    const slowAnthropic = {
      messages: {
        create: async (_payload, options = {}) => {
          await new Promise((resolve, reject) => {
            const timeout = setTimeout(resolve, 13_000);
            options.signal?.addEventListener('abort', () => {
              clearTimeout(timeout);
              const err = new Error('aborted');
              err.name = 'AbortError';
              reject(err);
            }, { once: true });
          });
          return { content: [{ text: '[]' }] };
        },
      },
    };
    const startedAt = Date.now();
    const result = await runAnalyzerPipeline(text, {
      anthropic: slowAnthropic,
      model: 'mock',
      budgetMs: 12_000,
    });
    expect(Date.now() - startedAt).toBeLessThan(12_500);
    expect(result.summary.fastPath).toBe(true);
    expect(result.summary.reportStatus).toBe('review_only');
    expect(result.summary.operationalBlocks).toBe(true);
    expect(result.diagnostics.suppressions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ stage: 'llm', reason: 'llm_skipped_fast_path' }),
      ]),
    );
  });

  test('result preserves v1 mobile-compatible field shape', async () => {
    const text = readFileSync(
      join(process.cwd(), 'tests/fixtures/analyze/one-real-collection.txt'),
      'utf8'
    );
    const result = await runAnalyzerPipeline(text, { anthropic: await getClient(), model: 'mock' });
    // v1 keys all present.
    expect(result).toHaveProperty('reportType');
    expect(result).toHaveProperty('cleanReport');
    expect(result).toHaveProperty('confidence');
    expect(result).toHaveProperty('evidenceQuotes');
    expect(result).toHaveProperty('summary.reportStatus');
    expect(result).toHaveProperty('findings');
    expect(result).toHaveProperty('reviewOnly');
    expect(result).toHaveProperty('positiveFactors');
    expect(result).toHaveProperty('crossBureauInconsistencies');
    expect(result).toHaveProperty('personalInfo');
    expect(result).toHaveProperty('actionPlan');
    // v2 additive keys.
    expect(result).toHaveProperty('extracted');
    expect(result).toHaveProperty('classifications');
    expect(result).toHaveProperty('diagnostics');
    expect(result.schemaVersion).toBe(2);
    expect(typeof result.diagnostics.collectionLikeMarkerCount).toBe('number');
    expect(result.diagnostics.emittedByCategory).toBeTruthy();
    expect(result.diagnostics.emittedByIssueType).toBeTruthy();
    // Each finding has the v1 shape required by mobile's hasDisplayEvidence filter.
    for (const f of result.findings) {
      expect(f.accountId).toBeTruthy();
      expect(f.accountContext).toBeTruthy();
      expect(f.displayTitle).toBeTruthy();
      expect(f.displayTitle).not.toMatch(/^Type[A-Z]/);
      expect(f.issueType).toBeTruthy();
      expect(f.recommendedTemplateId).toBeTruthy();
      expect(f.recommendedTemplate).toBeTruthy();
      expect(f.recommendedTemplate.appliesToAccountId).toBe(f.accountId);
      expect(f).toHaveProperty('evidence_quote');
      expect(f).toHaveProperty('bureau');
      expect(f).toHaveProperty('source');
      expect(f).toHaveProperty('category');
      expect(['review_only', 'informational', 'potential_issue', 'high_priority_issue']).toContain(f.category);
      expect(typeof f.confidence).toBe('number');
      expect(f.reason || f.reasoning).toBeTruthy();
    }
  });
});
