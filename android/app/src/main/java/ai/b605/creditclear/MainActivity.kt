package ai.b605.creditclear

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import androidx.core.view.WindowCompat
import ai.b605.creditclear.ui.theme.CreditClearTheme
import ai.b605.creditclear.ui.CreditClearApp
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        WindowCompat.setDecorFitsSystemWindows(window, false)
        
        setContent {
            CreditClearTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = CreditClearTheme.colors.background
                ) {
                    CreditClearApp()
                }
            }
        }
    }
}
