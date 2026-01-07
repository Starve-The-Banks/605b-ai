package ai.b605.creditclear.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
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
class TrackerViewModel @Inject constructor(
    private val repository: DataRepository
) : ViewModel() {
    
    private val _disputes = MutableStateFlow<List<Dispute>>(emptyList())
    val disputes: StateFlow<List<Dispute>> = _disputes.asStateFlow()
    
    init {
        viewModelScope.launch {
            repository.disputes.collect { _disputes.value = it }
        }
    }
    
    fun addDispute(dispute: Dispute) {
        viewModelScope.launch {
            val updated = _disputes.value + dispute
            repository.saveDisputes(updated)
        }
    }
    
    fun markResponseReceived(disputeId: String) {
        viewModelScope.launch {
            val updated = _disputes.value.map {
                if (it.id == disputeId) it.copy(responseReceived = true, status = DisputeStatus.RESOLVED)
                else it
            }
            repository.saveDisputes(updated)
        }
    }
    
    fun escalateDispute(disputeId: String) {
        viewModelScope.launch {
            val updated = _disputes.value.map {
                if (it.id == disputeId) it.copy(status = DisputeStatus.ESCALATED)
                else it
            }
            repository.saveDisputes(updated)
        }
    }
    
    fun deleteDispute(disputeId: String) {
        viewModelScope.launch {
            val updated = _disputes.value.filter { it.id != disputeId }
            repository.saveDisputes(updated)
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TrackerScreen(
    viewModel: TrackerViewModel = hiltViewModel()
) {
    val colors = CreditClearTheme.colors
    val disputes by viewModel.disputes.collectAsState()
    var showAddDialog by remember { mutableStateOf(false) }
    
    Scaffold(
        containerColor = colors.background,
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "Tracker",
                        fontSize = 28.sp,
                        fontWeight = FontWeight.Bold,
                        color = colors.textPrimary
                    )
                },
                actions = {
                    IconButton(onClick = { showAddDialog = true }) {
                        Icon(
                            imageVector = Icons.Default.Add,
                            contentDescription = "Add dispute",
                            tint = colors.bronze
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = colors.background
                )
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
            if (disputes.isEmpty()) {
                item {
                    EmptyState(
                        icon = Icons.Default.CalendarMonth,
                        title = "No Active Disputes",
                        message = "Start tracking your disputes by tapping the + button"
                    )
                }
            } else {
                items(disputes) { dispute ->
                    DisputeCard(
                        dispute = dispute,
                        onMarkResponse = { viewModel.markResponseReceived(dispute.id) },
                        onEscalate = { viewModel.escalateDispute(dispute.id) },
                        onDelete = { viewModel.deleteDispute(dispute.id) }
                    )
                }
            }
        }
    }
    
    if (showAddDialog) {
        AddDisputeDialog(
            onDismiss = { showAddDialog = false },
            onSave = { dispute ->
                viewModel.addDispute(dispute)
                showAddDialog = false
            }
        )
    }
}

@Composable
fun DisputeCard(
    dispute: Dispute,
    onMarkResponse: () -> Unit,
    onEscalate: () -> Unit,
    onDelete: () -> Unit
) {
    val colors = CreditClearTheme.colors
    val dateFormat = remember { SimpleDateFormat("MMM d, yyyy", Locale.US) }
    
    val borderColor = when {
        dispute.isOverdue -> colors.error
        dispute.daysRemaining <= 5 -> colors.warning
        else -> Color(dispute.disputeType.colorHex)
    }
    
    val progress = remember(dispute) {
        val totalDays = dispute.disputeType.deadline.toFloat()
        val elapsed = totalDays - dispute.daysRemaining
        (elapsed / totalDays).coerceIn(0f, 1f)
    }
    
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(colors.cardGradient)
            .border(1.dp, colors.surfaceBorder.copy(alpha = 0.5f), RoundedCornerShape(14.dp))
    ) {
        // Left accent
        Row {
            Box(
                modifier = Modifier
                    .width(4.dp)
                    .fillMaxHeight()
                    .background(borderColor)
            )
            
            Column(
                modifier = Modifier
                    .weight(1f)
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                // Header
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.Top
                ) {
                    Column {
                        Text(
                            text = dispute.agency,
                            fontSize = 16.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = colors.textPrimary
                        )
                        Text(
                            text = dispute.accountName,
                            fontSize = 13.sp,
                            color = colors.textTertiary
                        )
                    }
                    
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(6.dp))
                            .background(Color(dispute.disputeType.colorHex).copy(alpha = 0.15f))
                            .padding(horizontal = 10.dp, vertical = 5.dp)
                    ) {
                        Text(
                            text = dispute.disputeType.displayName,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = Color(dispute.disputeType.colorHex)
                        )
                    }
                }
                
                // Countdown
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = if (dispute.isOverdue) Icons.Default.Warning else Icons.Default.Schedule,
                        contentDescription = null,
                        tint = if (dispute.isOverdue) colors.error 
                               else if (dispute.daysRemaining <= 5) colors.warning 
                               else colors.bronze,
                        modifier = Modifier.size(18.dp)
                    )
                    
                    Text(
                        text = when {
                            dispute.responseReceived -> "Response Received"
                            dispute.isOverdue -> "${kotlin.math.abs(dispute.daysRemaining)} days overdue — VIOLATION"
                            else -> "${dispute.daysRemaining} days remaining"
                        },
                        fontSize = 15.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = when {
                            dispute.responseReceived -> colors.success
                            dispute.isOverdue -> colors.error
                            dispute.daysRemaining <= 5 -> colors.warning
                            else -> colors.textPrimary
                        }
                    )
                }
                
                // Progress bar
                LinearProgressIndicator(
                    progress = { progress },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(6.dp)
                        .clip(RoundedCornerShape(3.dp)),
                    color = when {
                        dispute.isOverdue -> colors.error
                        dispute.daysRemaining <= 5 -> colors.warning
                        else -> colors.bronze
                    },
                    trackColor = colors.surfaceBorder
                )
                
                // Status & date
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(4.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = when (dispute.status) {
                                DisputeStatus.PENDING -> Icons.Default.Schedule
                                DisputeStatus.INVESTIGATING -> Icons.Default.Search
                                DisputeStatus.RESOLVED -> Icons.Default.CheckCircle
                                DisputeStatus.ESCALATED -> Icons.Default.ArrowUpward
                                DisputeStatus.VIOLATION -> Icons.Default.Warning
                            },
                            contentDescription = null,
                            tint = colors.textTertiary,
                            modifier = Modifier.size(14.dp)
                        )
                        Text(
                            text = dispute.status.displayName,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Medium,
                            color = colors.textTertiary
                        )
                    }
                    
                    Text(
                        text = "Sent: ${dateFormat.format(Date(dispute.dateSent))}",
                        fontSize = 12.sp,
                        color = colors.textMuted
                    )
                }
                
                // Actions
                Row(
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    if (!dispute.responseReceived) {
                        OutlinedButton(
                            onClick = onMarkResponse,
                            colors = ButtonDefaults.outlinedButtonColors(
                                contentColor = colors.textSecondary
                            ),
                            border = ButtonDefaults.outlinedButtonBorder.copy(
                                brush = androidx.compose.ui.graphics.SolidColor(colors.surfaceBorder)
                            ),
                            contentPadding = PaddingValues(horizontal = 12.dp, vertical = 8.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.CheckCircle,
                                contentDescription = null,
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Got Response", fontSize = 13.sp)
                        }
                        
                        if (dispute.isOverdue) {
                            OutlinedButton(
                                onClick = onEscalate,
                                colors = ButtonDefaults.outlinedButtonColors(
                                    contentColor = colors.error
                                ),
                                border = ButtonDefaults.outlinedButtonBorder.copy(
                                    brush = androidx.compose.ui.graphics.SolidColor(colors.error.copy(alpha = 0.3f))
                                ),
                                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 8.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.ArrowUpward,
                                    contentDescription = null,
                                    modifier = Modifier.size(16.dp)
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Escalate", fontSize = 13.sp)
                            }
                        }
                    }
                    
                    Spacer(modifier = Modifier.weight(1f))
                    
                    IconButton(
                        onClick = onDelete,
                        modifier = Modifier.size(32.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Delete,
                            contentDescription = "Delete",
                            tint = colors.textMuted,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun EmptyState(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    title: String,
    message: String
) {
    val colors = CreditClearTheme.colors
    
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(32.dp)
            .clip(RoundedCornerShape(14.dp))
            .background(colors.cardGradient)
            .border(1.dp, colors.surfaceBorder.copy(alpha = 0.5f), RoundedCornerShape(14.dp))
            .padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Box(
            modifier = Modifier
                .size(64.dp)
                .background(colors.surface, androidx.compose.foundation.shape.CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = colors.textMuted,
                modifier = Modifier.size(28.dp)
            )
        }
        
        Text(
            text = title,
            fontSize = 16.sp,
            fontWeight = FontWeight.SemiBold,
            color = colors.textSecondary
        )
        
        Text(
            text = message,
            fontSize = 14.sp,
            color = colors.textMuted
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddDisputeDialog(
    onDismiss: () -> Unit,
    onSave: (Dispute) -> Unit
) {
    val colors = CreditClearTheme.colors
    
    var agency by remember { mutableStateOf("") }
    var accountName by remember { mutableStateOf("") }
    var disputeType by remember { mutableStateOf(DisputeType.INACCURACY) }
    var expandedAgency by remember { mutableStateOf(false) }
    var expandedType by remember { mutableStateOf(false) }
    
    val agencies = listOf("Experian", "Equifax", "TransUnion", "ChexSystems", "Early Warning Services", "Other")
    
    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = colors.backgroundTertiary,
        title = {
            Text(
                text = "Add Dispute",
                color = colors.textPrimary
            )
        },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                // Agency dropdown
                ExposedDropdownMenuBox(
                    expanded = expandedAgency,
                    onExpandedChange = { expandedAgency = it }
                ) {
                    OutlinedTextField(
                        value = agency,
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Agency") },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expandedAgency) },
                        modifier = Modifier
                            .fillMaxWidth()
                            .menuAnchor(),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = colors.bronze,
                            unfocusedBorderColor = colors.surfaceBorder,
                            focusedLabelColor = colors.bronze,
                            unfocusedLabelColor = colors.textTertiary,
                            focusedTextColor = colors.textPrimary,
                            unfocusedTextColor = colors.textPrimary
                        )
                    )
                    ExposedDropdownMenu(
                        expanded = expandedAgency,
                        onDismissRequest = { expandedAgency = false }
                    ) {
                        agencies.forEach { option ->
                            DropdownMenuItem(
                                text = { Text(option) },
                                onClick = {
                                    agency = option
                                    expandedAgency = false
                                }
                            )
                        }
                    }
                }
                
                // Account name
                OutlinedTextField(
                    value = accountName,
                    onValueChange = { accountName = it },
                    label = { Text("Account Name") },
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = colors.bronze,
                        unfocusedBorderColor = colors.surfaceBorder,
                        focusedLabelColor = colors.bronze,
                        unfocusedLabelColor = colors.textTertiary,
                        focusedTextColor = colors.textPrimary,
                        unfocusedTextColor = colors.textPrimary
                    )
                )
                
                // Dispute type dropdown
                ExposedDropdownMenuBox(
                    expanded = expandedType,
                    onExpandedChange = { expandedType = it }
                ) {
                    OutlinedTextField(
                        value = disputeType.displayName,
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Dispute Type") },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expandedType) },
                        modifier = Modifier
                            .fillMaxWidth()
                            .menuAnchor(),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = colors.bronze,
                            unfocusedBorderColor = colors.surfaceBorder,
                            focusedLabelColor = colors.bronze,
                            unfocusedLabelColor = colors.textTertiary,
                            focusedTextColor = colors.textPrimary,
                            unfocusedTextColor = colors.textPrimary
                        )
                    )
                    ExposedDropdownMenu(
                        expanded = expandedType,
                        onDismissRequest = { expandedType = false }
                    ) {
                        DisputeType.entries.forEach { type ->
                            DropdownMenuItem(
                                text = { Text(type.displayName) },
                                onClick = {
                                    disputeType = type
                                    expandedType = false
                                }
                            )
                        }
                    }
                }
                
                // Deadline info
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Default.Schedule,
                        contentDescription = null,
                        tint = colors.bronze,
                        modifier = Modifier.size(16.dp)
                    )
                    Text(
                        text = "Deadline: ${disputeType.deadline} days",
                        fontSize = 14.sp,
                        color = colors.textSecondary
                    )
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    if (agency.isNotBlank() && accountName.isNotBlank()) {
                        val now = System.currentTimeMillis()
                        val deadlineMs = now + (disputeType.deadline * 24 * 60 * 60 * 1000L)
                        onSave(
                            Dispute(
                                agency = agency,
                                accountName = accountName,
                                disputeType = disputeType,
                                dateSent = now,
                                deadlineDate = deadlineMs
                            )
                        )
                    }
                },
                enabled = agency.isNotBlank() && accountName.isNotBlank(),
                colors = ButtonDefaults.buttonColors(
                    containerColor = colors.bronze
                )
            ) {
                Text("Save", color = colors.background)
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel", color = colors.textTertiary)
            }
        }
    )
}
