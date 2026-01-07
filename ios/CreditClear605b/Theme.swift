import SwiftUI

// MARK: - Brand Colors
struct Theme {
    // Primary brand colors
    static let bronze = Color(hex: "d4a574")
    static let bronzeLight = Color(hex: "e8c4a0")
    static let bronzeDark = Color(hex: "c49665")
    
    // Background colors
    static let background = Color(hex: "09090b")
    static let backgroundSecondary = Color(hex: "0c0c0e")
    static let backgroundTertiary = Color(hex: "111113")
    static let backgroundCard = Color(hex: "0f0f11")
    
    // Surface colors
    static let surface = Color(hex: "18181b")
    static let surfaceLight = Color(hex: "1c1c1f")
    static let surfaceBorder = Color(hex: "27272a")
    
    // Text colors
    static let textPrimary = Color(hex: "fafafa")
    static let textSecondary = Color(hex: "a1a1aa")
    static let textTertiary = Color(hex: "71717a")
    static let textMuted = Color(hex: "52525b")
    
    // Status colors
    static let success = Color(hex: "22c55e")
    static let warning = Color(hex: "f59e0b")
    static let error = Color(hex: "ef4444")
    static let info = Color(hex: "3b82f6")
    
    // Gradients
    static let bronzeGradient = LinearGradient(
        colors: [bronze, bronzeDark],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )
    
    static let bronzeSubtleGradient = LinearGradient(
        colors: [bronze.opacity(0.15), bronze.opacity(0.05)],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )
    
    static let cardGradient = LinearGradient(
        colors: [backgroundCard.opacity(0.8), backgroundCard.opacity(0.5)],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )
}

// MARK: - Color Extension
extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3:
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6:
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8:
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (255, 0, 0, 0)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}

// MARK: - Custom View Modifiers
struct CardStyle: ViewModifier {
    var padding: CGFloat = 16
    
    func body(content: Content) -> some View {
        content
            .padding(padding)
            .background(Theme.cardGradient)
            .overlay(
                RoundedRectangle(cornerRadius: 14)
                    .stroke(Color.white.opacity(0.06), lineWidth: 1)
            )
            .clipShape(RoundedRectangle(cornerRadius: 14))
    }
}

struct PrimaryButtonStyle: ButtonStyle {
    var isDisabled: Bool = false
    
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.system(size: 15, weight: .semibold))
            .foregroundColor(Theme.background)
            .padding(.horizontal, 20)
            .padding(.vertical, 12)
            .background(Theme.bronzeGradient)
            .clipShape(RoundedRectangle(cornerRadius: 10))
            .opacity(isDisabled ? 0.6 : (configuration.isPressed ? 0.9 : 1.0))
            .scaleEffect(configuration.isPressed ? 0.98 : 1.0)
            .animation(.easeInOut(duration: 0.15), value: configuration.isPressed)
    }
}

struct SecondaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.system(size: 14, weight: .medium))
            .foregroundColor(Theme.textSecondary)
            .padding(.horizontal, 16)
            .padding(.vertical, 10)
            .background(Color.white.opacity(0.04))
            .overlay(
                RoundedRectangle(cornerRadius: 10)
                    .stroke(Theme.surfaceBorder, lineWidth: 1)
            )
            .clipShape(RoundedRectangle(cornerRadius: 10))
            .opacity(configuration.isPressed ? 0.8 : 1.0)
    }
}

struct GlassCard: ViewModifier {
    func body(content: Content) -> some View {
        content
            .background(.ultraThinMaterial.opacity(0.5))
            .background(Theme.surface.opacity(0.8))
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(Color.white.opacity(0.08), lineWidth: 1)
            )
            .clipShape(RoundedRectangle(cornerRadius: 16))
    }
}

// MARK: - View Extensions
extension View {
    func cardStyle(padding: CGFloat = 16) -> some View {
        modifier(CardStyle(padding: padding))
    }
    
    func glassCard() -> some View {
        modifier(GlassCard())
    }
}

// MARK: - Custom Text Styles
extension Font {
    static let displayLarge = Font.system(size: 32, weight: .bold, design: .default)
    static let displayMedium = Font.system(size: 24, weight: .semibold, design: .default)
    static let headline = Font.system(size: 18, weight: .semibold, design: .default)
    static let body = Font.system(size: 15, weight: .regular, design: .default)
    static let caption = Font.system(size: 13, weight: .medium, design: .default)
    static let small = Font.system(size: 12, weight: .regular, design: .default)
    static let mono = Font.system(size: 12, weight: .regular, design: .monospaced)
}
