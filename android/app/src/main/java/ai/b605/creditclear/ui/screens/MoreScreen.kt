package ai.b605.creditclear.ui.screens

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import ai.b605.creditclear.data.*
import ai.b605.creditclear.ui.theme.CreditClearTheme
import javax.inject.Inject
import java.text.SimpleDateFormat
import java.util.*

@HiltViewModel
class MoreViewModel @Inject constructor(
    private val repository: DataRepository
) : ViewModel() {
    
    private val _flaggedItems = MutableStateFlow<List<FlaggedItem>>(emptyList())
    val flaggedItems: StateFlow<List<FlaggedItem>> = _flaggedItems.asStateFlow()
    
    private val _auditLog = MutableStateFlow<List<AuditEntry>>(emptyList())
    val auditLog: StateFlow<List<AuditEntry>> = _auditLog.asStateFlow()
    
    private val _disputes = MutableStateFlow<List<Dispute>>(emptyList())
    val disputes: StateFlow<List<Dispute>> = _disputes.asStateFlow()
    
    init {
        viewModelScope.launch {
            repository.flaggedItems.collect { _flaggedItems.value = it }
        }
        viewModelScope.launch {
            repository.auditLog.collect { _auditLog.value = it }
        }
        viewModelScope.launch {
            repository.disputes.collect { _disputes.value = it }
        }
    }
    
    fun removeFlaggedItem(id: String) {
        viewModelScope.launch {
            val updated = _flaggedItems.value.filter { it.id != id }
            repository.saveFlaggedItems(updated)
        }
    }
    
    fun createDisputeFromFlagged(item: FlaggedItem) {
        viewModelScope.launch {
            val now = System.currentTimeMillis()
            val dispute = Dispute(
                agency = item.bureau ?: "Unknown",
                accountName = item.account,
                disputeType = DisputeType.INACCURACY,
                dateSent = now,
                deadlineDate = now + (30 * 24 * 60 * 60 * 1000L),
                notes = item.issue
            )
            val updatedDisputes = _disputes.value + dispute
            repository.saveDisputes(updatedDisputes)
            
            val updatedFlagged = _flaggedItems.value.filter { it.id != item.id }
            repository.saveFlaggedItems(updatedFlagged)
        }
    }
    
    fun signOut() {
        viewModelScope.launch {
            repository.setAuthToken(null)
        }
    }
}

@Composable
fun MoreScreen(
    viewModel: MoreViewModel = hiltViewModel()
) {
    val colors = CreditClearTheme.colors
    val flaggedItems by viewModel.flaggedItems.collectAsState()
    val auditLog by viewModel.auditLog.collectAsState()
    
    var currentSection by remember { mutableStateOf<String?>(null) }
    
    when (currentSection) {
        "flagged" -> FlaggedScreen(
            items = flaggedItems,
            onBack = { currentSection = null },
            onRemove = viewModel::removeFlaggedItem,
            onCreateDispute = viewModel::createDisputeFromFlagged
        )
        "audit" -> AuditScreen(
            entries = auditLog,
            onBack = { currentSection = null }
        )
        "resources" -> ResourcesScreen(onBack = { currentSection = null })
        "settings" -> SettingsScreen(
            onBack = { currentSection = null },
            onSignOut = viewModel::signOut
        )
        else -> MoreMenuScreen(
            flaggedCount = flaggedItems.size,
            auditCount = auditLog.size,
            onNavigate = { currentSection = it }
        )
    }
}

@Composable
fun MoreMenuScreen(
    flaggedCount: Int,
    auditCount: Int,
    onNavigate: (String) -> Unit
) {
    val colors = CreditClearTheme.colors
    
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(colors.background),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Text(
                text = "More",
                fontSize = 28.sp,
                fontWeight = FontWeight.Bold,
                color = colors.textPrimary
            )
            Spacer(modifier = Modifier.height(8.dp))
        }
        
        item {
            MoreMenuItem(
                icon = Icons.Default.Flag,
                title = "Flagged Items",
                subtitle = "$flaggedCount items",
                color = colors.warning,
                onClick = { onNavigate("flagged") }
            )
        }
        
        item {
            MoreMenuItem(
                icon = Icons.Default.List,
                title = "Audit Log",
                subtitle = "$auditCount entries",
                color = colors.info,
                onClick = { onNavigate("audit") }
            )
        }
        
        item {
            HorizontalDivider(
                color = colors.surfaceBorder,
                modifier = Modifier.padding(vertical = 8.dp)
            )
        }
        
        item {
            MoreMenuItem(
                icon = Icons.Default.Link,
                title = "Resources",
                subtitle = "Bureaus, agencies & gov sites",
                color = colors.bronze,
                onClick = { onNavigate("resources") }
            )
        }
        
        item {
            MoreMenuItem(
                icon = Icons.Default.Settings,
                title = "Settings",
                subtitle = "Account & preferences",
                color = colors.textTertiary,
                onClick = { onNavigate("settings") }
            )
        }
    }
}

@Composable
fun MoreMenuItem(
    icon: ImageVector,
    title: String,
    subtitle: String,
    color: Color,
    onClick: () -> Unit
) {
    val colors = CreditClearTheme.colors
    
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(colors.cardGradient)
            .border(1.dp, colors.surfaceBorder.copy(alpha = 0.5f), RoundedCornerShape(12.dp))
            .clickable { onClick() }
            .padding(14.dp),
        horizontalArrangement = Arrangement.spacedBy(14.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(40.dp)
                .background(color.copy(alpha = 0.15f), RoundedCornerShape(10.dp)),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = color,
                modifier = Modifier.size(20.dp)
            )
        }
        
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = title,
                fontSize = 15.sp,
                fontWeight = FontWeight.SemiBold,
                color = colors.textPrimary
            )
            Text(
                text = subtitle,
                fontSize = 13.sp,
                color = colors.textTertiary
            )
        }
        
        Icon(
            imageVector = Icons.Default.ChevronRight,
            contentDescription = null,
            tint = colors.textMuted,
            modifier = Modifier.size(20.dp)
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FlaggedScreen(
    items: List<FlaggedItem>,
    onBack: () -> Unit,
    onRemove: (String) -> Unit,
    onCreateDispute: (FlaggedItem) -> Unit
) {
    val colors = CreditClearTheme.colors
    val dateFormat = remember { SimpleDateFormat("MMM d, yyyy", Locale.US) }
    
    Scaffold(
        containerColor = colors.background,
        topBar = {
            TopAppBar(
                title = { Text("Flagged Items", color = colors.textPrimary) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, "Back", tint = colors.textPrimary)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = colors.backgroundSecondary)
            )
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            if (items.isEmpty()) {
                item {
                    EmptyState(
                        icon = Icons.Default.Flag,
                        title = "No Flagged Items",
                        message = "Flag items from your analysis to track them here"
                    )
                }
            } else {
                items(items) { item ->
                    FlaggedItemCard(
                        item = item,
                        dateFormat = dateFormat,
                        onRemove = { onRemove(item.id) },
                        onCreateDispute = { onCreateDispute(item) }
                    )
                }
            }
        }
    }
}

@Composable
fun FlaggedItemCard(
    item: FlaggedItem,
    dateFormat: SimpleDateFormat,
    onRemove: () -> Unit,
    onCreateDispute: () -> Unit
) {
    val colors = CreditClearTheme.colors
    val severityColor = Color(item.severity.colorHex)
    
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(colors.cardGradient)
            .border(1.dp, colors.surfaceBorder.copy(alpha = 0.5f), RoundedCornerShape(14.dp))
    ) {
        Row {
            Box(
                modifier = Modifier
                    .width(4.dp)
                    .height(IntrinsicSize.Max)
                    .background(severityColor)
            )
            
            Column(
                modifier = Modifier
                    .weight(1f)
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(4.dp))
                                .background(severityColor.copy(alpha = 0.15f))
                                .padding(horizontal = 8.dp, vertical = 4.dp)
                        ) {
                            Text(
                                text = item.severity.name,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                color = severityColor
                            )
                        }
                        
                        Text(
                            text = item.statute,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Medium,
                            color = colors.bronze
                        )
                    }
                    
                    Text(
                        text = dateFormat.format(Date(item.flaggedAt)),
                        fontSize = 11.sp,
                        color = colors.textMuted
                    )
                }
                
                Text(
                    text = item.account,
                    fontSize = 15.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = colors.textPrimary
                )
                
                Text(
                    text = item.issue,
                    fontSize = 14.sp,
                    color = colors.textSecondary,
                    lineHeight = 20.sp
                )
                
                Text(
                    text = "Success: ${item.successLikelihood}",
                    fontSize = 13.sp,
                    color = colors.textTertiary
                )
                
                Row(
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Button(
                        onClick = onCreateDispute,
                        colors = ButtonDefaults.buttonColors(containerColor = colors.bronze),
                        contentPadding = PaddingValues(horizontal = 14.dp, vertical = 8.dp),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Icon(Icons.Default.Add, null, modifier = Modifier.size(16.dp), tint = colors.background)
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Create Dispute", fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = colors.background)
                    }
                    
                    Spacer(modifier = Modifier.weight(1f))
                    
                    IconButton(onClick = onRemove, modifier = Modifier.size(32.dp)) {
                        Icon(Icons.Default.Close, "Remove", tint = colors.textMuted, modifier = Modifier.size(18.dp))
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AuditScreen(
    entries: List<AuditEntry>,
    onBack: () -> Unit
) {
    val colors = CreditClearTheme.colors
    val dateFormat = remember { SimpleDateFormat("MMM d, yyyy h:mm a", Locale.US) }
    
    Scaffold(
        containerColor = colors.background,
        topBar = {
            TopAppBar(
                title = { Text("Audit Log", color = colors.textPrimary) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, "Back", tint = colors.textPrimary)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = colors.backgroundSecondary)
            )
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            item {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(10.dp))
                        .background(colors.bronze.copy(alpha = 0.1f))
                        .border(1.dp, colors.bronze.copy(alpha = 0.2f), RoundedCornerShape(10.dp))
                        .padding(14.dp),
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Default.Info, null, tint = colors.bronze, modifier = Modifier.size(18.dp))
                    Text(
                        text = "This log documents all actions for potential legal proceedings.",
                        fontSize = 13.sp,
                        color = colors.bronze
                    )
                }
            }
            
            if (entries.isEmpty()) {
                item {
                    EmptyState(
                        icon = Icons.Default.List,
                        title = "No Audit Entries",
                        message = "Actions will be logged automatically"
                    )
                }
            } else {
                items(entries) { entry ->
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(10.dp))
                            .background(colors.backgroundCard)
                            .border(1.dp, colors.surfaceBorder.copy(alpha = 0.5f), RoundedCornerShape(10.dp))
                            .padding(14.dp),
                        verticalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Text(
                            text = dateFormat.format(Date(entry.timestamp)),
                            fontSize = 11.sp,
                            fontFamily = FontFamily.Monospace,
                            color = colors.textMuted
                        )
                        Text(
                            text = entry.action,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.SemiBold,
                            fontFamily = FontFamily.Monospace,
                            color = colors.bronze
                        )
                        if (entry.details.isNotEmpty()) {
                            Text(
                                text = entry.details,
                                fontSize = 12.sp,
                                fontFamily = FontFamily.Monospace,
                                color = colors.textTertiary
                            )
                        }
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ResourcesScreen(onBack: () -> Unit) {
    val colors = CreditClearTheme.colors
    val context = LocalContext.current
    
    val resources = listOf(
        Triple("Credit Reports", listOf(
            Triple("AnnualCreditReport.com", "https://www.annualcreditreport.com", "Official free reports"),
            Triple("Experian", "https://www.experian.com", "Direct from Experian"),
            Triple("Equifax", "https://www.equifax.com", "Direct from Equifax"),
            Triple("TransUnion", "https://www.transunion.com", "Direct from TransUnion")
        ), Icons.Default.Description),
        Triple("Specialty Agencies", listOf(
            Triple("ChexSystems", "https://www.chexsystems.com", "Banking history"),
            Triple("Early Warning", "https://www.earlywarning.com", "Bank screening"),
            Triple("LexisNexis", "https://consumer.risk.lexisnexis.com", "Insurance data")
        ), Icons.Default.Business),
        Triple("Government", listOf(
            Triple("IdentityTheft.gov", "https://www.identitytheft.gov", "FTC recovery"),
            Triple("CFPB Complaints", "https://www.consumerfinance.gov/complaint/", "Federal complaints"),
            Triple("State AG Directory", "https://www.naag.org/find-my-ag/", "Find your AG")
        ), Icons.Default.AccountBalance)
    )
    
    Scaffold(
        containerColor = colors.background,
        topBar = {
            TopAppBar(
                title = { Text("Resources", color = colors.textPrimary) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, "Back", tint = colors.textPrimary)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = colors.backgroundSecondary)
            )
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(20.dp)
        ) {
            resources.forEach { (category, links, icon) ->
                item {
                    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Text(
                            text = category.uppercase(),
                            fontSize = 12.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = colors.textTertiary,
                            letterSpacing = 0.5.sp
                        )
                        
                        links.forEach { (name, url, desc) ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(10.dp))
                                    .background(colors.cardGradient)
                                    .border(1.dp, colors.surfaceBorder.copy(alpha = 0.5f), RoundedCornerShape(10.dp))
                                    .clickable {
                                        context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
                                    }
                                    .padding(14.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(name, fontSize = 15.sp, fontWeight = FontWeight.Medium, color = colors.textPrimary)
                                    Text(desc, fontSize = 13.sp, color = colors.textTertiary)
                                }
                                Icon(Icons.Default.OpenInNew, null, tint = colors.textMuted, modifier = Modifier.size(16.dp))
                            }
                        }
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    onBack: () -> Unit,
    onSignOut: () -> Unit
) {
    val colors = CreditClearTheme.colors
    
    Scaffold(
        containerColor = colors.background,
        topBar = {
            TopAppBar(
                title = { Text("Settings", color = colors.textPrimary) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, "Back", tint = colors.textPrimary)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = colors.backgroundSecondary)
            )
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            item {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(12.dp))
                        .background(colors.cardGradient)
                        .border(1.dp, colors.surfaceBorder.copy(alpha = 0.5f), RoundedCornerShape(12.dp))
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.spacedBy(14.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .size(50.dp)
                            .background(colors.bronze.copy(alpha = 0.2f), CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "U",
                            fontSize = 20.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = colors.bronze
                        )
                    }
                    
                    Column {
                        Text("User", fontSize = 16.sp, fontWeight = FontWeight.SemiBold, color = colors.textPrimary)
                        Text("user@example.com", fontSize = 13.sp, color = colors.textTertiary)
                    }
                }
            }
            
            item {
                Button(
                    onClick = onSignOut,
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = colors.error.copy(alpha = 0.15f),
                        contentColor = colors.error
                    ),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text("Sign Out", fontWeight = FontWeight.SemiBold)
                }
            }
            
            item {
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    LogoText()
                    Text("Version 1.0.0", fontSize = 12.sp, color = colors.textMuted)
                }
            }
        }
    }
}
