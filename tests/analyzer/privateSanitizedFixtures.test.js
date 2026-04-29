import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { runAnalyzerPipeline } from '../../lib/analyzer/pipeline.js';

const fixtureDir = join(process.cwd(), 'tests/analyzer/fixtures/private-sanitized');

function fixture(name) {
  return readFileSync(join(fixtureDir, name), 'utf8');
}

const cases = [
  {
    file: 'experian-real-sanitized.txt',
    parserType: 'experian',
    minExtractedAccounts: 9,
    minIssues: 2,
    status: 'high_priority_issue',
  },
  {
    file: 'equifax-real-sanitized.txt',
    parserType: 'equifax',
    minExtractedAccounts: 14,
    minIssues: 8,
    status: 'high_priority_issue',
  },
  {
    file: 'transunion-real-sanitized.txt',
    parserType: 'transunion',
    minExtractedAccounts: 13,
    minIssues: 5,
    status: 'high_priority_issue',
  },
  {
    file: 'three-bureau-real-sanitized.txt',
    parserType: 'merged_credit',
    minExtractedAccounts: 10,
    minIssues: 1,
    status: 'high_priority_issue',
  },
  {
    file: 'chexsystems-real-sanitized.txt',
    parserType: 'chexsystems',
    minExtractedAccounts: 1,
    minIssues: 1,
    status: 'high_priority_issue',
  },
  {
    file: 'ews-real-sanitized.txt',
    parserType: 'ews',
    minExtractedAccounts: 1,
    minIssues: 1,
    status: 'high_priority_issue',
  },
];

describe('private sanitized real-report fixtures', () => {
  for (const c of cases) {
    test(`${c.file}: parser=${c.parserType}, status=${c.status}`, async () => {
      const startedAt = Date.now();
      const result = await runAnalyzerPipeline(fixture(c.file), { budgetMs: 12_000 });
      const extractedAccountCount =
        result.extracted.accounts.length +
        result.extracted.collections.length +
        result.extracted.bankingItems.length;

      expect(result.parserType).toBe(c.parserType);
      expect(result.summary.reportStatus).toBe(c.status);
      expect(result.cleanReport).toBe(false);
      expect(result.summary.reportStatus).not.toBe('clean');
      expect(extractedAccountCount).toBeGreaterThanOrEqual(c.minExtractedAccounts);
      expect(result.findings.length).toBeGreaterThanOrEqual(c.minIssues);
      expect(result.diagnostics.pipelineMs.extract).toBeLessThan(2_000);
      expect(Date.now() - startedAt).toBeLessThan(15_000);
      for (const finding of [...result.findings, ...result.reviewOnly]) {
        expect(finding.evidence_quote).toBeTruthy();
      }
    });
  }
});
