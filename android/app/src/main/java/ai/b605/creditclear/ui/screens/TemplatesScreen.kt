package ai.b605.creditclear.ui.screens

import android.content.Intent
import android.net.Uri
import androidx.compose.animation.AnimatedVisibility
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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import ai.b605.creditclear.ui.theme.CreditClearTheme

data class TemplateItem(
    val id: String,
    val name: String,
    val description: String,
    val deadline: String,
    val externalUrl: String? = null
)

data class TemplateCategory(
    val id: String,
    val name: String,
    val icon: ImageVector,
    val templates: List<TemplateItem>
)

@Composable
fun TemplatesScreen() {
    val colors = CreditClearTheme.colors
    var expandedCategory by remember { mutableStateOf<String?>(null) }
    
    val categories = remember {
        listOf(
            TemplateCategory(
                id = "identity_theft",
                name = "Identity Theft Recovery",
                icon = Icons.Default.Shield,
                templates = listOf(
                    TemplateItem("605b_bureau", "§605B Identity Theft Block (Bureau)", "Demand credit bureaus block all fraudulent accounts within 4 business days", "4 business days"),
                    TemplateItem("605b_furnisher", "§605B Direct to Furnisher", "Send block demand directly to the creditor/furnisher", "4 business days"),
                    TemplateItem("ftc_affidavit", "FTC Identity Theft Report", "Create official FTC identity theft report at IdentityTheft.gov", "N/A", "https://www.identitytheft.gov/")
                )
            ),
            TemplateCategory(
                id = "disputes",
                name = "Credit Bureau Disputes",
                icon = Icons.Default.Warning,
                templates = listOf(
                    TemplateItem("611_dispute", "§611 Standard Dispute", "Challenge inaccurate information with credit bureaus - 30 day investigation required", "30 days"),
                    TemplateItem("609_disclosure", "§609 Method of Verification", "Demand proof of HOW they verified disputed information", "15 days"),
                    TemplateItem("623_direct", "§623 Direct Furnisher Dispute", "Dispute directly with the company reporting the information", "30 days")
                )
            ),
            TemplateCategory(
                id = "debt_collection",
                name = "Debt Collection Defense",
                icon = Icons.Default.AttachMoney,
                templates = listOf(
                    TemplateItem("809_validation", "§809 Debt Validation Demand", "Force collector to prove the debt is valid and they can collect", "30 days"),
                    TemplateItem("cease_desist", "Cease & Desist Letter", "Legally stop all collector phone calls and contact", "Immediate")
                )
            ),
            TemplateCategory(
                id = "specialty",
                name = "Specialty Agencies",
                icon = Icons.Default.Business,
                templates = listOf(
                    TemplateItem("chex_dispute", "ChexSystems Dispute", "Dispute banking history blocking account approvals", "30 days"),
                    TemplateItem("ews_dispute", "Early Warning Services Dispute", "Dispute EWS records affecting bank account approvals", "30 days")
                )
            ),
            TemplateCategory(
                id = "escalation",
                name = "Escalation & Legal",
                icon = Icons.Default.Balance,
                templates = listOf(
                    TemplateItem("cfpb_complaint", "CFPB Complaint Portal", "File federal complaint - companies respond 95%+ of time", "15-60 days", "https://www.consumerfinance.gov/complaint/"),
                    TemplateItem("intent_to_sue", "Intent to Sue / Final Demand", "Final warning letter before filing lawsuit", "15-30 days")
                )
            )
        )
    }
    
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(colors.background),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Text(
                text = "Letter Templates",
                fontSize = 28.sp,
                fontWeight = FontWeight.Bold,
                color = colors.textPrimary
            )
            Spacer(modifier = Modifier.height(8.dp))
        }
        
        items(categories) { category ->
            CategoryCard(
                category = category,
                isExpanded = expandedCategory == category.id,
                onToggle = {
                    expandedCategory = if (expandedCategory == category.id) null else category.id
                }
            )
        }
    }
}

@Composable
fun CategoryCard(
    category: TemplateCategory,
    isExpanded: Boolean,
    onToggle: () -> Unit
) {
    val colors = CreditClearTheme.colors
    val context = LocalContext.current
    
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(colors.cardGradient)
            .border(1.dp, colors.surfaceBorder.copy(alpha = 0.5f), RoundedCornerShape(14.dp))
    ) {
        // Header
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clickable { onToggle() }
                .padding(16.dp),
            horizontalArrangement = Arrangement.spacedBy(14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .background(colors.bronze.copy(alpha = 0.15f), RoundedCornerShape(10.dp)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = category.icon,
                    contentDescription = null,
                    tint = colors.bronze,
                    modifier = Modifier.size(20.dp)
                )
            }
            
            Text(
                text = category.name,
                fontSize = 15.sp,
                fontWeight = FontWeight.SemiBold,
                color = colors.textPrimary,
                modifier = Modifier.weight(1f)
            )
            
            Icon(
                imageVector = if (isExpanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                contentDescription = null,
                tint = colors.textMuted,
                modifier = Modifier.size(20.dp)
            )
        }
        
        // Templates
        AnimatedVisibility(visible = isExpanded) {
            Column {
                category.templates.forEach { template ->
                    HorizontalDivider(color = colors.surfaceBorder.copy(alpha = 0.5f))
                    
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.Top
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = template.name,
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Medium,
                                color = colors.textPrimary
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = template.description,
                                fontSize = 13.sp,
                                color = colors.textTertiary,
                                lineHeight = 18.sp
                            )
                            Spacer(modifier = Modifier.height(6.dp))
                            Row(
                                horizontalArrangement = Arrangement.spacedBy(4.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Schedule,
                                    contentDescription = null,
                                    tint = colors.bronze,
                                    modifier = Modifier.size(12.dp)
                                )
                                Text(
                                    text = template.deadline,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Medium,
                                    color = colors.bronze
                                )
                            }
                        }
                        
                        Spacer(modifier = Modifier.width(12.dp))
                        
                        if (template.externalUrl != null) {
                            Button(
                                onClick = {
                                    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(template.externalUrl))
                                    context.startActivity(intent)
                                },
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = colors.bronze
                                ),
                                contentPadding = PaddingValues(horizontal = 14.dp, vertical = 8.dp),
                                shape = RoundedCornerShape(8.dp)
                            ) {
                                Text(
                                    text = "Open",
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = colors.background
                                )
                                Spacer(modifier = Modifier.width(4.dp))
                                Icon(
                                    imageVector = Icons.Default.OpenInNew,
                                    contentDescription = null,
                                    modifier = Modifier.size(14.dp),
                                    tint = colors.background
                                )
                            }
                        } else {
                            Button(
                                onClick = { /* TODO: Show template detail */ },
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = colors.bronze
                                ),
                                contentPadding = PaddingValues(horizontal = 14.dp, vertical = 8.dp),
                                shape = RoundedCornerShape(8.dp)
                            ) {
                                Text(
                                    text = "Generate",
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = colors.background
                                )
                                Spacer(modifier = Modifier.width(4.dp))
                                Icon(
                                    imageVector = Icons.Default.ChevronRight,
                                    contentDescription = null,
                                    modifier = Modifier.size(14.dp),
                                    tint = colors.background
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
