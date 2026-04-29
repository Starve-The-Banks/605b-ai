import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { runAnalyzerPipeline } from '../../lib/analyzer/pipeline.js';

const fixtureDir = join(process.cwd(), 'tests/analyzer/bureau-fixtures');

function fixture(name) {
  return readFileSync(join(fixtureDir, name), 'utf8');
}

const mockAnthropic = {
  messages: {
    create: async ({ messages }) => {
      const last = messages[messages.length - 1]?.content || '';
      const arrayMatch = last.match(/\[\s*\{[\s\S]*\}\s*\]/);
      const items = arrayMatch ? JSON.parse(arrayMatch[0]) : [];
      return {
        content: [{
          text: JSON.stringify(items.map((it) => ({
            itemId: it.itemId,
            issue: 'Mock issue',
            reason: 'Mock reason',
            recommendation: 'Mock recommendation',
            confidence: 0.9,
          }))),
        }],
      };
    },
  },
};

const cases = [
  ['experian-clean.txt', 'experian', 1, 0, 'clean'],
  ['experian-late.txt', 'experian', 1, 1, 'potential_issue'],
  ['equifax-clean.txt', 'equifax', 1, 0, 'clean'],
  ['equifax-collection.txt', 'equifax', 1, 1, 'high_priority_issue'],
  ['transunion-clean.txt', 'transunion', 1, 0, 'clean'],
  ['transunion-charge-off.txt', 'transunion', 1, 1, 'high_priority_issue'],
  ['merged-3-bureau-mixed.txt', 'merged_credit', 3, 2, 'high_priority_issue'],
  ['chexsystems-account-abuse.txt', 'chexsystems', 1, 1, 'high_priority_issue'],
  ['ews-clean.txt', 'ews', 1, 0, 'clean'],
  ['low-confidence-ocr.txt', 'experian', 0, 0, 'needs_review'],
];

describe('bureau-specific analyzer parsers', () => {
  for (const [file, parserType, expectedAccountCount, expectedIssueCount, expectedStatus] of cases) {
    test(`${file}: parser=${parserType}, status=${expectedStatus}`, async () => {
      const text = fixture(file);
      const startedAt = Date.now();
      const result = await runAnalyzerPipeline(text, {
        anthropic: mockAnthropic,
        model: 'mock',
        budgetMs: 12_000,
      });
      const extractMs = result.diagnostics.pipelineMs.extract;

      expect(extractMs).toBeLessThan(2_000);
      expect(Date.now() - startedAt).toBeLessThan(2_000);
      expect(result.parserType).toBe(parserType);
      expect(result.summary.reportStatus).toBe(expectedStatus);
      expect(result.cleanReport).toBe(expectedStatus === 'clean');
      expect(result.extracted.accounts.length + result.extracted.collections.length + result.extracted.bankingItems.length)
        .toBeGreaterThanOrEqual(expectedAccountCount);
      expect(result.findings.length).toBeGreaterThanOrEqual(expectedIssueCount);
      if (expectedStatus !== 'clean') {
        expect(result.summary.reportStatus).not.toBe('clean');
      }
      for (const finding of [...result.findings, ...result.reviewOnly]) {
        expect(finding.evidence_quote).toBeTruthy();
      }
      if (expectedStatus === 'needs_review') {
        expect(result.needsManualReview).toBe(true);
        expect(result.summary.needsManualReview).toBe(true);
      }
    });
  }
});
