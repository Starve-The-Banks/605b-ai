// Complete Letter Templates Library for 605b.ai
// All templates cite actual statutes and follow proper legal formatting

const LETTER_TEMPLATES = {

  // ============================================
  // IDENTITY THEFT - §605B
  // ============================================

  "605b_bureau": () => `${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}

[YOUR NAME]
[YOUR ADDRESS]
[CITY, STATE ZIP]

VIA CERTIFIED MAIL - RETURN RECEIPT REQUESTED

[BUREAU NAME - Use one of the addresses below]
Experian: P.O. Box 4500, Allen, TX 75013
Equifax: P.O. Box 740256, Atlanta, GA 30374
TransUnion: P.O. Box 2000, Chester, PA 19016

Re: IDENTITY THEFT BLOCK REQUEST - FCRA §605B (15 U.S.C. § 1681c-2)
Social Security Number: XXX-XX-[LAST 4]

To Whom It May Concern:

I am a victim of identity theft. Pursuant to the Fair Credit Reporting Act, 15 U.S.C. § 1681c-2 (Section 605B), I am formally requesting that you BLOCK all information in my credit file resulting from identity theft within FOUR (4) BUSINESS DAYS of receipt of this letter.

FRAUDULENT ACCOUNTS TO BE BLOCKED:

Account Name: [CREDITOR NAME]
Account Number: [ACCOUNT NUMBER]
Date Opened: [DATE]
Amount: $[AMOUNT]
Reason: This account was opened fraudulently without my knowledge or authorization.

[REPEAT FOR EACH FRAUDULENT ACCOUNT]

ENCLOSED DOCUMENTATION:

□ Copy of FTC Identity Theft Report (Report Number: ____________)
□ Copy of police report (Report Number: ____________, Filed: ____________)
□ Copy of government-issued photo identification
□ Proof of current address (utility bill/bank statement)

LEGAL REQUIREMENTS:

Under 15 U.S.C. § 1681c-2(a), you are required to block this fraudulent information within FOUR (4) BUSINESS DAYS of receipt of this letter and the required documentation.

Under 15 U.S.C. § 1681c-2(b), you must promptly notify the furnisher of information that the block has been imposed and that it resulted from identity theft.

FAILURE TO COMPLY:

Failure to block this information within the statutory timeframe may result in civil liability under:
• 15 U.S.C. § 1681n - Willful noncompliance: $100 to $1,000 per violation PLUS actual damages, punitive damages, and attorney's fees
• 15 U.S.C. § 1681o - Negligent noncompliance: Actual damages and attorney's fees

I expect written confirmation that these accounts have been blocked within the four-day statutory period.

Sincerely,


______________________________
[YOUR NAME]

Enclosures:
- FTC Identity Theft Report
- Police Report
- Government-issued ID (copy)
- Proof of Address`,


  "605b_furnisher": () => `${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}

[YOUR NAME]
[YOUR ADDRESS]
[CITY, STATE ZIP]

VIA CERTIFIED MAIL - RETURN RECEIPT REQUESTED

[CREDITOR/FURNISHER NAME]
[CREDITOR ADDRESS]
[CITY, STATE ZIP]

Re: IDENTITY THEFT NOTIFICATION AND BLOCK REQUEST - FCRA §605B
Account Number: [ACCOUNT NUMBER]
Social Security Number: XXX-XX-[LAST 4]

To Whom It May Concern:

I am writing to notify you that I am a victim of identity theft. The account referenced above was opened fraudulently using my personal information without my knowledge, authorization, or consent.

Pursuant to the Fair Credit Reporting Act, 15 U.S.C. § 1681c-2 (Section 605B), and the Fair Debt Collection Practices Act, 15 U.S.C. § 1692 et seq., I demand that you:

1. IMMEDIATELY cease all collection activity on this fraudulent account
2. IMMEDIATELY cease reporting this account to any consumer reporting agency
3. Provide me with copies of all documentation related to this account, including:
   - The original signed application or contract
   - All transaction records
   - Any identification documents provided at account opening
   - Records of the address where statements were sent
   - Records of the phone number associated with the account

ENCLOSED DOCUMENTATION:

□ Copy of FTC Identity Theft Report (Report Number: ____________)
□ Copy of police report (Report Number: ____________)
□ Copy of government-issued photo identification
□ Proof of current address

LEGAL NOTICE:

Under 15 U.S.C. § 1681s-2(a)(6), you are prohibited from furnishing information to a consumer reporting agency if you have been notified by the consumer that specific information results from identity theft and the consumer has provided an identity theft report.

Continued reporting of this fraudulent account after receipt of this notice and the enclosed identity theft report constitutes:
• A violation of FCRA §623 (15 U.S.C. § 1681s-2)
• Potential willful noncompliance under 15 U.S.C. § 1681n
• Potential violation of state consumer protection laws

I expect written confirmation within 30 days that this account has been closed, marked as fraudulent, and that you have notified all credit bureaus to remove this tradeline.

Sincerely,


______________________________
[YOUR NAME]

Enclosures:
- FTC Identity Theft Report
- Police Report
- Government-issued ID (copy)
- Proof of Address`,


  "ftc_affidavit": () => `IDENTITY THEFT AFFIDAVIT

NOTE: This form should be completed at IdentityTheft.gov

Visit: https://www.identitytheft.gov/

The FTC's IdentityTheft.gov website will:
1. Walk you through creating an official Identity Theft Report
2. Generate a personalized recovery plan
3. Create pre-filled letters to send to companies
4. Provide your FTC Identity Theft Report number

Your FTC Identity Theft Report serves as:
• Proof of identity theft for credit bureaus (required for §605B blocks)
• Documentation for creditors and collectors
• Evidence for police reports
• Support for extended fraud alerts

IMPORTANT: Keep copies of your completed Identity Theft Report for your records.

After completing your report at IdentityTheft.gov, you will receive:
• A unique report number
• A PDF copy of your report
• Step-by-step instructions for recovery`,


  // ============================================
  // CREDIT DISPUTES - §611
  // ============================================

  "611_dispute": () => `${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}

[YOUR NAME]
[YOUR ADDRESS]
[CITY, STATE ZIP]

VIA CERTIFIED MAIL - RETURN RECEIPT REQUESTED

[BUREAU NAME]
[BUREAU ADDRESS]

Experian: P.O. Box 4500, Allen, TX 75013
Equifax: P.O. Box 740256, Atlanta, GA 30374
TransUnion: P.O. Box 2000, Chester, PA 19016

Re: FORMAL DISPUTE OF INACCURATE INFORMATION - FCRA §611 (15 U.S.C. § 1681i)
Social Security Number: XXX-XX-[LAST 4]

To Whom It May Concern:

Pursuant to the Fair Credit Reporting Act, 15 U.S.C. § 1681i (Section 611), I am formally disputing the following inaccurate information appearing on my credit report.

ITEMS IN DISPUTE:

Item #1:
Creditor Name: [CREDITOR NAME]
Account Number: [ACCOUNT NUMBER]
Reported Balance: $[AMOUNT]
Date Reported: [DATE]

REASON FOR DISPUTE (check all that apply):
□ This is not my account
□ The balance is incorrect - Correct balance: $________
□ The payment history is inaccurate
□ The account status is incorrect - Should be: ________
□ The date opened is wrong - Correct date: ________
□ The credit limit is incorrect
□ This account was included in bankruptcy
□ This account was paid/settled but still shows balance
□ Late payments are being reported incorrectly
□ The account is showing duplicate
□ Other: ________________________________________________

SPECIFIC EXPLANATION OF INACCURACY:
[Provide detailed explanation of what is wrong and what the correct information should be]

_____________________________________________________________
_____________________________________________________________
_____________________________________________________________

[REPEAT FOR EACH ADDITIONAL DISPUTED ITEM]

LEGAL REQUIREMENTS:

Under 15 U.S.C. § 1681i(a)(1)(A), you must conduct a reasonable investigation within 30 days of receiving this dispute.

Under 15 U.S.C. § 1681i(a)(5)(A), if the information cannot be verified or is found to be inaccurate, you must promptly DELETE or MODIFY the item.

Under 15 U.S.C. § 1681i(a)(6), you must provide me with written notice of the results within 5 business days of completion.

DOCUMENTATION ENCLOSED:

□ Copy of credit report with disputed items circled
□ [List any additional supporting documents]
□ _______________________________________________

NOTICE: Under 15 U.S.C. § 1681i(a)(1)(A), merely forwarding this dispute to the furnisher without conducting your own reasonable investigation does not satisfy your statutory obligations.

I expect a written response within 30 days.

Sincerely,


______________________________
[YOUR NAME]

Enclosures: [List all enclosures]`,


  "609_disclosure": () => `${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}

[YOUR NAME]
[YOUR ADDRESS]
[CITY, STATE ZIP]

VIA CERTIFIED MAIL - RETURN RECEIPT REQUESTED

[BUREAU NAME]
[BUREAU ADDRESS]

Re: REQUEST FOR METHOD OF VERIFICATION - FCRA §611(a)(7)
Reference: Previous Dispute Dated [DATE OF PREVIOUS DISPUTE]
Social Security Number: XXX-XX-[LAST 4]

To Whom It May Concern:

On [DATE], I submitted a dispute regarding the following item(s) on my credit report. You responded that the information was "verified" but did not provide the method of verification.

DISPUTED ITEM(S):

Creditor: [CREDITOR NAME]
Account Number: [ACCOUNT NUMBER]

Pursuant to the Fair Credit Reporting Act, 15 U.S.C. § 1681i(a)(7), I am formally requesting that you provide me with:

1. A DESCRIPTION OF THE PROCEDURE used to determine the accuracy of the disputed information

2. The BUSINESS NAME, ADDRESS, AND TELEPHONE NUMBER of any furnisher of information contacted in connection with this dispute

3. The METHOD OF VERIFICATION - specifically:
   • What documents did you review?
   • What information did the furnisher provide?
   • How did you independently verify accuracy?

LEGAL BASIS:

Section 611(a)(7) of the FCRA states: "A consumer reporting agency shall provide to a consumer a description referred to in paragraph (6)(B)(iii) by not later than 15 days after receiving a request from the consumer for that description."

This information must be provided within 15 DAYS of your receipt of this request.

IMPORTANT: If you verified this information merely by asking the furnisher if it was accurate (known as "parroting"), this does not constitute a reasonable investigation under the FCRA. See Cushman v. Trans Union Corp., 115 F.3d 220 (3rd Cir. 1997).

If you cannot provide the specific method of verification with supporting documentation, the disputed item must be DELETED from my credit file pursuant to 15 U.S.C. § 1681i(a)(5)(A).

Sincerely,


______________________________
[YOUR NAME]

Enclosure: Copy of your previous dispute response letter`,


  "623_direct": () => `${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}

[YOUR NAME]
[YOUR ADDRESS]
[CITY, STATE ZIP]

VIA CERTIFIED MAIL - RETURN RECEIPT REQUESTED

[CREDITOR/FURNISHER NAME]
[ADDRESS]
[CITY, STATE ZIP]

Re: DIRECT DISPUTE TO FURNISHER - FCRA §623 (15 U.S.C. § 1681s-2)
Account Number: [ACCOUNT NUMBER]
Social Security Number: XXX-XX-[LAST 4]

To Whom It May Concern:

Pursuant to the Fair Credit Reporting Act, 15 U.S.C. § 1681s-2(a)(8) (Section 623), I am directly disputing information you have furnished to consumer reporting agencies regarding the above-referenced account.

INACCURATE INFORMATION BEING REPORTED:

What You Are Currently Reporting:
_____________________________________________________________

What Should Be Reported:
_____________________________________________________________

SPECIFIC DISPUTE (check all that apply):

□ The account status is incorrect
□ The balance is incorrect
□ The payment history contains errors
□ Late payments are being reported incorrectly
□ The account was paid/settled but not updated
□ The date of first delinquency is wrong
□ The credit limit is incorrect
□ The account was included in bankruptcy and not updated
□ This account does not belong to me
□ Other: ________________________________________________

DETAILED EXPLANATION:
_____________________________________________________________
_____________________________________________________________
_____________________________________________________________

DOCUMENTATION ENCLOSED:

□ [Payment records/receipts]
□ [Bank statements showing payments]
□ [Previous correspondence]
□ [Other: _______________________________________________]

LEGAL REQUIREMENTS:

Under 15 U.S.C. § 1681s-2(a)(8)(E), upon receipt of a direct dispute, you MUST:

1. Conduct an investigation with respect to the disputed information
2. Review ALL relevant information provided by me
3. Complete the investigation within 30 days
4. Report the results to me in writing
5. If inaccurate, report corrections to ALL credit bureaus

Under 15 U.S.C. § 1681s-2(b), if found inaccurate, incomplete, or unverifiable, you must MODIFY, DELETE, or BLOCK the reporting.

FAILURE TO COMPLY may result in liability under 15 U.S.C. § 1681n (willful) and § 1681o (negligent).

I expect a written response within 30 days.

Sincerely,


______________________________
[YOUR NAME]

Enclosures: [List all enclosed documents]`,


  // ============================================
  // DEBT COLLECTION - FDCPA §809
  // ============================================

  "809_validation": () => `${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}

[YOUR NAME]
[YOUR ADDRESS]
[CITY, STATE ZIP]

VIA CERTIFIED MAIL - RETURN RECEIPT REQUESTED

[COLLECTION AGENCY NAME]
[ADDRESS]
[CITY, STATE ZIP]

Re: DEBT VALIDATION REQUEST - FDCPA §809 (15 U.S.C. § 1692g)
Your Reference/Account Number: [NUMBER]

To Whom It May Concern:

I am writing in response to [your letter dated ________ / your phone call on ________] regarding an alleged debt. This letter is NOT an acknowledgment of the debt's validity.

Pursuant to 15 U.S.C. § 1692g (Section 809), I am requesting VALIDATION of this alleged debt. Please provide ALL of the following:

1. VERIFICATION OF THE DEBT:
   □ The EXACT amount of the debt and itemized breakdown of how it was calculated
   □ Interest, fees, and charges itemized separately
   □ The name and address of the ORIGINAL creditor
   □ The original account number with the original creditor
   □ The date the debt was originally incurred
   □ The date of last payment (if any)
   □ The date of alleged default

2. PROOF OF YOUR AUTHORITY TO COLLECT:
   □ Copy of the SIGNED contract or agreement creating this debt obligation
   □ Complete chain of assignment/sale documentation from original creditor to you
   □ Proof you are licensed to collect debts in [YOUR STATE]
   □ Your state license number: ____________

3. COMPLETE DOCUMENTATION:
   □ Complete payment history from the original creditor
   □ Copy of the original signed credit application
   □ All statements sent to the consumer
   □ Any judgment (if applicable)

LEGAL NOTICE - YOU MUST CEASE COLLECTION:

Under 15 U.S.C. § 1692g(b), you must CEASE ALL COLLECTION ACTIVITY until you provide proper validation. This includes:
• NO phone calls
• NO letters demanding payment
• NO credit bureau reporting
• NO lawsuits or legal action
• NO contact with third parties

CREDIT REPORTING NOTICE:

If you have reported or report this alleged debt to any credit bureau without first providing validation, you are in violation of:
• FDCPA 15 U.S.C. § 1692e (false/misleading representations)
• FCRA 15 U.S.C. § 1681s-2 (furnishing inaccurate information)

STATUTE OF LIMITATIONS NOTICE:

If this debt is beyond the statute of limitations in [YOUR STATE], be advised that any lawsuit would be subject to dismissal and any threat to sue may violate the FDCPA.

FAILURE TO VALIDATE:

If you cannot provide complete validation within 30 days, you must:
1. Cease ALL collection activity permanently
2. Remove any credit bureau reporting
3. Return this account to the original creditor or close it

Continued collection activity without proper validation will result in legal action under the FDCPA, with potential damages of $1,000 per violation plus actual damages and attorney's fees (15 U.S.C. § 1692k).

ALL FUTURE COMMUNICATION MUST BE IN WRITING.

Sincerely,


______________________________
[YOUR NAME]

CC: [YOUR STATE] Attorney General
    Consumer Financial Protection Bureau`,


  "cease_desist": () => `${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}

[YOUR NAME]
[YOUR ADDRESS]
[CITY, STATE ZIP]

VIA CERTIFIED MAIL - RETURN RECEIPT REQUESTED

[COLLECTION AGENCY NAME]
[ADDRESS]
[CITY, STATE ZIP]

Re: CEASE AND DESIST ALL COMMUNICATION - FDCPA §805(c)
Your Reference/Account Number: [NUMBER]

To Whom It May Concern:

Pursuant to the Fair Debt Collection Practices Act, 15 U.S.C. § 1692c(c), I hereby demand that you IMMEDIATELY CEASE ALL COMMUNICATION with me regarding the above-referenced alleged debt.

EFFECTIVE IMMEDIATELY, YOU MUST STOP:

• ALL telephone calls to any phone number
• ALL letters, emails, texts, or written communication
• ALL contact with any third parties about this alleged debt
• ALL contact at my place of employment
• ALL social media contact or messaging

ONLY PERMITTED COMMUNICATIONS:

Under § 1692c(c), after receiving this notice, you may ONLY contact me to:
1. Advise that you are terminating further collection efforts
2. Notify me that you may invoke a specific remedy (such as filing a lawsuit)
3. Notify me that you WILL invoke a specific remedy

ANY OTHER COMMUNICATION FOR ANY OTHER PURPOSE IS A FEDERAL LAW VIOLATION.

WARNING - CONSEQUENCES OF VIOLATION:

Any violation of this cease and desist notice will result in:
• Statutory damages of up to $1,000 per violation (15 U.S.C. § 1692k)
• Actual damages for any harm caused
• Attorney's fees and court costs
• Formal complaints to the CFPB, FTC, and [STATE] Attorney General
• Potential class action liability if this is a pattern of conduct

IMPORTANT NOTICES:

• This letter is NOT an acknowledgment that this debt is valid
• This letter is NOT a refusal to pay a valid debt
• This letter IS a demand to stop harassing me

If you believe you have a valid legal claim, you may pursue it through proper legal channels. However, ALL informal collection activity must STOP IMMEDIATELY upon receipt of this letter.

The certified mail receipt for this letter will serve as evidence of your receipt and knowledge of this demand.

Sincerely,


______________________________
[YOUR NAME]

CC: Consumer Financial Protection Bureau`,


  "pay_delete": () => `${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}

[YOUR NAME]
[YOUR ADDRESS]
[CITY, STATE ZIP]

VIA CERTIFIED MAIL - RETURN RECEIPT REQUESTED

[CREDITOR OR COLLECTION AGENCY NAME]
[ADDRESS]
[CITY, STATE ZIP]

Re: SETTLEMENT AND DELETION PROPOSAL
Account Number: [ACCOUNT NUMBER]
Original Creditor (if applicable): [NAME]
Current Balance Claimed: $[AMOUNT]

To Whom It May Concern:

I am writing regarding the above-referenced account. Without admitting the validity of this alleged debt or waiving any rights, I am proposing a settlement arrangement.

SETTLEMENT OFFER:

I am prepared to pay: $[SETTLEMENT AMOUNT]
(Representing approximately [X]% of the claimed balance)

This payment would be in FULL AND FINAL SETTLEMENT, subject to the conditions below.

CONDITIONS OF SETTLEMENT:

1. DELETION AGREEMENT - You agree to:
   □ Request complete DELETION (not "paid" or "settled" status) from Experian, Equifax, AND TransUnion within 30 days of payment
   □ Never re-sell, transfer, or assign this account
   □ Never re-report this account to any credit bureau
   □ Provide written confirmation of deletion requests

2. WRITTEN AGREEMENT REQUIRED BEFORE PAYMENT:
   Before I send any payment, you MUST provide a signed agreement on company letterhead confirming:
   □ Acceptance of $[AMOUNT] as payment in full
   □ Agreement to DELETE (not update) all credit bureau reporting
   □ Account will be marked as "Paid in Full" in your records
   □ No further collection activity will occur
   □ No 1099-C will be issued (for amounts under $600)

3. PAYMENT METHOD:
   Upon receipt of signed agreement, payment will be made via:
   □ Cashier's check / Money order (NO electronic access to my accounts)
   □ Payable to: [COMPANY NAME]

IMPORTANT TERMS:

• This offer EXPIRES: [DATE - 30 days from letter date]
• This offer is CONTINGENT on receiving your written acceptance BEFORE payment
• This is NOT an acknowledgment of the debt's validity
• Do NOT apply partial payment - full agreement must be executed first
• Do NOT contact me by phone - written responses only

If this account is held by a collection agency, the deletion agreement must also include confirmation that the original creditor will not continue reporting.

If you wish to accept this settlement offer, please respond in writing within 30 days.

Sincerely,


______________________________
[YOUR NAME]`,


  // ============================================
  // SPECIALTY AGENCIES
  // ============================================

  "chex_dispute": () => `${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}

[YOUR NAME]
[YOUR ADDRESS]
[CITY, STATE ZIP]

VIA CERTIFIED MAIL - RETURN RECEIPT REQUESTED

ChexSystems, Inc.
Attn: Consumer Relations
7805 Hudson Road, Suite 100
Woodbury, MN 55125

Re: FORMAL DISPUTE OF INACCURATE INFORMATION - FCRA §611
Social Security Number: XXX-XX-[LAST 4]
Date of Birth: [DOB]

To Whom It May Concern:

Pursuant to the Fair Credit Reporting Act, 15 U.S.C. § 1681i (Section 611), I am formally disputing inaccurate information appearing in my ChexSystems consumer report.

ITEM IN DISPUTE:

Reporting Bank: [BANK NAME]
Account Number: [ACCOUNT NUMBER]
Date Reported: [DATE]
Reason Reported: [REASON - e.g., "Account Abuse," "Unpaid NSF," "Account Closed for Cause"]
Amount Owed (if any): $[AMOUNT]

REASON FOR DISPUTE (check all that apply):

□ This account is not mine / I never had an account at this bank
□ This account was closed in good standing
□ The balance owed has been paid in full (receipt enclosed)
□ The reported amount is incorrect
□ This resulted from identity theft (FTC report enclosed)
□ This information is more than 5 years old and should be removed
□ The bank failed to provide proper notice before reporting
□ I was never given opportunity to resolve the issue before reporting
□ The reason code is incorrect
□ Other: _______________________________________________

DETAILED EXPLANATION:
_____________________________________________________________
_____________________________________________________________
_____________________________________________________________

DOCUMENTATION ENCLOSED:

□ Copy of ChexSystems report with disputed item highlighted
□ Bank statements showing account was in good standing
□ Payment receipt showing balance was paid
□ Letter from bank confirming resolution
□ FTC Identity Theft Report (if applicable)
□ Police report (if applicable)
□ Other: _______________________________________________

LEGAL REQUIREMENTS:

ChexSystems is a consumer reporting agency under the FCRA. You must:
1. Conduct a reasonable investigation within 30 days
2. Forward all relevant information to the furnisher (bank)
3. Review documentation I have provided
4. DELETE or MODIFY information that is inaccurate or unverifiable
5. Provide written notice of investigation results

Please send me an UPDATED copy of my ChexSystems report upon completion.

Sincerely,


______________________________
[YOUR NAME]

Enclosures: [List all documents]`,


  "ews_dispute": () => `${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}

[YOUR NAME]
[YOUR ADDRESS]
[CITY, STATE ZIP]

VIA CERTIFIED MAIL - RETURN RECEIPT REQUESTED

Early Warning Services, LLC
Attn: Consumer Services
16552 N. 90th Street
Scottsdale, AZ 85260

Re: FORMAL DISPUTE OF INACCURATE INFORMATION - FCRA §611
Social Security Number: XXX-XX-[LAST 4]
Date of Birth: [DOB]

To Whom It May Concern:

Pursuant to the Fair Credit Reporting Act, 15 U.S.C. § 1681i (Section 611), I am formally disputing inaccurate information appearing in my Early Warning Services (EWS) consumer report.

REQUEST FOR DISCLOSURE:

If you have not already provided me with a copy of my EWS report, I am also requesting a free copy pursuant to 15 U.S.C. § 1681j.

ITEM IN DISPUTE:

Reporting Financial Institution: [BANK NAME]
Account Number (if known): [ACCOUNT NUMBER]
Date of Report: [DATE]
Type of Report: [Account closure/Suspected fraud/Unpaid balance/Check fraud/etc.]
Amount (if any): $[AMOUNT]

REASON FOR DISPUTE (check all that apply):

□ This information is inaccurate
□ This is not my account
□ The account was closed in good standing
□ Any balance owed has been paid in full
□ This resulted from identity theft
□ The information is outdated (EWS keeps data for 7 years)
□ I was never notified this would be reported
□ The fraud/abuse allegation is false
□ Other: _______________________________________________

DETAILED EXPLANATION:
_____________________________________________________________
_____________________________________________________________
_____________________________________________________________

DOCUMENTATION ENCLOSED:

□ Bank statements
□ Payment receipts
□ Letter from bank confirming account status
□ FTC Identity Theft Report (if applicable)
□ Other: _______________________________________________

LEGAL REQUIREMENTS:

Early Warning Services is a consumer reporting agency under the FCRA. You must:
1. Conduct a reasonable investigation within 30 days
2. DELETE or MODIFY information that cannot be verified
3. Provide written notice of investigation results
4. Provide me with an updated consumer report

Failure to properly investigate may result in liability under 15 U.S.C. § 1681n and § 1681o.

Sincerely,


______________________________
[YOUR NAME]

Enclosures: [List all documents]`,


  "lexis_dispute": () => `${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}

[YOUR NAME]
[YOUR ADDRESS]
[CITY, STATE ZIP]

VIA CERTIFIED MAIL - RETURN RECEIPT REQUESTED

LexisNexis Consumer Center
P.O. Box 105108
Atlanta, GA 30348-5108

Re: FORMAL DISPUTE OF INACCURATE INFORMATION - FCRA §611
Full Legal Name: [YOUR FULL LEGAL NAME]
Date of Birth: [DOB]
Social Security Number: XXX-XX-[LAST 4]
Current Address: [YOUR ADDRESS]

To Whom It May Concern:

Pursuant to the Fair Credit Reporting Act, 15 U.S.C. § 1681i (Section 611), I am formally disputing inaccurate information appearing in my LexisNexis consumer file (including CLUE, C.L.U.E. Auto, and Full File Disclosure reports).

INACCURATE INFORMATION TO DISPUTE (check all that apply):

□ PERSONAL INFORMATION:
   Incorrect item: _______________________________________________
   Correct information: __________________________________________

□ ADDRESS HISTORY:
   Address that is not mine: ______________________________________
   □ I have never lived at this address

□ PHONE NUMBERS:
   Number that is not mine: ______________________________________

□ ALIASES/NAMES:
   Name that is not mine: ________________________________________

□ PUBLIC RECORDS:
   □ Criminal record that is not mine
   □ Bankruptcy that is not mine
   □ Civil judgment that is incorrect
   □ Tax lien that is incorrect or has been paid
   □ Eviction record that is inaccurate
   Details: ____________________________________________________

□ INSURANCE CLAIMS (CLUE Report):
   □ Claim that is not mine
   □ Incorrect claim information
   □ Claim amount is wrong
   □ Claim type is wrong
   □ Claim date is wrong
   Details: ____________________________________________________

□ OTHER:
   ___________________________________________________________

DETAILED EXPLANATION:
_____________________________________________________________
_____________________________________________________________
_____________________________________________________________

DOCUMENTATION ENCLOSED:

□ Copy of government-issued photo ID
□ Proof of current address (utility bill within 60 days)
□ Copy of Social Security card
□ Copy of LexisNexis report with disputed items marked
□ Supporting documentation: ____________________________________

LEGAL REQUIREMENTS:

LexisNexis is a consumer reporting agency under the FCRA and must:
1. Conduct a reasonable investigation within 30 days
2. DELETE or MODIFY inaccurate or unverifiable information
3. Provide written notice of investigation results
4. Provide an updated consumer file

Please provide me with an updated copy of my consumer file upon completion.

Sincerely,


______________________________
[YOUR NAME]

Enclosures: [List all documents]`,


  // ============================================
  // ESCALATION
  // ============================================

  "state_ag": () => `${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}

[YOUR NAME]
[YOUR ADDRESS]
[CITY, STATE ZIP]

VIA CERTIFIED MAIL

Office of the Attorney General
Consumer Protection Division
[YOUR STATE]
[STATE AG ADDRESS]

Re: CONSUMER COMPLAINT - FCRA/FDCPA VIOLATIONS
Company: [COMPANY NAME]

Dear Attorney General:

I am writing to file a formal complaint against [COMPANY NAME] for violations of federal and state consumer protection laws.

COMPLAINANT INFORMATION:

Name: [YOUR NAME]
Address: [YOUR ADDRESS]
Phone: [YOUR PHONE]
Email: [YOUR EMAIL]

COMPANY INFORMATION:

Company Name: [COMPANY NAME]
Address: [COMPANY ADDRESS]
Phone: [COMPANY PHONE]
Account Number: [IF APPLICABLE]

SUMMARY OF COMPLAINT:

[Provide a clear summary of what happened in 2-3 paragraphs]

CHRONOLOGICAL TIMELINE:

[DATE]: _______________________________________________
[DATE]: _______________________________________________
[DATE]: _______________________________________________
[DATE]: _______________________________________________
[Continue as needed]

LAWS VIOLATED:

□ Fair Credit Reporting Act (FCRA) - 15 U.S.C. § 1681 et seq.
   Specific violations:
   □ § 1681i - Failure to investigate dispute
   □ § 1681s-2 - Furnishing inaccurate information
   □ § 1681c-2 - Failure to block identity theft information
   □ Other: _________________________________________

□ Fair Debt Collection Practices Act (FDCPA) - 15 U.S.C. § 1692 et seq.
   Specific violations:
   □ § 1692g - Failure to validate debt
   □ § 1692c - Communication violations
   □ § 1692e - False or misleading representations
   □ § 1692f - Unfair practices
   □ Other: _________________________________________

□ [YOUR STATE] Consumer Protection Laws
   _________________________________________________

HARM SUFFERED:

□ Denied credit or loan
□ Higher interest rates
□ Denied employment
□ Denied housing
□ Emotional distress
□ Out-of-pocket expenses: $__________
□ Other: ___________________________________________

RESOLUTION SOUGHT:

1. ________________________________________________
2. ________________________________________________
3. Investigation of company's practices

DOCUMENTATION ENCLOSED:

□ Copies of all correspondence with company
□ Credit reports showing errors
□ Certified mail receipts
□ [Other: _________________________________________]

I am willing to cooperate fully with any investigation.

Sincerely,


______________________________
[YOUR NAME]

Enclosures: [List all documents]`,


  "intent_to_sue": () => `${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}

[YOUR NAME]
[YOUR ADDRESS]
[CITY, STATE ZIP]

VIA CERTIFIED MAIL - RETURN RECEIPT REQUESTED

[COMPANY NAME]
ATTN: LEGAL DEPARTMENT
[ADDRESS]
[CITY, STATE ZIP]

Re: NOTICE OF INTENT TO FILE LAWSUIT
      FCRA AND FDCPA VIOLATIONS
      Account/Reference: [NUMBER]

PLEASE DIRECT THIS LETTER IMMEDIATELY TO YOUR LEGAL DEPARTMENT

To Whom It May Concern:

This letter serves as formal notice of my intent to file a lawsuit against [COMPANY NAME] for WILLFUL violations of federal consumer protection laws. This is your FINAL OPPORTUNITY to resolve this matter before litigation.

BACKGROUND:

On [DATE], I [describe initial action - disputed information/requested validation/etc.].

Despite [NUMBER] written attempts to resolve this matter, you have [describe violations - failed to investigate/continued reporting inaccurate information/continued collection/etc.].

DOCUMENTED VIOLATIONS:

□ FAIR CREDIT REPORTING ACT (15 U.S.C. § 1681 et seq.)
   • § 1681i - Failure to conduct reasonable investigation
   • § 1681s-2 - Furnishing information known to be inaccurate
   • § 1681c-2 - Failure to block fraudulent information
   • § 1681e(b) - Failure to maintain reasonable procedures

□ FAIR DEBT COLLECTION PRACTICES ACT (15 U.S.C. § 1692 et seq.)
   • § 1692g - Failure to validate debt
   • § 1692c - Unauthorized communications
   • § 1692e - False and misleading representations
   • § 1692f - Unfair practices

DAMAGES TO BE SOUGHT:

Under federal law, I am entitled to:
• Statutory damages: $100 - $1,000 per FCRA violation
• Statutory damages: Up to $1,000 per FDCPA violation
• Actual damages including emotional distress
• Punitive damages for willful violations
• Attorney's fees and litigation costs

DEMAND FOR PRE-LITIGATION SETTLEMENT:

To avoid litigation, you must complete the following by [DATE - 15-30 days]:

1. [Specific action: e.g., Delete all inaccurate information from all credit bureaus]
2. [Additional action: e.g., Cease all collection activity]
3. [Provide written confirmation of compliance]

DEADLINE: [DATE]

If I do not receive satisfactory written confirmation of compliance by the above date, I will:
• File suit in [Federal/State] Court
• Report violations to the CFPB, FTC, and [STATE] Attorney General
• Seek all available statutory, actual, and punitive damages

NOTICE OF DOCUMENTATION:

This matter has been thoroughly documented. I have retained:
• All written correspondence (with certified mail receipts)
• Credit reports showing continued inaccurate reporting
• Records of all phone calls and communications
• Evidence of harm suffered

This letter constitutes notice of your violations and will be used as evidence of your knowledge should this matter proceed to litigation.

I am prepared to proceed pro se or with legal counsel.

Sincerely,


______________________________
[YOUR NAME]

CC: Consumer Financial Protection Bureau
    [STATE] Attorney General
    Federal Trade Commission`,


  // ============================================
  // GOODWILL & SPECIAL REQUESTS
  // ============================================

  "goodwill_letter": () => `${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}

[YOUR NAME]
[YOUR ADDRESS]
[CITY, STATE ZIP]

[CREDITOR NAME]
Customer Relations Department
[ADDRESS]
[CITY, STATE ZIP]

Re: GOODWILL ADJUSTMENT REQUEST
Account Number: [ACCOUNT NUMBER]

Dear Sir or Madam:

I am writing to respectfully request a goodwill adjustment to remove a [late payment / negative mark] from my credit report with [CREDITOR NAME].

ACCOUNT INFORMATION:

Account Number: [ACCOUNT NUMBER]
Account Type: [Credit Card / Auto Loan / Mortgage / etc.]
Account Opened: [DATE]
Current Status: [Current / Paid in Full / Closed in Good Standing]
Issue: [Late payment in MONTH/YEAR / Other negative mark]

MY HISTORY WITH YOUR COMPANY:

I have been a customer of [COMPANY NAME] for [X] years. During this time, I have:
• Maintained my account responsibly
• Made [consistent/timely] payments
• [Other positive history]

WHAT HAPPENED:

In [MONTH/YEAR], I experienced [explain circumstances]:
_____________________________________________________________
_____________________________________________________________

This caused me to [miss a payment / fall behind], which resulted in a negative mark on my credit report.

SINCE THEN:

Since this incident, I have:
• [Brought the account current / Paid off the balance]
• [Maintained perfect payment history]
• [Other steps taken to resolve]

MY REQUEST:

I am respectfully asking that you consider removing the [late payment notation / negative mark] from my credit report as a one-time goodwill gesture.

I understand this is entirely at your discretion and that you are under no legal obligation to make this adjustment. However, this single blemish on an otherwise positive account history is [affecting my credit score / preventing me from qualifying for a mortgage / etc.].

WHY THIS MATTERS:
_____________________________________________________________
_____________________________________________________________

I truly value my relationship with [COMPANY NAME] and hope to remain a loyal customer. A goodwill adjustment would mean a great deal to me.

Thank you for taking the time to consider my request. Please feel free to contact me if you need any additional information.

Sincerely,


______________________________
[YOUR NAME]
Phone: [YOUR PHONE]
Email: [YOUR EMAIL]`,


  "medical_debt": () => `${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}

[YOUR NAME]
[YOUR ADDRESS]
[CITY, STATE ZIP]

VIA CERTIFIED MAIL - RETURN RECEIPT REQUESTED

[CREDIT BUREAU / COLLECTION AGENCY / MEDICAL PROVIDER]
[ADDRESS]
[CITY, STATE ZIP]

Re: DISPUTE OF MEDICAL DEBT REPORTING
Account/Reference: [NUMBER]

To Whom It May Concern:

I am disputing the following medical debt appearing on my credit report:

DISPUTED ITEM:

Collection Agency (if applicable): [NAME]
Original Medical Provider: [HOSPITAL/DOCTOR NAME]
Account Number: [NUMBER]
Amount Claimed: $[AMOUNT]
Date of Service: [DATE]

GROUNDS FOR DISPUTE (check all that apply):

□ TIMING VIOLATION - This debt should not be reported yet
   Under current FCRA rules, medical debt CANNOT be reported until 365 days after it first became past due.
   Date allegedly past due: __________
   Date reported: __________
   Days elapsed: __________ (must be 365+)

□ PAID MEDICAL DEBT - This debt has been paid
   As of 2023, PAID medical debt cannot appear on credit reports.
   Date paid: __________
   Amount paid: $__________
   □ Receipt/proof of payment enclosed

□ AMOUNT THRESHOLD - This debt is under $500
   As of 2023, medical debt under $500 is EXCLUDED from credit reports.
   Amount claimed: $__________

□ INSURANCE ISSUE - This should have been covered by insurance
   I had insurance at the time of service:
   Insurance Company: __________
   Policy Number: __________
   □ This is a billing error - insurance should have paid
   □ Provider failed to bill insurance properly
   □ EOB enclosed showing coverage

□ BILLING DISPUTE - I never received proper billing
   □ I was not billed at my correct address
   □ I did not receive an itemized bill before collections
   □ The amount is incorrect

□ NOT MY DEBT
   □ I did not receive these services
   □ This is someone else's debt
   □ This may be identity theft

□ HIPAA CONCERNS
   □ Debt reported without proper authorization
   □ Protected health information disclosed improperly

EXPLANATION:
_____________________________________________________________
_____________________________________________________________

DOCUMENTATION ENCLOSED:

□ Insurance card (copy)
□ Explanation of Benefits (EOB)
□ Payment receipt
□ Correspondence with provider
□ Other: _______________________________________________

LEGAL REQUIREMENTS:

Recent changes to credit reporting provide significant protections for medical debt:
• Paid medical debt is excluded from credit reports
• Medical debt under $500 is excluded
• 365-day waiting period before reporting is allowed
• Insurance billing issues must be resolved first

Please investigate this matter and REMOVE this item from my credit report.

Sincerely,


______________________________
[YOUR NAME]

Enclosures: [List all documents]`,

};

module.exports = LETTER_TEMPLATES;
