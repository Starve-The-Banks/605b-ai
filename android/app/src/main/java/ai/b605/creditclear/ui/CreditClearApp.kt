package ai.b605.creditclear.ui

import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.MoreHoriz
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.outlined.AutoAwesome
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import ai.b605.creditclear.ui.screens.*
import ai.b605.creditclear.ui.theme.CreditClearTheme

sealed class Screen(val route: String, val title: String, val icon: ImageVector) {
    data object Analyze : Screen("analyze", "Analyze", Icons.Default.Search)
    data object Chat : Screen("chat", "AI", Icons.Outlined.AutoAwesome)
    data object Templates : Screen("templates", "Letters", Icons.Default.Description)
    data object Tracker : Screen("tracker", "Track", Icons.Default.CalendarMonth)
    data object More : Screen("more", "More", Icons.Default.MoreHoriz)
}

val bottomNavItems = listOf(
    Screen.Analyze,
    Screen.Chat,
    Screen.Templates,
    Screen.Tracker,
    Screen.More
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CreditClearApp() {
    val navController = rememberNavController()
    val colors = CreditClearTheme.colors
    
    Scaffold(
        containerColor = colors.background,
        bottomBar = {
            NavigationBar(
                containerColor = colors.backgroundSecondary,
                contentColor = colors.textMuted
            ) {
                val navBackStackEntry by navController.currentBackStackEntryAsState()
                val currentDestination = navBackStackEntry?.destination
                
                bottomNavItems.forEach { screen ->
                    val selected = currentDestination?.hierarchy?.any { it.route == screen.route } == true
                    
                    NavigationBarItem(
                        icon = { 
                            Icon(
                                imageVector = screen.icon,
                                contentDescription = screen.title
                            )
                        },
                        label = { Text(screen.title) },
                        selected = selected,
                        onClick = {
                            navController.navigate(screen.route) {
                                popUpTo(navController.graph.findStartDestination().id) {
                                    saveState = true
                                }
                                launchSingleTop = true
                                restoreState = true
                            }
                        },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = colors.bronze,
                            selectedTextColor = colors.bronze,
                            unselectedIconColor = colors.textMuted,
                            unselectedTextColor = colors.textMuted,
                            indicatorColor = colors.bronze.copy(alpha = 0.15f)
                        )
                    )
                }
            }
        }
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = Screen.Analyze.route,
            modifier = Modifier.padding(innerPadding)
        ) {
            composable(Screen.Analyze.route) { AnalyzeScreen() }
            composable(Screen.Chat.route) { ChatScreen() }
            composable(Screen.Templates.route) { TemplatesScreen() }
            composable(Screen.Tracker.route) { TrackerScreen() }
            composable(Screen.More.route) { MoreScreen() }
        }
    }
}
