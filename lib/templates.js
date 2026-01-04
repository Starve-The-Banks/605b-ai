import { Shield, FileWarning, AlertTriangle, Building2, Scale } from 'lucide-react';

export const TEMPLATES = {
  identity_theft: {
    category: "Identity Theft",
    icon: Shield,
    templates: [
      { id: "605b_bureau", name: "§605B Identity Theft Block", description: "Demand bureaus block fraudulent accounts", deadline: "4 business days" },
      { id: "605b_furnisher", name: "§605B Direct to Furnisher", description: "Send block demand to creditor", deadline: "4 business days" },
      { id: "ftc_affidavit", name: "FTC Identity Theft Report", description: "Official identity theft affidavit", deadline: "N/A", external: "https://www.identitytheft.gov/" },
    ]
  },
  disputes: {
    category: "Credit Disputes",
    icon: FileWarning,
    templates: [
      { id: "611_dispute", name: "§611 Standard Dispute", description: "Challenge inaccurate information", deadline: "30 days" },
      { id: "609_disclosure", name: "§609 Method of Verification", description: "Request verification proof", deadline: "15 days" },
      { id: "623_direct", name: "§623 Direct Furnisher Dispute", description: "Dispute directly with furnisher", deadline: "30 days" },
    ]
  },
  debt_collection: {
    category: "Debt Collection",
    icon: AlertTriangle,
    templates: [
      { id: "809_validation", name: "§809 Debt Validation", description: "Demand collector prove debt", deadline: "30 days" },
      { id: "cease_desist", name: "Cease & Desist Letter", description: "Stop collector contact", deadline: "Immediate" },
      { id: "pay_delete", name: "Pay for Delete Request", description: "Payment for removal", deadline: "Negotiable" },
    ]
  },
  specialty: {
    category: "Specialty Agencies",
    icon: Building2,
    templates: [
      { id: "chex_dispute", name: "ChexSystems Dispute", description: "Dispute banking history", deadline: "30 days" },
      { id: "ews_dispute", name: "Early Warning Dispute", description: "Dispute EWS records", deadline: "30 days" },
      { id: "lexis_dispute", name: "LexisNexis Dispute", description: "Dispute public records", deadline: "30 days" },
    ]
  },
  escalation: {
    category: "Escalation",
    icon: Scale,
    templates: [
      { id: "cfpb_complaint", name: "CFPB Complaint", description: "File federal complaint", deadline: "15-60 days", external: "https://www.consumerfinance.gov/complaint/" },
      { id: "state_ag", name: "State Attorney General", description: "File state complaint", deadline: "Varies" },
      { id: "intent_to_sue", name: "Intent to Sue Letter", description: "Final demand before litigation", deadline: "15-30 days" },
    ]
  },
};

const formatDate = () => new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

export const LETTER_CONTENT = {
  "605b_bureau": () => `${formatDate()}

[YOUR NAME]
[YOUR ADDRESS]
[CITY, STATE ZIP]

[BUREAU NAME]
[BUREAU ADDRESS]

Re: Identity Theft Block Request Pursuant to FCRA §605B
SSN: XXX-XX-[LAST 4]

To Whom It May Concern:

I am a victim of identity theft. Pursuant to the Fair Credit Reporting Act, 15 U.S.C. § 1681c-2 (Section 605B), I am requesting that you block the following fraudulent information from my credit report within four (4) business days of receipt of this letter.

FRAUDULENT ACCOUNTS TO BE BLOCKED:
[ACCOUNT NAME] - Account #[XXXX] - Opened [DATE]

I have enclosed:
□ Copy of FTC Identity Theft Report
□ Copy of government-issued photo ID
□ Proof of address

Under 15 U.S.C. § 1681c-2(a), you must block this information within four (4) business days. Failure to comply may result in civil liability under 15 U.S.C. § 1681n (willful noncompliance) including statutory damages of $100 to $1,000 per violation.

Sincerely,

______________________________
[YOUR NAME]`,

  "605b_furnisher": () => `${formatDate()}

[YOUR NAME]
[YOUR ADDRESS]
[CITY, STATE ZIP]

[CREDITOR/FURNISHER NAME]
[ADDRESS]

Re: Identity Theft Notice - Block Fraudulent Account
Account #: [XXXX]

To Whom It May Concern:

Pursuant to FCRA §605B (15 U.S.C. § 1681c-2), I am notifying you that the above-referenced account was opened fraudulently as a result of identity theft.

I am demanding that you:
1. Cease reporting this account to credit bureaus immediately
2. Cease all collection activity
3. Provide me with copies of all application documents

I have enclosed my FTC Identity Theft Report. Under federal law, you may not sell or transfer this debt after receiving this notice.

Sincerely,

______________________________
[YOUR NAME]`,

  "611_dispute": () => `${formatDate()}

[YOUR NAME]
[YOUR ADDRESS]
[CITY, STATE ZIP]

[BUREAU NAME]
[BUREAU ADDRESS]

Re: Dispute of Inaccurate Information - FCRA §611
SSN: XXX-XX-[LAST 4]

To Whom It May Concern:

Pursuant to FCRA §611, I am disputing the following inaccurate information:

ITEMS DISPUTED:
Creditor: [CREDITOR NAME]
Account Number: [XXXX]
Reason: [REASON]

Under §611(a)(1)(A), you must conduct a reasonable investigation within 30 days. Under §611(a)(5)(A), if the information is inaccurate or unverifiable, you must delete or modify it.

Please send me an updated copy of my credit report upon completion.

Sincerely,

______________________________
[YOUR NAME]`,

  "609_disclosure": () => `${formatDate()}

[YOUR NAME]
[YOUR ADDRESS]
[CITY, STATE ZIP]

[BUREAU NAME]
[BUREAU ADDRESS]

Re: Request for Method of Verification - FCRA §609
SSN: XXX-XX-[LAST 4]

To Whom It May Concern:

Pursuant to FCRA §609, I am requesting disclosure of the method of verification used for the following account(s):

Account: [CREDITOR NAME] - [ACCOUNT NUMBER]

Please provide:
1. The name, address, and phone number of each person contacted
2. A summary of the response from each furnisher
3. Any documentation used to verify the information

You must respond within 15 days.

Sincerely,

______________________________
[YOUR NAME]`,

  "623_direct": () => `${formatDate()}

[YOUR NAME]
[YOUR ADDRESS]
[CITY, STATE ZIP]

[FURNISHER NAME]
[ADDRESS]

Re: Direct Dispute - FCRA §623
Account #: [XXXX]

To Whom It May Concern:

Pursuant to FCRA §623(a)(8), I am disputing the accuracy of information you are reporting to credit bureaus.

DISPUTED INFORMATION:
[DESCRIBE INACCURACY]

Under §623(b), upon receiving this dispute, you must:
1. Conduct an investigation
2. Review all relevant information provided
3. Report results to all credit bureaus
4. Modify, delete, or permanently block reporting if inaccurate

Please investigate and correct within 30 days.

Sincerely,

______________________________
[YOUR NAME]`,

  "809_validation": () => `${formatDate()}

[YOUR NAME]
[YOUR ADDRESS]
[CITY, STATE ZIP]

[COLLECTION AGENCY NAME]
[ADDRESS]

Re: Debt Validation Request - FDCPA §809
Reference: [ACCOUNT NUMBER]

To Whom It May Concern:

I am requesting validation of this alleged debt pursuant to FDCPA §809. Please provide:

1. The amount of the debt and how it was calculated
2. The name and address of the original creditor
3. A copy of the original signed contract
4. Proof you are licensed to collect in [STATE]
5. Complete payment history

Under §809(b), you must cease collection until validation is provided. Violations may result in statutory damages under 15 U.S.C. § 1692k.

Sincerely,

______________________________
[YOUR NAME]

SENT VIA CERTIFIED MAIL`,

  "cease_desist": () => `${formatDate()}

[YOUR NAME]
[YOUR ADDRESS]
[CITY, STATE ZIP]

[COLLECTION AGENCY NAME]
[ADDRESS]

Re: Cease Communication Demand - FDCPA §805(c)
Reference: [ACCOUNT NUMBER]

To Whom It May Concern:

Pursuant to FDCPA §805(c), I demand that you cease all communication with me regarding the alleged debt referenced above.

Under federal law, after receiving this notice, you may only contact me to:
1. Advise that collection efforts are being terminated
2. Notify me of a specific action being taken

Any further contact beyond these exceptions will result in statutory damages under 15 U.S.C. § 1692k.

Sincerely,

______________________________
[YOUR NAME]

SENT VIA CERTIFIED MAIL`,

  "pay_delete": () => `${formatDate()}

[YOUR NAME]
[YOUR ADDRESS]
[CITY, STATE ZIP]

[CREDITOR/COLLECTION AGENCY]
[ADDRESS]

Re: Settlement Offer - Pay for Delete
Account #: [XXXX]
Original Balance: $[AMOUNT]

To Whom It May Concern:

I am writing to propose a settlement of the above-referenced account. I am prepared to pay $[OFFER AMOUNT] as full and final settlement, contingent upon your agreement to:

1. Accept this amount as payment in full
2. Request deletion of this account from all credit bureaus within 30 days of payment
3. Provide written confirmation of these terms before payment

This offer is contingent upon receiving written agreement. Upon acceptance, I will remit payment via [METHOD].

This letter is not an acknowledgment of the debt's validity.

Sincerely,

______________________________
[YOUR NAME]`,

  "chex_dispute": () => `${formatDate()}

[YOUR NAME]
[YOUR ADDRESS]
[CITY, STATE ZIP]

ChexSystems, Inc.
Attn: Consumer Relations
7805 Hudson Road, Suite 100
Woodbury, MN 55125

Re: Dispute of Inaccurate Information
SSN: XXX-XX-[LAST 4]

To Whom It May Concern:

I am disputing the following information in my ChexSystems file:

Bank: [BANK NAME]
Account Type: [CHECKING/SAVINGS]
Reason Reported: [REASON]

This information is inaccurate because: [EXPLANATION]

Under the FCRA, you must investigate within 30 days and delete unverifiable information.

I have enclosed: [LIST SUPPORTING DOCUMENTS]

Sincerely,

______________________________
[YOUR NAME]`,

  "ews_dispute": () => `${formatDate()}

[YOUR NAME]
[YOUR ADDRESS]
[CITY, STATE ZIP]

Early Warning Services
16552 N 90th Street
Scottsdale, AZ 85260

Re: Dispute of Inaccurate Information
SSN: XXX-XX-[LAST 4]

To Whom It May Concern:

I am disputing the following information in my Early Warning Services file:

Reporting Institution: [BANK NAME]
Date Reported: [DATE]
Reason: [REASON]

This information is inaccurate because: [EXPLANATION]

Please investigate and correct this information within 30 days as required by the FCRA.

Sincerely,

______________________________
[YOUR NAME]`,

  "lexis_dispute": () => `${formatDate()}

[YOUR NAME]
[YOUR ADDRESS]
[CITY, STATE ZIP]

LexisNexis Consumer Center
P.O. Box 105108
Atlanta, GA 30348

Re: Dispute of Inaccurate Information
SSN: XXX-XX-[LAST 4]

To Whom It May Concern:

I am disputing the following information in my LexisNexis consumer file:

Information Disputed: [DESCRIPTION]
Reason: [INACCURATE/NOT MINE/OUTDATED]

Please investigate this matter and correct or delete the disputed information within 30 days as required by the FCRA.

Sincerely,

______________________________
[YOUR NAME]`,

  "state_ag": () => `${formatDate()}

[YOUR NAME]
[YOUR ADDRESS]
[CITY, STATE ZIP]

Office of the Attorney General
[STATE]
[ADDRESS]

Re: Consumer Complaint - Credit Reporting Violation
Against: [COMPANY NAME]

Dear Attorney General:

I am filing a formal complaint against [COMPANY NAME] for violations of [STATE] consumer protection laws and federal credit reporting regulations.

SUMMARY OF COMPLAINT:
[DESCRIBE THE ISSUE]

ATTEMPTS TO RESOLVE:
[LIST PREVIOUS CORRESPONDENCE]

RELIEF SOUGHT:
1. Investigation of the company's practices
2. Corrective action
3. Enforcement of applicable laws

I have enclosed copies of all relevant correspondence.

Sincerely,

______________________________
[YOUR NAME]`,

  "intent_to_sue": () => `${formatDate()}

[YOUR NAME]
[YOUR ADDRESS]
[CITY, STATE ZIP]

VIA CERTIFIED MAIL

[COMPANY NAME]
[ADDRESS]

Re: Notice of Intent to Sue - FCRA/FDCPA Violations
Account Reference: [IF APPLICABLE]

To Whom It May Concern:

This letter serves as formal notice of my intent to pursue legal action against [COMPANY NAME] for violations of federal law.

VIOLATIONS:
[LIST SPECIFIC VIOLATIONS WITH STATUTE CITATIONS]

DEMANDS:
1. [SPECIFIC DEMAND 1]
2. [SPECIFIC DEMAND 2]
3. Statutory damages as provided by law

You have fifteen (15) days from receipt of this letter to resolve this matter. Failure to respond will result in the filing of a complaint in [COURT], seeking all available remedies including:
- Actual damages
- Statutory damages ($100-$1,000 per violation)
- Punitive damages (if willful)
- Attorney's fees and costs

Govern yourselves accordingly.

______________________________
[YOUR NAME]`
};

export function getLetterContent(templateId) {
  if (LETTER_CONTENT[templateId]) {
    return LETTER_CONTENT[templateId]();
  }
  return `[Letter template for ${templateId}]\n\nCustomize this template with your specific information.`;
}
