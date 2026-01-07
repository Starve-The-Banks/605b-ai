import SwiftUI

struct ChatView: View {
    @EnvironmentObject var appState: AppState
    @StateObject private var viewModel = ChatViewModel()
    @FocusState private var isInputFocused: Bool
    
    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Messages area
                ScrollViewReader { proxy in
                    ScrollView {
                        LazyVStack(spacing: 16) {
                            if viewModel.showIntro {
                                IntroSection(onQuickStart: { text in
                                    viewModel.sendMessage(text)
                                })
                                .transition(.opacity.combined(with: .move(edge: .top)))
                            }
                            
                            ForEach(viewModel.messages) { message in
                                MessageBubble(message: message)
                                    .id(message.id)
                            }
                            
                            if viewModel.isLoading {
                                TypingIndicator()
                                    .id("typing")
                            }
                        }
                        .padding()
                    }
                    .onChange(of: viewModel.messages.count) { _, _ in
                        withAnimation {
                            proxy.scrollTo(viewModel.messages.last?.id ?? "typing", anchor: .bottom)
                        }
                    }
                }
                
                // Input area
                InputArea(
                    text: $viewModel.inputText,
                    isLoading: viewModel.isLoading,
                    isFocused: $isInputFocused,
                    onSend: {
                        viewModel.sendMessage(viewModel.inputText)
                    }
                )
            }
            .background(Theme.background)
            .navigationTitle("")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .principal) {
                    LogoView()
                }
                
                ToolbarItem(placement: .topBarTrailing) {
                    if !viewModel.messages.isEmpty {
                        Button {
                            viewModel.resetChat()
                        } label: {
                            Image(systemName: "arrow.counterclockwise")
                                .font(.system(size: 15, weight: .medium))
                                .foregroundColor(Theme.textTertiary)
                        }
                    }
                }
            }
            .toolbarBackground(Theme.backgroundSecondary, for: .navigationBar)
            .toolbarBackground(.visible, for: .navigationBar)
        }
    }
}

// MARK: - Chat View Model
@MainActor
class ChatViewModel: ObservableObject {
    @Published var messages: [ChatMessage] = []
    @Published var inputText = ""
    @Published var isLoading = false
    @Published var showIntro = true
    
    func sendMessage(_ text: String) {
        let trimmedText = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmedText.isEmpty else { return }
        
        withAnimation {
            showIntro = false
        }
        
        inputText = ""
        
        let userMessage = ChatMessage(role: .user, content: trimmedText)
        messages.append(userMessage)
        
        isLoading = true
        
        Task {
            do {
                let response = try await APIService.shared.sendChatMessageSimple(
                    messages: messages,
                    systemPrompt: SystemPrompts.chatStrategist
                )
                
                let assistantMessage = ChatMessage(role: .assistant, content: response)
                messages.append(assistantMessage)
            } catch {
                let errorMessage = ChatMessage(
                    role: .assistant,
                    content: "Connection error. Please try again.",
                    isError: true
                )
                messages.append(errorMessage)
            }
            
            isLoading = false
        }
    }
    
    func resetChat() {
        withAnimation {
            messages.removeAll()
            showIntro = true
        }
    }
}

// MARK: - Intro Section
struct IntroSection: View {
    let onQuickStart: (String) -> Void
    
    let quickStarts = [
        QuickStartOption(text: "I'm a victim of identity theft", icon: "shield.fill"),
        QuickStartOption(text: "I have collections to dispute", icon: "doc.text.fill"),
        QuickStartOption(text: "Break down my rights under FCRA", icon: "scale.3d"),
        QuickStartOption(text: "What's the fastest path to clean credit?", icon: "bolt.fill"),
    ]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            // Header
            HStack(spacing: 14) {
                ZStack {
                    RoundedRectangle(cornerRadius: 14)
                        .fill(
                            LinearGradient(
                                colors: [Theme.bronze.opacity(0.2), Theme.bronze.opacity(0.1)],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .frame(width: 52, height: 52)
                    
                    Image(systemName: "sparkles")
                        .font(.system(size: 24, weight: .medium))
                        .foregroundColor(Theme.bronze)
                }
                
                VStack(alignment: .leading, spacing: 2) {
                    Text("AI Credit Strategist")
                        .font(.system(size: 20, weight: .semibold))
                        .foregroundColor(Theme.textPrimary)
                    
                    Text("FCRA · FDCPA · Consumer Protection")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundColor(Theme.textTertiary)
                        .tracking(0.3)
                }
            }
            
            // Intro text
            Text(SystemPrompts.introMessage)
                .font(.system(size: 15))
                .foregroundColor(Theme.textSecondary)
                .lineSpacing(6)
                .fixedSize(horizontal: false, vertical: true)
            
            // Quick starts
            VStack(spacing: 10) {
                ForEach(quickStarts) { option in
                    Button {
                        onQuickStart(option.text)
                    } label: {
                        HStack(spacing: 12) {
                            ZStack {
                                RoundedRectangle(cornerRadius: 8)
                                    .fill(Theme.surfaceBorder)
                                    .frame(width: 34, height: 34)
                                
                                Image(systemName: option.icon)
                                    .font(.system(size: 14, weight: .medium))
                                    .foregroundColor(Theme.textSecondary)
                            }
                            
                            Text(option.text)
                                .font(.system(size: 14, weight: .medium))
                                .foregroundColor(Theme.textSecondary)
                            
                            Spacer()
                            
                            Image(systemName: "arrow.right")
                                .font(.system(size: 12, weight: .medium))
                                .foregroundColor(Theme.textMuted)
                        }
                        .padding(12)
                        .background(Theme.surface)
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                .stroke(Theme.surfaceBorder, lineWidth: 1)
                        )
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.top, 8)
        }
        .padding(.vertical, 8)
    }
}

// MARK: - Message Bubble
struct MessageBubble: View {
    let message: ChatMessage
    
    var body: some View {
        HStack {
            if message.role == .user { Spacer(minLength: 40) }
            
            Text(message.content)
                .font(.system(size: 15))
                .foregroundColor(message.role == .user ? Theme.background : Theme.textPrimary)
                .lineSpacing(4)
                .padding(.horizontal, 16)
                .padding(.vertical, 12)
                .background(
                    message.role == .user
                    ? AnyView(Theme.bronzeGradient)
                    : AnyView(
                        message.isError
                        ? Theme.error.opacity(0.15)
                        : Theme.surface
                    )
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 16)
                        .stroke(
                            message.role == .assistant
                            ? (message.isError ? Theme.error.opacity(0.3) : Theme.surfaceBorder)
                            : Color.clear,
                            lineWidth: 1
                        )
                )
                .clipShape(
                    BubbleShape(isUser: message.role == .user)
                )
            
            if message.role == .assistant { Spacer(minLength: 40) }
        }
    }
}

struct BubbleShape: Shape {
    let isUser: Bool
    
    func path(in rect: CGRect) -> Path {
        let radius: CGFloat = 16
        let smallRadius: CGFloat = 4
        
        var path = Path()
        
        if isUser {
            // User bubble - small radius on bottom right
            path.move(to: CGPoint(x: rect.minX + radius, y: rect.minY))
            path.addLine(to: CGPoint(x: rect.maxX - radius, y: rect.minY))
            path.addArc(center: CGPoint(x: rect.maxX - radius, y: rect.minY + radius), radius: radius, startAngle: .degrees(-90), endAngle: .degrees(0), clockwise: false)
            path.addLine(to: CGPoint(x: rect.maxX, y: rect.maxY - smallRadius))
            path.addArc(center: CGPoint(x: rect.maxX - smallRadius, y: rect.maxY - smallRadius), radius: smallRadius, startAngle: .degrees(0), endAngle: .degrees(90), clockwise: false)
            path.addLine(to: CGPoint(x: rect.minX + radius, y: rect.maxY))
            path.addArc(center: CGPoint(x: rect.minX + radius, y: rect.maxY - radius), radius: radius, startAngle: .degrees(90), endAngle: .degrees(180), clockwise: false)
            path.addLine(to: CGPoint(x: rect.minX, y: rect.minY + radius))
            path.addArc(center: CGPoint(x: rect.minX + radius, y: rect.minY + radius), radius: radius, startAngle: .degrees(180), endAngle: .degrees(270), clockwise: false)
        } else {
            // Assistant bubble - small radius on bottom left
            path.move(to: CGPoint(x: rect.minX + radius, y: rect.minY))
            path.addLine(to: CGPoint(x: rect.maxX - radius, y: rect.minY))
            path.addArc(center: CGPoint(x: rect.maxX - radius, y: rect.minY + radius), radius: radius, startAngle: .degrees(-90), endAngle: .degrees(0), clockwise: false)
            path.addLine(to: CGPoint(x: rect.maxX, y: rect.maxY - radius))
            path.addArc(center: CGPoint(x: rect.maxX - radius, y: rect.maxY - radius), radius: radius, startAngle: .degrees(0), endAngle: .degrees(90), clockwise: false)
            path.addLine(to: CGPoint(x: rect.minX + smallRadius, y: rect.maxY))
            path.addArc(center: CGPoint(x: rect.minX + smallRadius, y: rect.maxY - smallRadius), radius: smallRadius, startAngle: .degrees(90), endAngle: .degrees(180), clockwise: false)
            path.addLine(to: CGPoint(x: rect.minX, y: rect.minY + radius))
            path.addArc(center: CGPoint(x: rect.minX + radius, y: rect.minY + radius), radius: radius, startAngle: .degrees(180), endAngle: .degrees(270), clockwise: false)
        }
        
        return path
    }
}

// MARK: - Typing Indicator
struct TypingIndicator: View {
    @State private var animating = false
    
    var body: some View {
        HStack {
            HStack(spacing: 4) {
                ForEach(0..<3) { index in
                    Circle()
                        .fill(Theme.textTertiary)
                        .frame(width: 6, height: 6)
                        .scaleEffect(animating ? 1 : 0.5)
                        .opacity(animating ? 1 : 0.4)
                        .animation(
                            .easeInOut(duration: 0.6)
                            .repeatForever()
                            .delay(Double(index) * 0.15),
                            value: animating
                        )
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 16)
            .background(Theme.surface)
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(Theme.surfaceBorder, lineWidth: 1)
            )
            .clipShape(RoundedRectangle(cornerRadius: 16))
            
            Spacer()
        }
        .onAppear { animating = true }
    }
}

// MARK: - Input Area
struct InputArea: View {
    @Binding var text: String
    let isLoading: Bool
    var isFocused: FocusState<Bool>.Binding
    let onSend: () -> Void
    
    var body: some View {
        VStack(spacing: 0) {
            Divider()
                .background(Theme.surfaceBorder)
            
            HStack(alignment: .bottom, spacing: 12) {
                TextField("Describe your situation...", text: $text, axis: .vertical)
                    .font(.system(size: 15))
                    .foregroundColor(Theme.textPrimary)
                    .lineLimit(1...5)
                    .focused(isFocused)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 12)
                    .background(Theme.surface)
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(
                                isFocused.wrappedValue ? Theme.bronze.opacity(0.4) : Theme.surfaceBorder,
                                lineWidth: 1
                            )
                    )
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                    .onSubmit {
                        if !text.isEmpty {
                            onSend()
                        }
                    }
                
                Button {
                    onSend()
                } label: {
                    ZStack {
                        RoundedRectangle(cornerRadius: 12)
                            .fill(Theme.bronzeGradient)
                            .frame(width: 44, height: 44)
                        
                        if isLoading {
                            ProgressView()
                                .tint(Theme.background)
                        } else {
                            Image(systemName: "arrow.up")
                                .font(.system(size: 18, weight: .semibold))
                                .foregroundColor(Theme.background)
                        }
                    }
                }
                .disabled(text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || isLoading)
                .opacity(text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? 0.5 : 1)
            }
            .padding(16)
            .background(Theme.backgroundSecondary)
        }
    }
}

// MARK: - Logo View
struct LogoView: View {
    var body: some View {
        HStack(spacing: 0) {
            Text("605b")
                .font(.system(size: 18, weight: .bold))
                .foregroundColor(Theme.textPrimary)
            
            Text(".ai")
                .font(.system(size: 18, weight: .bold))
                .foregroundStyle(
                    LinearGradient(
                        colors: [Theme.bronze, Theme.bronzeLight],
                        startPoint: .leading,
                        endPoint: .trailing
                    )
                )
        }
        .tracking(-0.5)
    }
}

// MARK: - Preview
#Preview {
    ChatView()
        .environmentObject(AppState())
}
