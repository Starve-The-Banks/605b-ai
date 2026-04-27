import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { extractReport } from '../../lib/analyzer/extract.js';

const fixtureDir = join(process.cwd(), 'tests/fixtures/analyze');
const newFixtureDir = join(process.cwd(), 'tests/analyzer/fixtures');

function fixture(name) {
  return readFileSync(join(fixtureDir, name), 'utf8');
}
function newFixture(name) {
  return readFileSync(join(newFixtureDir, name), 'utf8');
}

describe('extractor (Stage 1)', () => {
  test('credit bureau: clean report extracts accounts and no collections', () => {
    const out = extractReport(fixture('clean-perfect-report.txt'));
    expect(out.reportType).toBe('credit_bureau');
    expect(out.accounts.length).toBeGreaterThanOrEqual(2);
    expect(out.collections).toHaveLength(0);
    expect(out.publicRecords).toHaveLength(0);
    // Every item must carry a verbatim source span.
    for (const item of out.accounts) {
      expect(typeof item.span?.text).toBe('string');
      expect(item.span.text.length).toBeGreaterThan(10);
      expect(item.itemId).toMatch(/^it_/);
    }
  });

  test('credit bureau: collection account is extracted as a collection, not an account', () => {
    const out = extractReport(fixture('one-real-collection.txt'));
    expect(out.collections.length).toBeGreaterThanOrEqual(1);
    const collection = out.collections[0];
    expect(collection.span.text).toContain('Status: Collection');
    expect(collection.span.text).toContain('Original Creditor: City Medical');
    // The collection's evidence is the verbatim source span.
    expect(collection.span.text.startsWith('Account:')).toBe(true);
  });

  test('credit bureau: late payment is extracted as an account (classifier promotes it)', () => {
    const out = extractReport(fixture('late-payment.txt'));
    expect(out.accounts.length).toBeGreaterThanOrEqual(1);
    expect(out.collections).toHaveLength(0);
    const late = out.accounts.find((a) => /late/i.test(a.paymentHistory || ''));
    expect(late).toBeTruthy();
    expect(late.span.text).toContain('30 days late reported for 11/2025');
  });

  test('credit bureau: inquiries section produces inquiry items per line', () => {
    const out = extractReport(fixture('inquiries-only.txt'));
    expect(out.inquiries.length).toBeGreaterThanOrEqual(2);
    for (const inq of out.inquiries) {
      expect(inq.span.text.length).toBeGreaterThan(0);
      expect(inq.creditor).toBeTruthy();
    }
  });

  test('chexsystems: account abuse extracted with banking item', () => {
    const out = extractReport(fixture('chexsystems-account-abuse.txt'));
    expect(out.reportType).toBe('chexsystems');
    expect(out.bankingItems.length).toBeGreaterThanOrEqual(1);
    const item = out.bankingItems[0];
    expect(item.reportedFor).toMatch(/account abuse/i);
    expect(item.span.text).toContain('Reported For: Account Abuse');
  });

  test('chexsystems: clean inquiries-only reports zero banking items', () => {
    const out = extractReport(fixture('clean-chexsystems-report.txt'));
    expect(out.reportType).toBe('chexsystems');
    expect(out.inquiries.length).toBeGreaterThanOrEqual(2);
    expect(out.bankingItems).toHaveLength(0);
  });

  test('ews: clean report has positive banking item, no fraud markers', () => {
    const out = extractReport(fixture('clean-ews-report.txt'));
    expect(out.reportType).toBe('early_warning_services');
    expect(out.bankingItems.length).toBeGreaterThanOrEqual(1);
    expect(out.fraudMarkers).toHaveLength(0);
  });

  test('mixed report extracts a collection AND an account with late history', () => {
    const out = extractReport(newFixture('mixed-late-and-collection.txt'));
    expect(out.collections.length).toBeGreaterThanOrEqual(1);
    expect(out.accounts.length).toBeGreaterThanOrEqual(2);
    const late = out.accounts.find((a) => /late/i.test(a.paymentHistory || ''));
    expect(late).toBeTruthy();
  });

  test('itemIds are stable across runs for the same input', () => {
    const a = extractReport(fixture('one-real-collection.txt'));
    const b = extractReport(fixture('one-real-collection.txt'));
    const aIds = a.collections.map((c) => c.itemId).sort();
    const bIds = b.collections.map((c) => c.itemId).sort();
    expect(aIds).toEqual(bIds);
  });
});
