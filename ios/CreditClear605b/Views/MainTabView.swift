import SwiftUI

struct MainTabView: View {
    @EnvironmentObject var appState: AppState
    @State private var selectedTab = 0
    
    var body: some View {
        TabView(selection: $selectedTab) {
            AnalyzeView()
                .tabItem {
                    Image(systemName: "magnifyingglass")
                    Text("Analyze")
                }
                .tag(0)
            
            ChatView()
                .tabItem {
                    Image(systemName: "sparkles")
                    Text("AI")
                }
                .tag(1)
            
            TemplatesView()
                .tabItem {
                    Image(systemName: "doc.text")
                    Text("Letters")
                }
                .tag(2)
            
            TrackerView()
                .tabItem {
                    Image(systemName: "calendar")
                    Text("Track")
                }
                .tag(3)
            
            MoreView()
                .tabItem {
                    Image(systemName: "ellipsis")
                    Text("More")
                }
                .tag(4)
        }
        .tint(Theme.bronze)
        .onAppear {
            // Style the tab bar
            let appearance = UITabBarAppearance()
            appearance.configureWithOpaqueBackground()
            appearance.backgroundColor = UIColor(Theme.backgroundSecondary)
            appearance.stackedLayoutAppearance.normal.iconColor = UIColor(Theme.textMuted)
            appearance.stackedLayoutAppearance.normal.titleTextAttributes = [.foregroundColor: UIColor(Theme.textMuted)]
            appearance.stackedLayoutAppearance.selected.iconColor = UIColor(Theme.bronze)
            appearance.stackedLayoutAppearance.selected.titleTextAttributes = [.foregroundColor: UIColor(Theme.bronze)]
            
            UITabBar.appearance().standardAppearance = appearance
            UITabBar.appearance().scrollEdgeAppearance = appearance
        }
    }
}

// MARK: - More View (Flagged + Audit + Settings)
struct MoreView: View {
    @EnvironmentObject var appState: AppState
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 12) {
                    NavigationLink {
                        FlaggedView()
                    } label: {
                        MoreMenuRow(
                            icon: "flag.fill",
                            title: "Flagged Items",
                            subtitle: "\(appState.flaggedItems.count) items",
                            color: Theme.warning
                        )
                    }
                    
                    NavigationLink {
                        AuditView()
                    } label: {
                        MoreMenuRow(
                            icon: "list.bullet.rectangle",
                            title: "Audit Log",
                            subtitle: "\(appState.auditLog.count) entries",
                            color: Theme.info
                        )
                    }
                    
                    Divider()
                        .background(Theme.surfaceBorder)
                        .padding(.vertical, 8)
                    
                    NavigationLink {
                        ResourcesView()
                    } label: {
                        MoreMenuRow(
                            icon: "link",
                            title: "Resources",
                            subtitle: "Bureaus, agencies & gov sites",
                            color: Theme.bronze
                        )
                    }
                    
                    NavigationLink {
                        SettingsView()
                    } label: {
                        MoreMenuRow(
                            icon: "gear",
                            title: "Settings",
                            subtitle: "Account & preferences",
                            color: Theme.textTertiary
                        )
                    }
                }
                .padding()
            }
            .background(Theme.background)
            .navigationTitle("More")
            .navigationBarTitleDisplayMode(.large)
            .toolbarBackground(Theme.backgroundSecondary, for: .navigationBar)
            .toolbarBackground(.visible, for: .navigationBar)
        }
    }
}

struct MoreMenuRow: View {
    let icon: String
    let title: String
    let subtitle: String
    let color: Color
    
    var body: some View {
        HStack(spacing: 14) {
            ZStack {
                RoundedRectangle(cornerRadius: 10)
                    .fill(color.opacity(0.15))
                    .frame(width: 40, height: 40)
                
                Image(systemName: icon)
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(color)
            }
            
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundColor(Theme.textPrimary)
                
                Text(subtitle)
                    .font(.system(size: 13))
                    .foregroundColor(Theme.textTertiary)
            }
            
            Spacer()
            
            Image(systemName: "chevron.right")
                .font(.system(size: 14, weight: .medium))
                .foregroundColor(Theme.textMuted)
        }
        .padding(14)
        .background(Theme.cardGradient)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color.white.opacity(0.06), lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }
}

// MARK: - Preview
#Preview {
    MainTabView()
        .environmentObject(AppState())
}
