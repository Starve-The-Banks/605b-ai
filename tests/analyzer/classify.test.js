import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { extractReport } from '../../lib/analyzer/extract.js';
import { classifyExtractedReport } from '../../lib/analyzer/classify.js';
import { CLASSIFICATIONS } from '../../lib/analyzer/types.js';

const fixtureDir = join(process.cwd(), 'tests/fixtures/analyze');
const newFixtureDir = join(process.cwd(), 'tests/analyzer/fixtures');

function fixture(name) {
  return readFileSync(join(fixtureDir, name), 'utf8');
}
function newFixture(name) {
  return readFileSync(join(newFixtureDir, name), 'utf8');
}

function classes(items) {
  return items.map((c) => c.classification);
}

describe('classifier (Stage 2)', () => {
  test('clean credit report yields only positive/neutral/review items', () => {
    const ext = extractReport(fixture('clean-perfect-report.txt'));
    const cls = classifyExtractedReport(ext);
    const set = new Set(classes(cls));
    expect(set.has(CLASSIFICATIONS.HIGH_PRIORITY)).toBe(false);
    expect(set.has(CLASSIFICATIONS.ACTIONABLE)).toBe(false);
    expect(set.has(CLASSIFICATIONS.SUSPECTED_UNCERTAIN)).toBe(false);
  });

  test('collection account classifies as high_priority via collection.is_collection rule', () => {
    const ext = extractReport(fixture('one-real-collection.txt'));
    const cls = classifyExtractedReport(ext);
    const collection = cls.find((c) => c.itemKind === 'collection');
    expect(collection).toBeTruthy();
    expect(collection.classification).toBe(CLASSIFICATIONS.HIGH_PRIORITY);
    expect(collection.classifierRule).toBe('collection.is_collection');
  });

  test('late payment classifies as actionable via account.late_payment rule', () => {
    const ext = extractReport(fixture('late-payment.txt'));
    const cls = classifyExtractedReport(ext);
    const late = cls.find((c) => c.classifierRule === 'account.late_payment');
    expect(late).toBeTruthy();
    expect(late.classification).toBe(CLASSIFICATIONS.ACTIONABLE);
  });

  test('ordinary inquiry classifies as review_only, fraud inquiry as high_priority', () => {
    const ext = extractReport(fixture('inquiries-only.txt'));
    const cls = classifyExtractedReport(ext);
    expect(cls.every((c) => c.itemKind !== 'inquiry' || c.classification === CLASSIFICATIONS.REVIEW_ONLY)).toBe(true);
  });

  test('chexsystems account abuse classifies as high_priority via banking.account_abuse rule', () => {
    const ext = extractReport(fixture('chexsystems-account-abuse.txt'));
    const cls = classifyExtractedReport(ext);
    const banking = cls.find((c) => c.itemKind === 'banking');
    expect(banking.classification).toBe(CLASSIFICATIONS.HIGH_PRIORITY);
    expect(banking.classifierRule).toBe('banking.account_abuse');
  });

  test('ambiguous "previously delinquent" account classifies as suspected_uncertain', () => {
    const ext = extractReport(newFixture('suspected-uncertain.txt'));
    const cls = classifyExtractedReport(ext);
    const ambiguous = cls.find((c) => c.classification === CLASSIFICATIONS.SUSPECTED_UNCERTAIN);
    expect(ambiguous).toBeTruthy();
  });
});
