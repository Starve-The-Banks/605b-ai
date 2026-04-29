import { runAnalyzerPipeline } from '../../lib/analyzer/pipeline.js';

const REALISTIC_CAPITAL_ONE_REPORT = `
TransUnion Credit Report
Prepared for [NAME]
Confirmation # 123456

Accounts with Adverse Information
CAPITAL ONE517805880222****
Account Information
Address: 15000 CAPITAL ONE DR
RICHMOND, VA 23238
Phone (800) 955-7070
Date Opened 08/04/2021
Responsibility Individual Account
Account Type Revolving Account
Loan Type CREDIT CARD
Balance $1,054
Date Updated 02/18/2025
Pay Status >Charge-off<
Terms Paid Monthly
High Balance $1,054
Payment History
December 2021
30
January 2022
60
February 2022
90


Creditor Contacts
CREDIT ONE BANK NA
PO BOX 98875
LAS VEGAS, NV 89193
ATTN FCRA DISPUTES
CAP ONE NA PO BOX 30281
SALT LAKE CITY, UT 84130
([PHONE])
Page 6 of 9
Narrative Code: Account information disputed by consumer (FCRA)
`;

function normalizedFindingText(finding) {
  return `${finding.account || ''} ${finding.creditor || ''} ${finding.issue || ''} ${finding.evidence_quote || ''}`.toUpperCase();
}

describe('real credit report parser', () => {
  test('groups Capital One charge-off and suppresses address/contact fragments', async () => {
    const result = await runAnalyzerPipeline(REALISTIC_CAPITAL_ONE_REPORT, { budgetMs: 12_000 });

    const highPriority = result.findings.filter((finding) => finding.category === 'high_priority_issue');
    expect(highPriority.length).toBeGreaterThanOrEqual(1);

    const capitalOne = highPriority.find((finding) => normalizedFindingText(finding).includes('CAPITAL ONE'));
    expect(capitalOne).toEqual(expect.objectContaining({
      subtype: 'charge_off',
      creditor: 'CAPITAL ONE',
      balance: 1054,
    }));

    const allFindings = [...result.findings, ...result.reviewOnly];
    expect(allFindings.every((finding) => (finding.account || '').trim().length >= 5)).toBe(true);
    expect(allFindings.some((finding) => normalizedFindingText(finding).includes('PO BOX'))).toBe(false);
    expect(allFindings.some((finding) => normalizedFindingText(finding).includes('ATTN'))).toBe(false);
    expect(allFindings.some((finding) => /(^|\s)IA(\s|$)/.test(normalizedFindingText(finding)))).toBe(false);

    const accountLabels = allFindings.map((finding) => finding.account).filter(Boolean);
    expect(new Set(accountLabels).size).toBe(accountLabels.length);
  });
});
