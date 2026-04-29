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

  test('real-world dense tradelines extract accounts, status, balances, payment history, and remarks', () => {
    const out = extractReport(newFixture('real-world-dense-tradelines.txt'));
    expect(out.accounts.length + out.collections.length).toBeGreaterThanOrEqual(3);
    const late = out.accounts.find((a) => /northstar/i.test(a.accountName || ''));
    expect(late).toBeTruthy();
    expect(late.status).toMatch(/open/i);
    expect(late.paymentStatus).toMatch(/60 days late/i);
    expect(late.paymentHistory).toMatch(/60 days late|past due/i);
    expect(late.balance).toBe('$1,243');
    expect(late.remarks).toMatch(/past due/i);

    const chargedOff = out.accounts.find((a) => /regional bank/i.test(a.accountName || ''));
    expect(chargedOff).toBeTruthy();
    expect(chargedOff.status).toMatch(/charged off/i);
  });

  test('itemIds are stable across runs for the same input', () => {
    const a = extractReport(fixture('one-real-collection.txt'));
    const b = extractReport(fixture('one-real-collection.txt'));
    const aIds = a.collections.map((c) => c.itemId).sort();
    const bIds = b.collections.map((c) => c.itemId).sort();
    expect(aIds).toEqual(bIds);
  });
});

describe('extractor — fraud / operational markers', () => {
  test('detects "Security freeze active" → type=freeze with high confidence', () => {
    const out = extractReport('Experian Credit Report\nReport Date: 04/01/2026\n\nSecurity Freeze: Security freeze active on this file as of 03/14/2026.\n');
    expect(out.fraudMarkers.length).toBeGreaterThanOrEqual(1);
    const freeze = out.fraudMarkers.find((m) => m.type === 'freeze');
    expect(freeze).toBeTruthy();
    expect(freeze.confidence).toBeGreaterThanOrEqual(0.9);
    expect(freeze.span.text.toLowerCase()).toContain('security freeze');
  });

  test('detects "Credit lock enabled" → type=lock', () => {
    const out = extractReport('TransUnion Credit Report\nReport Date: 04/01/2026\n\nCredit lock enabled on this file.\n');
    const lock = out.fraudMarkers.find((m) => m.type === 'lock');
    expect(lock).toBeTruthy();
  });

  test('detects "Active fraud alert" → type=fraud_alert and not freeze', () => {
    const out = extractReport('Equifax Credit Report\nReport Date: 04/01/2026\n\nActive fraud alert is on this file.\n');
    const alert = out.fraudMarkers.find((m) => m.type === 'fraud_alert');
    const freeze = out.fraudMarkers.find((m) => m.type === 'freeze');
    expect(alert).toBeTruthy();
    expect(freeze).toBeUndefined();
  });

  test('detects "Extended fraud alert" → type=extended_alert', () => {
    const out = extractReport('Experian Credit Report\nReport Date: 04/01/2026\n\nExtended fraud alert remains in effect.\n');
    const alert = out.fraudMarkers.find((m) => m.type === 'extended_alert');
    expect(alert).toBeTruthy();
  });

  test('detects "Active duty military alert" → type=active_duty_alert', () => {
    const out = extractReport('Equifax Credit Report\nReport Date: 04/01/2026\n\nActive duty military alert is in place.\n');
    const alert = out.fraudMarkers.find((m) => m.type === 'active_duty_alert');
    expect(alert).toBeTruthy();
  });

  test('detects restrictive consumer statement → type=consumer_statement', () => {
    const out = extractReport('Experian Credit Report\nReport Date: 04/01/2026\n\nConsumer Statement: Do not extend credit without contacting consumer directly.\n');
    const statement = out.fraudMarkers.find((m) => m.type === 'consumer_statement');
    expect(statement).toBeTruthy();
  });

  test('regression: clean fixtures produce zero fraudMarkers', () => {
    for (const name of ['clean-perfect-report.txt', 'clean-chexsystems-report.txt', 'clean-ews-report.txt', 'positive-accounts-only.txt']) {
      const out = extractReport(fixture(name));
      expect(out.fraudMarkers).toHaveLength(0);
    }
  });

  // Phrase coverage matrix derived from real-world report variations.
  // We embed each candidate line in a minimal but analyzable credit-bureau
  // report so the pipeline doesn't short-circuit on text-quality.
  const REPORT_HEADER = 'Experian Credit Report\nReport Date: 04/27/2026\n\nAccount: Prime Bank Rewards Card\nBureau: Experian\nStatus: Open / Current\nPayment Status: Pays as agreed\nBalance: $120\nPayment History: Never late\n\n';

  const POSITIVE_PHRASES = [
    { line: 'Security Freeze: ACTIVE on this file as of 03/14/2026', type: 'freeze' },
    { line: 'Security Freeze Active', type: 'freeze' },
    { line: 'Credit Freeze: Active', type: 'freeze' },
    { line: 'File frozen', type: 'freeze' },
    { line: 'Credit file is frozen', type: 'freeze' },
    { line: 'File is frozen', type: 'freeze' },
    { line: 'SecurityFreeze active', type: 'freeze' },
    { line: 'Frozen file present', type: 'freeze' },
    { line: 'Credit Lock: Enabled', type: 'lock' },
    { line: 'Credit report is locked', type: 'lock' },
    { line: 'Fraud Alert: Active', type: 'fraud_alert' },
    { line: 'Extended Fraud Alert in effect', type: 'extended_alert' },
    { line: 'Active Duty Alert is in place', type: 'active_duty_alert' },
  ];

  for (const { line, type } of POSITIVE_PHRASES) {
    test(`positive coverage: detects "${line}" → type=${type}`, () => {
      const out = extractReport(`${REPORT_HEADER}${line}\n`);
      const marker = out.fraudMarkers.find((m) => m.type === type);
      expect(marker).toBeTruthy();
      expect(marker.span.text.toLowerCase()).toContain(line.split(':')[0].toLowerCase().split(/\s/)[0]);
    });
  }

  const NEGATION_PHRASES = [
    'Fraud Alerts: None',
    'Security Freeze: None',
    'Credit Freeze: Not Active',
    'Credit Lock: Not Enabled',
    'No freeze on file',
    'No fraud alert reported',
    'Security Freeze - None',
    'Consumer Statements: N/A',
  ];

  for (const line of NEGATION_PHRASES) {
    test(`negation coverage: "${line}" produces zero fraudMarkers`, () => {
      const out = extractReport(`${REPORT_HEADER}${line}\n`);
      expect(out.fraudMarkers).toHaveLength(0);
    });
  }
});
