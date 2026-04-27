import { readFileSync } from 'fs';
import { join } from 'path';

import { normalizeAnalysisResult } from '../lib/creditReportAnalysis.js';

const fixtureDir = join(process.cwd(), 'tests/fixtures/analyze');

function fixture(name) {
  return readFileSync(join(fixtureDir, name), 'utf8');
}

function normalize(reportText, findings, summary = {}) {
  return normalizeAnalysisResult({
    parsed: {
      reportType: 'Experian',
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
    expect(result.summary.potentialIssues).toBe(0);
    expect(result.summary.highPriorityItems).toBe(0);
    expect(result.findings).toEqual([]);
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
    expect(result.findings[0].category).toBe('review_only');
    expect(result.findings[0].severity).toBe('low');
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
    expect(result.findings[0].category).toBe('high_priority_issue');
    expect(result.findings[0].evidence_quote).toContain('Collection account');
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
});
