import SwiftUI

@main
struct CreditClear605bApp: App {
    @StateObject private var appState = AppState()
    
    var body: some Scene {
        WindowGroup {
            if appState.isAuthenticated {
                MainTabView()
                    .environmentObject(appState)
                    .preferredColorScheme(.dark)
            } else {
                OnboardingView()
                    .environmentObject(appState)
                    .preferredColorScheme(.dark)
            }
        }
    }
}

// MARK: - App State
class AppState: ObservableObject {
    @Published var isAuthenticated = false
    @Published var user: User?
    @Published var disputes: [Dispute] = []
    @Published var flaggedItems: [FlaggedItem] = []
    @Published var auditLog: [AuditEntry] = []
    
    init() {
        // Check for stored auth token
        if let _ = UserDefaults.standard.string(forKey: "authToken") {
            isAuthenticated = true
            loadUserData()
        }
    }
    
    func loadUserData() {
        // Load from local storage
        if let data = UserDefaults.standard.data(forKey: "disputes"),
           let decoded = try? JSONDecoder().decode([Dispute].self, from: data) {
            disputes = decoded
        }
        
        if let data = UserDefaults.standard.data(forKey: "flaggedItems"),
           let decoded = try? JSONDecoder().decode([FlaggedItem].self, from: data) {
            flaggedItems = decoded
        }
        
        if let data = UserDefaults.standard.data(forKey: "auditLog"),
           let decoded = try? JSONDecoder().decode([AuditEntry].self, from: data) {
            auditLog = decoded
        }
    }
    
    func saveUserData() {
        if let encoded = try? JSONEncoder().encode(disputes) {
            UserDefaults.standard.set(encoded, forKey: "disputes")
        }
        if let encoded = try? JSONEncoder().encode(flaggedItems) {
            UserDefaults.standard.set(encoded, forKey: "flaggedItems")
        }
        if let encoded = try? JSONEncoder().encode(auditLog) {
            UserDefaults.standard.set(encoded, forKey: "auditLog")
        }
    }
    
    func logAction(_ action: String, details: [String: Any]? = nil) {
        let entry = AuditEntry(
            id: UUID().uuidString,
            timestamp: Date(),
            action: action,
            details: details?.description ?? ""
        )
        auditLog.insert(entry, at: 0)
        saveUserData()
    }
    
    func signOut() {
        UserDefaults.standard.removeObject(forKey: "authToken")
        isAuthenticated = false
        user = nil
    }
}
