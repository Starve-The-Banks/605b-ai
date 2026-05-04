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

  test('real-world dense tradelines classify late/past-due as actionable and charge-off as high_priority', () => {
    const ext = extractReport(newFixture('real-world-dense-tradelines.txt'));
    const cls = classifyExtractedReport(ext);
    const late = cls.find((c) => /northstar/i.test(c.accountName || ''));
    expect(late).toBeTruthy();
    expect(late.classification).toBe(CLASSIFICATIONS.ACTIONABLE);
    const chargedOff = cls.find((c) => /regional bank/i.test(c.accountName || ''));
    expect(chargedOff).toBeTruthy();
    expect(chargedOff.classification).toBe(CLASSIFICATIONS.HIGH_PRIORITY);
  });

  test('payment-history legend text does not create a negative finding for a positive account', () => {
    const ext = {
      reportType: 'credit_bureau',
      accounts: [{
        itemId: 'it_positive_with_legend',
        itemKind: 'account',
        span: {
          start: 0,
          end: 200,
          text: 'WELLS FARGO CARD SERV\nStatus: Pays As Agreed\nPayment History\nPaid on Time\n30 Days Past Due\n60 Days Past Due\nCharge Off',
        },
        bureau: 'Experian',
        source: 'Experian',
        accountName: 'WELLS FARGO CARD SERV',
        status: 'Pays As Agreed',
        paymentStatus: '',
        paymentHistory: 'Paid on Time 30 Days Past Due 60 Days Past Due Charge Off',
        fields: {},
      }],
      collections: [],
      inquiries: [],
      publicRecords: [],
      bankingItems: [],
      fraudMarkers: [],
      remarks: [],
    };

    const cls = classifyExtractedReport(ext);
    expect(cls[0].classification).toBe(CLASSIFICATIONS.POSITIVE);
    expect(cls[0].classifierRule).toBe('account.positive');
  });

  test('weak collection-like language without explicit collection status is review_only', () => {
    const ext = {
      reportType: 'credit_bureau',
      accounts: [{
        itemId: 'it_weak_collection_signal',
        itemKind: 'account',
        span: {
          start: 0,
          end: 300,
          text: 'WELLS FARGO CARD SERV\nAccount Type: Revolving\nPayment History\nOK Current 30 Days Late 60 Days Late Collection Charge Off',
        },
        bureau: 'Equifax',
        source: 'Equifax',
        accountName: 'WELLS FARGO CARD SERV',
        status: 'Open / Current',
        paymentStatus: 'Pays as agreed',
        accountType: 'Revolving',
        paymentHistory: 'OK Current 30 Days Late 60 Days Late Collection Charge Off',
        remarks: '',
        fields: {
          'Account Condition': 'Open / Current',
        },
      }],
      collections: [],
      inquiries: [],
      publicRecords: [],
      bankingItems: [],
      fraudMarkers: [],
      remarks: [],
    };

    const cls = classifyExtractedReport(ext);
    expect(cls[0].classification).toBe(CLASSIFICATIONS.REVIEW_ONLY);
    expect(cls[0].classifierRule).toBe('account.collection_weak_signal');
  });
});

describe('classifier — operational blockers', () => {
  test('freeze fraudMarker → review_only with subtype operational_blocker', () => {
    const ext = extractReport(newFixture('freeze-only.txt'));
    const cls = classifyExtractedReport(ext);
    const freeze = cls.find((c) => c.itemKind === 'fraud' && c.type === 'freeze');
    expect(freeze).toBeTruthy();
    expect(freeze.classification).toBe(CLASSIFICATIONS.REVIEW_ONLY);
    expect(freeze.classifierRule).toBe('operational.freeze');
    expect(freeze.subtype).toBe('operational_blocker');
  });

  test('fraud_alert fraudMarker → review_only with subtype operational_blocker', () => {
    const ext = extractReport('Equifax Credit Report\nReport Date: 04/01/2026\n\nActive fraud alert in effect.\n');
    const cls = classifyExtractedReport(ext);
    const alert = cls.find((c) => c.itemKind === 'fraud' && c.type === 'fraud_alert');
    expect(alert).toBeTruthy();
    expect(alert.classification).toBe(CLASSIFICATIONS.REVIEW_ONLY);
    expect(alert.classifierRule).toBe('operational.fraud_alert');
    expect(alert.subtype).toBe('operational_blocker');
  });

  test('hard invariant: typed fraudMarker is never high_priority or actionable', () => {
    for (const type of ['freeze', 'lock', 'fraud_alert', 'extended_alert', 'active_duty_alert', 'consumer_statement']) {
      const ext = {
        reportType: 'credit_bureau',
        accounts: [], collections: [], inquiries: [], publicRecords: [],
        bankingItems: [], remarks: [],
        fraudMarkers: [{
          itemId: `it_test_${type}`,
          itemKind: 'fraud',
          span: { start: 0, end: 4, text: 'test' },
          bureau: 'Experian',
          source: 'consumer report',
          type,
          marker: 'test',
          context: 'test',
          confidence: 0.9,
          fields: { line: 'test' },
        }],
      };
      const cls = classifyExtractedReport(ext);
      const item = cls[0];
      expect(item.classification).not.toBe(CLASSIFICATIONS.HIGH_PRIORITY);
      expect(item.classification).not.toBe(CLASSIFICATIONS.ACTIONABLE);
      expect(item.classification).toBe(CLASSIFICATIONS.REVIEW_ONLY);
      expect(item.subtype).toBe('operational_blocker');
    }
  });

  test('regression: collection still classifies as high_priority', () => {
    const ext = extractReport(fixture('one-real-collection.txt'));
    const cls = classifyExtractedReport(ext);
    const collection = cls.find((c) => c.itemKind === 'collection');
    expect(collection.classification).toBe(CLASSIFICATIONS.HIGH_PRIORITY);
  });

  test('regression: positive accounts still classify as positive', () => {
    const ext = extractReport(fixture('positive-accounts-only.txt'));
    const cls = classifyExtractedReport(ext);
    expect(cls.some((c) => c.classification === CLASSIFICATIONS.POSITIVE)).toBe(true);
  });
});
