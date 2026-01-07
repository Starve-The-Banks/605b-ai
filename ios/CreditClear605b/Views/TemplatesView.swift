import SwiftUI

struct TemplatesView: View {
    @State private var expandedCategory: String?
    @State private var selectedTemplate: LetterTemplate?
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 12) {
                    ForEach(TemplateData.categories, id: \.name) { category in
                        CategoryCard(
                            category: category,
                            isExpanded: expandedCategory == category.name,
                            onToggle: {
                                withAnimation(.easeInOut(duration: 0.2)) {
                                    expandedCategory = expandedCategory == category.name ? nil : category.name
                                }
                            },
                            onSelectTemplate: { template in
                                selectedTemplate = template
                            }
                        )
                    }
                }
                .padding()
            }
            .background(Theme.background)
            .navigationTitle("Letter Templates")
            .navigationBarTitleDisplayMode(.large)
            .toolbarBackground(Theme.backgroundSecondary, for: .navigationBar)
            .toolbarBackground(.visible, for: .navigationBar)
            .sheet(item: $selectedTemplate) { template in
                TemplateDetailSheet(template: template)
            }
        }
    }
}

// MARK: - Category Card
struct CategoryCard: View {
    let category: TemplateCategory
    let isExpanded: Bool
    let onToggle: () -> Void
    let onSelectTemplate: (LetterTemplate) -> Void
    
    var body: some View {
        VStack(spacing: 0) {
            Button {
                onToggle()
            } label: {
                HStack(spacing: 14) {
                    ZStack {
                        RoundedRectangle(cornerRadius: 10)
                            .fill(Theme.bronze.opacity(0.15))
                            .frame(width: 40, height: 40)
                        
                        Image(systemName: category.icon)
                            .font(.system(size: 16, weight: .medium))
                            .foregroundColor(Theme.bronze)
                    }
                    
                    Text(category.name)
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundColor(Theme.textPrimary)
                    
                    Spacer()
                    
                    Image(systemName: "chevron.down")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(Theme.textMuted)
                        .rotationEffect(.degrees(isExpanded ? 180 : 0))
                }
                .padding(16)
            }
            .buttonStyle(.plain)
            
            if isExpanded {
                VStack(spacing: 0) {
                    ForEach(category.templates) { template in
                        TemplateRow(
                            template: template,
                            onSelect: { onSelectTemplate(template) }
                        )
                    }
                }
            }
        }
        .background(Theme.cardGradient)
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .stroke(Color.white.opacity(0.06), lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }
}

// MARK: - Template Row
struct TemplateRow: View {
    let template: LetterTemplate
    let onSelect: () -> Void
    
    var body: some View {
        VStack(spacing: 0) {
            Divider()
                .background(Color.white.opacity(0.06))
            
            HStack(alignment: .top, spacing: 14) {
                VStack(alignment: .leading, spacing: 6) {
                    Text(template.name)
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(Theme.textPrimary)
                    
                    Text(template.description)
                        .font(.system(size: 13))
                        .foregroundColor(Theme.textTertiary)
                        .lineLimit(2)
                    
                    HStack(spacing: 4) {
                        Image(systemName: "clock")
                            .font(.system(size: 11))
                        Text(template.deadline)
                            .font(.system(size: 12, weight: .medium))
                    }
                    .foregroundColor(Theme.bronze)
                }
                
                Spacer()
                
                if let url = template.externalURL {
                    Link(destination: URL(string: url)!) {
                        HStack(spacing: 4) {
                            Text("Open")
                            Image(systemName: "arrow.up.right")
                                .font(.system(size: 10))
                        }
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundColor(Theme.background)
                        .padding(.horizontal, 14)
                        .padding(.vertical, 8)
                        .background(Theme.bronzeGradient)
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                    }
                } else {
                    Button {
                        onSelect()
                    } label: {
                        HStack(spacing: 4) {
                            Text("Generate")
                            Image(systemName: "chevron.right")
                                .font(.system(size: 10))
                        }
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundColor(Theme.background)
                        .padding(.horizontal, 14)
                        .padding(.vertical, 8)
                        .background(Theme.bronzeGradient)
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                    }
                }
            }
            .padding(16)
        }
    }
}

// MARK: - Template Detail Sheet
struct TemplateDetailSheet: View {
    let template: LetterTemplate
    @Environment(\.dismiss) private var dismiss
    @State private var copySuccess = false
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    // Instructions
                    HStack(alignment: .top, spacing: 10) {
                        Image(systemName: "info.circle.fill")
                            .foregroundColor(Theme.bronze)
                        
                        Text("Replace [BRACKETED] text with your information. Send via certified mail with return receipt.")
                            .font(.system(size: 13))
                            .foregroundColor(Theme.bronze)
                    }
                    .padding(14)
                    .background(Theme.bronze.opacity(0.1))
                    .overlay(
                        RoundedRectangle(cornerRadius: 10)
                            .stroke(Theme.bronze.opacity(0.2), lineWidth: 1)
                    )
                    .clipShape(RoundedRectangle(cornerRadius: 10))
                    
                    // Letter content
                    Text(template.content ?? "Template content loading...")
                        .font(.system(size: 12, design: .monospaced))
                        .foregroundColor(Theme.textSecondary)
                        .lineSpacing(4)
                        .padding(16)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(Theme.surface)
                        .overlay(
                            RoundedRectangle(cornerRadius: 10)
                                .stroke(Color.white.opacity(0.06), lineWidth: 1)
                        )
                        .clipShape(RoundedRectangle(cornerRadius: 10))
                }
                .padding()
            }
            .background(Theme.background)
            .navigationTitle(template.name)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button {
                        dismiss()
                    } label: {
                        Image(systemName: "xmark")
                            .font(.system(size: 14, weight: .medium))
                            .foregroundColor(Theme.textTertiary)
                            .padding(8)
                            .background(Theme.surfaceBorder)
                            .clipShape(Circle())
                    }
                }
                
                ToolbarItem(placement: .topBarTrailing) {
                    HStack(spacing: 12) {
                        Button {
                            if let content = template.content {
                                UIPasteboard.general.string = content
                                copySuccess = true
                                DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
                                    copySuccess = false
                                }
                            }
                        } label: {
                            HStack(spacing: 4) {
                                Image(systemName: copySuccess ? "checkmark" : "doc.on.doc")
                                Text(copySuccess ? "Copied!" : "Copy")
                            }
                            .font(.system(size: 13, weight: .medium))
                            .foregroundColor(Theme.textSecondary)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 8)
                            .background(Theme.surfaceBorder)
                            .clipShape(RoundedRectangle(cornerRadius: 8))
                        }
                        
                        ShareLink(item: template.content ?? "") {
                            HStack(spacing: 4) {
                                Image(systemName: "square.and.arrow.up")
                                Text("Share")
                            }
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundColor(Theme.background)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 8)
                            .background(Theme.bronzeGradient)
                            .clipShape(RoundedRectangle(cornerRadius: 8))
                        }
                    }
                }
            }
            .toolbarBackground(Theme.backgroundSecondary, for: .navigationBar)
            .toolbarBackground(.visible, for: .navigationBar)
        }
    }
}

// MARK: - Template Data
struct TemplateCategory {
    let name: String
    let icon: String
    let templates: [LetterTemplate]
}

struct TemplateData {
    static let categories: [TemplateCategory] = [
        TemplateCategory(
            name: "Identity Theft Recovery",
            icon: "shield.fill",
            templates: [
                LetterTemplate(
                    id: "605b_bureau",
                    name: "§605B Identity Theft Block (Bureau)",
                    description: "Demand credit bureaus block all fraudulent accounts within 4 business days",
                    deadline: "4 business days",
                    category: .identityTheft,
                    externalURL: nil,
                    content: TemplateContent.block605B
                ),
                LetterTemplate(
                    id: "605b_furnisher",
                    name: "§605B Direct to Furnisher",
                    description: "Send block demand directly to the creditor/furnisher",
                    deadline: "4 business days",
                    category: .identityTheft,
                    externalURL: nil,
                    content: TemplateContent.block605BFurnisher
                ),
                LetterTemplate(
                    id: "ftc_affidavit",
                    name: "FTC Identity Theft Report",
                    description: "Create official FTC identity theft report at IdentityTheft.gov",
                    deadline: "N/A",
                    category: .identityTheft,
                    externalURL: "https://www.identitytheft.gov/",
                    content: nil
                ),
            ]
        ),
        TemplateCategory(
            name: "Credit Bureau Disputes",
            icon: "exclamationmark.triangle.fill",
            templates: [
                LetterTemplate(
                    id: "611_dispute",
                    name: "§611 Standard Dispute",
                    description: "Challenge inaccurate information with credit bureaus - 30 day investigation required",
                    deadline: "30 days",
                    category: .disputes,
                    externalURL: nil,
                    content: TemplateContent.dispute611
                ),
                LetterTemplate(
                    id: "609_disclosure",
                    name: "§609 Method of Verification",
                    description: "Demand proof of HOW they verified disputed information",
                    deadline: "15 days",
                    category: .disputes,
                    externalURL: nil,
                    content: TemplateContent.verification609
                ),
                LetterTemplate(
                    id: "623_direct",
                    name: "§623 Direct Furnisher Dispute",
                    description: "Dispute directly with the company reporting the information",
                    deadline: "30 days",
                    category: .disputes,
                    externalURL: nil,
                    content: TemplateContent.directFurnisher623
                ),
            ]
        ),
        TemplateCategory(
            name: "Debt Collection Defense",
            icon: "dollarsign.circle.fill",
            templates: [
                LetterTemplate(
                    id: "809_validation",
                    name: "§809 Debt Validation Demand",
                    description: "Force collector to prove the debt is valid and they can collect",
                    deadline: "30 days",
                    category: .debtCollection,
                    externalURL: nil,
                    content: TemplateContent.validation809
                ),
                LetterTemplate(
                    id: "cease_desist",
                    name: "Cease & Desist Letter",
                    description: "Legally stop all collector phone calls and contact",
                    deadline: "Immediate",
                    category: .debtCollection,
                    externalURL: nil,
                    content: TemplateContent.ceaseDesist
                ),
            ]
        ),
        TemplateCategory(
            name: "Specialty Agencies",
            icon: "building.2.fill",
            templates: [
                LetterTemplate(
                    id: "chex_dispute",
                    name: "ChexSystems Dispute",
                    description: "Dispute banking history blocking account approvals",
                    deadline: "30 days",
                    category: .specialty,
                    externalURL: nil,
                    content: TemplateContent.chexDispute
                ),
                LetterTemplate(
                    id: "ews_dispute",
                    name: "Early Warning Services Dispute",
                    description: "Dispute EWS records affecting bank account approvals",
                    deadline: "30 days",
                    category: .specialty,
                    externalURL: nil,
                    content: TemplateContent.ewsDispute
                ),
            ]
        ),
        TemplateCategory(
            name: "Escalation & Legal",
            icon: "scale.3d",
            templates: [
                LetterTemplate(
                    id: "cfpb_complaint",
                    name: "CFPB Complaint Portal",
                    description: "File federal complaint - companies respond 95%+ of time",
                    deadline: "15-60 days",
                    category: .escalation,
                    externalURL: "https://www.consumerfinance.gov/complaint/",
                    content: nil
                ),
                LetterTemplate(
                    id: "intent_to_sue",
                    name: "Intent to Sue / Final Demand",
                    description: "Final warning letter before filing lawsuit",
                    deadline: "15-30 days",
                    category: .escalation,
                    externalURL: nil,
                    content: TemplateContent.intentToSue
                ),
            ]
        ),
    ]
}

// MARK: - Template Content
struct TemplateContent {
    static let block605B = """
    [YOUR NAME]
    [YOUR ADDRESS]
    [CITY, STATE ZIP]
    [DATE]
    
    [CREDIT BUREAU NAME]
    [BUREAU ADDRESS]
    
    Re: FCRA §605B Identity Theft Block Request
    SSN: XXX-XX-[LAST 4]
    
    To Whom It May Concern:
    
    I am a victim of identity theft. Pursuant to FCRA §605B, I demand that you block the following fraudulent information from my credit report within 4 business days:
    
    FRAUDULENT ACCOUNT(S):
    • Creditor: [CREDITOR NAME]
    • Account Number: [ACCOUNT NUMBER]
    • Reason: This account was opened fraudulently without my knowledge or consent
    
    I have enclosed the following required documents:
    1. Copy of my FTC Identity Theft Report
    2. Proof of my identity (government-issued ID)
    3. Proof of address (utility bill)
    
    Under FCRA §605B(a), you must block this information within 4 business days of receipt. Failure to comply may result in civil liability under §616 and §617.
    
    Sincerely,
    
    [YOUR SIGNATURE]
    [YOUR PRINTED NAME]
    
    Enclosures:
    - FTC Identity Theft Report
    - Copy of ID
    - Proof of Address
    """
    
    static let block605BFurnisher = """
    [YOUR NAME]
    [YOUR ADDRESS]
    [CITY, STATE ZIP]
    [DATE]
    
    [FURNISHER/CREDITOR NAME]
    [FURNISHER ADDRESS]
    
    Re: FCRA §605B(b) Identity Theft Block Notice - Direct to Furnisher
    Account: [ACCOUNT NUMBER]
    
    To Whom It May Concern:
    
    I am a victim of identity theft. The above-referenced account was opened fraudulently in my name without my authorization.
    
    Pursuant to FCRA §605B(b), I am providing you with my FTC Identity Theft Report and demand that you:
    
    1. Cease collection of this fraudulent debt immediately
    2. Remove this account from my credit reports with all bureaus
    3. Provide written confirmation of deletion within 30 days
    
    Under FCRA §623(a)(6), furnishers who receive an identity theft report are prohibited from reporting blocked information.
    
    Enclosed:
    - FTC Identity Theft Report
    - Copy of government-issued ID
    
    Sincerely,
    
    [YOUR SIGNATURE]
    [YOUR PRINTED NAME]
    """
    
    static let dispute611 = """
    [YOUR NAME]
    [YOUR ADDRESS]
    [CITY, STATE ZIP]
    [DATE]
    
    [CREDIT BUREAU NAME]
    [BUREAU ADDRESS]
    
    Re: FCRA §611 Dispute - Request for Investigation
    SSN: XXX-XX-[LAST 4]
    
    To Whom It May Concern:
    
    Pursuant to FCRA §611, I am disputing the following inaccurate information on my credit report:
    
    DISPUTED ITEM(S):
    Creditor: [CREDITOR NAME]
    Account Number: [ACCOUNT NUMBER]
    Reason for Dispute: [SPECIFIC REASON - e.g., "This account shows a late payment in March 2024, but I have bank records showing payment was made on time"]
    
    Under FCRA §611(a), you must:
    1. Conduct a reasonable investigation within 30 days
    2. Forward all relevant information to the furnisher
    3. Provide me with written results, including any changes made
    
    Please provide written confirmation of your investigation results.
    
    Sincerely,
    
    [YOUR SIGNATURE]
    [YOUR PRINTED NAME]
    
    Enclosures (if applicable):
    - [Supporting documentation]
    """
    
    static let verification609 = """
    [YOUR NAME]
    [YOUR ADDRESS]
    [CITY, STATE ZIP]
    [DATE]
    
    [CREDIT BUREAU NAME]
    [BUREAU ADDRESS]
    
    Re: FCRA §609 - Method of Verification Request
    SSN: XXX-XX-[LAST 4]
    Previous Dispute Reference: [IF APPLICABLE]
    
    To Whom It May Concern:
    
    Following my previous dispute regarding [ACCOUNT NAME/NUMBER], you indicated the information was "verified."
    
    Pursuant to FCRA §611(a)(7), I request the following within 15 days:
    
    1. Description of the procedure used to determine accuracy
    2. Name, address, and phone number of the furnisher contacted
    3. The specific method used to verify the information
    
    Note: A generic response stating information was "verified with the creditor" is insufficient under FCRA requirements.
    
    Sincerely,
    
    [YOUR SIGNATURE]
    [YOUR PRINTED NAME]
    """
    
    static let directFurnisher623 = """
    [YOUR NAME]
    [YOUR ADDRESS]
    [CITY, STATE ZIP]
    [DATE]
    
    [FURNISHER/CREDITOR NAME]
    [FURNISHER ADDRESS]
    
    Re: FCRA §623 Direct Dispute
    Account: [ACCOUNT NUMBER]
    
    To Whom It May Concern:
    
    Pursuant to FCRA §623(a)(8), I am disputing information you are furnishing to credit bureaus regarding the above account.
    
    DISPUTE DETAILS:
    Information Disputed: [SPECIFIC INFORMATION]
    Reason: [WHY IT'S INACCURATE]
    
    Under FCRA §623(b), upon receipt of this dispute, you must:
    1. Conduct an investigation
    2. Review all relevant information I've provided
    3. Report results to me and the credit bureaus
    4. Modify, delete, or permanently block reporting of inaccurate information
    
    Sincerely,
    
    [YOUR SIGNATURE]
    [YOUR PRINTED NAME]
    """
    
    static let validation809 = """
    [YOUR NAME]
    [YOUR ADDRESS]
    [CITY, STATE ZIP]
    [DATE]
    
    [COLLECTION AGENCY NAME]
    [AGENCY ADDRESS]
    
    Re: FDCPA §809 Debt Validation Demand
    Account Reference: [THEIR REFERENCE NUMBER]
    
    To Whom It May Concern:
    
    I am responding to your contact about an alleged debt. Pursuant to FDCPA §809(b), I request validation of this debt within 30 days:
    
    REQUIRED INFORMATION:
    1. Amount of the debt and how it was calculated
    2. Name and address of the original creditor
    3. Proof that you are licensed to collect in my state
    4. Copy of the original signed contract or agreement
    5. Complete payment history from the original creditor
    
    Until you provide this validation:
    • You must cease all collection activity (§809(b))
    • You cannot report this to credit bureaus
    • Any continued collection violates federal law
    
    Sincerely,
    
    [YOUR SIGNATURE]
    [YOUR PRINTED NAME]
    """
    
    static let ceaseDesist = """
    [YOUR NAME]
    [YOUR ADDRESS]
    [CITY, STATE ZIP]
    [DATE]
    
    [COLLECTION AGENCY NAME]
    [AGENCY ADDRESS]
    
    Re: Cease and Desist Communication - FDCPA §805(c)
    Account Reference: [THEIR REFERENCE NUMBER]
    
    To Whom It May Concern:
    
    Pursuant to FDCPA §805(c), I demand that you CEASE ALL COMMUNICATION with me regarding the above-referenced account.
    
    This includes but is not limited to:
    • Phone calls to any number
    • Letters or mailings
    • Emails or text messages
    • Contact with third parties
    
    Under FDCPA §805(c), you may only contact me to:
    1. Advise that collection efforts are being terminated
    2. Notify me of specific legal action being taken
    
    Any further communication beyond these exceptions will be considered harassment and will be documented for potential legal action.
    
    Sincerely,
    
    [YOUR SIGNATURE]
    [YOUR PRINTED NAME]
    
    SENT VIA CERTIFIED MAIL: [TRACKING NUMBER]
    """
    
    static let chexDispute = """
    [YOUR NAME]
    [YOUR ADDRESS]
    [CITY, STATE ZIP]
    [DATE]
    
    ChexSystems, Inc.
    Attn: Consumer Relations
    7805 Hudson Road, Suite 100
    Woodbury, MN 55125
    
    Re: Dispute of Inaccurate Information
    
    To Whom It May Concern:
    
    I am disputing the following information on my ChexSystems report:
    
    DISPUTED ITEM:
    Bank Name: [BANK NAME]
    Account Type: [CHECKING/SAVINGS]
    Reported Amount: [AMOUNT IF APPLICABLE]
    Reason for Dispute: [SPECIFIC REASON]
    
    Please investigate and remove this inaccurate information. Under FCRA, you have 30 days to investigate.
    
    Sincerely,
    
    [YOUR SIGNATURE]
    [YOUR PRINTED NAME]
    
    Enclosures:
    - Copy of ID
    - Proof of Address
    """
    
    static let ewsDispute = """
    [YOUR NAME]
    [YOUR ADDRESS]
    [CITY, STATE ZIP]
    [DATE]
    
    Early Warning Services, LLC
    16552 N. 90th Street
    Scottsdale, AZ 85260
    
    Re: Dispute of Reported Information
    
    To Whom It May Concern:
    
    I am disputing information on my Early Warning Services consumer report:
    
    DISPUTED ITEM:
    Reporting Institution: [BANK NAME]
    Issue: [DESCRIBE THE ISSUE]
    
    Please investigate this matter and provide written results within 30 days as required by FCRA.
    
    Sincerely,
    
    [YOUR SIGNATURE]
    [YOUR PRINTED NAME]
    
    Enclosures:
    - Copy of government ID
    - Proof of current address
    """
    
    static let intentToSue = """
    [YOUR NAME]
    [YOUR ADDRESS]
    [CITY, STATE ZIP]
    [DATE]
    
    VIA CERTIFIED MAIL - RETURN RECEIPT REQUESTED
    
    [COMPANY NAME]
    [COMPANY ADDRESS]
    
    Re: FINAL DEMAND - Intent to Pursue Legal Action
    Account/Reference: [NUMBER]
    
    To Whom It May Concern:
    
    Despite my previous communications, you have failed to [DESCRIBE VIOLATION - e.g., "remove inaccurate information," "properly validate the debt," "cease illegal collection activity"].
    
    DOCUMENTED VIOLATIONS:
    1. [Specific violation with date]
    2. [Specific violation with date]
    3. [Specific violation with date]
    
    DEMAND:
    You have 15 days from receipt of this letter to [SPECIFIC RESOLUTION DEMANDED].
    
    If you fail to resolve this matter, I will pursue all available legal remedies including:
    • Filing a lawsuit in [Federal/State] court
    • Seeking statutory damages under [FCRA §616-617 / FDCPA §813]
    • Seeking actual damages and attorney's fees
    
    This is your final opportunity to resolve this matter without litigation.
    
    Sincerely,
    
    [YOUR SIGNATURE]
    [YOUR PRINTED NAME]
    
    CC: Consumer Financial Protection Bureau
    """
}

#Preview {
    TemplatesView()
}
