import SwiftUI

// MARK: - Flagged View
struct FlaggedView: View {
    @EnvironmentObject var appState: AppState
    
    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if appState.flaggedItems.isEmpty {
                    EmptyStateView(
                        icon: "flag",
                        title: "No Flagged Items",
                        message: "Flag items from your analysis to track them here"
                    )
                    .padding(.top, 40)
                } else {
                    ForEach(appState.flaggedItems) { item in
                        FlaggedItemCard(
                            item: item,
                            onCreateDispute: { createDispute(from: item) },
                            onRemove: { removeItem(item) }
                        )
                    }
                }
            }
            .padding()
        }
        .background(Theme.background)
        .navigationTitle("Flagged Items")
        .navigationBarTitleDisplayMode(.large)
        .toolbarBackground(Theme.backgroundSecondary, for: .navigationBar)
        .toolbarBackground(.visible, for: .navigationBar)
    }
    
    private func createDispute(from item: FlaggedItem) {
        let dispute = Dispute(
            id: UUID().uuidString,
            agency: item.bureau ?? "Unknown",
            accountName: item.account,
            disputeType: .inaccuracy,
            status: .pending,
            dateSent: Date(),
            deadlineDate: Calendar.current.date(byAdding: .day, value: 30, to: Date()) ?? Date(),
            notes: item.issue,
            responseReceived: false
        )
        appState.disputes.append(dispute)
        appState.flaggedItems.removeAll { $0.id == item.id }
        appState.saveUserData()
        appState.logAction("DISPUTE_CREATED_FROM_FLAG", details: ["account": item.account])
    }
    
    private func removeItem(_ item: FlaggedItem) {
        appState.flaggedItems.removeAll { $0.id == item.id }
        appState.saveUserData()
    }
}

struct FlaggedItemCard: View {
    let item: FlaggedItem
    let onCreateDispute: () -> Void
    let onRemove: () -> Void
    
    var severityColor: Color {
        switch item.severity {
        case .high: return Theme.error
        case .medium: return Theme.warning
        case .low: return Theme.success
        }
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text(item.severity.rawValue.uppercased())
                    .font(.system(size: 10, weight: .bold))
                    .foregroundColor(severityColor)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(severityColor.opacity(0.15))
                    .clipShape(RoundedRectangle(cornerRadius: 4))
                
                Text(item.statute)
                    .font(.system(size: 12, weight: .medium))
                    .foregroundColor(Theme.bronze)
                
                Spacer()
                
                Text(item.flaggedAt.formatted(date: .abbreviated, time: .omitted))
                    .font(.system(size: 11))
                    .foregroundColor(Theme.textMuted)
            }
            
            Text(item.account)
                .font(.system(size: 15, weight: .semibold))
                .foregroundColor(Theme.textPrimary)
            
            Text(item.issue)
                .font(.system(size: 14))
                .foregroundColor(Theme.textSecondary)
                .lineSpacing(4)
            
            Text("Success: \(item.successLikelihood)")
                .font(.system(size: 13))
                .foregroundColor(Theme.textTertiary)
            
            HStack(spacing: 10) {
                Button {
                    onCreateDispute()
                } label: {
                    HStack(spacing: 6) {
                        Image(systemName: "plus.circle")
                        Text("Create Dispute")
                    }
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundColor(Theme.background)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 8)
                    .background(Theme.bronzeGradient)
                    .clipShape(RoundedRectangle(cornerRadius: 8))
                }
                
                Spacer()
                
                Button {
                    onRemove()
                } label: {
                    Image(systemName: "xmark")
                        .font(.system(size: 13))
                        .foregroundColor(Theme.textMuted)
                        .padding(8)
                }
            }
        }
        .padding(16)
        .background(Theme.cardGradient)
        .overlay(
            Rectangle()
                .fill(severityColor)
                .frame(width: 4),
            alignment: .leading
        )
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .stroke(Color.white.opacity(0.06), lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }
}

// MARK: - Audit View
struct AuditView: View {
    @EnvironmentObject var appState: AppState
    
    var body: some View {
        ScrollView {
            VStack(spacing: 12) {
                // Notice
                HStack(spacing: 10) {
                    Image(systemName: "info.circle.fill")
                        .foregroundColor(Theme.bronze)
                    
                    Text("This log documents all actions for potential legal proceedings.")
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
                
                if appState.auditLog.isEmpty {
                    EmptyStateView(
                        icon: "list.bullet.rectangle",
                        title: "No Audit Entries",
                        message: "Actions will be logged automatically"
                    )
                    .padding(.top, 20)
                } else {
                    ForEach(appState.auditLog) { entry in
                        AuditEntryRow(entry: entry)
                    }
                }
            }
            .padding()
        }
        .background(Theme.background)
        .navigationTitle("Audit Log")
        .navigationBarTitleDisplayMode(.large)
        .toolbarBackground(Theme.backgroundSecondary, for: .navigationBar)
        .toolbarBackground(.visible, for: .navigationBar)
        .toolbar {
            if !appState.auditLog.isEmpty {
                ToolbarItem(placement: .topBarTrailing) {
                    ShareLink(
                        item: exportAuditLog(),
                        subject: Text("605b.ai Audit Log"),
                        message: Text("Attached is my credit dispute audit log.")
                    ) {
                        Image(systemName: "square.and.arrow.up")
                            .font(.system(size: 14, weight: .medium))
                            .foregroundColor(Theme.bronze)
                    }
                }
            }
        }
    }
    
    private func exportAuditLog() -> String {
        var output = "605b.ai AUDIT LOG\n"
        output += "Generated: \(Date().formatted())\n"
        output += String(repeating: "=", count: 50) + "\n\n"
        
        for entry in appState.auditLog {
            output += "[\(entry.timestamp.formatted())]\n"
            output += "Action: \(entry.action)\n"
            if !entry.details.isEmpty {
                output += "Details: \(entry.details)\n"
            }
            output += "\n"
        }
        
        return output
    }
}

struct AuditEntryRow: View {
    let entry: AuditEntry
    
    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(entry.timestamp.formatted(date: .abbreviated, time: .shortened))
                .font(.system(size: 11, design: .monospaced))
                .foregroundColor(Theme.textMuted)
            
            Text(entry.action)
                .font(.system(size: 13, weight: .semibold, design: .monospaced))
                .foregroundColor(Theme.bronze)
            
            if !entry.details.isEmpty {
                Text(entry.details)
                    .font(.system(size: 12, design: .monospaced))
                    .foregroundColor(Theme.textTertiary)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(14)
        .background(Theme.backgroundCard)
        .overlay(
            RoundedRectangle(cornerRadius: 10)
                .stroke(Color.white.opacity(0.06), lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 10))
    }
}

// MARK: - Resources View
struct ResourcesView: View {
    let resources: [(category: String, links: [(name: String, url: String, desc: String)])] = [
        (
            "Credit Reports",
            [
                ("AnnualCreditReport.com", "https://www.annualcreditreport.com", "Official free reports from all 3 bureaus"),
                ("Experian", "https://www.experian.com", "Direct from Experian"),
                ("Equifax", "https://www.equifax.com", "Direct from Equifax"),
                ("TransUnion", "https://www.transunion.com", "Direct from TransUnion"),
            ]
        ),
        (
            "Specialty Agencies",
            [
                ("ChexSystems", "https://www.chexsystems.com", "Banking history"),
                ("Early Warning Services", "https://www.earlywarning.com", "Bank screening"),
                ("LexisNexis", "https://consumer.risk.lexisnexis.com", "Insurance & background"),
                ("NCTUE", "https://www.nctue.com", "Utility history"),
            ]
        ),
        (
            "Government",
            [
                ("IdentityTheft.gov", "https://www.identitytheft.gov", "FTC identity theft recovery"),
                ("CFPB Complaints", "https://www.consumerfinance.gov/complaint/", "File federal complaints"),
                ("FTC Consumer", "https://consumer.ftc.gov", "Consumer protection"),
                ("State AG Directory", "https://www.naag.org/find-my-ag/", "Find your attorney general"),
            ]
        ),
    ]
    
    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                ForEach(resources, id: \.category) { section in
                    VStack(alignment: .leading, spacing: 12) {
                        Text(section.category)
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundColor(Theme.textTertiary)
                            .textCase(.uppercase)
                            .tracking(0.5)
                        
                        VStack(spacing: 8) {
                            ForEach(section.links, id: \.name) { link in
                                Link(destination: URL(string: link.url)!) {
                                    HStack {
                                        VStack(alignment: .leading, spacing: 2) {
                                            Text(link.name)
                                                .font(.system(size: 15, weight: .medium))
                                                .foregroundColor(Theme.textPrimary)
                                            
                                            Text(link.desc)
                                                .font(.system(size: 13))
                                                .foregroundColor(Theme.textTertiary)
                                        }
                                        
                                        Spacer()
                                        
                                        Image(systemName: "arrow.up.right")
                                            .font(.system(size: 12))
                                            .foregroundColor(Theme.textMuted)
                                    }
                                    .padding(14)
                                    .background(Theme.cardGradient)
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 10)
                                            .stroke(Color.white.opacity(0.06), lineWidth: 1)
                                    )
                                    .clipShape(RoundedRectangle(cornerRadius: 10))
                                }
                            }
                        }
                    }
                }
            }
            .padding()
        }
        .background(Theme.background)
        .navigationTitle("Resources")
        .navigationBarTitleDisplayMode(.large)
        .toolbarBackground(Theme.backgroundSecondary, for: .navigationBar)
        .toolbarBackground(.visible, for: .navigationBar)
    }
}

// MARK: - Settings View
struct SettingsView: View {
    @EnvironmentObject var appState: AppState
    
    var body: some View {
        List {
            Section {
                HStack(spacing: 14) {
                    ZStack {
                        Circle()
                            .fill(Theme.bronze.opacity(0.2))
                            .frame(width: 50, height: 50)
                        
                        Text(String(appState.user?.firstName?.prefix(1) ?? "U"))
                            .font(.system(size: 20, weight: .semibold))
                            .foregroundColor(Theme.bronze)
                    }
                    
                    VStack(alignment: .leading, spacing: 2) {
                        Text(appState.user?.firstName ?? "User")
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundColor(Theme.textPrimary)
                        
                        Text(appState.user?.email ?? "")
                            .font(.system(size: 13))
                            .foregroundColor(Theme.textTertiary)
                    }
                }
                .padding(.vertical, 4)
            }
            
            Section("Data") {
                HStack {
                    Label("Disputes", systemImage: "calendar")
                    Spacer()
                    Text("\(appState.disputes.count)")
                        .foregroundColor(Theme.textTertiary)
                }
                
                HStack {
                    Label("Flagged Items", systemImage: "flag")
                    Spacer()
                    Text("\(appState.flaggedItems.count)")
                        .foregroundColor(Theme.textTertiary)
                }
                
                HStack {
                    Label("Audit Entries", systemImage: "list.bullet")
                    Spacer()
                    Text("\(appState.auditLog.count)")
                        .foregroundColor(Theme.textTertiary)
                }
            }
            
            Section("Legal") {
                Link(destination: URL(string: "https://605b.ai/terms")!) {
                    HStack {
                        Label("Terms of Service", systemImage: "doc.text")
                        Spacer()
                        Image(systemName: "arrow.up.right")
                            .font(.system(size: 12))
                            .foregroundColor(Theme.textMuted)
                    }
                }
                
                Link(destination: URL(string: "https://605b.ai/privacy")!) {
                    HStack {
                        Label("Privacy Policy", systemImage: "hand.raised")
                        Spacer()
                        Image(systemName: "arrow.up.right")
                            .font(.system(size: 12))
                            .foregroundColor(Theme.textMuted)
                    }
                }
            }
            
            Section {
                Button {
                    appState.signOut()
                } label: {
                    HStack {
                        Spacer()
                        Text("Sign Out")
                            .foregroundColor(Theme.error)
                        Spacer()
                    }
                }
            }
            
            Section {
                HStack {
                    Spacer()
                    VStack(spacing: 4) {
                        LogoView()
                        Text("Version 1.0.0")
                            .font(.system(size: 12))
                            .foregroundColor(Theme.textMuted)
                    }
                    Spacer()
                }
            }
            .listRowBackground(Color.clear)
        }
        .scrollContentBackground(.hidden)
        .background(Theme.background)
        .navigationTitle("Settings")
        .navigationBarTitleDisplayMode(.large)
        .toolbarBackground(Theme.backgroundSecondary, for: .navigationBar)
        .toolbarBackground(.visible, for: .navigationBar)
    }
}

// MARK: - Onboarding View
struct OnboardingView: View {
    @EnvironmentObject var appState: AppState
    
    var body: some View {
        VStack(spacing: 0) {
            Spacer()
            
            // Logo & Title
            VStack(spacing: 20) {
                ZStack {
                    Circle()
                        .fill(
                            LinearGradient(
                                colors: [Theme.bronze.opacity(0.2), Theme.bronze.opacity(0.05)],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .frame(width: 100, height: 100)
                    
                    Image(systemName: "shield.checkered")
                        .font(.system(size: 44, weight: .medium))
                        .foregroundColor(Theme.bronze)
                }
                
                VStack(spacing: 8) {
                    HStack(spacing: 0) {
                        Text("605b")
                            .font(.system(size: 36, weight: .bold))
                            .foregroundColor(Theme.textPrimary)
                        
                        Text(".ai")
                            .font(.system(size: 36, weight: .bold))
                            .foregroundStyle(Theme.bronzeGradient)
                    }
                    .tracking(-1)
                    
                    Text("Credit Dispute Intelligence")
                        .font(.system(size: 15))
                        .foregroundColor(Theme.textTertiary)
                }
            }
            
            Spacer()
            
            // Features
            VStack(spacing: 16) {
                FeatureRow(icon: "brain.head.profile", title: "AI-Powered Analysis", description: "Scan reports for disputes & violations")
                FeatureRow(icon: "doc.text", title: "Legal Letter Templates", description: "FCRA & FDCPA compliant templates")
                FeatureRow(icon: "calendar.badge.clock", title: "Deadline Tracking", description: "Never miss a statutory deadline")
            }
            .padding(.horizontal, 32)
            
            Spacer()
            
            // Sign in button
            VStack(spacing: 16) {
                Button {
                    // TODO: Implement actual auth
                    appState.isAuthenticated = true
                } label: {
                    Text("Get Started")
                        .font(.system(size: 17, weight: .semibold))
                        .foregroundColor(Theme.background)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                        .background(Theme.bronzeGradient)
                        .clipShape(RoundedRectangle(cornerRadius: 14))
                }
                
                Text("By continuing, you agree to our Terms of Service")
                    .font(.system(size: 12))
                    .foregroundColor(Theme.textMuted)
            }
            .padding(.horizontal, 24)
            .padding(.bottom, 40)
        }
        .background(Theme.background)
    }
}

struct FeatureRow: View {
    let icon: String
    let title: String
    let description: String
    
    var body: some View {
        HStack(spacing: 16) {
            ZStack {
                RoundedRectangle(cornerRadius: 12)
                    .fill(Theme.bronze.opacity(0.1))
                    .frame(width: 48, height: 48)
                
                Image(systemName: icon)
                    .font(.system(size: 20, weight: .medium))
                    .foregroundColor(Theme.bronze)
            }
            
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundColor(Theme.textPrimary)
                
                Text(description)
                    .font(.system(size: 13))
                    .foregroundColor(Theme.textTertiary)
            }
            
            Spacer()
        }
    }
}

#Preview("Flagged") {
    NavigationStack {
        FlaggedView()
    }
    .environmentObject(AppState())
}

#Preview("Onboarding") {
    OnboardingView()
        .environmentObject(AppState())
}
