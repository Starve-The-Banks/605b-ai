import SwiftUI

struct TrackerView: View {
    @EnvironmentObject var appState: AppState
    @State private var showAddDispute = false
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    if appState.disputes.isEmpty {
                        EmptyStateView(
                            icon: "calendar.badge.clock",
                            title: "No Active Disputes",
                            message: "Start tracking your disputes by tapping the + button"
                        )
                        .padding(.top, 40)
                    } else {
                        ForEach(appState.disputes) { dispute in
                            DisputeCard(
                                dispute: dispute,
                                onMarkResponse: { markResponseReceived(dispute) },
                                onEscalate: { escalateDispute(dispute) },
                                onDelete: { deleteDispute(dispute) }
                            )
                        }
                    }
                }
                .padding()
            }
            .background(Theme.background)
            .navigationTitle("Tracker")
            .navigationBarTitleDisplayMode(.large)
            .toolbarBackground(Theme.backgroundSecondary, for: .navigationBar)
            .toolbarBackground(.visible, for: .navigationBar)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        showAddDispute = true
                    } label: {
                        Image(systemName: "plus")
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundColor(Theme.bronze)
                    }
                }
            }
            .sheet(isPresented: $showAddDispute) {
                AddDisputeSheet { dispute in
                    appState.disputes.append(dispute)
                    appState.saveUserData()
                    appState.logAction("DISPUTE_ADDED", details: ["agency": dispute.agency, "type": dispute.disputeType.rawValue])
                }
            }
        }
    }
    
    private func markResponseReceived(_ dispute: Dispute) {
        if let index = appState.disputes.firstIndex(where: { $0.id == dispute.id }) {
            appState.disputes[index].responseReceived = true
            appState.disputes[index].status = .resolved
            appState.saveUserData()
            appState.logAction("RESPONSE_RECEIVED", details: ["agency": dispute.agency])
        }
    }
    
    private func escalateDispute(_ dispute: Dispute) {
        if let index = appState.disputes.firstIndex(where: { $0.id == dispute.id }) {
            appState.disputes[index].status = .escalated
            appState.saveUserData()
            appState.logAction("DISPUTE_ESCALATED", details: ["agency": dispute.agency])
        }
    }
    
    private func deleteDispute(_ dispute: Dispute) {
        appState.disputes.removeAll { $0.id == dispute.id }
        appState.saveUserData()
    }
}

// MARK: - Dispute Card
struct DisputeCard: View {
    let dispute: Dispute
    let onMarkResponse: () -> Void
    let onEscalate: () -> Void
    let onDelete: () -> Void
    
    var borderColor: Color {
        if dispute.isOverdue {
            return Theme.error
        } else if dispute.daysRemaining <= 5 {
            return Theme.warning
        } else {
            return Color(hex: dispute.disputeType.color)
        }
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            // Header
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(dispute.agency)
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundColor(Theme.textPrimary)
                    
                    Text(dispute.accountName)
                        .font(.system(size: 13))
                        .foregroundColor(Theme.textTertiary)
                }
                
                Spacer()
                
                Text(dispute.disputeType.rawValue)
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundColor(Color(hex: dispute.disputeType.color))
                    .padding(.horizontal, 10)
                    .padding(.vertical, 5)
                    .background(Color(hex: dispute.disputeType.color).opacity(0.15))
                    .clipShape(RoundedRectangle(cornerRadius: 6))
            }
            
            // Countdown
            HStack(spacing: 8) {
                Image(systemName: dispute.isOverdue ? "exclamationmark.triangle.fill" : "clock")
                    .foregroundColor(dispute.isOverdue ? Theme.error : (dispute.daysRemaining <= 5 ? Theme.warning : Theme.bronze))
                
                if dispute.responseReceived {
                    Text("Response Received")
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundColor(Theme.success)
                } else if dispute.isOverdue {
                    Text("\(abs(dispute.daysRemaining)) days overdue — VIOLATION")
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundColor(Theme.error)
                } else {
                    Text("\(dispute.daysRemaining) days remaining")
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundColor(dispute.daysRemaining <= 5 ? Theme.warning : Theme.textPrimary)
                }
            }
            
            // Progress bar
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 4)
                        .fill(Theme.surfaceBorder)
                    
                    RoundedRectangle(cornerRadius: 4)
                        .fill(
                            dispute.isOverdue ? Theme.error :
                            (dispute.daysRemaining <= 5 ? Theme.warning : Theme.bronze)
                        )
                        .frame(width: max(0, geo.size.width * progressValue))
                }
            }
            .frame(height: 6)
            
            // Status & dates
            HStack {
                Label(dispute.status.rawValue, systemImage: statusIcon)
                    .font(.system(size: 12, weight: .medium))
                    .foregroundColor(Theme.textTertiary)
                
                Spacer()
                
                Text("Sent: \(dispute.dateSent.formatted(date: .abbreviated, time: .omitted))")
                    .font(.system(size: 12))
                    .foregroundColor(Theme.textMuted)
            }
            
            // Actions
            HStack(spacing: 10) {
                if !dispute.responseReceived {
                    Button {
                        onMarkResponse()
                    } label: {
                        HStack(spacing: 6) {
                            Image(systemName: "checkmark.circle")
                            Text("Got Response")
                        }
                        .font(.system(size: 13, weight: .medium))
                        .foregroundColor(Theme.textSecondary)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 8)
                        .background(Theme.surface)
                        .overlay(
                            RoundedRectangle(cornerRadius: 8)
                                .stroke(Theme.surfaceBorder, lineWidth: 1)
                        )
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                    }
                    
                    if dispute.isOverdue {
                        Button {
                            onEscalate()
                        } label: {
                            HStack(spacing: 6) {
                                Image(systemName: "arrow.up.circle")
                                Text("Escalate")
                            }
                            .font(.system(size: 13, weight: .medium))
                            .foregroundColor(Theme.error)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 8)
                            .background(Theme.error.opacity(0.1))
                            .overlay(
                                RoundedRectangle(cornerRadius: 8)
                                    .stroke(Theme.error.opacity(0.3), lineWidth: 1)
                            )
                            .clipShape(RoundedRectangle(cornerRadius: 8))
                        }
                    }
                }
                
                Spacer()
                
                Button {
                    onDelete()
                } label: {
                    Image(systemName: "trash")
                        .font(.system(size: 14))
                        .foregroundColor(Theme.textMuted)
                        .padding(8)
                }
            }
        }
        .padding(16)
        .background(Theme.cardGradient)
        .overlay(
            Rectangle()
                .fill(borderColor)
                .frame(width: 4),
            alignment: .leading
        )
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .stroke(Color.white.opacity(0.06), lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }
    
    private var progressValue: CGFloat {
        let totalDays = CGFloat(dispute.disputeType.deadline)
        let elapsed = totalDays - CGFloat(dispute.daysRemaining)
        return min(1, max(0, elapsed / totalDays))
    }
    
    private var statusIcon: String {
        switch dispute.status {
        case .pending: return "clock"
        case .investigating: return "magnifyingglass"
        case .resolved: return "checkmark.circle"
        case .escalated: return "arrow.up.circle"
        case .violation: return "exclamationmark.triangle"
        }
    }
}

// MARK: - Add Dispute Sheet
struct AddDisputeSheet: View {
    @Environment(\.dismiss) private var dismiss
    let onSave: (Dispute) -> Void
    
    @State private var agency = ""
    @State private var accountName = ""
    @State private var disputeType: Dispute.DisputeType = .inaccuracy
    @State private var dateSent = Date()
    @State private var notes = ""
    
    let agencies = ["Experian", "Equifax", "TransUnion", "ChexSystems", "Early Warning Services", "Other"]
    
    var body: some View {
        NavigationStack {
            Form {
                Section {
                    Picker("Agency", selection: $agency) {
                        Text("Select Agency").tag("")
                        ForEach(agencies, id: \.self) { agency in
                            Text(agency).tag(agency)
                        }
                    }
                    
                    TextField("Account Name", text: $accountName)
                    
                    Picker("Dispute Type", selection: $disputeType) {
                        ForEach(Dispute.DisputeType.allCases, id: \.self) { type in
                            Text(type.rawValue).tag(type)
                        }
                    }
                    
                    DatePicker("Date Sent", selection: $dateSent, displayedComponents: .date)
                }
                
                Section("Notes (Optional)") {
                    TextField("Additional notes...", text: $notes, axis: .vertical)
                        .lineLimit(3...6)
                }
                
                Section {
                    HStack {
                        Image(systemName: "clock")
                            .foregroundColor(Theme.bronze)
                        Text("Deadline: \(disputeType.deadline) days")
                            .foregroundColor(Theme.textSecondary)
                    }
                }
            }
            .scrollContentBackground(.hidden)
            .background(Theme.background)
            .navigationTitle("Add Dispute")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                    .foregroundColor(Theme.textTertiary)
                }
                
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Save") {
                        let dispute = Dispute(
                            id: UUID().uuidString,
                            agency: agency,
                            accountName: accountName,
                            disputeType: disputeType,
                            status: .pending,
                            dateSent: dateSent,
                            deadlineDate: Calendar.current.date(byAdding: .day, value: disputeType.deadline, to: dateSent) ?? dateSent,
                            notes: notes.isEmpty ? nil : notes,
                            responseReceived: false
                        )
                        onSave(dispute)
                        dismiss()
                    }
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundColor(Theme.bronze)
                    .disabled(agency.isEmpty || accountName.isEmpty)
                }
            }
            .toolbarBackground(Theme.backgroundSecondary, for: .navigationBar)
            .toolbarBackground(.visible, for: .navigationBar)
        }
    }
}

// MARK: - Empty State View
struct EmptyStateView: View {
    let icon: String
    let title: String
    let message: String
    
    var body: some View {
        VStack(spacing: 16) {
            ZStack {
                Circle()
                    .fill(Theme.surface)
                    .frame(width: 64, height: 64)
                
                Image(systemName: icon)
                    .font(.system(size: 26))
                    .foregroundColor(Theme.textMuted)
            }
            
            Text(title)
                .font(.system(size: 16, weight: .semibold))
                .foregroundColor(Theme.textSecondary)
            
            Text(message)
                .font(.system(size: 14))
                .foregroundColor(Theme.textMuted)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(32)
        .cardStyle()
    }
}

#Preview {
    TrackerView()
        .environmentObject(AppState())
}
