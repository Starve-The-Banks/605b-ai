import SwiftUI
import UniformTypeIdentifiers

struct AnalyzeView: View {
    @EnvironmentObject var appState: AppState
    @StateObject private var viewModel = AnalyzeViewModel()
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    // Intro banner
                    IntroBanner()
                    
                    // Upload section
                    UploadSection(viewModel: viewModel)
                    
                    // Analysis results
                    if let result = viewModel.analysisResult {
                        AnalysisResultsView(
                            result: result,
                            flaggedItems: appState.flaggedItems,
                            onFlag: { item in
                                toggleFlag(item)
                            }
                        )
                    }
                    
                    // Resources
                    if viewModel.uploadedFiles.isEmpty && viewModel.analysisResult == nil {
                        ResourcesSection()
                    }
                }
                .padding()
            }
            .background(Theme.background)
            .navigationTitle("Analyze")
            .navigationBarTitleDisplayMode(.large)
            .toolbarBackground(Theme.backgroundSecondary, for: .navigationBar)
            .toolbarBackground(.visible, for: .navigationBar)
            .alert("Error", isPresented: $viewModel.showError) {
                Button("OK", role: .cancel) { }
            } message: {
                Text(viewModel.errorMessage)
            }
        }
    }
    
    private func toggleFlag(_ finding: AnalysisResult.Finding) {
        let item = FlaggedItem(
            id: finding.id,
            account: finding.account,
            issue: finding.issue,
            statute: finding.statute,
            severity: FlaggedItem.Severity(rawValue: finding.severity.lowercased()) ?? .medium,
            successLikelihood: finding.successLikelihood,
            flaggedAt: Date()
        )
        
        if let index = appState.flaggedItems.firstIndex(where: { $0.id == item.id }) {
            appState.flaggedItems.remove(at: index)
        } else {
            appState.flaggedItems.append(item)
            appState.logAction("ITEM_FLAGGED", details: ["account": finding.account])
        }
        appState.saveUserData()
    }
}

// MARK: - Analyze View Model
@MainActor
class AnalyzeViewModel: ObservableObject {
    @Published var uploadedFiles: [(name: String, data: Data)] = []
    @Published var isAnalyzing = false
    @Published var analysisResult: AnalysisResult?
    @Published var showError = false
    @Published var errorMessage = ""
    @Published var showFilePicker = false
    
    func addFile(name: String, data: Data) {
        uploadedFiles.append((name: name, data: data))
    }
    
    func removeFile(at index: Int) {
        uploadedFiles.remove(at: index)
    }
    
    func analyze() {
        guard !uploadedFiles.isEmpty else { return }
        
        isAnalyzing = true
        
        Task {
            do {
                let result = try await APIService.shared.analyzeReports(
                    files: uploadedFiles.map { $0.data },
                    fileNames: uploadedFiles.map { $0.name }
                )
                analysisResult = result
            } catch {
                errorMessage = error.localizedDescription
                showError = true
            }
            
            isAnalyzing = false
        }
    }
}

// MARK: - Intro Banner
struct IntroBanner: View {
    let capabilities = [
        ("magnifyingglass", "Account Verification", "Identifies unrecognized accounts"),
        ("exclamationmark.triangle", "Inconsistency Detection", "Flags cross-bureau discrepancies"),
        ("clock", "Age Analysis", "Spots outdated items"),
        ("scale.3d", "Statute Matching", "Maps to FCRA/FDCPA sections"),
        ("bolt", "Priority Scoring", "Ranks by success likelihood"),
        ("shield", "Identity Theft Markers", "Detects fraud patterns"),
    ]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack(spacing: 12) {
                Image(systemName: "brain.head.profile")
                    .font(.system(size: 18, weight: .medium))
                    .foregroundColor(Theme.bronze)
                
                Text("Comprehensive Credit Analysis")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(Theme.textPrimary)
            }
            
            Text("Upload your credit reports and our AI will scan for inaccuracies, identity theft markers, outdated accounts, and FCRA violations.")
                .font(.system(size: 14))
                .foregroundColor(Theme.textSecondary)
                .lineSpacing(4)
            
            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
                ForEach(capabilities, id: \.1) { cap in
                    HStack(spacing: 10) {
                        ZStack {
                            RoundedRectangle(cornerRadius: 6)
                                .fill(Theme.bronze.opacity(0.15))
                                .frame(width: 28, height: 28)
                            
                            Image(systemName: cap.0)
                                .font(.system(size: 12, weight: .medium))
                                .foregroundColor(Theme.bronze)
                        }
                        
                        VStack(alignment: .leading, spacing: 1) {
                            Text(cap.1)
                                .font(.system(size: 11, weight: .semibold))
                                .foregroundColor(Theme.textPrimary)
                            
                            Text(cap.2)
                                .font(.system(size: 10))
                                .foregroundColor(Theme.textMuted)
                                .lineLimit(1)
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(10)
                    .background(Theme.surfaceBorder.opacity(0.3))
                    .clipShape(RoundedRectangle(cornerRadius: 8))
                }
            }
        }
        .padding(18)
        .background(
            LinearGradient(
                colors: [Theme.bronze.opacity(0.1), Theme.bronze.opacity(0.05)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        )
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .stroke(Theme.bronze.opacity(0.2), lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }
}

// MARK: - Upload Section
struct UploadSection: View {
    @ObservedObject var viewModel: AnalyzeViewModel
    @State private var showFilePicker = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Upload Credit Reports")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(Theme.textPrimary)
                
                Spacer()
                
                HStack(spacing: 6) {
                    Image(systemName: "questionmark.circle")
                        .font(.system(size: 12))
                    Text("Best with all 3 bureaus")
                        .font(.system(size: 11, weight: .medium))
                }
                .foregroundColor(Theme.info)
                .padding(.horizontal, 10)
                .padding(.vertical, 5)
                .background(Theme.info.opacity(0.1))
                .clipShape(Capsule())
            }
            
            // Upload zone
            Button {
                showFilePicker = true
            } label: {
                VStack(spacing: 14) {
                    ZStack {
                        Circle()
                            .fill(Theme.bronze.opacity(0.1))
                            .frame(width: 64, height: 64)
                        
                        Image(systemName: "arrow.up.doc")
                            .font(.system(size: 26, weight: .medium))
                            .foregroundColor(Theme.bronze)
                    }
                    
                    Text("Tap to upload credit reports")
                        .font(.system(size: 15, weight: .medium))
                        .foregroundColor(Theme.textPrimary)
                    
                    Text("PDF files from Experian, Equifax, TransUnion")
                        .font(.system(size: 13))
                        .foregroundColor(Theme.textTertiary)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 36)
                .background(
                    RoundedRectangle(cornerRadius: 14)
                        .stroke(style: StrokeStyle(lineWidth: 2, dash: [8]))
                        .foregroundColor(Theme.surfaceBorder)
                )
                .background(Theme.backgroundCard.opacity(0.5))
                .clipShape(RoundedRectangle(cornerRadius: 14))
            }
            .buttonStyle(.plain)
            .fileImporter(
                isPresented: $showFilePicker,
                allowedContentTypes: [UTType.pdf],
                allowsMultipleSelection: true
            ) { result in
                switch result {
                case .success(let urls):
                    for url in urls {
                        if url.startAccessingSecurityScopedResource() {
                            defer { url.stopAccessingSecurityScopedResource() }
                            if let data = try? Data(contentsOf: url) {
                                viewModel.addFile(name: url.lastPathComponent, data: data)
                            }
                        }
                    }
                case .failure:
                    break
                }
            }
            
            // File list
            if !viewModel.uploadedFiles.isEmpty {
                VStack(spacing: 8) {
                    ForEach(Array(viewModel.uploadedFiles.enumerated()), id: \.offset) { index, file in
                        HStack(spacing: 12) {
                            Image(systemName: "doc.fill")
                                .font(.system(size: 16))
                                .foregroundColor(Theme.bronze)
                            
                            Text(file.name)
                                .font(.system(size: 14))
                                .foregroundColor(Theme.textPrimary)
                                .lineLimit(1)
                            
                            Spacer()
                            
                            Text(formatFileSize(file.data.count))
                                .font(.system(size: 12))
                                .foregroundColor(Theme.textMuted)
                            
                            Button {
                                viewModel.removeFile(at: index)
                            } label: {
                                Image(systemName: "xmark")
                                    .font(.system(size: 12, weight: .medium))
                                    .foregroundColor(Theme.textTertiary)
                                    .padding(6)
                            }
                        }
                        .padding(12)
                        .background(Theme.backgroundCard)
                        .overlay(
                            RoundedRectangle(cornerRadius: 10)
                                .stroke(Color.white.opacity(0.06), lineWidth: 1)
                        )
                        .clipShape(RoundedRectangle(cornerRadius: 10))
                    }
                    
                    // Analyze button
                    Button {
                        viewModel.analyze()
                    } label: {
                        HStack {
                            if viewModel.isAnalyzing {
                                ProgressView()
                                    .tint(Theme.background)
                                Text("Analyzing...")
                            } else {
                                Image(systemName: "magnifyingglass")
                                Text("Analyze \(viewModel.uploadedFiles.count) Report\(viewModel.uploadedFiles.count > 1 ? "s" : "")")
                            }
                        }
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundColor(Theme.background)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(Theme.bronzeGradient)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                    }
                    .disabled(viewModel.isAnalyzing)
                    .opacity(viewModel.isAnalyzing ? 0.7 : 1)
                }
            }
            
            // No reports CTA
            if viewModel.uploadedFiles.isEmpty && viewModel.analysisResult == nil {
                VStack(spacing: 14) {
                    Text("Don't have your reports yet?")
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundColor(Theme.textPrimary)
                    
                    Text("You're entitled to free credit reports from each bureau every week.")
                        .font(.system(size: 13))
                        .foregroundColor(Theme.textTertiary)
                        .multilineTextAlignment(.center)
                    
                    HStack(spacing: 10) {
                        Link(destination: URL(string: "https://www.annualcreditreport.com")!) {
                            HStack(spacing: 6) {
                                Image(systemName: "doc.text")
                                Text("Get Free Reports")
                                Image(systemName: "arrow.up.right")
                                    .font(.system(size: 10))
                            }
                            .font(.system(size: 13, weight: .medium))
                            .foregroundColor(Theme.bronze)
                            .padding(.horizontal, 14)
                            .padding(.vertical, 10)
                            .background(Theme.bronze.opacity(0.1))
                            .overlay(
                                RoundedRectangle(cornerRadius: 8)
                                    .stroke(Theme.bronze.opacity(0.25), lineWidth: 1)
                            )
                            .clipShape(RoundedRectangle(cornerRadius: 8))
                        }
                        
                        Link(destination: URL(string: "https://www.identitytheft.gov")!) {
                            HStack(spacing: 6) {
                                Image(systemName: "shield")
                                Text("Report ID Theft")
                                Image(systemName: "arrow.up.right")
                                    .font(.system(size: 10))
                            }
                            .font(.system(size: 13, weight: .medium))
                            .foregroundColor(Theme.bronze)
                            .padding(.horizontal, 14)
                            .padding(.vertical, 10)
                            .background(Theme.bronze.opacity(0.1))
                            .overlay(
                                RoundedRectangle(cornerRadius: 8)
                                    .stroke(Theme.bronze.opacity(0.25), lineWidth: 1)
                            )
                            .clipShape(RoundedRectangle(cornerRadius: 8))
                        }
                    }
                }
                .frame(maxWidth: .infinity)
                .padding(24)
                .background(Theme.surfaceBorder.opacity(0.3))
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(style: StrokeStyle(lineWidth: 1, dash: [6]))
                        .foregroundColor(Theme.surfaceBorder)
                )
                .clipShape(RoundedRectangle(cornerRadius: 12))
            }
        }
    }
    
    private func formatFileSize(_ bytes: Int) -> String {
        let mb = Double(bytes) / 1_000_000
        return String(format: "%.1f MB", mb)
    }
}

// MARK: - Analysis Results View
struct AnalysisResultsView: View {
    let result: AnalysisResult
    let flaggedItems: [FlaggedItem]
    let onFlag: (AnalysisResult.Finding) -> Void
    
    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            // Summary cards
            if let summary = result.summary {
                HStack(spacing: 12) {
                    SummaryCard(value: "\(summary.totalAccounts)", label: "Accounts", color: Theme.textPrimary)
                    SummaryCard(value: "\(summary.potentialIssues)", label: "Issues", color: Theme.warning)
                    SummaryCard(value: "\(summary.highPriorityItems)", label: "High Priority", color: Theme.error)
                }
            }
            
            // Findings
            if !result.findings.isEmpty {
                Text("Findings")
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundColor(Theme.textPrimary)
                
                ForEach(result.findings) { finding in
                    FindingCard(
                        finding: finding,
                        isFlagged: flaggedItems.contains(where: { $0.id == finding.id }),
                        onFlag: { onFlag(finding) }
                    )
                }
            }
            
            // Positive factors
            if let positives = result.positiveFactors, !positives.isEmpty {
                VStack(alignment: .leading, spacing: 12) {
                    HStack(spacing: 8) {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundColor(Theme.success)
                        Text("Positive Factors")
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundColor(Theme.success)
                    }
                    
                    VStack(alignment: .leading, spacing: 8) {
                        ForEach(positives, id: \.self) { factor in
                            HStack(alignment: .top, spacing: 8) {
                                Circle()
                                    .fill(Theme.success)
                                    .frame(width: 6, height: 6)
                                    .padding(.top, 6)
                                
                                Text(factor)
                                    .font(.system(size: 14))
                                    .foregroundColor(Theme.textSecondary)
                            }
                        }
                    }
                }
                .padding(16)
                .background(Theme.success.opacity(0.08))
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(Theme.success.opacity(0.2), lineWidth: 1)
                )
                .clipShape(RoundedRectangle(cornerRadius: 12))
            }
        }
    }
}

struct SummaryCard: View {
    let value: String
    let label: String
    let color: Color
    
    var body: some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.system(size: 28, weight: .bold))
                .foregroundColor(color)
            
            Text(label)
                .font(.system(size: 12))
                .foregroundColor(Theme.textTertiary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 18)
        .cardStyle()
    }
}

struct FindingCard: View {
    let finding: AnalysisResult.Finding
    let isFlagged: Bool
    let onFlag: () -> Void
    
    var severityColor: Color {
        switch finding.severity.lowercased() {
        case "high": return Theme.error
        case "medium": return Theme.warning
        default: return Theme.success
        }
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text(finding.severity.uppercased())
                    .font(.system(size: 10, weight: .bold))
                    .foregroundColor(severityColor)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(severityColor.opacity(0.15))
                    .clipShape(RoundedRectangle(cornerRadius: 4))
                
                Text(finding.statute)
                    .font(.system(size: 12, weight: .medium))
                    .foregroundColor(Theme.bronze)
                
                Spacer()
                
                Button {
                    onFlag()
                } label: {
                    Image(systemName: isFlagged ? "flag.fill" : "flag")
                        .font(.system(size: 14))
                        .foregroundColor(isFlagged ? Theme.bronze : Theme.textTertiary)
                        .padding(8)
                }
            }
            
            Text(finding.account)
                .font(.system(size: 15, weight: .semibold))
                .foregroundColor(Theme.textPrimary)
            
            Text(finding.issue)
                .font(.system(size: 14))
                .foregroundColor(Theme.textSecondary)
                .lineSpacing(4)
            
            Text("Success: \(finding.successLikelihood)")
                .font(.system(size: 13))
                .foregroundColor(Theme.textTertiary)
        }
        .padding(16)
        .background(Theme.backgroundCard)
        .overlay(
            Rectangle()
                .fill(severityColor)
                .frame(width: 4),
            alignment: .leading
        )
        .overlay(
            RoundedRectangle(cornerRadius: 10)
                .stroke(Color.white.opacity(0.06), lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 10))
    }
}

// MARK: - Resources Section
struct ResourcesSection: View {
    @State private var expandedSection: String?
    
    let sections: [(key: String, title: String, description: String, links: [(name: String, url: String, desc: String, highlight: Bool)])] = [
        (
            key: "reports",
            title: "Get Your Credit Reports",
            description: "Free reports from each bureau weekly",
            links: [
                ("AnnualCreditReport.com", "https://www.annualcreditreport.com", "Official free reports (all 3 bureaus)", true),
                ("Experian", "https://www.experian.com/consumer-products/free-credit-report.html", "Direct from Experian", false),
                ("Equifax", "https://www.equifax.com/personal/credit-report-services/free-credit-reports/", "Direct from Equifax", false),
                ("TransUnion", "https://www.transunion.com/credit-reports/free-credit-reports", "Direct from TransUnion", false),
            ]
        ),
        (
            key: "specialty",
            title: "Specialty Agencies",
            description: "Banking, insurance & background data",
            links: [
                ("ChexSystems", "https://www.chexsystems.com", "Banking history report", false),
                ("Early Warning (EWS)", "https://www.earlywarning.com/consumer-information", "Bank account screening", false),
                ("LexisNexis", "https://consumer.risk.lexisnexis.com/request", "Insurance & background data", false),
            ]
        ),
        (
            key: "government",
            title: "Government Resources",
            description: "Complaints and identity theft",
            links: [
                ("IdentityTheft.gov", "https://www.identitytheft.gov", "FTC identity theft recovery", true),
                ("CFPB Complaint Portal", "https://www.consumerfinance.gov/complaint/", "File federal complaints", false),
                ("State AG Directory", "https://www.naag.org/find-my-ag/", "Find your state attorney general", false),
            ]
        ),
    ]
    
    var body: some View {
        VStack(spacing: 0) {
            ForEach(sections, id: \.key) { section in
                VStack(spacing: 0) {
                    Button {
                        withAnimation {
                            expandedSection = expandedSection == section.key ? nil : section.key
                        }
                    } label: {
                        HStack {
                            VStack(alignment: .leading, spacing: 2) {
                                Text(section.title)
                                    .font(.system(size: 14, weight: .semibold))
                                    .foregroundColor(Theme.textPrimary)
                                
                                Text(section.description)
                                    .font(.system(size: 12))
                                    .foregroundColor(Theme.textTertiary)
                            }
                            
                            Spacer()
                            
                            Image(systemName: "chevron.down")
                                .font(.system(size: 12, weight: .medium))
                                .foregroundColor(Theme.textMuted)
                                .rotationEffect(.degrees(expandedSection == section.key ? 180 : 0))
                        }
                        .padding(14)
                    }
                    .buttonStyle(.plain)
                    
                    if expandedSection == section.key {
                        VStack(spacing: 8) {
                            ForEach(section.links, id: \.name) { link in
                                Link(destination: URL(string: link.url)!) {
                                    HStack {
                                        VStack(alignment: .leading, spacing: 2) {
                                            Text(link.name)
                                                .font(.system(size: 14, weight: .medium))
                                                .foregroundColor(link.highlight ? Theme.bronze : Theme.textPrimary)
                                            
                                            Text(link.desc)
                                                .font(.system(size: 12))
                                                .foregroundColor(Theme.textTertiary)
                                        }
                                        
                                        Spacer()
                                        
                                        Image(systemName: "arrow.up.right")
                                            .font(.system(size: 12))
                                            .foregroundColor(Theme.textMuted)
                                    }
                                    .padding(12)
                                    .background(link.highlight ? Theme.bronze.opacity(0.1) : Theme.surfaceBorder.opacity(0.3))
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 8)
                                            .stroke(link.highlight ? Theme.bronze.opacity(0.25) : Theme.surfaceBorder, lineWidth: 1)
                                    )
                                    .clipShape(RoundedRectangle(cornerRadius: 8))
                                }
                            }
                        }
                        .padding(.horizontal, 14)
                        .padding(.bottom, 14)
                    }
                    
                    if section.key != "government" {
                        Divider()
                            .background(Theme.surfaceBorder)
                    }
                }
            }
        }
        .background(Theme.backgroundCard)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color.white.opacity(0.06), lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }
}

#Preview {
    AnalyzeView()
        .environmentObject(AppState())
}
