import Foundation

// MARK: - User
struct User: Codable, Identifiable {
    let id: String
    var firstName: String?
    var lastName: String?
    var email: String
}

// MARK: - Chat Message
struct ChatMessage: Identifiable, Equatable {
    let id: String
    let role: MessageRole
    var content: String
    let timestamp: Date
    var isError: Bool = false
    
    enum MessageRole: String, Codable {
        case user
        case assistant
    }
    
    init(id: String = UUID().uuidString, role: MessageRole, content: String, timestamp: Date = Date(), isError: Bool = false) {
        self.id = id
        self.role = role
        self.content = content
        self.timestamp = timestamp
        self.isError = isError
    }
}

// MARK: - Dispute
struct Dispute: Codable, Identifiable {
    let id: String
    var agency: String
    var accountName: String
    var disputeType: DisputeType
    var status: DisputeStatus
    var dateSent: Date
    var deadlineDate: Date
    var notes: String?
    var responseReceived: Bool
    
    enum DisputeType: String, Codable, CaseIterable {
        case identityTheft = "Identity Theft (§605B)"
        case inaccuracy = "Inaccuracy (§611)"
        case debtValidation = "Debt Validation (§809)"
        case directFurnisher = "Direct Furnisher (§623)"
        
        var deadline: Int {
            switch self {
            case .identityTheft: return 4
            case .inaccuracy, .debtValidation, .directFurnisher: return 30
            }
        }
        
        var color: String {
            switch self {
            case .identityTheft: return "ef4444"
            case .inaccuracy: return "f59e0b"
            case .debtValidation: return "3b82f6"
            case .directFurnisher: return "22c55e"
            }
        }
    }
    
    enum DisputeStatus: String, Codable, CaseIterable {
        case pending = "Pending"
        case investigating = "Under Investigation"
        case resolved = "Resolved"
        case escalated = "Escalated"
        case violation = "Deadline Violated"
    }
    
    var daysRemaining: Int {
        Calendar.current.dateComponents([.day], from: Date(), to: deadlineDate).day ?? 0
    }
    
    var isOverdue: Bool {
        daysRemaining < 0 && !responseReceived
    }
}

// MARK: - Flagged Item
struct FlaggedItem: Codable, Identifiable {
    let id: String
    var account: String
    var issue: String
    var statute: String
    var severity: Severity
    var successLikelihood: String
    var flaggedAt: Date
    var bureau: String?
    var notes: String?
    
    enum Severity: String, Codable, CaseIterable {
        case high
        case medium
        case low
        
        var color: String {
            switch self {
            case .high: return "ef4444"
            case .medium: return "f59e0b"
            case .low: return "22c55e"
            }
        }
    }
}

// MARK: - Audit Entry
struct AuditEntry: Codable, Identifiable {
    let id: String
    let timestamp: Date
    let action: String
    let details: String
}

// MARK: - Analysis Result
struct AnalysisResult: Codable {
    var summary: Summary?
    var findings: [Finding]
    var positiveFactors: [String]?
    var crossBureauInconsistencies: [Inconsistency]?
    var personalInfo: PersonalInfo?
    
    struct Summary: Codable {
        var totalAccounts: Int
        var potentialIssues: Int
        var highPriorityItems: Int
        var estimatedDisputeTime: String?
    }
    
    struct Finding: Codable, Identifiable {
        var id: String { "\(account)-\(issue)" }
        var account: String
        var issue: String
        var statute: String
        var severity: String
        var successLikelihood: String
        var recommendation: String?
    }
    
    struct Inconsistency: Codable {
        var item: String
        var details: String
    }
    
    struct PersonalInfo: Codable {
        var namesFound: [String]?
        var addressesFound: [String]?
        var employersFound: [String]?
        var potentiallyUnfamiliar: [String]?
    }
}

// MARK: - Letter Template
struct LetterTemplate: Identifiable {
    let id: String
    let name: String
    let description: String
    let deadline: String
    let category: TemplateCategory
    let externalURL: String?
    let content: String?
    
    enum TemplateCategory: String, CaseIterable {
        case identityTheft = "Identity Theft Recovery"
        case disputes = "Credit Bureau Disputes"
        case debtCollection = "Debt Collection Defense"
        case specialty = "Specialty Agencies"
        case medical = "Medical Debt"
        case goodwill = "Goodwill Requests"
        case escalation = "Escalation & Legal"
        
        var icon: String {
            switch self {
            case .identityTheft: return "shield.fill"
            case .disputes: return "exclamationmark.triangle.fill"
            case .debtCollection: return "dollarsign.circle.fill"
            case .specialty: return "building.2.fill"
            case .medical: return "heart.fill"
            case .goodwill: return "creditcard.fill"
            case .escalation: return "scale.3d"
            }
        }
    }
}

// MARK: - Quick Start Option
struct QuickStartOption: Identifiable {
    let id = UUID()
    let text: String
    let icon: String
}
