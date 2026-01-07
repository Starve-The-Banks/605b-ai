package ai.b605.creditclear.ui.theme

import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color

// Brand Colors
val Bronze = Color(0xFFD4A574)
val BronzeLight = Color(0xFFE8C4A0)
val BronzeDark = Color(0xFFC49665)

// Background Colors
val Background = Color(0xFF09090B)
val BackgroundSecondary = Color(0xFF0C0C0E)
val BackgroundTertiary = Color(0xFF111113)
val BackgroundCard = Color(0xFF0F0F11)

// Surface Colors
val Surface = Color(0xFF18181B)
val SurfaceLight = Color(0xFF1C1C1F)
val SurfaceBorder = Color(0xFF27272A)

// Text Colors
val TextPrimary = Color(0xFFFAFAFA)
val TextSecondary = Color(0xFFA1A1AA)
val TextTertiary = Color(0xFF71717A)
val TextMuted = Color(0xFF52525B)

// Status Colors
val Success = Color(0xFF22C55E)
val Warning = Color(0xFFF59E0B)
val Error = Color(0xFFEF4444)
val Info = Color(0xFF3B82F6)

@Immutable
data class CreditClearColors(
    val bronze: Color = Bronze,
    val bronzeLight: Color = BronzeLight,
    val bronzeDark: Color = BronzeDark,
    val background: Color = Background,
    val backgroundSecondary: Color = BackgroundSecondary,
    val backgroundTertiary: Color = BackgroundTertiary,
    val backgroundCard: Color = BackgroundCard,
    val surface: Color = Surface,
    val surfaceLight: Color = SurfaceLight,
    val surfaceBorder: Color = SurfaceBorder,
    val textPrimary: Color = TextPrimary,
    val textSecondary: Color = TextSecondary,
    val textTertiary: Color = TextTertiary,
    val textMuted: Color = TextMuted,
    val success: Color = Success,
    val warning: Color = Warning,
    val error: Color = Error,
    val info: Color = Info
) {
    val bronzeGradient: Brush
        get() = Brush.linearGradient(listOf(bronze, bronzeDark))
    
    val bronzeSubtleGradient: Brush
        get() = Brush.linearGradient(listOf(bronze.copy(alpha = 0.15f), bronze.copy(alpha = 0.05f)))
    
    val cardGradient: Brush
        get() = Brush.linearGradient(listOf(backgroundCard.copy(alpha = 0.8f), backgroundCard.copy(alpha = 0.5f)))
}

val LocalCreditClearColors = staticCompositionLocalOf { CreditClearColors() }

object CreditClearTheme {
    val colors: CreditClearColors
        @Composable
        get() = LocalCreditClearColors.current
}

@Composable
fun CreditClearTheme(
    content: @Composable () -> Unit
) {
    val colors = CreditClearColors()
    
    CompositionLocalProvider(
        LocalCreditClearColors provides colors
    ) {
        content()
    }
}
