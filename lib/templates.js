// ============================================================================
// COMPREHENSIVE LETTER TEMPLATES FOR CREDIT REPAIR & IDENTITY THEFT RECOVERY
// 605b.ai - Complete Template Library
// ============================================================================
// All letters comply with FCRA, FDCPA, FCBA, and state consumer protection laws
// Last updated: January 2026
// ============================================================================

import { Shield, FileWarning, AlertTriangle, Building2, Scale, CreditCard, Landmark, FileCheck, Clock, Users, AlertOctagon, Banknote } from 'lucide-react';

// ============================================================================
// TEMPLATE CATEGORIES
// ============================================================================

export const TEMPLATES = {

  // ============================================
  // IDENTITY THEFT RECOVERY (12 templates)
  // ============================================
  identity_theft: {
    category: "Identity Theft Recovery",
    icon: Shield,
    description: "Essential letters for identity theft victims",
    templates: [
      { id: "605b_bureau", name: "§605B Bureau Block Request", description: "Demand bureaus block fraudulent accounts within 4 days", deadline: "4 business days", priority: "critical" },
      { id: "605b_furnisher", name: "§605B Furnisher Block Request", description: "Block demand sent directly to creditor/furnisher", deadline: "4 business days", priority: "critical" },
      { id: "extended_fraud_alert", name: "Extended Fraud Alert (7 Years)", description: "Request 7-year fraud alert on credit files", deadline: "1 business day", priority: "high" },
      { id: "initial_fraud_alert", name: "Initial Fraud Alert (1 Year)", description: "Request 1-year fraud alert on credit files", deadline: "1 business day", priority: "high" },
      { id: "credit_freeze", name: "Credit Freeze Request", description: "Freeze credit file to prevent new accounts", deadline: "1 business day", priority: "critical" },
      { id: "police_report_request", name: "Police Report Request Letter", description: "Request police report for identity theft", deadline: "Varies", priority: "critical" },
      { id: "fraudulent_inquiry_removal", name: "Fraudulent Inquiry Removal", description: "Remove unauthorized hard inquiries", deadline: "30 days", priority: "medium" },
      { id: "ssa_notification", name: "SSA Identity Theft Notice", description: "Notify Social Security Administration", deadline: "N/A", priority: "high" },
      { id: "irs_14039", name: "IRS Form 14039 Cover Letter", description: "IRS Identity Theft Affidavit submission", deadline: "N/A", priority: "high" },
      { id: "fraudulent_bank_closure", name: "Fraudulent Bank Account Closure", description: "Close bank account opened fraudulently", deadline: "Varies", priority: "critical" },
      { id: "address_dispute", name: "Fraudulent Address Dispute", description: "Remove addresses added by identity thief", deadline: "30 days", priority: "medium" },
      { id: "ftc_affidavit", name: "FTC Identity Theft Report", description: "Official identity theft affidavit", deadline: "N/A", external: "https://www.identitytheft.gov/", priority: "critical" },
    ]
  },

  // ============================================
  // CREDIT BUREAU DISPUTES (10 templates)
  // ============================================
  disputes: {
    category: "Credit Bureau Disputes",
    icon: FileWarning,
    description: "Dispute inaccurate information on credit reports",
    templates: [
      { id: "611_dispute", name: "§611 Standard Dispute", description: "Challenge inaccurate information with bureaus", deadline: "30 days", priority: "high" },
      { id: "609_disclosure", name: "§609 Method of Verification", description: "Demand proof of how information was verified", deadline: "15 days", priority: "medium" },
      { id: "623_direct", name: "§623 Direct Furnisher Dispute", description: "Bypass bureaus - dispute directly with furnisher", deadline: "30 days", priority: "high" },
      { id: "reinvestigation_failure", name: "Dispute After Reinvestigation Failure", description: "Follow-up when bureau fails proper investigation", deadline: "30 days", priority: "high" },
      { id: "reinsertion_notice", name: "Reinsertion Violation Notice", description: "When deleted item reappears without proper notice", deadline: "5 days for bureau response", priority: "critical" },
      { id: "outdated_info_removal", name: "Outdated Information Removal (7-Year)", description: "Remove information past reporting period", deadline: "30 days", priority: "medium" },
      { id: "balance_dispute", name: "Account Balance Dispute", description: "Dispute incorrect balance reporting", deadline: "30 days", priority: "medium" },
      { id: "account_ownership_dispute", name: "Account Ownership Dispute", description: "Not my account - prove I'm the owner", deadline: "30 days", priority: "high" },
      { id: "late_payment_dispute", name: "Late Payment Dispute", description: "Challenge inaccurate late payment reporting", deadline: "30 days", priority: "medium" },
      { id: "public_record_dispute", name: "Public Record Dispute", description: "Dispute bankruptcies, judgments, liens", deadline: "30 days", priority: "high" },
    ]
  },

  // ============================================
  // DEBT COLLECTION (10 templates)
  // ============================================
  debt_collection: {
    category: "Debt Collection Defense",
    icon: AlertTriangle,
    description: "Defend against collectors and protect your rights",
    templates: [
      { id: "809_validation", name: "§809 Debt Validation Demand", description: "Force collector to prove the debt exists", deadline: "30 days to send", priority: "critical" },
      { id: "cease_desist", name: "Cease & Desist Communication", description: "Stop all collector contact", deadline: "Immediate effect", priority: "high" },
      { id: "pay_delete", name: "Pay for Delete Negotiation", description: "Negotiate payment for credit report removal", deadline: "Negotiable", priority: "medium" },
      { id: "time_barred_debt", name: "Time-Barred Debt Response", description: "Debt past statute of limitations", deadline: "N/A", priority: "high" },
      { id: "id_theft_to_collector", name: "Identity Theft Notice to Collector", description: "Notify collector debt is from identity theft", deadline: "30 days", priority: "critical" },
      { id: "harassment_complaint", name: "FDCPA Harassment Complaint", description: "Document collector violations", deadline: "N/A", priority: "high" },
      { id: "third_party_disclosure", name: "Third Party Disclosure Complaint", description: "Collector told others about debt", deadline: "1 year to sue", priority: "high" },
      { id: "workplace_contact_cease", name: "Workplace Contact Cease Letter", description: "Stop collector from calling work", deadline: "Immediate", priority: "high" },
      { id: "goodwill_adjustment", name: "Goodwill Adjustment Request", description: "Request removal based on good payment history", deadline: "N/A", priority: "low" },
      { id: "settlement_offer", name: "Debt Settlement Offer", description: "Propose lump sum settlement", deadline: "Negotiable", priority: "medium" },
    ]
  },

  // ============================================
  // SPECIALTY AGENCIES (10 templates)
  // ============================================
  specialty: {
    category: "Specialty Reporting Agencies",
    icon: Building2,
    description: "Dispute banking, utility, and public record databases",
    templates: [
      { id: "chex_dispute", name: "ChexSystems Dispute", description: "Dispute banking/checking account history", deadline: "30 days", priority: "high" },
      { id: "ews_dispute", name: "Early Warning Services Dispute", description: "Dispute EWS bank screening records", deadline: "30 days", priority: "high" },
      { id: "lexis_dispute", name: "LexisNexis Consumer Dispute", description: "Dispute public records and background data", deadline: "30 days", priority: "medium" },
      { id: "innovis_dispute", name: "Innovis Credit Dispute", description: "Dispute 4th credit bureau records", deadline: "30 days", priority: "medium" },
      { id: "nctue_dispute", name: "NCTUE Utility Dispute", description: "Dispute utility payment history", deadline: "30 days", priority: "medium" },
      { id: "telecheck_dispute", name: "TeleCheck Dispute", description: "Dispute check writing history", deadline: "30 days", priority: "medium" },
      { id: "clue_dispute", name: "LexisNexis C.L.U.E. Dispute", description: "Dispute insurance claim history", deadline: "30 days", priority: "medium" },
      { id: "corelogic_dispute", name: "CoreLogic/ARS Dispute", description: "Dispute rental history records", deadline: "30 days", priority: "medium" },
      { id: "medical_debt_dispute", name: "Medical Debt Dispute", description: "Dispute under medical debt protections", deadline: "30 days", priority: "high" },
      { id: "sagestream_dispute", name: "SageStream Dispute", description: "Dispute alternative credit data", deadline: "30 days", priority: "low" },
    ]
  },

  // ============================================
  // BANK & CREDIT CARD DISPUTES (6 templates)
  // ============================================
  banking: {
    category: "Bank & Credit Card Disputes",
    icon: CreditCard,
    description: "Dispute fraudulent transactions and accounts",
    templates: [
      { id: "reg_e_dispute", name: "Regulation E Dispute (Debit/EFT)", description: "Dispute unauthorized electronic transfers", deadline: "60 days from statement", priority: "critical" },
      { id: "reg_z_dispute", name: "Regulation Z Dispute (Credit Card)", description: "Dispute unauthorized credit card charges", deadline: "60 days from statement", priority: "critical" },
      { id: "billing_error_notice", name: "FCBA Billing Error Notice", description: "Formal billing error dispute", deadline: "60 days from statement", priority: "high" },
      { id: "provisional_credit_demand", name: "Provisional Credit Demand", description: "Demand temporary credit during investigation", deadline: "10 business days", priority: "high" },
      { id: "fraud_claim_appeal", name: "Fraud Claim Denial Appeal", description: "Appeal denied fraud claim", deadline: "Varies", priority: "high" },
      { id: "account_closure_fraud", name: "Account Closure Due to Fraud", description: "Close account due to compromised information", deadline: "Immediate", priority: "critical" },
    ]
  },

  // ============================================
  // ESCALATION & LEGAL (8 templates)
  // ============================================
  escalation: {
    category: "Escalation & Legal Action",
    icon: Scale,
    description: "Regulatory complaints and legal threats",
    templates: [
      { id: "cfpb_complaint", name: "CFPB Complaint", description: "File federal consumer complaint", deadline: "15-60 days for response", external: "https://www.consumerfinance.gov/complaint/", priority: "high" },
      { id: "state_ag", name: "State Attorney General Complaint", description: "File state-level complaint", deadline: "Varies by state", priority: "high" },
      { id: "intent_to_sue", name: "Intent to Sue Letter", description: "Final demand before litigation", deadline: "15-30 days to respond", priority: "critical" },
      { id: "occ_complaint", name: "OCC Complaint (National Banks)", description: "Complaint to bank regulator", deadline: "Varies", priority: "high" },
      { id: "fdic_complaint", name: "FDIC Complaint", description: "Complaint for FDIC-insured banks", deadline: "Varies", priority: "high" },
      { id: "ncua_complaint", name: "NCUA Complaint (Credit Unions)", description: "Complaint to credit union regulator", deadline: "Varies", priority: "medium" },
      { id: "ftc_complaint", name: "FTC Complaint Letter", description: "Report violations to Federal Trade Commission", deadline: "N/A", priority: "medium" },
      { id: "small_claims_demand", name: "Small Claims Pre-Filing Demand", description: "Final demand before small claims court", deadline: "30 days", priority: "critical" },
    ]
  },

  // ============================================
  // FOLLOW-UP & PROCEDURAL (6 templates)
  // ============================================
  followup: {
    category: "Follow-Up & Procedures",
    icon: Clock,
    description: "Follow-ups, responses, and procedural letters",
    templates: [
      { id: "no_response_followup", name: "No Response Follow-Up", description: "When bureau/furnisher doesn't respond", deadline: "After 30+ days", priority: "high" },
      { id: "dispute_response_rebuttal", name: "Dispute Response Rebuttal", description: "Challenge inadequate investigation", deadline: "30 days", priority: "high" },
      { id: "certified_mail_instructions", name: "Certified Mail Instructions", description: "How to properly send certified mail", deadline: "N/A", priority: "info" },
      { id: "documentation_checklist", name: "Documentation Checklist", description: "Required documents for disputes", deadline: "N/A", priority: "info" },
      { id: "consumer_statement", name: "Consumer Statement Request", description: "Add 100-word statement to credit file", deadline: "N/A", priority: "low" },
      { id: "annual_report_request", name: "Annual Credit Report Request", description: "Request free annual credit reports", deadline: "N/A", external: "https://www.annualcreditreport.com", priority: "info" },
    ]
  },
};

const formatDate = () => new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

export const LETTER_CONTENT = {

  "605b_bureau": () => `${formatDate()}

[YOUR FULL LEGAL NAME]
[YOUR STREET ADDRESS]
[CITY, STATE ZIP CODE]
[YOUR PHONE NUMBER]
[YOUR EMAIL ADDRESS]

VIA CERTIFIED MAIL - RETURN RECEIPT REQUESTED

[CREDIT BUREAU NAME AND ADDRESS - Choose One:]

Equifax Information Services LLC
P.O. Box 740256
Atlanta, GA 30374

— OR —

Experian
P.O. Box 4500
Allen, TX 75013

— OR —

TransUnion LLC
Consumer Dispute Center
P.O. Box 2000
Chester, PA 19016

Re: IDENTITY THEFT BLOCK REQUEST PURSUANT TO FCRA §605B (15 U.S.C. § 1681c-2)
    Social Security Number: XXX-XX-[LAST 4 DIGITS]

To Whom It May Concern:

I am a victim of identity theft. Pursuant to the Fair Credit Reporting Act, 15 U.S.C. § 1681c-2 (Section 605B), I am formally requesting that you BLOCK the following fraudulent information from my consumer credit file within four (4) business days of receipt of this letter.

═══════════════════════════════════════════════════════════════════════════
FRAUDULENT ACCOUNTS TO BE BLOCKED:
═══════════════════════════════════════════════════════════════════════════

Account #1:
    Creditor/Company Name: [CREDITOR NAME]
    Account Number: [FULL OR PARTIAL ACCOUNT NUMBER]
    Date Opened: [DATE]
    Amount/Balance: $[AMOUNT]
    Reason: This account was opened fraudulently without my knowledge or consent

[ADD ADDITIONAL ACCOUNTS AS NEEDED - COPY THE FORMAT ABOVE]

═══════════════════════════════════════════════════════════════════════════
LEGAL BASIS:
═══════════════════════════════════════════════════════════════════════════

Under 15 U.S.C. § 1681c-2(a), you are REQUIRED to block the reporting of any information resulting from identity theft within FOUR (4) BUSINESS DAYS after receiving:

(1) Appropriate proof of identity (ENCLOSED)
(2) A copy of an identity theft report (ENCLOSED)
(3) Identification of information resulting from identity theft (LISTED ABOVE)
(4) A statement that the information is not related to any transaction by the consumer

I hereby certify that the information identified above does not relate to any transaction that I made or authorized.

Under 15 U.S.C. § 1681c-2(b), you must promptly notify the furnisher(s) of the blocked information.

═══════════════════════════════════════════════════════════════════════════
ENCLOSED DOCUMENTS:
═══════════════════════════════════════════════════════════════════════════

□ Copy of FTC Identity Theft Report (IdentityTheft.gov)
□ Copy of government-issued photo ID
□ Proof of current address
□ [IF AVAILABLE] Copy of police report

═══════════════════════════════════════════════════════════════════════════
NOTICE OF LIABILITY:
═══════════════════════════════════════════════════════════════════════════

Failure to comply within the statutory timeframe may result in civil liability under:
• 15 U.S.C. § 1681n - Willful noncompliance: $100-$1,000 statutory damages plus actual and punitive damages
• 15 U.S.C. § 1681o - Negligent noncompliance: Actual damages and attorney's fees

Sincerely,

______________________________
[YOUR PRINTED NAME]

Enclosures: [NUMBER] items as listed above`,


  "605b_furnisher": () => `${formatDate()}

[YOUR FULL LEGAL NAME]
[YOUR STREET ADDRESS]
[CITY, STATE ZIP CODE]
[YOUR PHONE NUMBER]

VIA CERTIFIED MAIL - RETURN RECEIPT REQUESTED

[CREDITOR/FURNISHER NAME]
[FRAUD DEPARTMENT ADDRESS]
[CITY, STATE ZIP CODE]

Re: IDENTITY THEFT NOTICE - BLOCK REQUEST PURSUANT TO FCRA §605B
    Account Number: [ACCOUNT NUMBER]
    Alleged Amount: $[AMOUNT]

To Whom It May Concern:

I am writing to inform you that the above-referenced account was opened fraudulently as a result of identity theft. I did NOT open this account, I did NOT authorize anyone to open this account on my behalf, and I have received NO benefit from this account.

═══════════════════════════════════════════════════════════════════════════
DEMANDS PURSUANT TO FEDERAL LAW:
═══════════════════════════════════════════════════════════════════════════

1. CEASE REPORTING this fraudulent account to all credit bureaus immediately
2. CEASE ALL COLLECTION activity on this fraudulent account
3. PROVIDE DOCUMENTATION - Within 30 days, provide copies of:
   • Original application or agreement bearing my signature
   • All documents used to open this account
   • Records of all transactions on this account
4. CLOSE THE ACCOUNT immediately
5. CONFIRM ZERO BALANCE in writing

═══════════════════════════════════════════════════════════════════════════
PROHIBITION ON DEBT SALE:
═══════════════════════════════════════════════════════════════════════════

Under 15 U.S.C. § 1681c-2(f), you are PROHIBITED from selling or transferring this debt after receiving this notification.

═══════════════════════════════════════════════════════════════════════════
ENCLOSED:
═══════════════════════════════════════════════════════════════════════════

□ Copy of FTC Identity Theft Report
□ Copy of government-issued photo ID
□ [IF AVAILABLE] Copy of police report

Sincerely,

______________________________
[YOUR PRINTED NAME]`,


  "extended_fraud_alert": () => `${formatDate()}

[YOUR FULL LEGAL NAME]
[YOUR STREET ADDRESS]
[CITY, STATE ZIP CODE]
[YOUR PHONE NUMBER]

VIA CERTIFIED MAIL - RETURN RECEIPT REQUESTED

[CREDIT BUREAU]
[ADDRESS]

Re: REQUEST FOR EXTENDED FRAUD ALERT (7 YEARS) - FCRA §605A(b)
    Social Security Number: XXX-XX-[LAST 4 DIGITS]

To Whom It May Concern:

I am a victim of identity theft. Pursuant to FCRA §605A(b) (15 U.S.C. § 1681c-1(b)), I am requesting an EXTENDED FRAUD ALERT on my credit file for seven (7) years.

═══════════════════════════════════════════════════════════════════════════
CONTACT FOR IDENTITY VERIFICATION:
═══════════════════════════════════════════════════════════════════════════

Primary Phone: [YOUR PHONE NUMBER]
Secondary Phone: [ALTERNATE NUMBER]
Email: [YOUR EMAIL]

Please require creditors to contact me at these numbers before extending credit.

═══════════════════════════════════════════════════════════════════════════
YOUR LEGAL OBLIGATIONS:
═══════════════════════════════════════════════════════════════════════════

Under 15 U.S.C. § 1681c-1(b), you must:
1. Place the extended fraud alert within ONE (1) BUSINESS DAY
2. Notify the other two nationwide credit bureaus
3. Exclude me from prescreened credit offers for 5 years
4. Provide me with two (2) free credit reports within 12 months

═══════════════════════════════════════════════════════════════════════════
ENCLOSED:
═══════════════════════════════════════════════════════════════════════════

□ Copy of FTC Identity Theft Report
□ Copy of government-issued photo ID
□ Proof of current address

Please send written confirmation.

Sincerely,

______________________________
[YOUR PRINTED NAME]`,


  "initial_fraud_alert": () => `${formatDate()}

[YOUR FULL LEGAL NAME]
[YOUR STREET ADDRESS]
[CITY, STATE ZIP CODE]
[YOUR PHONE NUMBER]

[CREDIT BUREAU]
[ADDRESS]

Re: REQUEST FOR INITIAL FRAUD ALERT (1 YEAR) - FCRA §605A(a)
    Social Security Number: XXX-XX-[LAST 4 DIGITS]

To Whom It May Concern:

Pursuant to FCRA §605A(a), I am requesting an INITIAL FRAUD ALERT on my credit file for one (1) year.

Contact Phone for Verification: [YOUR PHONE NUMBER]

Under federal law, you must:
1. Place the fraud alert within ONE (1) BUSINESS DAY
2. Notify the other two nationwide credit bureaus
3. Provide me with a free credit report upon request

Please send written confirmation.

Sincerely,

______________________________
[YOUR PRINTED NAME]`,


  "credit_freeze": () => `${formatDate()}

[YOUR FULL LEGAL NAME]
[YOUR STREET ADDRESS]
[CITY, STATE ZIP CODE]
[YOUR DATE OF BIRTH]
[YOUR PHONE NUMBER]

VIA CERTIFIED MAIL - RETURN RECEIPT REQUESTED

[CREDIT BUREAU]
[ADDRESS]

Re: REQUEST FOR SECURITY FREEZE - FCRA §605A(i)
    Social Security Number: XXX-XX-[LAST 4 DIGITS]

To Whom It May Concern:

Pursuant to FCRA §605A(i), I am requesting a SECURITY FREEZE on my credit file.

═══════════════════════════════════════════════════════════════════════════
PERSONAL INFORMATION:
═══════════════════════════════════════════════════════════════════════════

Full Legal Name: [YOUR NAME]
Date of Birth: [YOUR DOB]
Social Security Number: [YOUR SSN]
Current Address: [YOUR ADDRESS]
Previous Addresses (past 2 years): [LIST ANY]

═══════════════════════════════════════════════════════════════════════════
YOUR LEGAL OBLIGATIONS:
═══════════════════════════════════════════════════════════════════════════

Under federal law, you must:
1. Place the freeze within ONE (1) BUSINESS DAY (3 days if by mail)
2. Provide written confirmation
3. Provide a PIN or password for lifting/removing the freeze
4. NOT charge any fee

═══════════════════════════════════════════════════════════════════════════
ENCLOSED:
═══════════════════════════════════════════════════════════════════════════

□ Copy of government-issued photo ID
□ Proof of current address

Please send confirmation and my PIN/password.

Sincerely,

______________________________
[YOUR PRINTED NAME]`,


  "police_report_request": () => `${formatDate()}

[YOUR FULL LEGAL NAME]
[YOUR STREET ADDRESS]
[CITY, STATE ZIP CODE]
[YOUR PHONE NUMBER]

[POLICE DEPARTMENT NAME]
Records Division
[ADDRESS]

Re: Request for Identity Theft Police Report
    Case/Report Number: [IF KNOWN]

To Whom It May Concern:

I am requesting a copy of the police report I filed regarding identity theft.

═══════════════════════════════════════════════════════════════════════════
INCIDENT DETAILS:
═══════════════════════════════════════════════════════════════════════════

Date Reported: [DATE]
Reporting Officer: [NAME IF KNOWN]
Case Number: [IF KNOWN]
Type: Identity Theft / Fraudulent Accounts

═══════════════════════════════════════════════════════════════════════════
REQUEST:
═══════════════════════════════════════════════════════════════════════════

Please provide:
□ Certified copy of police report
□ Official case/report number
□ Any supplements or additional documentation

I understand there may be a fee. Please contact me if payment is required.

═══════════════════════════════════════════════════════════════════════════
ENCLOSED:
═══════════════════════════════════════════════════════════════════════════

□ Copy of government-issued photo ID
□ Self-addressed stamped envelope

Thank you.

Sincerely,

______________________________
[YOUR PRINTED NAME]`,


  "fraudulent_inquiry_removal": () => `${formatDate()}

[YOUR FULL LEGAL NAME]
[YOUR STREET ADDRESS]
[CITY, STATE ZIP CODE]
[YOUR PHONE NUMBER]

VIA CERTIFIED MAIL - RETURN RECEIPT REQUESTED

[CREDIT BUREAU]
[ADDRESS]

Re: REQUEST TO REMOVE FRAUDULENT HARD INQUIRIES
    Social Security Number: XXX-XX-[LAST 4 DIGITS]

To Whom It May Concern:

I am a victim of identity theft. Pursuant to FCRA §605B, I am requesting removal of the following fraudulent hard inquiries:

═══════════════════════════════════════════════════════════════════════════
FRAUDULENT INQUIRIES:
═══════════════════════════════════════════════════════════════════════════

Inquiry #1:
    Company: [COMPANY NAME]
    Date: [DATE]
    I did NOT authorize this inquiry.

[ADD MORE AS NEEDED]

═══════════════════════════════════════════════════════════════════════════
ENCLOSED:
═══════════════════════════════════════════════════════════════════════════

□ FTC Identity Theft Report
□ Government-issued ID

Sincerely,

______________________________
[YOUR PRINTED NAME]`,


  "ssa_notification": () => `${formatDate()}

[YOUR FULL LEGAL NAME]
[YOUR STREET ADDRESS]
[CITY, STATE ZIP CODE]
[YOUR PHONE NUMBER]
[YOUR DATE OF BIRTH]

Social Security Administration
Office of the Inspector General
Fraud Hotline
P.O. Box 17785
Baltimore, MD 21235

Re: NOTIFICATION OF IDENTITY THEFT - MISUSE OF SOCIAL SECURITY NUMBER
    Social Security Number: XXX-XX-[LAST 4 DIGITS]

To Whom It May Concern:

I am reporting that my Social Security number has been stolen and used fraudulently.

═══════════════════════════════════════════════════════════════════════════
PERSONAL INFORMATION:
═══════════════════════════════════════════════════════════════════════════

Full Name: [YOUR NAME]
Date of Birth: [YOUR DOB]
Social Security Number: [YOUR SSN]
Current Address: [YOUR ADDRESS]
Phone: [YOUR PHONE]

═══════════════════════════════════════════════════════════════════════════
DETAILS OF IDENTITY THEFT:
═══════════════════════════════════════════════════════════════════════════

Date Discovered: [DATE]
Description: [DESCRIBE HOW YOUR SSN WAS MISUSED]

═══════════════════════════════════════════════════════════════════════════
REQUESTS:
═══════════════════════════════════════════════════════════════════════════

1. Please flag my SSN for potential fraud
2. Review my earnings record for fraudulent wages
3. Provide me with a copy of my Social Security Statement
4. Advise if a new SSN is warranted

═══════════════════════════════════════════════════════════════════════════
ENCLOSED:
═══════════════════════════════════════════════════════════════════════════

□ FTC Identity Theft Report
□ Government-issued photo ID
□ Police report (if available)

Sincerely,

______________________________
[YOUR PRINTED NAME]`,


  "irs_14039": () => `${formatDate()}

[YOUR FULL LEGAL NAME]
[YOUR STREET ADDRESS]
[CITY, STATE ZIP CODE]
[YOUR PHONE NUMBER]

Internal Revenue Service
Identity Protection Specialized Unit
P.O. Box 9039
Andover, MA 01810-0939

Re: IRS FORM 14039 - IDENTITY THEFT AFFIDAVIT
    Social Security Number: XXX-XX-[LAST 4 DIGITS]
    Tax Year(s) Affected: [YEAR(S)]

To Whom It May Concern:

I am enclosing IRS Form 14039 to report that someone has fraudulently used my Social Security number for tax purposes.

═══════════════════════════════════════════════════════════════════════════
TYPE OF TAX IDENTITY THEFT:
═══════════════════════════════════════════════════════════════════════════

□ Someone filed a tax return using my SSN
□ Someone claimed me as a dependent
□ Someone used my SSN for employment
□ IRS sent me a notice about income I didn't earn

═══════════════════════════════════════════════════════════════════════════
ENCLOSED:
═══════════════════════════════════════════════════════════════════════════

□ Completed IRS Form 14039
□ Government-issued photo ID
□ Copy of Social Security card or SSA letter
□ FTC Identity Theft Report
□ IRS notice received (if applicable)

═══════════════════════════════════════════════════════════════════════════
REQUESTS:
═══════════════════════════════════════════════════════════════════════════

1. Place an Identity Protection PIN on my account
2. Investigate the fraudulent activity
3. Correct my tax records

Sincerely,

______________________________
[YOUR PRINTED NAME]`,


  "fraudulent_bank_closure": () => `${formatDate()}

[YOUR FULL LEGAL NAME]
[YOUR STREET ADDRESS]
[CITY, STATE ZIP CODE]
[YOUR PHONE NUMBER]

VIA CERTIFIED MAIL - RETURN RECEIPT REQUESTED

[BANK NAME]
Fraud Department
[ADDRESS]

Re: REQUEST TO CLOSE FRAUDULENT ACCOUNT - IDENTITY THEFT
    Fraudulent Account Number: [ACCOUNT NUMBER]

To Whom It May Concern:

A bank account was opened at your institution fraudulently using my personal information. I am a victim of identity theft.

═══════════════════════════════════════════════════════════════════════════
FRAUDULENT ACCOUNT:
═══════════════════════════════════════════════════════════════════════════

Account Number: [NUMBER]
Type: [CHECKING/SAVINGS/OTHER]
Date Opened: [DATE IF KNOWN]

I DID NOT open this account. I DID NOT authorize anyone to open it. I have received NO benefit from it.

═══════════════════════════════════════════════════════════════════════════
DEMANDS:
═══════════════════════════════════════════════════════════════════════════

1. IMMEDIATELY CLOSE this account
2. CONFIRM IN WRITING that I owe $0.00 and have no liability
3. REMOVE all negative information from ChexSystems, EWS, and credit bureaus
4. PROVIDE copies of all documents used to open this account
5. DO NOT report any negative information about this account

═══════════════════════════════════════════════════════════════════════════
ENCLOSED:
═══════════════════════════════════════════════════════════════════════════

□ FTC Identity Theft Report
□ Government-issued photo ID
□ Police report (if available)

Failure to close this account and clear my records may result in legal action.

Sincerely,

______________________________
[YOUR PRINTED NAME]`,


  "address_dispute": () => `${formatDate()}

[YOUR FULL LEGAL NAME]
[YOUR STREET ADDRESS]
[CITY, STATE ZIP CODE]
[YOUR PHONE NUMBER]

VIA CERTIFIED MAIL - RETURN RECEIPT REQUESTED

[CREDIT BUREAU]
[ADDRESS]

Re: DISPUTE OF FRAUDULENT ADDRESS ON FILE
    Social Security Number: XXX-XX-[LAST 4 DIGITS]

To Whom It May Concern:

I am disputing the following address(es) on my credit report. These are NOT my addresses and were added as a result of identity theft.

═══════════════════════════════════════════════════════════════════════════
FRAUDULENT ADDRESSES TO REMOVE:
═══════════════════════════════════════════════════════════════════════════

Address #1: [FRAUDULENT ADDRESS]
    I have NEVER lived at this address.

[ADD MORE AS NEEDED]

═══════════════════════════════════════════════════════════════════════════
MY CORRECT ADDRESS HISTORY:
═══════════════════════════════════════════════════════════════════════════

Current: [YOUR ADDRESS]
Previous: [IF APPLICABLE]

Pursuant to FCRA §611, please investigate and remove these fraudulent addresses.

═══════════════════════════════════════════════════════════════════════════
ENCLOSED:
═══════════════════════════════════════════════════════════════════════════

□ Government-issued photo ID
□ Proof of current address
□ FTC Identity Theft Report (if applicable)

Sincerely,

______________________________
[YOUR PRINTED NAME]`,


  "611_dispute": () => `${formatDate()}

[YOUR FULL LEGAL NAME]
[YOUR STREET ADDRESS]
[CITY, STATE ZIP CODE]
[YOUR PHONE NUMBER]

VIA CERTIFIED MAIL - RETURN RECEIPT REQUESTED

[CREDIT BUREAU NAME]
[ADDRESS]

Re: FORMAL DISPUTE PURSUANT TO FCRA §611 (15 U.S.C. § 1681i)
    Social Security Number: XXX-XX-[LAST 4 DIGITS]

To Whom It May Concern:

Pursuant to FCRA §611, I am formally disputing the following inaccurate information on my credit report:

═══════════════════════════════════════════════════════════════════════════
DISPUTED ITEM:
═══════════════════════════════════════════════════════════════════════════

Creditor Name: [CREDITOR]
Account Number: [ACCOUNT NUMBER]
Type: [CREDIT CARD/LOAN/COLLECTION/ETC.]

What is being reported: [DESCRIBE]

Why this is inaccurate: [EXPLAIN THE ERROR]

What should be reported: [CORRECT INFORMATION OR "DELETED"]

═══════════════════════════════════════════════════════════════════════════
LEGAL REQUIREMENTS:
═══════════════════════════════════════════════════════════════════════════

Under FCRA §611(a)(1), you must investigate within 30 days.
Under FCRA §611(a)(5)(A), unverified or inaccurate information must be deleted/modified.
Under FCRA §611(a)(6), you must provide written notice of results.

═══════════════════════════════════════════════════════════════════════════
ENCLOSED:
═══════════════════════════════════════════════════════════════════════════

□ Copy of credit report with disputed item highlighted
□ [LIST ANY SUPPORTING EVIDENCE]

Failure to investigate properly may result in civil liability under 15 U.S.C. § 1681n or § 1681o.

Sincerely,

______________________________
[YOUR PRINTED NAME]`,


  "609_disclosure": () => `${formatDate()}

[YOUR FULL LEGAL NAME]
[YOUR STREET ADDRESS]
[CITY, STATE ZIP CODE]
[YOUR PHONE NUMBER]

VIA CERTIFIED MAIL - RETURN RECEIPT REQUESTED

[CREDIT BUREAU NAME]
[ADDRESS]

Re: REQUEST FOR METHOD OF VERIFICATION - FCRA §609 AND §611
    Social Security Number: XXX-XX-[LAST 4 DIGITS]

To Whom It May Concern:

Pursuant to FCRA §609 and §611(a)(7), I am requesting disclosure of the method of verification used for:

═══════════════════════════════════════════════════════════════════════════
ACCOUNT(S):
═══════════════════════════════════════════════════════════════════════════

Creditor: [CREDITOR NAME]
Account: [ACCOUNT NUMBER]
Previous Dispute Date: [DATE]

═══════════════════════════════════════════════════════════════════════════
INFORMATION REQUESTED:
═══════════════════════════════════════════════════════════════════════════

Under 15 U.S.C. § 1681i(a)(7), please provide:

1. Business name, address, and phone of each furnisher contacted
2. Dates each furnisher was contacted
3. Detailed summary of verification procedure used
4. Any documentation received from furnisher

You must provide this within 15 DAYS.

Sincerely,

______________________________
[YOUR PRINTED NAME]`,


  "623_direct": () => `${formatDate()}

[YOUR FULL LEGAL NAME]
[YOUR STREET ADDRESS]
[CITY, STATE ZIP CODE]
[YOUR PHONE NUMBER]

VIA CERTIFIED MAIL - RETURN RECEIPT REQUESTED

[FURNISHER/CREDITOR NAME]
[DISPUTES DEPARTMENT]
[ADDRESS]

Re: DIRECT DISPUTE - FCRA §623(a)(8) (15 U.S.C. § 1681s-2(a)(8))
    Account Number: [ACCOUNT NUMBER]

To Whom It May Concern:

Pursuant to FCRA §623(a)(8), I am directly disputing information you are furnishing to credit bureaus:

═══════════════════════════════════════════════════════════════════════════
DISPUTED INFORMATION:
═══════════════════════════════════════════════════════════════════════════

Account Number: [NUMBER]
What you are reporting: [DESCRIBE]
Why this is inaccurate: [EXPLAIN]
Correct information: [WHAT IT SHOULD BE]

═══════════════════════════════════════════════════════════════════════════
YOUR LEGAL OBLIGATIONS:
═══════════════════════════════════════════════════════════════════════════

Under FCRA §623(b), you must:
1. Conduct an investigation
2. Review all relevant information provided
3. Report results to all credit bureaus
4. Modify, delete, or block inaccurate/unverifiable information

Complete within 30 days. Failure to comply may result in liability under 15 U.S.C. § 1681s-2.

═══════════════════════════════════════════════════════════════════════════
ENCLOSED:
═══════════════════════════════════════════════════════════════════════════

□ [SUPPORTING EVIDENCE]

Sincerely,

______________________________
[YOUR PRINTED NAME]`,


  "reinvestigation_failure": () => `${formatDate()}

[YOUR FULL LEGAL NAME]
[YOUR STREET ADDRESS]
[CITY, STATE ZIP CODE]
[YOUR PHONE NUMBER]

VIA CERTIFIED MAIL - RETURN RECEIPT REQUESTED

[CREDIT BUREAU NAME]
[ADDRESS]

Re: NOTICE OF UNREASONABLE INVESTIGATION - SECOND DISPUTE
    SSN: XXX-XX-[LAST 4]
    Previous Dispute Date: [DATE]

To Whom It May Concern:

On [DATE], I submitted a dispute. Your response on [DATE] indicated verification, but your investigation was UNREASONABLE and INADEQUATE under FCRA §611(a)(1)(A).

═══════════════════════════════════════════════════════════════════════════
PROBLEMS WITH YOUR INVESTIGATION:
═══════════════════════════════════════════════════════════════════════════

□ You failed to forward all information I provided
□ You merely parroted the furnisher's response without investigation
□ You used only e-OSCAR (inadequate for complex disputes)
□ You failed to consider my evidence
□ Your response doesn't address the specific inaccuracies

═══════════════════════════════════════════════════════════════════════════
THE INFORMATION REMAINS INACCURATE:
═══════════════════════════════════════════════════════════════════════════

[RESTATE THE INACCURACY AND YOUR EVIDENCE]

═══════════════════════════════════════════════════════════════════════════
DEMAND:
═══════════════════════════════════════════════════════════════════════════

Conduct an ACTUAL reasonable investigation that:
1. Considers all evidence provided
2. Goes beyond e-OSCAR
3. Contacts the furnisher directly
4. Provides documentation of verification process

═══════════════════════════════════════════════════════════════════════════
ENCLOSED:
═══════════════════════════════════════════════════════════════════════════

□ Copy of original dispute
□ Your response
□ Additional evidence

Failure to properly investigate will result in CFPB complaint and potential legal action.

Sincerely,

______________________________
[YOUR PRINTED NAME]`,


  "reinsertion_notice": () => `${formatDate()}

[YOUR FULL LEGAL NAME]
[YOUR STREET ADDRESS]
[CITY, STATE ZIP CODE]
[YOUR PHONE NUMBER]

VIA CERTIFIED MAIL - RETURN RECEIPT REQUESTED

[CREDIT BUREAU NAME]
[ADDRESS]

Re: VIOLATION OF FCRA §611(a)(5)(B)(ii) - ILLEGAL REINSERTION
    SSN: XXX-XX-[LAST 4]

To Whom It May Concern:

A previously deleted item has been REINSERTED on my credit report WITHOUT the required written notification within five (5) business days. This is a VIOLATION of federal law.

═══════════════════════════════════════════════════════════════════════════
CHRONOLOGY:
═══════════════════════════════════════════════════════════════════════════

1. Original Dispute: [DATE]
   Item: [CREDITOR] - Account #[NUMBER]

2. Deletion Confirmed: [DATE]

3. Reinsertion Discovered: [DATE]

4. Written Notice Received: [NONE]

═══════════════════════════════════════════════════════════════════════════
VIOLATION:
═══════════════════════════════════════════════════════════════════════════

Under FCRA §611(a)(5)(B)(ii), if a deleted item is reinserted, you MUST:
1. Certify accuracy
2. Notify me IN WRITING within FIVE (5) BUSINESS DAYS
3. Provide furnisher contact information

You FAILED to comply.

═══════════════════════════════════════════════════════════════════════════
DEMANDS:
═══════════════════════════════════════════════════════════════════════════

1. IMMEDIATELY DELETE the reinserted item
2. Confirm deletion within 5 business days
3. Explain why proper notification was not provided

This is a willful violation under 15 U.S.C. § 1681n ($100-$1,000 statutory damages plus actual and punitive damages).

Sincerely,

______________________________
[YOUR PRINTED NAME]

Enclosures:
□ Credit report showing reinsertion
□ Previous deletion confirmation`,


  "outdated_info_removal": () => `${formatDate()}

[YOUR FULL LEGAL NAME]
[YOUR STREET ADDRESS]
[CITY, STATE ZIP CODE]
[YOUR PHONE NUMBER]

VIA CERTIFIED MAIL - RETURN RECEIPT REQUESTED

[CREDIT BUREAU NAME]
[ADDRESS]

Re: REQUEST TO REMOVE OUTDATED INFORMATION - FCRA §605
    SSN: XXX-XX-[LAST 4]

To Whom It May Concern:

Pursuant to FCRA §605, I am requesting immediate removal of the following OUTDATED information:

═══════════════════════════════════════════════════════════════════════════
OUTDATED ITEM:
═══════════════════════════════════════════════════════════════════════════

Type: [COLLECTION/CHARGE-OFF/LATE PAYMENT/ETC.]
Creditor: [NAME]
Account: [NUMBER]
Date of First Delinquency: [DATE]
Current Age: [X] years [X] months
Legal Limit: 7 years from date of first delinquency

═══════════════════════════════════════════════════════════════════════════
LEGAL BASIS:
═══════════════════════════════════════════════════════════════════════════

Under FCRA §605(a):
• Collections/Charge-offs: 7 years from date of first delinquency
• Bankruptcies: 10 years (Ch. 7), 7 years (Ch. 13)
• Civil judgments: 7 years from entry date

This item has EXCEEDED the applicable reporting period.

Please remove immediately and send confirmation.

Sincerely,

______________________________
[YOUR PRINTED NAME]`,


  "balance_dispute": () => `${formatDate()}

[YOUR FULL LEGAL NAME]
[YOUR STREET ADDRESS]
[CITY, STATE ZIP CODE]
[YOUR PHONE NUMBER]

VIA CERTIFIED MAIL - RETURN RECEIPT REQUESTED

[CREDIT BUREAU NAME]
[ADDRESS]

Re: DISPUTE OF INCORRECT ACCOUNT BALANCE
    SSN: XXX-XX-[LAST 4]

To Whom It May Concern:

Pursuant to FCRA §611, I am disputing the reported balance on:

═══════════════════════════════════════════════════════════════════════════

Creditor: [NAME]
Account: [NUMBER]

Balance Reported: $[INCORRECT AMOUNT]
Correct Balance: $[CORRECT AMOUNT]

Reason:
□ Paid in full on [DATE]
□ Disputed charges under investigation
□ Includes unauthorized fees
□ Settled for different amount
□ Discharged in bankruptcy
□ Other: [EXPLAIN]

═══════════════════════════════════════════════════════════════════════════
ENCLOSED:
═══════════════════════════════════════════════════════════════════════════

□ [PROOF OF PAYMENT/STATEMENTS/DOCUMENTATION]

Please investigate and correct within 30 days.

Sincerely,

______________________________
[YOUR PRINTED NAME]`,


  "account_ownership_dispute": () => `${formatDate()}

[YOUR FULL LEGAL NAME]
[YOUR STREET ADDRESS]
[CITY, STATE ZIP CODE]
[YOUR PHONE NUMBER]

VIA CERTIFIED MAIL - RETURN RECEIPT REQUESTED

[CREDIT BUREAU NAME]
[ADDRESS]

Re: DISPUTE - THIS IS NOT MY ACCOUNT
    SSN: XXX-XX-[LAST 4]

To Whom It May Concern:

Pursuant to FCRA §611, I am disputing the following account. This account DOES NOT BELONG TO ME.

═══════════════════════════════════════════════════════════════════════════
DISPUTED ACCOUNT:
═══════════════════════════════════════════════════════════════════════════

Creditor: [NAME]
Account: [NUMBER]
Balance: $[AMOUNT]
Date Opened: [DATE]

═══════════════════════════════════════════════════════════════════════════
REASON THIS IS NOT MY ACCOUNT:
═══════════════════════════════════════════════════════════════════════════

□ Never opened account with this creditor
□ Never applied for credit with this creditor
□ Don't recognize account number
□ Address is not mine
□ Account opened when I was a minor (DOB: [DATE])
□ Possible identity theft
□ Mixed file (another person's account)

═══════════════════════════════════════════════════════════════════════════
REQUEST:
═══════════════════════════════════════════════════════════════════════════

Please require the furnisher to prove I opened this account, including:
• Signed application/agreement
• Proof of ID used at opening
• Verification matching my exact name, SSN, and DOB

If unverifiable, DELETE this account.

═══════════════════════════════════════════════════════════════════════════
ENCLOSED:
═══════════════════════════════════════════════════════════════════════════

□ Government-issued ID
□ Credit report with disputed item highlighted

Sincerely,

______________________________
[YOUR PRINTED NAME]`,


  "late_payment_dispute": () => `${formatDate()}

[YOUR FULL LEGAL NAME]
[YOUR STREET ADDRESS]
[CITY, STATE ZIP CODE]
[YOUR PHONE NUMBER]

VIA CERTIFIED MAIL - RETURN RECEIPT REQUESTED

[CREDIT BUREAU NAME]
[ADDRESS]

Re: DISPUTE OF INACCURATE LATE PAYMENT(S)
    SSN: XXX-XX-[LAST 4]

To Whom It May Concern:

Pursuant to FCRA §611, I am disputing the following late payment(s):

═══════════════════════════════════════════════════════════════════════════
DISPUTED LATE PAYMENTS:
═══════════════════════════════════════════════════════════════════════════

Creditor: [NAME]
Account: [NUMBER]

[MONTH/YEAR] - Reported as [30/60/90] days late
[MONTH/YEAR] - Reported as [30/60/90] days late

═══════════════════════════════════════════════════════════════════════════
REASON FOR DISPUTE:
═══════════════════════════════════════════════════════════════════════════

□ Payment was made on time (proof enclosed)
□ Payment not received due to creditor error
□ Was not yet 30 days past due
□ Had payment arrangement in place
□ Statements sent to wrong address
□ Resulted from resolved billing dispute

═══════════════════════════════════════════════════════════════════════════
ENCLOSED:
═══════════════════════════════════════════════════════════════════════════

□ [BANK STATEMENTS/CHECKS/PAYMENT CONFIRMATIONS]

Please investigate and correct within 30 days.

Sincerely,

______________________________
[YOUR PRINTED NAME]`,


  "public_record_dispute": () => `${formatDate()}

[YOUR FULL LEGAL NAME]
[YOUR STREET ADDRESS]
[CITY, STATE ZIP CODE]
[YOUR PHONE NUMBER]

VIA CERTIFIED MAIL - RETURN RECEIPT REQUESTED

[CREDIT BUREAU NAME]
[ADDRESS]

Re: DISPUTE OF PUBLIC RECORD INFORMATION
    SSN: XXX-XX-[LAST 4]

To Whom It May Concern:

Pursuant to FCRA §611, I am disputing the following public record:

═══════════════════════════════════════════════════════════════════════════
DISPUTED RECORD:
═══════════════════════════════════════════════════════════════════════════

Type: [BANKRUPTCY/JUDGMENT/TAX LIEN]
Case Number: [NUMBER]
Court/Agency: [NAME]
Date Filed: [DATE]
Amount: $[IF APPLICABLE]

═══════════════════════════════════════════════════════════════════════════
REASON FOR DISPUTE:
═══════════════════════════════════════════════════════════════════════════

□ Not my record - different person with similar name
□ Satisfied/dismissed/vacated on [DATE]
□ Outdated - past reporting period
□ Information is inaccurate
□ Filed in error, corrected by court

═══════════════════════════════════════════════════════════════════════════
ENCLOSED:
═══════════════════════════════════════════════════════════════════════════

□ Court documents showing dismissal/satisfaction
□ [OTHER SUPPORTING DOCUMENTS]

Please investigate and correct/remove within 30 days.

Sincerely,

______________________________
[YOUR PRINTED NAME]`,


  "809_validation": () => `${formatDate()}

[YOUR FULL LEGAL NAME]
[YOUR STREET ADDRESS]
[CITY, STATE ZIP CODE]

VIA CERTIFIED MAIL - RETURN RECEIPT REQUESTED

[COLLECTION AGENCY NAME]
[ADDRESS]

Re: DEBT VALIDATION REQUEST - FDCPA §809 (15 U.S.C. § 1692g)
    Your Reference: [THEIR REFERENCE NUMBER]

To Whom It May Concern:

Pursuant to FDCPA §809, I am requesting validation of this alleged debt.

═══════════════════════════════════════════════════════════════════════════
REQUIRED VALIDATION:
═══════════════════════════════════════════════════════════════════════════

Please provide:

1. Exact amount of alleged debt (principal, interest, fees - itemized)
2. Name and address of ORIGINAL CREDITOR
3. Copy of original signed contract/agreement
4. Proof you are licensed to collect in [YOUR STATE]
5. Proof statute of limitations has not expired
6. Complete payment history from original creditor

═══════════════════════════════════════════════════════════════════════════
LEGAL REQUIREMENTS:
═══════════════════════════════════════════════════════════════════════════

Under FDCPA §809(b), upon receipt of this request, you MUST:
1. CEASE all collection until validation is provided
2. NOT report to credit bureaus until validated
3. NOT contact third parties

═══════════════════════════════════════════════════════════════════════════
NOTICE:
═══════════════════════════════════════════════════════════════════════════

This letter is NOT an acknowledgment of the debt.
Violations may result in statutory damages up to $1,000 plus actual damages.

All future communication must be in writing to the address above.

Sincerely,

______________________________
[YOUR PRINTED NAME]`,


  "cease_desist": () => `${formatDate()}

[YOUR FULL LEGAL NAME]
[YOUR STREET ADDRESS]
[CITY, STATE ZIP CODE]

VIA CERTIFIED MAIL - RETURN RECEIPT REQUESTED

[COLLECTION AGENCY NAME]
[ADDRESS]

Re: CEASE COMMUNICATION DEMAND - FDCPA §805(c) (15 U.S.C. § 1692c(c))
    Your Reference: [NUMBER]

To Whom It May Concern:

Pursuant to FDCPA §805(c), I DEMAND that you CEASE ALL COMMUNICATION with me regarding the alleged debt referenced above.

═══════════════════════════════════════════════════════════════════════════
EFFECTIVE IMMEDIATELY, STOP:
═══════════════════════════════════════════════════════════════════════════

• All telephone calls
• All letters, emails, and texts
• All contact through third parties
• All contact with family, employers, or others

═══════════════════════════════════════════════════════════════════════════
PERMITTED COMMUNICATION:
═══════════════════════════════════════════════════════════════════════════

After receiving this, you may ONLY contact me to:
1. Advise you are terminating collection efforts, OR
2. Notify me of a specific legal action you intend to take

Any other contact is a VIOLATION of federal law.

═══════════════════════════════════════════════════════════════════════════
WARNING:
═══════════════════════════════════════════════════════════════════════════

Violations may result in:
• Statutory damages up to $1,000
• Actual damages
• Attorney's fees

This letter is NOT an acknowledgment of the alleged debt.

Sincerely,

______________________________
[YOUR PRINTED NAME]`,


  "pay_delete": () => `${formatDate()}

[YOUR FULL LEGAL NAME]
[YOUR STREET ADDRESS]
[CITY, STATE ZIP CODE]

[CREDITOR/COLLECTION AGENCY]
[ADDRESS]

Re: CONDITIONAL SETTLEMENT OFFER - PAY FOR DELETE
    Account: [NUMBER]
    Original Balance: $[AMOUNT]

To Whom It May Concern:

I am proposing a settlement CONDITIONAL upon your agreement to these specific terms:

═══════════════════════════════════════════════════════════════════════════
SETTLEMENT OFFER:
═══════════════════════════════════════════════════════════════════════════

I will pay: $[YOUR OFFER] as FULL AND FINAL SETTLEMENT

═══════════════════════════════════════════════════════════════════════════
REQUIRED TERMS:
═══════════════════════════════════════════════════════════════════════════

1. Accept $[AMOUNT] as payment in full
2. Within 30 days of payment, request DELETION from:
   • Equifax
   • Experian
   • TransUnion
3. Do NOT sell/transfer any remaining balance
4. Provide written confirmation BEFORE I submit payment
5. Payment via [CERTIFIED CHECK/MONEY ORDER] only

═══════════════════════════════════════════════════════════════════════════
PROCEDURE:
═══════════════════════════════════════════════════════════════════════════

1. Send written agreement on company letterhead
2. Upon receipt, I will remit payment within 10 business days
3. Process deletion within 30 days of payment
4. Send confirmation when deletion is submitted

═══════════════════════════════════════════════════════════════════════════
NOTICES:
═══════════════════════════════════════════════════════════════════════════

• Offer expires 30 days from this letter
• NOT an acknowledgment of debt validity
• Contingent upon written acceptance
• No payment without prior written agreement

Sincerely,

______________________________
[YOUR PRINTED NAME]`,


  "time_barred_debt": () => `${formatDate()}

[YOUR FULL LEGAL NAME]
[YOUR STREET ADDRESS]
[CITY, STATE ZIP CODE]

VIA CERTIFIED MAIL - RETURN RECEIPT REQUESTED

[COLLECTION AGENCY NAME]
[ADDRESS]

Re: NOTICE - TIME-BARRED DEBT
    Your Reference: [NUMBER]

To Whom It May Concern:

The alleged debt you are attempting to collect is TIME-BARRED under [STATE]'s statute of limitations.

═══════════════════════════════════════════════════════════════════════════
ANALYSIS:
═══════════════════════════════════════════════════════════════════════════

Date of Last Payment/Activity: [DATE]
[STATE] Statute of Limitations: [X] years for [TYPE] debt
Statute Expired: [DATE]

This debt is BEYOND the legal timeframe for collection through courts.

═══════════════════════════════════════════════════════════════════════════
LEGAL NOTICE:
═══════════════════════════════════════════════════════════════════════════

Attempting to collect a time-barred debt through litigation or threats of litigation violates FDCPA §1692e (false representations) and §1692f (unfair practices).

═══════════════════════════════════════════════════════════════════════════
DEMANDS:
═══════════════════════════════════════════════════════════════════════════

1. Cease all collection attempts
2. Remove from all credit bureaus (as unenforceable)
3. Do not sell/transfer without disclosing time-barred status

═══════════════════════════════════════════════════════════════════════════
WARNING:
═══════════════════════════════════════════════════════════════════════════

This letter is NOT:
• An acknowledgment of the debt
• A promise to pay
• A waiver of any defenses

Continued collection attempts will be reported to CFPB and may result in legal action.

Sincerely,

______________________________
[YOUR PRINTED NAME]`,


  "id_theft_to_collector": () => `${formatDate()}

[YOUR FULL LEGAL NAME]
[YOUR STREET ADDRESS]
[CITY, STATE ZIP CODE]

VIA CERTIFIED MAIL - RETURN RECEIPT REQUESTED

[COLLECTION AGENCY NAME]
[ADDRESS]

Re: IDENTITY THEFT NOTICE - CEASE COLLECTION IMMEDIATELY
    Your Reference: [NUMBER]
    Amount Claimed: $[AMOUNT]

To Whom It May Concern:

The alleged debt you are attempting to collect is the result of IDENTITY THEFT. I did NOT incur this debt.

═══════════════════════════════════════════════════════════════════════════
NOTICE PURSUANT TO FCRA §605B AND FDCPA:
═══════════════════════════════════════════════════════════════════════════

Under 15 U.S.C. § 1681c-2(f), upon receipt of this notice with an identity theft report, you are PROHIBITED from:

1. Selling or transferring this debt
2. Reporting to any credit bureau
3. Continuing collection activity

═══════════════════════════════════════════════════════════════════════════
DEMANDS:
═══════════════════════════════════════════════════════════════════════════

1. IMMEDIATELY CEASE all collection
2. REMOVE all credit bureau tradelines
3. PROVIDE copies of any application documents
4. NOTIFY credit bureaus this is identity theft
5. CLOSE your file as "Fraud - Identity Theft"

═══════════════════════════════════════════════════════════════════════════
ENCLOSED:
═══════════════════════════════════════════════════════════════════════════

□ FTC Identity Theft Report
□ Government-issued photo ID
□ Police report (if available)

Any continued collection or credit reporting after this notice is a WILLFUL violation of federal law.

Sincerely,

______________________________
[YOUR PRINTED NAME]`,


  "harassment_complaint": () => `${formatDate()}

[YOUR FULL LEGAL NAME]
[YOUR STREET ADDRESS]
[CITY, STATE ZIP CODE]

VIA CERTIFIED MAIL - RETURN RECEIPT REQUESTED

[COLLECTION AGENCY NAME]
[ADDRESS]

Re: FORMAL COMPLAINT - FDCPA VIOLATIONS
    Your Reference: [NUMBER]

To Whom It May Concern:

This letter documents your company's VIOLATIONS of the Fair Debt Collection Practices Act.

═══════════════════════════════════════════════════════════════════════════
DOCUMENTED VIOLATIONS:
═══════════════════════════════════════════════════════════════════════════

□ §806 - HARASSMENT (15 U.S.C. § 1692d)
    • Threatening violence
    • Using obscene language
    • Calling repeatedly to annoy
    • Calling before 8AM or after 9PM
    Details: [DESCRIBE WITH DATES]

□ §807 - FALSE REPRESENTATIONS (15 U.S.C. § 1692e)
    • Falsely implying government affiliation
    • Misrepresenting amount owed
    • Threatening illegal action
    Details: [DESCRIBE]

□ §808 - UNFAIR PRACTICES (15 U.S.C. § 1692f)
    • Collecting unauthorized amounts
    • Threatening illegal property seizure
    Details: [DESCRIBE]

□ §805 - COMMUNICATION VIOLATIONS (15 U.S.C. § 1692c)
    • Contacted third parties
    • Contacted work after told not to
    Details: [DESCRIBE]

═══════════════════════════════════════════════════════════════════════════
EVIDENCE:
═══════════════════════════════════════════════════════════════════════════

□ Call log showing [X] calls on [DATES]
□ Recording of call on [DATE]
□ Letter dated [DATE]
□ Voicemail recording

═══════════════════════════════════════════════════════════════════════════
NOTICE:
═══════════════════════════════════════════════════════════════════════════

Copies being sent to:
□ Consumer Financial Protection Bureau
□ Federal Trade Commission
□ [STATE] Attorney General

I am consulting an attorney regarding legal action.

Sincerely,

______________________________
[YOUR PRINTED NAME]`,


  "third_party_disclosure": () => `${formatDate()}

[YOUR FULL LEGAL NAME]
[YOUR STREET ADDRESS]
[CITY, STATE ZIP CODE]

VIA CERTIFIED MAIL - RETURN RECEIPT REQUESTED

[COLLECTION AGENCY NAME]
[ADDRESS]

Re: VIOLATION OF FDCPA §805 - ILLEGAL THIRD PARTY DISCLOSURE
    Your Reference: [NUMBER]

To Whom It May Concern:

On [DATE], your company ILLEGALLY communicated about an alleged debt to a third party in violation of FDCPA §805(b).

═══════════════════════════════════════════════════════════════════════════
DETAILS OF VIOLATION:
═══════════════════════════════════════════════════════════════════════════

Date: [DATE]
Third Party Contacted: [RELATIONSHIP - neighbor, mother, employer, etc.]
Method: [PHONE/LETTER/IN PERSON]
What Was Disclosed: [DESCRIBE]

═══════════════════════════════════════════════════════════════════════════
LAW VIOLATED:
═══════════════════════════════════════════════════════════════════════════

Under FDCPA §805(b), you may ONLY contact third parties to obtain location information. You:
1. May NOT state I owe a debt
2. May NOT communicate more than once
3. May NOT use collection-indicating language on envelopes

Your communication violated these restrictions.

═══════════════════════════════════════════════════════════════════════════
DAMAGES:
═══════════════════════════════════════════════════════════════════════════

[DESCRIBE HARM - embarrassment, reputation damage, employment interference, distress]

Under 15 U.S.C. § 1692k, I may be entitled to statutory damages up to $1,000 plus actual damages and attorney's fees.

Sincerely,

______________________________
[YOUR PRINTED NAME]

CC: CFPB, FTC`,


  "workplace_contact_cease": () => `${formatDate()}

[YOUR FULL LEGAL NAME]
[YOUR STREET ADDRESS]
[CITY, STATE ZIP CODE]

VIA CERTIFIED MAIL - RETURN RECEIPT REQUESTED

[COLLECTION AGENCY NAME]
[ADDRESS]

Re: CEASE WORKPLACE COMMUNICATION - FDCPA §805(a)(3)
    Your Reference: [NUMBER]

To Whom It May Concern:

Pursuant to FDCPA §805(a)(3), my employer DOES NOT ALLOW me to receive debt collection communications at work.

═══════════════════════════════════════════════════════════════════════════
EFFECTIVE IMMEDIATELY, STOP:
═══════════════════════════════════════════════════════════════════════════

• Phone calls to my work number
• Voicemails at work
• Emails to work email
• Letters to work address
• Contact with employer or coworkers

═══════════════════════════════════════════════════════════════════════════
LEGAL BASIS:
═══════════════════════════════════════════════════════════════════════════

Under FDCPA §805(a)(3), after receiving this notice, you may NOT communicate with me at my place of employment.

═══════════════════════════════════════════════════════════════════════════
ALTERNATIVE CONTACT:
═══════════════════════════════════════════════════════════════════════════

You may contact me ONLY in writing at:
[YOUR HOME ADDRESS]

Any workplace contact after receipt is a WILLFUL violation of federal law.

Sincerely,

______________________________
[YOUR PRINTED NAME]`,


  "goodwill_adjustment": () => `${formatDate()}

[YOUR FULL LEGAL NAME]
[YOUR STREET ADDRESS]
[CITY, STATE ZIP CODE]
[YOUR PHONE NUMBER]

[CREDITOR NAME]
Customer Service / Credit Bureau Disputes
[ADDRESS]

Re: GOODWILL ADJUSTMENT REQUEST
    Account: [NUMBER]

Dear Sir or Madam:

I am respectfully requesting a goodwill adjustment to my account history with your company.

═══════════════════════════════════════════════════════════════════════════
ACCOUNT INFORMATION:
═══════════════════════════════════════════════════════════════════════════

Account: [NUMBER]
Type: [CREDIT CARD/LOAN/ETC.]
Status: [CURRENT/PAID IN FULL]
Customer Since: [YEAR]

═══════════════════════════════════════════════════════════════════════════
REQUEST:
═══════════════════════════════════════════════════════════════════════════

I am requesting removal of the following as a gesture of goodwill:

[MONTH/YEAR] - [30/60/90] day late payment

═══════════════════════════════════════════════════════════════════════════
EXPLANATION:
═══════════════════════════════════════════════════════════════════════════

[BRIEFLY EXPLAIN - medical emergency, job loss, family emergency, etc. Be honest and take responsibility.]

═══════════════════════════════════════════════════════════════════════════
WHY I'M A GOOD CUSTOMER:
═══════════════════════════════════════════════════════════════════════════

• Customer since [YEAR]
• Except for this incident, always paid on time
• Account currently [CURRENT/PAID IN FULL]
• Value my relationship with [CREDITOR]

This negative mark is significantly impacting my credit and affecting my ability to [mortgage, refinance, rent, etc.].

Thank you for your consideration.

Sincerely,

______________________________
[YOUR PRINTED NAME]`,


  "settlement_offer": () => `${formatDate()}

[YOUR FULL LEGAL NAME]
[YOUR STREET ADDRESS]
[CITY, STATE ZIP CODE]

[CREDITOR/COLLECTION AGENCY]
[ADDRESS]

Re: SETTLEMENT OFFER
    Account: [NUMBER]
    Current Balance: $[AMOUNT]

To Whom It May Concern:

I am proposing a settlement of the above account.

═══════════════════════════════════════════════════════════════════════════
OFFER:
═══════════════════════════════════════════════════════════════════════════

I will pay: $[YOUR OFFER - typically 25-50% of balance]

This represents [X]% of the claimed balance.

═══════════════════════════════════════════════════════════════════════════
TERMS:
═══════════════════════════════════════════════════════════════════════════

1. Accepted as FULL AND FINAL SETTLEMENT
2. No further balance claimed or collected
3. Written confirmation BEFORE payment
4. Credit bureau update to "Paid in Full" or "Settled"
5. No sale/transfer of any alleged remaining balance
6. Payment via [CERTIFIED CHECK/MONEY ORDER]

═══════════════════════════════════════════════════════════════════════════
PROCEDURE:
═══════════════════════════════════════════════════════════════════════════

If agreed:
1. Send written acceptance with all terms
2. I will remit payment within 10 business days
3. Provide zero-balance letter upon receipt

Offer expires 30 days from this letter.

Sincerely,

______________________________
[YOUR PRINTED NAME]`,


  "chex_dispute": () => `${formatDate()}

[YOUR FULL LEGAL NAME]
[YOUR STREET ADDRESS]
[CITY, STATE ZIP CODE]
[YOUR PHONE NUMBER]
[YOUR DATE OF BIRTH]

VIA CERTIFIED MAIL - RETURN RECEIPT REQUESTED

ChexSystems, Inc.
Attn: Consumer Relations
7805 Hudson Road, Suite 100
Woodbury, MN 55125

Re: DISPUTE OF INACCURATE INFORMATION
    SSN: XXX-XX-[LAST 4]

To Whom It May Concern:

Pursuant to the FCRA, I am disputing the following information in my ChexSystems file:

═══════════════════════════════════════════════════════════════════════════
DISPUTED ITEM:
═══════════════════════════════════════════════════════════════════════════

Bank: [BANK NAME]
Account Type: [CHECKING/SAVINGS]
Date Reported: [DATE]
Amount: $[IF APPLICABLE]
Reason Reported: [UNPAID BALANCE/FRAUD/ABUSE]

═══════════════════════════════════════════════════════════════════════════
REASON FOR DISPUTE:
═══════════════════════════════════════════════════════════════════════════

□ Not my account - never had account with this institution
□ Account opened fraudulently (identity theft)
□ Closed in good standing with no balance owed
□ Reported balance is incorrect - actual was $[AMOUNT]
□ Already resolved with bank on [DATE]
□ Debt paid in full
□ Outdated - over 5 years
□ Other: [EXPLAIN]

═══════════════════════════════════════════════════════════════════════════
ENCLOSED:
═══════════════════════════════════════════════════════════════════════════

□ Government-issued photo ID
□ [SUPPORTING DOCUMENTS]

Please investigate within 30 days and delete unverifiable information.

Sincerely,

______________________________
[YOUR PRINTED NAME]`,


  "ews_dispute": () => `${formatDate()}

[YOUR FULL LEGAL NAME]
[YOUR STREET ADDRESS]
[CITY, STATE ZIP CODE]
[YOUR PHONE NUMBER]
[YOUR DATE OF BIRTH]

VIA CERTIFIED MAIL - RETURN RECEIPT REQUESTED

Early Warning Services, LLC
Consumer Services
16552 N 90th Street
Scottsdale, AZ 85260

Re: DISPUTE OF INACCURATE INFORMATION
    SSN: XXX-XX-[LAST 4]

To Whom It May Concern:

Pursuant to the FCRA, I am disputing the following information in my EWS report:

═══════════════════════════════════════════════════════════════════════════
DISPUTED INFORMATION:
═══════════════════════════════════════════════════════════════════════════

Reporting Institution: [BANK NAME]
Type of Entry: [ACCOUNT CLOSURE/NEGATIVE BALANCE/FRAUD]
Date Reported: [DATE]
Details: [DESCRIBE]

═══════════════════════════════════════════════════════════════════════════
REASON FOR DISPUTE:
═══════════════════════════════════════════════════════════════════════════

[EXPLAIN WHY INACCURATE]

═══════════════════════════════════════════════════════════════════════════
ENCLOSED:
═══════════════════════════════════════════════════════════════════════════

□ Government-issued photo ID
□ [SUPPORTING DOCUMENTS]

Please investigate within 30 days as required by FCRA.

Sincerely,

______________________________
[YOUR PRINTED NAME]`,


  "lexis_dispute": () => `${formatDate()}

[YOUR FULL LEGAL NAME]
[YOUR STREET ADDRESS]
[CITY, STATE ZIP CODE]
[YOUR PHONE NUMBER]

VIA CERTIFIED MAIL - RETURN RECEIPT REQUESTED

LexisNexis Consumer Center
P.O. Box 105108
Atlanta, GA 30348-5108

Re: DISPUTE OF INACCURATE INFORMATION
    SSN: XXX-XX-[LAST 4]

To Whom It May Concern:

Pursuant to the FCRA, I am disputing the following information in my LexisNexis file:

═══════════════════════════════════════════════════════════════════════════
DISPUTED INFORMATION:
═══════════════════════════════════════════════════════════════════════════

Type: [ADDRESS/EMPLOYMENT/PUBLIC RECORD/NAME VARIATION]
Specific Entry: [DESCRIBE]
Reason: [EXPLAIN WHY INACCURATE]

═══════════════════════════════════════════════════════════════════════════
CORRECT INFORMATION:
═══════════════════════════════════════════════════════════════════════════

[PROVIDE CORRECT INFORMATION]

═══════════════════════════════════════════════════════════════════════════
ENCLOSED:
═══════════════════════════════════════════════════════════════════════════

□ Government-issued photo ID
□ Proof of SSN
□ [SUPPORTING DOCUMENTS]

Please investigate and correct within 30 days.

Sincerely,

______________________________
[YOUR PRINTED NAME]`,


  "innovis_dispute": () => `${formatDate()}

[YOUR FULL LEGAL NAME]
[YOUR STREET ADDRESS]
[CITY, STATE ZIP CODE]
[YOUR PHONE NUMBER]

VIA CERTIFIED MAIL - RETURN RECEIPT REQUESTED

Innovis Consumer Assistance
P.O. Box 1534
Columbus, OH 43216-1534

Re: DISPUTE OF INACCURATE INFORMATION
    SSN: XXX-XX-[LAST 4]

To Whom It May Concern:

Pursuant to the FCRA, I am disputing information on my Innovis credit report:

═══════════════════════════════════════════════════════════════════════════
DISPUTED ITEM:
═══════════════════════════════════════════════════════════════════════════

Creditor: [NAME]
Account: [NUMBER]
Disputed Information: [DESCRIBE]
Correct Information: [WHAT IT SHOULD BE]

═══════════════════════════════════════════════════════════════════════════
ENCLOSED:
═══════════════════════════════════════════════════════════════════════════

□ Government-issued photo ID
□ Credit report with disputed item highlighted
□ [SUPPORTING DOCUMENTS]

Please investigate within 30 days.

Sincerely,

______________________________
[YOUR PRINTED NAME]`,


  "nctue_dispute": () => `${formatDate()}

[YOUR FULL LEGAL NAME]
[YOUR STREET ADDRESS]
[CITY, STATE ZIP CODE]
[YOUR PHONE NUMBER]

VIA CERTIFIED MAIL - RETURN RECEIPT REQUESTED

NCTUE (National Consumer Telecom & Utilities Exchange)
P.O. Box 105161
Atlanta, GA 30348

Re: DISPUTE OF UTILITY REPORTING INFORMATION
    SSN: XXX-XX-[LAST 4]

To Whom It May Concern:

Pursuant to the FCRA, I am disputing the following utility information:

═══════════════════════════════════════════════════════════════════════════
DISPUTED ITEM:
═══════════════════════════════════════════════════════════════════════════

Utility Company: [NAME]
Type: [ELECTRIC/GAS/PHONE/CABLE/WATER]
Account: [NUMBER]
Amount: $[AMOUNT]
Date Reported: [DATE]

═══════════════════════════════════════════════════════════════════════════
REASON FOR DISPUTE:
═══════════════════════════════════════════════════════════════════════════

□ Not my account
□ Paid in full on [DATE]
□ Balance incorrect
□ Resolved with utility
□ Identity theft
□ Other: [EXPLAIN]

═══════════════════════════════════════════════════════════════════════════
ENCLOSED:
═══════════════════════════════════════════════════════════════════════════

□ Government-issued ID
□ [SUPPORTING DOCUMENTS]

Please investigate within 30 days.

Sincerely,

______________________________
[YOUR PRINTED NAME]`,


  "telecheck_dispute": () => `${formatDate()}

[YOUR FULL LEGAL NAME]
[YOUR STREET ADDRESS]
[CITY, STATE ZIP CODE]
[YOUR PHONE NUMBER]

VIA CERTIFIED MAIL - RETURN RECEIPT REQUESTED

TeleCheck Services, Inc.
Attention: Consumer Resolutions
P.O. Box 4514
Houston, TX 77210-4514

Re: DISPUTE OF CHECK WRITING HISTORY
    SSN: XXX-XX-[LAST 4]

To Whom It May Concern:

Pursuant to the FCRA, I am disputing information in my TeleCheck file:

═══════════════════════════════════════════════════════════════════════════
DISPUTED ITEM:
═══════════════════════════════════════════════════════════════════════════

Merchant: [NAME]
Check Number: [IF KNOWN]
Date: [DATE]
Amount: $[AMOUNT]
Reason: [UNPAID CHECK/FRAUD]

═══════════════════════════════════════════════════════════════════════════
REASON FOR DISPUTE:
═══════════════════════════════════════════════════════════════════════════

[EXPLAIN]

═══════════════════════════════════════════════════════════════════════════
ENCLOSED:
═══════════════════════════════════════════════════════════════════════════

□ Government-issued ID
□ Cleared check copy (if applicable)
□ Bank statement showing payment
□ [OTHER]

Please investigate and correct within 30 days.

Sincerely,

______________________________
[YOUR PRINTED NAME]`,


  "clue_dispute": () => `${formatDate()}

[YOUR FULL LEGAL NAME]
[YOUR STREET ADDRESS]
[CITY, STATE ZIP CODE]
[YOUR PHONE NUMBER]

VIA CERTIFIED MAIL - RETURN RECEIPT REQUESTED

LexisNexis C.L.U.E.
Consumer Center
P.O. Box 105108
Atlanta, GA 30348

Re: DISPUTE OF INSURANCE CLAIM HISTORY
    SSN: XXX-XX-[LAST 4]

To Whom It May Concern:

Pursuant to the FCRA, I am disputing information in my C.L.U.E. report:

═══════════════════════════════════════════════════════════════════════════
DISPUTED CLAIM:
═══════════════════════════════════════════════════════════════════════════

Insurance Company: [NAME]
Policy: [NUMBER]
Claim Date: [DATE]
Type: [AUTO/HOME]
Amount: $[IF KNOWN]

═══════════════════════════════════════════════════════════════════════════
REASON FOR DISPUTE:
═══════════════════════════════════════════════════════════════════════════

□ Never filed this claim
□ Claim for vehicle/property I never owned
□ Amount incorrect
□ Type incorrectly categorized
□ Duplicate entry
□ Other: [EXPLAIN]

═══════════════════════════════════════════════════════════════════════════
ENCLOSED:
═══════════════════════════════════════════════════════════════════════════

□ Government-issued ID
□ C.L.U.E. report with disputed item highlighted
□ [SUPPORTING DOCUMENTS]

Please investigate within 30 days.

Sincerely,

______________________________
[YOUR PRINTED NAME]`,


  "corelogic_dispute": () => `${formatDate()}

[YOUR FULL LEGAL NAME]
[YOUR STREET ADDRESS]
[CITY, STATE ZIP CODE]
[YOUR PHONE NUMBER]

VIA CERTIFIED MAIL - RETURN RECEIPT REQUESTED

CoreLogic Rental Property Solutions
Attn: Consumer Disputes
P.O. Box 509124
San Diego, CA 92150

Re: DISPUTE OF RENTAL HISTORY INFORMATION
    SSN: XXX-XX-[LAST 4]

To Whom It May Concern:

Pursuant to the FCRA, I am disputing information in my rental history report:

═══════════════════════════════════════════════════════════════════════════
DISPUTED ITEM:
═══════════════════════════════════════════════════════════════════════════

Property: [ADDRESS]
Landlord/Management: [NAME]
Dates Reported: [DATES]
Reason for Negative Report: [EVICTION/UNPAID RENT/DAMAGE]
Amount: $[IF APPLICABLE]

═══════════════════════════════════════════════════════════════════════════
REASON FOR DISPUTE:
═══════════════════════════════════════════════════════════════════════════

□ Never lived at this address
□ Never evicted
□ Eviction dismissed/vacated by court
□ All rent paid (documentation enclosed)
□ Amount incorrect
□ Identity theft
□ Other: [EXPLAIN]

═══════════════════════════════════════════════════════════════════════════
ENCLOSED:
═══════════════════════════════════════════════════════════════════════════

□ Government-issued ID
□ Lease agreement (if applicable)
□ Rent payment receipts
□ Court documents showing dismissal
□ [OTHER]

Please investigate within 30 days.

Sincerely,

______________________________
[YOUR PRINTED NAME]`,


  "medical_debt_dispute": () => `${formatDate()}

[YOUR FULL LEGAL NAME]
[YOUR STREET ADDRESS]
[CITY, STATE ZIP CODE]
[YOUR PHONE NUMBER]

VIA CERTIFIED MAIL - RETURN RECEIPT REQUESTED

[CREDIT BUREAU OR COLLECTION AGENCY]
[ADDRESS]

Re: DISPUTE OF MEDICAL DEBT - SPECIAL PROTECTIONS APPLY
    SSN: XXX-XX-[LAST 4]
    Account/Reference: [NUMBER]

To Whom It May Concern:

I am disputing the following MEDICAL DEBT. Special protections apply under FCRA and CFPB rules.

═══════════════════════════════════════════════════════════════════════════
DISPUTED MEDICAL DEBT:
═══════════════════════════════════════════════════════════════════════════

Collection Agency: [IF APPLICABLE]
Original Provider: [HOSPITAL/DOCTOR/CLINIC]
Amount: $[AMOUNT]
Date of Service: [DATE]
Date First Reported: [DATE]

═══════════════════════════════════════════════════════════════════════════
REASON FOR DISPUTE:
═══════════════════════════════════════════════════════════════════════════

□ Should be paid by insurance
   Insurance: [NAME]
   Claim: [NUMBER]

□ Reported before required 365-day waiting period

□ Paid in full on [DATE]

□ Enrolled in payment plan (started [DATE])

□ Disputing charges directly with provider

□ Billing error (incorrect amount)

□ Services never provided

□ Not the patient (identity theft/mixed file)

□ Below $500 threshold for reporting

═══════════════════════════════════════════════════════════════════════════
MEDICAL DEBT PROTECTIONS:
═══════════════════════════════════════════════════════════════════════════

• 365-day waiting period before reporting
• Paid medical collections must be removed
• Debts under $500 cannot be reported (CFPB rule)
• Insurance-covered debts must be removed when paid

═══════════════════════════════════════════════════════════════════════════
ENCLOSED:
═══════════════════════════════════════════════════════════════════════════

□ Explanation of Benefits (EOB)
□ Proof of payment
□ Payment plan agreement
□ [OTHER]

Please investigate within 30 days.

Sincerely,

______________________________
[YOUR PRINTED NAME]`,


  "sagestream_dispute": () => `${formatDate()}

[YOUR FULL LEGAL NAME]
[YOUR STREET ADDRESS]
[CITY, STATE ZIP CODE]
[YOUR PHONE NUMBER]

VIA CERTIFIED MAIL - RETURN RECEIPT REQUESTED

SageStream LLC
Consumer Assistance
P.O. Box 503793
San Diego, CA 92150

Re: DISPUTE OF CONSUMER FILE INFORMATION
    SSN: XXX-XX-[LAST 4]

To Whom It May Concern:

Pursuant to the FCRA, I am disputing information in my SageStream file:

═══════════════════════════════════════════════════════════════════════════
DISPUTED INFORMATION:
═══════════════════════════════════════════════════════════════════════════

[DESCRIBE]

═══════════════════════════════════════════════════════════════════════════
REASON FOR DISPUTE:
═══════════════════════════════════════════════════════════════════════════

[EXPLAIN]

═══════════════════════════════════════════════════════════════════════════
ENCLOSED:
═══════════════════════════════════════════════════════════════════════════

□ Government-issued ID
□ Proof of SSN
□ [SUPPORTING DOCUMENTS]

Please investigate within 30 days.

Sincerely,

______________________________
[YOUR PRINTED NAME]`,


  "reg_e_dispute": () => `${formatDate()}

[YOUR FULL LEGAL NAME]
[YOUR STREET ADDRESS]
[CITY, STATE ZIP CODE]
[YOUR PHONE NUMBER]
[YOUR ACCOUNT NUMBER]

VIA CERTIFIED MAIL - RETURN RECEIPT REQUESTED

[BANK NAME]
Fraud/Disputes Department
[ADDRESS]

Re: DISPUTE OF UNAUTHORIZED ELECTRONIC FUND TRANSFER - REGULATION E
    Account: [NUMBER]
    Transaction Date(s): [DATE(S)]
    Total Disputed: $[AMOUNT]

To Whom It May Concern:

Pursuant to the Electronic Fund Transfer Act (15 U.S.C. § 1693) and Regulation E (12 CFR Part 1005), I am disputing unauthorized electronic fund transfers:

═══════════════════════════════════════════════════════════════════════════
UNAUTHORIZED TRANSACTIONS:
═══════════════════════════════════════════════════════════════════════════

Transaction #1:
    Date: [DATE]
    Amount: $[AMOUNT]
    Merchant/Recipient: [IF KNOWN]
    Type: [DEBIT CARD/ACH/WIRE/P2P/ATM]

[ADD MORE AS NEEDED]

TOTAL: $[TOTAL]

═══════════════════════════════════════════════════════════════════════════
DETAILS:
═══════════════════════════════════════════════════════════════════════════

□ I did NOT authorize these transactions
□ I did NOT provide my card/PIN/account info to anyone
□ My debit card is: □ In my possession  □ Lost  □ Stolen
□ Date discovered: [DATE]

═══════════════════════════════════════════════════════════════════════════
YOUR LEGAL OBLIGATIONS - REGULATION E:
═══════════════════════════════════════════════════════════════════════════

Under 12 CFR § 1005.11:
1. PROVISIONAL CREDIT within 10 business days if investigation isn't complete
2. INVESTIGATION DEADLINE: 10 business days (20 for new accounts), extended to 45 days if provisional credit given
3. NOTIFICATION within 3 business days of completing investigation

═══════════════════════════════════════════════════════════════════════════
MY LIABILITY LIMITS:
═══════════════════════════════════════════════════════════════════════════

• $0 if card not lost/stolen and I didn't give access
• $50 if I report within 2 business days
• $500 if I report within 60 days

═══════════════════════════════════════════════════════════════════════════
REQUEST:
═══════════════════════════════════════════════════════════════════════════

1. Investigate immediately
2. Provide provisional credit within 10 business days if needed
3. Restore all funds if fraud confirmed
4. Waive overdraft/related fees
5. Provide written notification of results

═══════════════════════════════════════════════════════════════════════════
ENCLOSED:
═══════════════════════════════════════════════════════════════════════════

□ Bank statement highlighting disputed transactions
□ Government-issued ID
□ Police report (if filed)
□ FTC Identity Theft Report (if applicable)

Sincerely,

______________________________
[YOUR PRINTED NAME]`,


  "reg_z_dispute": () => `${formatDate()}

[YOUR FULL LEGAL NAME]
[YOUR STREET ADDRESS]
[CITY, STATE ZIP CODE]
[YOUR PHONE NUMBER]
[YOUR ACCOUNT NUMBER]

VIA CERTIFIED MAIL - RETURN RECEIPT REQUESTED

[CREDIT CARD ISSUER NAME]
Billing Disputes / Fraud Department
[ADDRESS]

Re: DISPUTE OF UNAUTHORIZED CREDIT CARD CHARGES - REGULATION Z / FCBA
    Account: [NUMBER]
    Statement Date: [DATE]
    Total Disputed: $[AMOUNT]

To Whom It May Concern:

Pursuant to the Truth in Lending Act, Fair Credit Billing Act, and Regulation Z, I am disputing unauthorized charges:

═══════════════════════════════════════════════════════════════════════════
UNAUTHORIZED CHARGES:
═══════════════════════════════════════════════════════════════════════════

Charge #1:
    Date: [DATE]
    Amount: $[AMOUNT]
    Merchant: [NAME]

[ADD MORE AS NEEDED]

TOTAL: $[TOTAL]

═══════════════════════════════════════════════════════════════════════════
DETAILS:
═══════════════════════════════════════════════════════════════════════════

□ I did NOT authorize these charges
□ I did NOT give my card to anyone
□ I did NOT provide my card number to this merchant
□ My card is: □ In my possession  □ Lost  □ Stolen
□ Date discovered: [DATE]

═══════════════════════════════════════════════════════════════════════════
YOUR LEGAL OBLIGATIONS:
═══════════════════════════════════════════════════════════════════════════

1. Acknowledge receipt within 30 days
2. Investigate and resolve within 90 days (two billing cycles)
3. Do NOT report as delinquent during investigation
4. Do NOT close/restrict my account solely due to this dispute
5. My maximum liability for unauthorized charges is $50

═══════════════════════════════════════════════════════════════════════════
REQUEST:
═══════════════════════════════════════════════════════════════════════════

1. Remove unauthorized charges
2. Issue new card with new number
3. Do not report as delinquent
4. Waive interest/fees on these charges
5. Provide written confirmation

═══════════════════════════════════════════════════════════════════════════
ENCLOSED:
═══════════════════════════════════════════════════════════════════════════

□ Statement highlighting disputed charges
□ Government-issued ID

Sincerely,

______________________________
[YOUR PRINTED NAME]`,


  "billing_error_notice": () => `${formatDate()}

[YOUR FULL LEGAL NAME]
[YOUR STREET ADDRESS]
[CITY, STATE ZIP CODE]
[YOUR PHONE NUMBER]
[YOUR ACCOUNT NUMBER]

VIA CERTIFIED MAIL - RETURN RECEIPT REQUESTED

[CREDITOR NAME]
Billing Inquiries Department
[ADDRESS]

Re: NOTICE OF BILLING ERROR - FAIR CREDIT BILLING ACT
    Account: [NUMBER]
    Statement Date: [DATE]
    Disputed Amount: $[AMOUNT]

To Whom It May Concern:

Pursuant to the Fair Credit Billing Act (15 U.S.C. § 1666), I am providing notice of a billing error:

═══════════════════════════════════════════════════════════════════════════
BILLING ERROR TYPE:
═══════════════════════════════════════════════════════════════════════════

□ Charge for property/services not delivered as agreed
□ Charge for property/services not accepted or returned
    Date Returned: [DATE]
    Return Tracking: [NUMBER]
□ Computation/mathematical error
    Correct Amount: $[AMOUNT]
□ Charge for which I request documentation
□ Duplicate charge
    Original: [DATE]
    Duplicate: [DATE]
□ Other: [DESCRIBE]

═══════════════════════════════════════════════════════════════════════════
TRANSACTION:
═══════════════════════════════════════════════════════════════════════════

Merchant: [NAME]
Date: [DATE]
Amount Charged: $[AMOUNT]
Amount Disputed: $[AMOUNT]

═══════════════════════════════════════════════════════════════════════════
YOUR OBLIGATIONS:
═══════════════════════════════════════════════════════════════════════════

You must:
1. Acknowledge within 30 days
2. Resolve within 2 billing cycles (max 90 days)
3. Not report as delinquent during dispute
4. Not take adverse action due to this dispute

═══════════════════════════════════════════════════════════════════════════
ENCLOSED:
═══════════════════════════════════════════════════════════════════════════

□ Statement with disputed charge highlighted
□ [RECEIPTS, CONTRACTS, MERCHANT CORRESPONDENCE]

Sincerely,

______________________________
[YOUR PRINTED NAME]`,


  "provisional_credit_demand": () => `${formatDate()}

[YOUR FULL LEGAL NAME]
[YOUR STREET ADDRESS]
[CITY, STATE ZIP CODE]
[YOUR PHONE NUMBER]

VIA CERTIFIED MAIL - RETURN RECEIPT REQUESTED

[BANK NAME]
[DISPUTES DEPARTMENT]
[ADDRESS]

Re: DEMAND FOR PROVISIONAL CREDIT - REGULATION E VIOLATION
    Account: [NUMBER]
    Original Dispute Date: [DATE]
    Dispute Amount: $[AMOUNT]

To Whom It May Concern:

On [DATE], I submitted a dispute totaling $[AMOUNT]. It has been MORE THAN 10 BUSINESS DAYS and you have FAILED to:
□ Complete your investigation, OR
□ Provide provisional credit

═══════════════════════════════════════════════════════════════════════════
LEGAL REQUIREMENT:
═══════════════════════════════════════════════════════════════════════════

Under Regulation E, 12 CFR § 1005.11(c)(2):

If you cannot complete investigation within 10 business days, you may take up to 45 days PROVIDED you provisionally credit my account within 10 business days.

You have FAILED to comply.

═══════════════════════════════════════════════════════════════════════════
DEMAND:
═══════════════════════════════════════════════════════════════════════════

IMMEDIATELY:
1. Credit my account for $[AMOUNT]
2. Waive all overdraft fees, interest, and penalties
3. Provide written confirmation

═══════════════════════════════════════════════════════════════════════════
NOTICE:
═══════════════════════════════════════════════════════════════════════════

If provisional credit is not provided within 5 business days, I will:
1. File CFPB complaint
2. File complaint with [STATE] banking regulator
3. Consult attorney regarding legal action

Under EFTA, I may be entitled to actual damages, statutory damages up to $1,000, and attorney's fees.

Sincerely,

______________________________
[YOUR PRINTED NAME]`,


  "fraud_claim_appeal": () => `${formatDate()}

[YOUR FULL LEGAL NAME]
[YOUR STREET ADDRESS]
[CITY, STATE ZIP CODE]
[YOUR PHONE NUMBER]

VIA CERTIFIED MAIL - RETURN RECEIPT REQUESTED

[BANK/CREDIT CARD ISSUER]
[DISPUTES DEPARTMENT / EXECUTIVE OFFICE]
[ADDRESS]

Re: APPEAL OF FRAUD CLAIM DENIAL
    Account: [NUMBER]
    Original Claim Date: [DATE]
    Reference: [NUMBER]
    Denied Amount: $[AMOUNT]

To Whom It May Concern:

I am formally APPEALING your denial dated [DATE]. Your investigation was INADEQUATE and your denial is NOT supported by facts.

═══════════════════════════════════════════════════════════════════════════
ORIGINAL CLAIM:
═══════════════════════════════════════════════════════════════════════════

Transaction Date(s): [DATE(S)]
Amount: $[AMOUNT]
Merchant/Recipient: [NAME]
Type: [DEBIT/CREDIT/ACH/WIRE]

═══════════════════════════════════════════════════════════════════════════
REASONS FOR APPEAL:
═══════════════════════════════════════════════════════════════════════════

Your denial stated: [SUMMARIZE THEIR REASON]

This is INCORRECT because:
[EXPLAIN IN DETAIL WITH FACTS, TIMELINE, EVIDENCE]

═══════════════════════════════════════════════════════════════════════════
NEW/ADDITIONAL EVIDENCE:
═══════════════════════════════════════════════════════════════════════════

[DESCRIBE EVIDENCE - police report, affidavit, documentation of whereabouts]

═══════════════════════════════════════════════════════════════════════════
REQUEST:
═══════════════════════════════════════════════════════════════════════════

1. Reopen and reinvestigate
2. Review new evidence
3. Reverse denial and credit $[AMOUNT]
4. Provide detailed written explanation if still denied

═══════════════════════════════════════════════════════════════════════════
NOTICE:
═══════════════════════════════════════════════════════════════════════════

If appeal denied, I reserve the right to:
• File CFPB complaint
• File complaint with [STATE] banking regulator
• Pursue legal remedies

Sincerely,

______________________________
[YOUR PRINTED NAME]

Enclosures:
□ Original denial letter
□ [NEW EVIDENCE]`,


  "account_closure_fraud": () => `${formatDate()}

[YOUR FULL LEGAL NAME]
[YOUR STREET ADDRESS]
[CITY, STATE ZIP CODE]
[YOUR PHONE NUMBER]

[BANK NAME]
Customer Service / Security Department
[ADDRESS]

Re: REQUEST TO CLOSE COMPROMISED ACCOUNT
    Account: [NUMBER]
    Type: [CHECKING/SAVINGS/CREDIT CARD]

To Whom It May Concern:

I am requesting IMMEDIATE CLOSURE of the above account due to fraud/security compromise.

═══════════════════════════════════════════════════════════════════════════
REASON:
═══════════════════════════════════════════════════════════════════════════

□ Unauthorized transactions occurred
□ Account/card information compromised (breach, skimming, phishing)
□ Identity theft victim
□ Other: [EXPLAIN]

═══════════════════════════════════════════════════════════════════════════
REQUEST:
═══════════════════════════════════════════════════════════════════════════

1. CLOSE this account immediately
2. BLOCK all pending transactions
3. ISSUE new account number (if continuing relationship)
4. MAIL remaining balance via check to above address
5. CONFIRM closure in writing

I have separately submitted/will submit a fraud dispute. This closure does not affect that dispute.

I understand I need to update automatic payments linked to this account.

Please confirm receipt and completion.

Sincerely,

______________________________
[YOUR PRINTED NAME]`,


  "state_ag": () => `${formatDate()}

[YOUR FULL LEGAL NAME]
[YOUR STREET ADDRESS]
[CITY, STATE ZIP CODE]
[YOUR PHONE NUMBER]
[YOUR EMAIL]

Office of the Attorney General
State of [YOUR STATE]
Consumer Protection Division
[ADDRESS]

Re: CONSUMER COMPLAINT
    Against: [COMPANY NAME]
    Address: [COMPANY ADDRESS]

Dear Attorney General:

I am filing a formal complaint against [COMPANY NAME] for violations of consumer protection laws.

═══════════════════════════════════════════════════════════════════════════
COMPLAINANT:
═══════════════════════════════════════════════════════════════════════════

Name: [YOUR NAME]
Address: [YOUR ADDRESS]
Phone: [YOUR PHONE]
Email: [YOUR EMAIL]

═══════════════════════════════════════════════════════════════════════════
COMPANY:
═══════════════════════════════════════════════════════════════════════════

Name: [COMPANY NAME]
Address: [ADDRESS]
Phone: [PHONE]
Website: [WEBSITE]
Account/Reference: [NUMBER]

═══════════════════════════════════════════════════════════════════════════
COMPLAINT:
═══════════════════════════════════════════════════════════════════════════

[DESCRIBE IN DETAIL]

═══════════════════════════════════════════════════════════════════════════
TIMELINE:
═══════════════════════════════════════════════════════════════════════════

[DATE]: [EVENT]
[DATE]: [EVENT]
[ADD MORE]

═══════════════════════════════════════════════════════════════════════════
LAWS VIOLATED:
═══════════════════════════════════════════════════════════════════════════

□ Fair Credit Reporting Act (FCRA)
□ Fair Debt Collection Practices Act (FDCPA)
□ [STATE] Consumer Protection Act
□ Truth in Lending Act / Regulation Z
□ Electronic Fund Transfer Act / Regulation E
□ Other: [SPECIFY]

═══════════════════════════════════════════════════════════════════════════
ATTEMPTS TO RESOLVE:
═══════════════════════════════════════════════════════════════════════════

[DATE]: [ACTION TAKEN]
[DATE]: [COMPANY RESPONSE]
[ADD MORE]

═══════════════════════════════════════════════════════════════════════════
RELIEF SOUGHT:
═══════════════════════════════════════════════════════════════════════════

1. Investigation of [COMPANY NAME]
2. [SPECIFIC REMEDY]
3. Enforcement action

═══════════════════════════════════════════════════════════════════════════
ENCLOSED:
═══════════════════════════════════════════════════════════════════════════

□ All correspondence with company
□ Credit reports showing violations
□ [OTHER EVIDENCE]

Sincerely,

______________________________
[YOUR PRINTED NAME]`,


  "intent_to_sue": () => `${formatDate()}

[YOUR FULL LEGAL NAME]
[YOUR STREET ADDRESS]
[CITY, STATE ZIP CODE]
[YOUR PHONE NUMBER]

VIA CERTIFIED MAIL - RETURN RECEIPT REQUESTED

[COMPANY NAME]
[LEGAL DEPARTMENT / REGISTERED AGENT]
[ADDRESS]

Re: NOTICE OF INTENT TO SUE - FINAL DEMAND
    Account/Reference: [IF APPLICABLE]
    Violations: [FCRA / FDCPA / OTHER]

════════════════════════════════════════════════════════════════════════════
NOTICE: THIS IS A FORMAL NOTICE OF INTENT TO PURSUE LEGAL ACTION.
PLEASE FORWARD TO YOUR LEGAL DEPARTMENT IMMEDIATELY.
════════════════════════════════════════════════════════════════════════════

To Whom It May Concern:

This letter serves as formal notice of my intent to file a civil lawsuit against [COMPANY NAME].

═══════════════════════════════════════════════════════════════════════════
VIOLATIONS:
═══════════════════════════════════════════════════════════════════════════

[COMPANY NAME] has violated:

□ Fair Credit Reporting Act (15 U.S.C. § 1681 et seq.)
   Specific: [DESCRIBE - §605B failure, §611 failure, etc.]

□ Fair Debt Collection Practices Act (15 U.S.C. § 1692 et seq.)
   Specific: [DESCRIBE - §806 harassment, §807 false representations]

□ [STATE] Consumer Protection Act
   Specific: [DESCRIBE]

□ Other: [SPECIFY]

═══════════════════════════════════════════════════════════════════════════
FACTUAL BASIS:
═══════════════════════════════════════════════════════════════════════════

[BRIEF SUMMARY]

═══════════════════════════════════════════════════════════════════════════
DAMAGES SOUGHT:
═══════════════════════════════════════════════════════════════════════════

1. ACTUAL DAMAGES: $[AMOUNT] or to be proven at trial
   [DESCRIBE - credit denial, distress, lost opportunity]

2. STATUTORY DAMAGES:
   • FCRA: $100-$1,000 per violation (15 U.S.C. § 1681n)
   • FDCPA: Up to $1,000 (15 U.S.C. § 1692k)
   • [STATE LAW DAMAGES]

3. PUNITIVE DAMAGES for willful violations

4. ATTORNEY'S FEES AND COSTS

═══════════════════════════════════════════════════════════════════════════
DEMAND:
═══════════════════════════════════════════════════════════════════════════

Within FIFTEEN (15) DAYS:

1. [DEMAND #1 - e.g., Delete inaccurate information]
2. [DEMAND #2 - e.g., Cease collection]
3. [DEMAND #3]
4. Provide written confirmation

═══════════════════════════════════════════════════════════════════════════
DEADLINE:
═══════════════════════════════════════════════════════════════════════════

If not resolved within 15 days, I will file a complaint in [COURT NAME] without further notice.

═══════════════════════════════════════════════════════════════════════════
PRESERVATION OF EVIDENCE:
═══════════════════════════════════════════════════════════════════════════

You are notified to PRESERVE all documents, communications, and records related to my account and this dispute. Destruction of evidence may result in adverse inference and sanctions.

Govern yourselves accordingly.

______________________________
[YOUR PRINTED NAME]

CC: [YOUR ATTORNEY, IF APPLICABLE]`,


  "occ_complaint": () => `${formatDate()}

[YOUR FULL LEGAL NAME]
[YOUR STREET ADDRESS]
[CITY, STATE ZIP CODE]
[YOUR PHONE NUMBER]

Office of the Comptroller of the Currency
Customer Assistance Group
P.O. Box 53570
Houston, TX 77052-3570

Re: COMPLAINT AGAINST NATIONAL BANK
    Bank Name: [BANK NAME]
    Account: [IF APPLICABLE]

To the Customer Assistance Group:

I am filing a complaint against [BANK NAME], a national bank regulated by the OCC.

═══════════════════════════════════════════════════════════════════════════
BANK:
═══════════════════════════════════════════════════════════════════════════

Name: [BANK NAME]
Branch/Location: [IF APPLICABLE]
Account: [NUMBER]

═══════════════════════════════════════════════════════════════════════════
COMPLAINT:
═══════════════════════════════════════════════════════════════════════════

[DESCRIBE IN DETAIL]

═══════════════════════════════════════════════════════════════════════════
LAWS/REGULATIONS VIOLATED:
═══════════════════════════════════════════════════════════════════════════

□ Regulation E
□ Regulation Z
□ Fair Credit Reporting Act
□ UDAAP
□ Other: [SPECIFY]

═══════════════════════════════════════════════════════════════════════════
RESOLUTION SOUGHT:
═══════════════════════════════════════════════════════════════════════════

[WHAT DO YOU WANT]

═══════════════════════════════════════════════════════════════════════════
ENCLOSED:
═══════════════════════════════════════════════════════════════════════════

□ Correspondence with bank
□ Account statements
□ [OTHER EVIDENCE]

Sincerely,

______________________________
[YOUR PRINTED NAME]`,


  "fdic_complaint": () => `${formatDate()}

[YOUR FULL LEGAL NAME]
[YOUR STREET ADDRESS]
[CITY, STATE ZIP CODE]
[YOUR PHONE NUMBER]

FDIC Consumer Response Center
1100 Walnut Street, Box #11
Kansas City, MO 64106

Re: COMPLAINT AGAINST FDIC-INSURED BANK
    Bank Name: [BANK NAME]

To the Consumer Response Center:

I am filing a complaint against [BANK NAME], an FDIC-insured institution.

[FOLLOW SAME FORMAT AS OCC COMPLAINT]

Sincerely,

______________________________
[YOUR PRINTED NAME]`,


  "ncua_complaint": () => `${formatDate()}

[YOUR FULL LEGAL NAME]
[YOUR STREET ADDRESS]
[CITY, STATE ZIP CODE]
[YOUR PHONE NUMBER]

National Credit Union Administration
Office of Consumer Financial Protection
1775 Duke Street
Alexandria, VA 22314-3428

Re: COMPLAINT AGAINST CREDIT UNION
    Credit Union Name: [NAME]

To the Office of Consumer Financial Protection:

I am filing a complaint against [CREDIT UNION NAME], a federally insured credit union.

[FOLLOW SAME FORMAT AS OCC COMPLAINT]

Sincerely,

______________________________
[YOUR PRINTED NAME]`,


  "ftc_complaint": () => `${formatDate()}

[YOUR FULL LEGAL NAME]
[YOUR STREET ADDRESS]
[CITY, STATE ZIP CODE]
[YOUR PHONE NUMBER]

Federal Trade Commission
Consumer Response Center
600 Pennsylvania Avenue, NW
Washington, DC 20580

Re: CONSUMER COMPLAINT
    Against: [COMPANY NAME]
    Type: [FCRA VIOLATION / FDCPA VIOLATION / IDENTITY THEFT]

To the Consumer Response Center:

I am submitting this complaint regarding [COMPANY NAME]'s violation of federal consumer protection laws.

Note: Can also be filed at ftc.gov/complaint or reportfraud.ftc.gov

═══════════════════════════════════════════════════════════════════════════
COMPANY:
═══════════════════════════════════════════════════════════════════════════

Name: [COMPANY NAME]
Address: [ADDRESS]
Phone: [PHONE]
Website: [WEBSITE]

═══════════════════════════════════════════════════════════════════════════
COMPLAINT:
═══════════════════════════════════════════════════════════════════════════

[DESCRIBE IN DETAIL]

═══════════════════════════════════════════════════════════════════════════
LAWS VIOLATED:
═══════════════════════════════════════════════════════════════════════════

[DESCRIBE]

═══════════════════════════════════════════════════════════════════════════
ENCLOSED:
═══════════════════════════════════════════════════════════════════════════

□ Supporting documentation

Sincerely,

______________________________
[YOUR PRINTED NAME]`,


  "small_claims_demand": () => `${formatDate()}

[YOUR FULL LEGAL NAME]
[YOUR STREET ADDRESS]
[CITY, STATE ZIP CODE]
[YOUR PHONE NUMBER]

VIA CERTIFIED MAIL - RETURN RECEIPT REQUESTED

[DEFENDANT COMPANY NAME]
[REGISTERED AGENT OR LEGAL DEPARTMENT]
[ADDRESS]

Re: PRE-SUIT DEMAND / NOTICE OF INTENT TO FILE SMALL CLAIMS ACTION
    Claim Amount: $[AMOUNT]

To Whom It May Concern:

I intend to file a small claims court action against [COMPANY NAME] if not resolved within thirty (30) days.

═══════════════════════════════════════════════════════════════════════════
CLAIM:
═══════════════════════════════════════════════════════════════════════════

Amount: $[AMOUNT]
Basis: [FCRA VIOLATION / FDCPA VIOLATION / BREACH / ETC.]

═══════════════════════════════════════════════════════════════════════════
FACTS:
═══════════════════════════════════════════════════════════════════════════

[DESCRIBE]

═══════════════════════════════════════════════════════════════════════════
DAMAGES:
═══════════════════════════════════════════════════════════════════════════

Statutory: $[AMOUNT]
Actual: $[AMOUNT]
[OTHER]: $[AMOUNT]
TOTAL: $[AMOUNT]

═══════════════════════════════════════════════════════════════════════════
DEMAND:
═══════════════════════════════════════════════════════════════════════════

1. [SPECIFIC ACTION]
2. Pay $[AMOUNT]

═══════════════════════════════════════════════════════════════════════════
DEADLINE:
═══════════════════════════════════════════════════════════════════════════

30 days from receipt. If no satisfactory response, I will file in [COUNTY] Small Claims Court.

Note: [STATE] small claims limit is $[AMOUNT]. I reserve the right to waive excess to proceed in small claims, or file in general jurisdiction court for full amount.

Sincerely,

______________________________
[YOUR PRINTED NAME]`,


  "no_response_followup": () => `${formatDate()}

[YOUR FULL LEGAL NAME]
[YOUR STREET ADDRESS]
[CITY, STATE ZIP CODE]
[YOUR PHONE NUMBER]

VIA CERTIFIED MAIL - RETURN RECEIPT REQUESTED

[CREDIT BUREAU / FURNISHER / COLLECTOR]
[ADDRESS]

Re: FAILURE TO RESPOND - SECOND NOTICE
    Original Letter: [DATE]
    Certified Mail #: [TRACKING NUMBER]
    Reference/Account: [NUMBER]

To Whom It May Concern:

On [DATE], I sent you [TYPE OF LETTER] via certified mail. USPS tracking shows delivery on [DATE].

It has been [NUMBER] days with NO RESPONSE.

═══════════════════════════════════════════════════════════════════════════
LEGAL DEADLINE:
═══════════════════════════════════════════════════════════════════════════

[FOR CREDIT BUREAUS]
Under FCRA §611(a)(1), you had 30 days to investigate. You FAILED.

[FOR DEBT VALIDATION]
Under FDCPA §809(b), you must cease collection until providing validation. Collection without validation is a VIOLATION.

[FOR 605B BLOCK]
Under FCRA §605B, you had 4 business days to block. You FAILED.

═══════════════════════════════════════════════════════════════════════════
CONSEQUENCES:
═══════════════════════════════════════════════════════════════════════════

[FOR BUREAUS]
Failure to respond means failure to verify. Under FCRA §611(a)(5)(A), unverifiable information must be DELETED. I demand immediate deletion of [ITEM].

[FOR COLLECTORS]
Failure to validate means you must CEASE all collection.

═══════════════════════════════════════════════════════════════════════════
DEMAND:
═══════════════════════════════════════════════════════════════════════════

1. [SPECIFIC DEMAND]
2. Respond within 10 days

═══════════════════════════════════════════════════════════════════════════
NOTICE:
═══════════════════════════════════════════════════════════════════════════

If no satisfactory response within 10 days:
□ CFPB complaint
□ FTC complaint
□ [STATE] Attorney General complaint
□ Attorney consultation

Sincerely,

______________________________
[YOUR PRINTED NAME]

Enclosures:
□ Copy of original letter
□ Certified mail receipt / delivery confirmation`,


  "dispute_response_rebuttal": () => `${formatDate()}

[YOUR FULL LEGAL NAME]
[YOUR STREET ADDRESS]
[CITY, STATE ZIP CODE]
[YOUR PHONE NUMBER]

VIA CERTIFIED MAIL - RETURN RECEIPT REQUESTED

[CREDIT BUREAU NAME]
[ADDRESS]

Re: REBUTTAL TO INVESTIGATION RESULTS - REQUEST FOR RE-INVESTIGATION
    Original Dispute: [DATE]
    Your Response: [DATE]
    SSN: XXX-XX-[LAST 4]

To Whom It May Concern:

I received your response dated [DATE]. I am NOT satisfied with the investigation results.

═══════════════════════════════════════════════════════════════════════════
PROBLEMS WITH INVESTIGATION:
═══════════════════════════════════════════════════════════════════════════

□ Failed to consider my evidence
□ Response doesn't address specific inaccuracies
□ "Verification" appears to be rubber stamp of furnisher data
□ Relied solely on e-OSCAR without genuine investigation
□ Information remains inaccurate despite "verification"
□ Other: [EXPLAIN]

═══════════════════════════════════════════════════════════════════════════
THE INFORMATION IS STILL INACCURATE:
═══════════════════════════════════════════════════════════════════════════

[RESTATE INACCURACY AND WHY YOUR EVIDENCE PROVES IT]

═══════════════════════════════════════════════════════════════════════════
ADDITIONAL EVIDENCE:
═══════════════════════════════════════════════════════════════════════════

[DESCRIBE NEW/ADDITIONAL EVIDENCE ENCLOSED]

═══════════════════════════════════════════════════════════════════════════
DEMAND:
═══════════════════════════════════════════════════════════════════════════

Conduct a NEW, REASONABLE investigation that:
1. Actually considers my evidence
2. Goes beyond e-OSCAR
3. Contacts furnisher directly for documentation
4. Provides detailed explanation of what was reviewed

Failure to properly investigate will be reported to CFPB and may result in legal action.

Sincerely,

______________________________
[YOUR PRINTED NAME]

Enclosures:
□ Your investigation results letter
□ My original dispute
□ [NEW EVIDENCE]`,


  "certified_mail_instructions": () => `═══════════════════════════════════════════════════════════════════════════
CERTIFIED MAIL INSTRUCTIONS
How to Send Legal Correspondence Properly
═══════════════════════════════════════════════════════════════════════════

WHY USE CERTIFIED MAIL?
─────────────────────────────────────────────────────────────────────────
Certified mail creates legal proof that:
• You sent the letter on a specific date
• The recipient received it on a specific date
• The specific person/company received it

This proof is ESSENTIAL for:
• Proving you met legal deadlines
• Starting countdown periods (e.g., 30 days)
• Establishing evidence for potential litigation

═══════════════════════════════════════════════════════════════════════════
STEP-BY-STEP INSTRUCTIONS
═══════════════════════════════════════════════════════════════════════════

STEP 1: PREPARE YOUR LETTER
─────────────────────────────────────────────────────────────────────────
□ Print on white paper
□ Sign in blue ink (distinguishes from copies)
□ Make 2 copies: one for records, one to send
□ Include all enclosures stated in letter
□ Highlight disputed items on credit reports

STEP 2: PREPARE ENVELOPE
─────────────────────────────────────────────────────────────────────────
□ Standard #10 or 9x12 manila envelope
□ Write recipient address clearly
□ Write return address in upper left
□ Do NOT seal yet (post office weighs it)

STEP 3: AT POST OFFICE
─────────────────────────────────────────────────────────────────────────
Tell the clerk you need:
□ CERTIFIED MAIL (~$4.85)
□ RETURN RECEIPT (GREEN CARD) (~$3.55)
□ First Class postage (by weight)

Total: ~$10-12 per letter

STEP 4: COMPLETE GREEN CARD (PS Form 3811)
─────────────────────────────────────────────────────────────────────────
□ Article Addressed To: [Recipient info]
□ Article Number: [From certified receipt]
□ Check: Certified Mail
□ YOUR address on bottom (where card returns)

STEP 5: COMPLETE CERTIFIED SLIP (PS Form 3800)
─────────────────────────────────────────────────────────────────────────
□ Sent To: [Recipient]
□ Write certified # on your letter for reference

STEP 6: SEND
─────────────────────────────────────────────────────────────────────────
□ Clerk attaches labels and green card
□ Get receipt (KEEP THIS!)
□ Keep tracking number

═══════════════════════════════════════════════════════════════════════════
AFTER SENDING
═══════════════════════════════════════════════════════════════════════════

TRACK: usps.com/tracking
□ Enter tracking number
□ Screenshot delivery confirmation
□ Green card returns in 1-2 weeks

ORGANIZE YOUR RECORDS:
□ Copy of letter
□ Certified mail receipt
□ Green card (when returned)
□ Tracking printout
□ Any response received

═══════════════════════════════════════════════════════════════════════════
COMMON ADDRESSES
═══════════════════════════════════════════════════════════════════════════

CREDIT BUREAUS:
─────────────────────────────────────────────────────────────────────────
Equifax Information Services LLC
P.O. Box 740256
Atlanta, GA 30374

Experian
P.O. Box 4500
Allen, TX 75013

TransUnion LLC
Consumer Dispute Center
P.O. Box 2000
Chester, PA 19016

Innovis Consumer Assistance
P.O. Box 1534
Columbus, OH 43216

SPECIALTY AGENCIES:
─────────────────────────────────────────────────────────────────────────
ChexSystems, Inc.
7805 Hudson Road, Suite 100
Woodbury, MN 55125

Early Warning Services, LLC
16552 N 90th Street
Scottsdale, AZ 85260

LexisNexis Consumer Center
P.O. Box 105108
Atlanta, GA 30348`,


  "documentation_checklist": () => `═══════════════════════════════════════════════════════════════════════════
DOCUMENTATION CHECKLIST FOR CREDIT DISPUTES
What to Include with Your Letters
═══════════════════════════════════════════════════════════════════════════

FOR ALL DISPUTES - ALWAYS INCLUDE:
─────────────────────────────────────────────────────────────────────────
□ Copy of government-issued photo ID
   • Driver's license OR
   • State ID OR
   • Passport (photo page)

□ Proof of current address (one of):
   • Utility bill (within 60 days)
   • Bank statement (within 60 days)
   • Lease agreement
   • Mortgage statement

□ Credit report with disputed items HIGHLIGHTED/CIRCLED

═══════════════════════════════════════════════════════════════════════════
FOR IDENTITY THEFT DISPUTES - ALSO INCLUDE:
═══════════════════════════════════════════════════════════════════════════

REQUIRED:
□ FTC Identity Theft Report (IdentityTheft.gov)
   • FREE and required by law
   • Print entire report (5-10 pages)

STRONGLY RECOMMENDED:
□ Police report (if available)
   • Some jurisdictions won't take a report - OK
   • FTC report is sufficient under federal law

HELPFUL IF AVAILABLE:
□ Documentation showing different location when account opened
□ Proof of residence at different address during fraud
□ Data breach notification letter

═══════════════════════════════════════════════════════════════════════════
FOR DEBT VALIDATION - DO NOT INCLUDE:
═══════════════════════════════════════════════════════════════════════════

✗ Social Security Number
✗ Bank account information
✗ Any payment
✗ Acknowledgment of debt

Just send your letter (keep a copy).

═══════════════════════════════════════════════════════════════════════════
ORGANIZATION TIPS:
═══════════════════════════════════════════════════════════════════════════

1. NUMBER YOUR ENCLOSURES
   • In letter: "Enclosure 1: Copy of driver's license"
   • On document: Write "Enclosure 1" in corner

2. MAKE COPIES OF EVERYTHING
   • Never send originals
   • Keep copies of what you send
   • Keep copies of what you receive

3. CREATE A DISPUTE FOLDER for each item:
   • Your letter (copy)
   • All enclosures (copies)
   • Certified mail receipt
   • Green card (when returned)
   • Their response
   • Your follow-up`,


  "consumer_statement": () => `${formatDate()}

[YOUR FULL LEGAL NAME]
[YOUR STREET ADDRESS]
[CITY, STATE ZIP CODE]
[YOUR PHONE NUMBER]

[CREDIT BUREAU NAME]
[ADDRESS]

Re: REQUEST TO ADD CONSUMER STATEMENT
    SSN: XXX-XX-[LAST 4]

To Whom It May Concern:

Pursuant to FCRA §611(b), I am requesting you add the following consumer statement to my credit file:

═══════════════════════════════════════════════════════════════════════════
CONSUMER STATEMENT (100 words or less):
═══════════════════════════════════════════════════════════════════════════

[WRITE YOUR STATEMENT HERE - MAX 100 WORDS]

Example statements:

"The [ACCOUNT NAME] account showing as delinquent resulted from identity theft. I have disputed this account and am awaiting resolution."

OR

"The late payments shown for [DATE] resulted from a medical emergency. Prior to and after this period, my payment history was perfect."

OR

"I dispute the accuracy of [ACCOUNT NAME]. The creditor has failed to provide verification despite multiple requests."

═══════════════════════════════════════════════════════════════════════════

Under FCRA §611(b), you must include this statement (or summary) in any report containing the information to which it relates.

Please confirm in writing that this statement has been added.

Sincerely,

______________________________
[YOUR PRINTED NAME]`,

};

// ============================================================================
// HELPER FUNCTION
// ============================================================================

export function getLetterContent(templateId) {
  if (LETTER_CONTENT[templateId]) {
    return LETTER_CONTENT[templateId]();
  }
  return `Template "${templateId}" not found.\n\nPlease contact support.`;
}

// ============================================================================
// TEMPLATE STATISTICS
// Total Categories: 7
// Total Templates: 62
// - Identity Theft Recovery: 12
// - Credit Bureau Disputes: 10
// - Debt Collection Defense: 10
// - Specialty Reporting Agencies: 10
// - Bank & Credit Card Disputes: 6
// - Escalation & Legal Action: 8
// - Follow-Up & Procedures: 6
// ============================================================================
