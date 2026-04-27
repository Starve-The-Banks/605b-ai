import { readFileSync } from 'fs';
import { join } from 'path';

import { detectConsumerReportType, normalizeAnalysisResult } from '../lib/creditReportAnalysis.js';

const fixtureDir = join(process.cwd(), 'tests/fixtures/analyze');

function fixture(name) {
  return readFileSync(join(fixtureDir, name), 'utf8');
}

function normalize(reportText, findings, summary = {}, reportType = 'Experian') {
  return normalizeAnalysisResult({
    parsed: {
      reportType,
      summary: {
        overallAssessment: 'Candidate assessment',
        ...summary,
      },
      findings,
      positiveFactors: [],
      crossBureauInconsistencies: [],
      personalInfo: {},
      actionPlan: ['Review generated findings'],
    },
    extractedText: reportText,
  });
}

describe('credit report analysis guardrails', () => {
  test('detects supported consumer report types from report markers', () => {
    expect(detectConsumerReportType(fixture('clean-perfect-report.txt')).reportType).toBe('credit_bureau');
    expect(detectConsumerReportType(fixture('clean-chexsystems-report.txt')).reportType).toBe('chexsystems');
    expect(detectConsumerReportType(fixture('clean-ews-report.txt')).reportType).toBe('early_warning_services');
    expect(detectConsumerReportType(fixture('unknown-consumer-report.txt')).reportType).toBe('unknown_consumer_report');
  });

  test('clean report returns zero issues', () => {
    const result = normalize(fixture('clean-perfect-report.txt'), [
      {
        id: 'invented-clean-issue',
        type: 'accuracy',
        category: 'potential_issue',
        severity: 'medium',
        confidence: 0.91,
        bureau: 'Experian',
        account: 'Prime Bank Rewards Card',
        issue: 'Current positive account should be disputed',
        evidence_quote: 'Payment Status: Pays as agreed',
        statute: 'FCRA §611',
        recommendation: 'Dispute this account',
        reason: 'The model speculated that the account may be inaccurate.',
      },
    ]);

    expect(result.summary.reportStatus).toBe('clean');
    expect(result.reportType).toBe('credit_bureau');
    expect(result.cleanReport).toBe(true);
    expect(result.summary.potentialIssues).toBe(0);
    expect(result.summary.highPriorityItems).toBe(0);
    expect(result.findings).toEqual([]);
    expect(result.reviewOnly).toEqual([]);
    expect(result.evidenceQuotes).toEqual([]);
  });

  test('positive accounts are not flagged', () => {
    const result = normalize(fixture('positive-accounts-only.txt'), [
      {
        id: 'mortgage-positive',
        type: 'accuracy',
        category: 'high_priority_issue',
        severity: 'high',
        confidence: 0.95,
        bureau: 'Equifax',
        account: 'Evergreen Mortgage',
        issue: 'Large mortgage balance is negative',
        evidence_quote: 'Status: Open / Current\nPayment Status: Pays as agreed',
        statute: 'FCRA §611',
        recommendation: 'Dispute the mortgage balance',
        reason: 'The balance is large.',
      },
    ]);

    expect(result.findings).toEqual([]);
    expect(result.summary.reportStatus).toBe('clean');
    expect(result.cleanReport).toBe(true);
  });

  test('inquiries alone are review only and not high-priority issues', () => {
    const result = normalize(fixture('inquiries-only.txt'), [
      {
        id: 'normal-inquiry',
        type: 'inquiry',
        category: 'high_priority_issue',
        severity: 'high',
        confidence: 0.92,
        bureau: 'TransUnion',
        account: 'Lender One',
        issue: 'Hard inquiry may indicate identity theft',
        evidence_quote: 'Lender One hard inquiry 03/12/2026',
        statute: 'FCRA §604',
        recommendation: 'Dispute as fraud',
        reason: 'Inquiry appears on the report.',
      },
    ]);

    expect(result.summary.highPriorityItems).toBe(0);
    expect(result.summary.potentialIssues).toBe(0);
    expect(result.summary.reviewItems).toBe(1);
    expect(result.findings).toEqual([]);
    expect(result.reviewOnly[0].category).toBe('review_only');
    expect(result.reviewOnly[0].severity).toBe('low');
  });

  test('real collection is flagged when evidence directly supports it', () => {
    const result = normalize(fixture('one-real-collection.txt'), [
      {
        id: 'abc-collection',
        type: 'accuracy',
        category: 'high_priority_issue',
        severity: 'high',
        confidence: 0.96,
        bureau: 'TransUnion',
        account: 'ABC Collections',
        issue: 'Collection account is reporting as derogatory',
        evidence_quote: 'Account Type: Collection account\nOriginal Creditor: City Medical\nStatus: Collection\nBalance: $842',
        statute: 'FCRA §611',
        recommendation: 'Review the collection for accuracy before deciding whether to dispute.',
        reason: 'The report directly labels this tradeline as a collection account with a balance.',
      },
    ]);

    expect(result.summary.highPriorityItems).toBe(1);
    expect(result.findings).toHaveLength(1);
    expect(result.reviewOnly).toEqual([]);
    expect(result.findings[0].category).toBe('high_priority_issue');
    expect(result.findings[0].evidence_quote).toContain('Collection account');
    expect(result.evidenceQuotes).toEqual([
      'Account Type: Collection account\nOriginal Creditor: City Medical\nStatus: Collection\nBalance: $842',
    ]);
  });

  test('late payment is flagged when evidence directly supports it', () => {
    const result = normalize(fixture('late-payment.txt'), [
      {
        id: 'late-payment',
        type: 'accuracy',
        category: 'potential_issue',
        severity: 'medium',
        confidence: 0.88,
        bureau: 'Equifax',
        account: 'Northstar Auto Finance',
        issue: 'A 30-day late payment is reporting for November 2025',
        evidence_quote: 'Payment History: 30 days late reported for 11/2025',
        statute: 'FCRA §611',
        recommendation: 'Review the payment history against your records before disputing.',
        reason: 'The report directly says a 30-day late payment was reported.',
      },
    ]);

    expect(result.summary.potentialIssues).toBe(1);
    expect(result.findings[0].category).toBe('potential_issue');
    expect(result.findings[0].confidence).toBeGreaterThanOrEqual(0.75);
  });

  test('model output cannot exceed evidence in extracted text', () => {
    const result = normalize(fixture('one-real-collection.txt'), [
      {
        id: 'unsupported-bankruptcy',
        type: 'timeliness',
        category: 'high_priority_issue',
        severity: 'high',
        confidence: 0.99,
        bureau: 'TransUnion',
        account: 'Bankruptcy Court',
        issue: 'Bankruptcy is reporting past the legal period',
        evidence_quote: 'Chapter 7 bankruptcy filed 02/01/2012',
        statute: 'FCRA §605',
        recommendation: 'Dispute the bankruptcy',
        reason: 'This was invented by the model and is not in the report text.',
      },
    ]);

    expect(result.findings).toEqual([]);
    expect(result.summary.reportStatus).toBe('clean');
  });

  test('clean ChexSystems report returns zero issues', () => {
    const result = normalize(fixture('clean-chexsystems-report.txt'), [
      {
        id: 'normal-chex-inquiry',
        type: 'inquiry',
        category: 'high_priority_issue',
        severity: 'high',
        confidence: 0.9,
        bureau: 'ChexSystems',
        account: 'Community Bank',
        issue: 'Bank inquiry should be disputed',
        evidence_quote: 'Community Bank inquiry 03/01/2026',
        recommendation: 'Dispute this inquiry',
        reason: 'The model treated an ordinary ChexSystems inquiry as fraud.',
      },
    ], {}, 'ChexSystems');

    expect(result.reportType).toBe('chexsystems');
    expect(result.cleanReport).toBe(true);
    expect(result.findings).toEqual([]);
    expect(result.reviewOnly).toHaveLength(1);
    expect(result.summary.highPriorityItems).toBe(0);
  });

  test('ChexSystems account abuse item is flagged with banking-report evidence', () => {
    const result = normalize(fixture('chexsystems-account-abuse.txt'), [
      {
        id: 'account-abuse',
        type: 'banking-history',
        category: 'high_priority_issue',
        severity: 'high',
        confidence: 0.94,
        bureau: 'ChexSystems',
        account: 'Metro Bank',
        issue: 'Metro Bank reported account abuse with an unpaid balance',
        evidence_quote: 'Reported For: Account Abuse\nSource of Information: Metro Bank\nDate Reported: 12/15/2025\nAmount Owed: $426',
        recommendation: 'Review the reporting details and prepare documentation if the item is inaccurate.',
        reason: 'The ChexSystems report directly lists Account Abuse and an amount owed from Metro Bank.',
      },
    ], {}, 'ChexSystems');

    expect(result.reportType).toBe('chexsystems');
    expect(result.cleanReport).toBe(false);
    expect(result.findings).toHaveLength(1);
    expect(result.findings[0].type).toBe('banking-history');
    expect(result.findings[0].evidence_quote).toContain('Reported For: Account Abuse');
  });

  test('ChexSystems inquiries only are review-only, not actionable issues', () => {
    const result = normalize(fixture('chexsystems-inquiries-only.txt'), [
      {
        id: 'chex-inquiry',
        type: 'inquiry',
        category: 'high_priority_issue',
        severity: 'high',
        confidence: 0.93,
        bureau: 'ChexSystems',
        account: 'Regional Credit Union',
        issue: 'ChexSystems inquiry indicates fraud',
        evidence_quote: 'Regional Credit Union inquiry 03/15/2026',
        recommendation: 'Dispute as fraud',
        reason: 'Inquiry exists.',
      },
    ], {}, 'ChexSystems');

    expect(result.findings).toEqual([]);
    expect(result.reviewOnly).toHaveLength(1);
    expect(result.summary.highPriorityItems).toBe(0);
  });

  test('clean EWS report returns zero issues and banking report clean status', () => {
    const result = normalize(fixture('clean-ews-report.txt'), [
      {
        id: 'good-standing-ews',
        type: 'banking-history',
        category: 'potential_issue',
        severity: 'medium',
        confidence: 0.88,
        bureau: 'Early Warning Services',
        account: 'Community Bank',
        issue: 'Checking account should be disputed',
        evidence_quote: 'Status: Open and in good standing\nUnpaid Balance: $0\nSuspected Fraud: None',
        recommendation: 'Dispute this checking account',
        reason: 'The model treated a positive banking-history item as negative.',
      },
    ], {}, 'EWS');

    expect(result.reportType).toBe('early_warning_services');
    expect(result.cleanReport).toBe(true);
    expect(result.findings).toEqual([]);
    expect(result.reviewOnly).toEqual([]);
  });

  test('unknown consumer report is marked unknown without applying credit-only logic', () => {
    const result = normalize(fixture('unknown-consumer-report.txt'), [], {}, 'Unknown');

    expect(result.reportType).toBe('unknown_consumer_report');
    expect(result.cleanReport).toBe(true);
    expect(result.findings).toEqual([]);
  });
});
