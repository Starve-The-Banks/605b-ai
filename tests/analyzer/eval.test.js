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
        expect(result.reviewOnly.length).toBeGreaterThanOrEqual(expectation.minReviewItems);
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
    // Each finding has the v1 shape required by mobile's hasDisplayEvidence filter.
    for (const f of result.findings) {
      expect(f).toHaveProperty('evidence_quote');
      expect(f).toHaveProperty('bureau');
      expect(f).toHaveProperty('source');
      expect(f).toHaveProperty('category');
      expect(['review_only', 'potential_issue', 'high_priority_issue']).toContain(f.category);
      expect(typeof f.confidence).toBe('number');
      expect(f.reason || f.reasoning).toBeTruthy();
    }
  });
});
