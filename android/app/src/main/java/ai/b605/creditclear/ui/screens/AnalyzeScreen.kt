package ai.b605.creditclear.ui.screens

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import ai.b605.creditclear.ui.theme.CreditClearTheme

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AnalyzeScreen() {
    val colors = CreditClearTheme.colors
    val context = LocalContext.current
    
    var expandedSection by remember { mutableStateOf<String?>(null) }
    
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(colors.background),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Header
        item {
            Text(
                text = "Analyze",
                fontSize = 28.sp,
                fontWeight = FontWeight.Bold,
                color = colors.textPrimary
            )
        }
        
        // Intro Banner
        item {
            IntroBanner()
        }
        
        // Upload Section
        item {
            UploadSection()
        }
        
        // Resources
        item {
            ResourcesSection(
                expandedSection = expandedSection,
                onToggleSection = { section ->
                    expandedSection = if (expandedSection == section) null else section
                }
            )
        }
    }
}

@Composable
fun IntroBanner() {
    val colors = CreditClearTheme.colors
    
    val capabilities = listOf(
        Triple(Icons.Default.Search, "Account Verification", "Identifies unrecognized accounts"),
        Triple(Icons.Default.Warning, "Inconsistency Detection", "Flags cross-bureau discrepancies"),
        Triple(Icons.Default.Schedule, "Age Analysis", "Spots outdated items"),
        Triple(Icons.Default.Balance, "Statute Matching", "Maps to FCRA/FDCPA sections"),
        Triple(Icons.Default.Bolt, "Priority Scoring", "Ranks by success likelihood"),
        Triple(Icons.Default.Shield, "Identity Theft Markers", "Detects fraud patterns"),
    )
    
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(
                brush = Brush.linearGradient(
                    listOf(
                        colors.bronze.copy(alpha = 0.1f),
                        colors.bronze.copy(alpha = 0.05f)
                    )
                )
            )
            .border(1.dp, colors.bronze.copy(alpha = 0.2f), RoundedCornerShape(14.dp))
            .padding(18.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Row(
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = Icons.Outlined.Psychology,
                contentDescription = null,
                tint = colors.bronze,
                modifier = Modifier.size(20.dp)
            )
            Text(
                text = "Comprehensive Credit Analysis",
                fontSize = 16.sp,
                fontWeight = FontWeight.SemiBold,
                color = colors.textPrimary
            )
        }
        
        Text(
            text = "Upload your credit reports and our AI will scan for inaccuracies, identity theft markers, outdated accounts, and FCRA violations.",
            fontSize = 14.sp,
            color = colors.textSecondary,
            lineHeight = 20.sp
        )
        
        // Capabilities grid
        LazyVerticalGrid(
            columns = GridCells.Fixed(2),
            horizontalArrangement = Arrangement.spacedBy(10.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
            modifier = Modifier.height(200.dp)
        ) {
            items(capabilities) { (icon, title, desc) ->
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(8.dp))
                        .background(colors.surfaceBorder.copy(alpha = 0.3f))
                        .padding(10.dp),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(28.dp)
                            .background(colors.bronze.copy(alpha = 0.15f), RoundedCornerShape(6.dp)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = icon,
                            contentDescription = null,
                            tint = colors.bronze,
                            modifier = Modifier.size(14.dp)
                        )
                    }
                    Column {
                        Text(
                            text = title,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = colors.textPrimary
                        )
                        Text(
                            text = desc,
                            fontSize = 10.sp,
                            color = colors.textMuted,
                            maxLines = 1
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun UploadSection() {
    val colors = CreditClearTheme.colors
    val context = LocalContext.current
    
    Column(
        modifier = Modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "Upload Credit Reports",
                fontSize = 16.sp,
                fontWeight = FontWeight.SemiBold,
                color = colors.textPrimary
            )
            
            Row(
                modifier = Modifier
                    .clip(RoundedCornerShape(50))
                    .background(colors.info.copy(alpha = 0.1f))
                    .padding(horizontal = 10.dp, vertical = 5.dp),
                horizontalArrangement = Arrangement.spacedBy(6.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = Icons.Outlined.Info,
                    contentDescription = null,
                    tint = colors.info,
                    modifier = Modifier.size(12.dp)
                )
                Text(
                    text = "Best with all 3 bureaus",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Medium,
                    color = colors.info
                )
            }
        }
        
        // Upload zone
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(14.dp))
                .border(
                    width = 2.dp,
                    color = colors.surfaceBorder,
                    shape = RoundedCornerShape(14.dp)
                )
                .background(colors.backgroundCard.copy(alpha = 0.5f))
                .clickable { /* TODO: Open file picker */ }
                .padding(vertical = 36.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(64.dp)
                    .background(colors.bronze.copy(alpha = 0.1f), CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.UploadFile,
                    contentDescription = null,
                    tint = colors.bronze,
                    modifier = Modifier.size(28.dp)
                )
            }
            
            Text(
                text = "Tap to upload credit reports",
                fontSize = 15.sp,
                fontWeight = FontWeight.Medium,
                color = colors.textPrimary
            )
            
            Text(
                text = "PDF files from Experian, Equifax, TransUnion",
                fontSize = 13.sp,
                color = colors.textTertiary
            )
        }
        
        // No reports CTA
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(12.dp))
                .border(
                    width = 1.dp,
                    color = colors.surfaceBorder,
                    shape = RoundedCornerShape(12.dp)
                )
                .background(colors.surfaceBorder.copy(alpha = 0.3f))
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            Text(
                text = "Don't have your reports yet?",
                fontSize = 15.sp,
                fontWeight = FontWeight.SemiBold,
                color = colors.textPrimary
            )
            
            Text(
                text = "You're entitled to free credit reports from each bureau every week.",
                fontSize = 13.sp,
                color = colors.textTertiary,
                textAlign = TextAlign.Center
            )
            
            Row(
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                OutlinedButton(
                    onClick = {
                        val intent = Intent(Intent.ACTION_VIEW, Uri.parse("https://www.annualcreditreport.com"))
                        context.startActivity(intent)
                    },
                    colors = ButtonDefaults.outlinedButtonColors(
                        contentColor = colors.bronze
                    ),
                    border = ButtonDefaults.outlinedButtonBorder.copy(
                        brush = Brush.linearGradient(listOf(colors.bronze.copy(alpha = 0.25f), colors.bronze.copy(alpha = 0.25f)))
                    )
                ) {
                    Icon(
                        imageVector = Icons.Default.Description,
                        contentDescription = null,
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Get Free Reports", fontSize = 13.sp)
                }
                
                OutlinedButton(
                    onClick = {
                        val intent = Intent(Intent.ACTION_VIEW, Uri.parse("https://www.identitytheft.gov"))
                        context.startActivity(intent)
                    },
                    colors = ButtonDefaults.outlinedButtonColors(
                        contentColor = colors.bronze
                    ),
                    border = ButtonDefaults.outlinedButtonBorder.copy(
                        brush = Brush.linearGradient(listOf(colors.bronze.copy(alpha = 0.25f), colors.bronze.copy(alpha = 0.25f)))
                    )
                ) {
                    Icon(
                        imageVector = Icons.Default.Shield,
                        contentDescription = null,
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Report ID Theft", fontSize = 13.sp)
                }
            }
        }
    }
}

@Composable
fun ResourcesSection(
    expandedSection: String?,
    onToggleSection: (String) -> Unit
) {
    val colors = CreditClearTheme.colors
    val context = LocalContext.current
    
    data class ResourceLink(
        val name: String,
        val url: String,
        val desc: String,
        val highlight: Boolean = false
    )
    
    val sections = listOf(
        Triple(
            "reports",
            "Get Your Credit Reports" to "Free reports from each bureau weekly",
            listOf(
                ResourceLink("AnnualCreditReport.com", "https://www.annualcreditreport.com", "Official free reports (all 3 bureaus)", true),
                ResourceLink("Experian", "https://www.experian.com", "Direct from Experian"),
                ResourceLink("Equifax", "https://www.equifax.com", "Direct from Equifax"),
                ResourceLink("TransUnion", "https://www.transunion.com", "Direct from TransUnion")
            )
        ),
        Triple(
            "specialty",
            "Specialty Agencies" to "Banking, insurance & background data",
            listOf(
                ResourceLink("ChexSystems", "https://www.chexsystems.com", "Banking history report"),
                ResourceLink("Early Warning (EWS)", "https://www.earlywarning.com", "Bank account screening"),
                ResourceLink("LexisNexis", "https://consumer.risk.lexisnexis.com", "Insurance & background data")
            )
        ),
        Triple(
            "government",
            "Government Resources" to "Complaints and identity theft",
            listOf(
                ResourceLink("IdentityTheft.gov", "https://www.identitytheft.gov", "FTC identity theft recovery", true),
                ResourceLink("CFPB Complaint Portal", "https://www.consumerfinance.gov/complaint/", "File federal complaints"),
                ResourceLink("State AG Directory", "https://www.naag.org/find-my-ag/", "Find your state attorney general")
            )
        )
    )
    
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(colors.backgroundCard)
            .border(1.dp, colors.surfaceBorder.copy(alpha = 0.5f), RoundedCornerShape(12.dp))
    ) {
        sections.forEachIndexed { index, (key, titlePair, links) ->
            val (title, subtitle) = titlePair
            val isExpanded = expandedSection == key
            
            Column {
                // Header
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { onToggleSection(key) }
                        .padding(14.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = title,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = colors.textPrimary
                        )
                        Text(
                            text = subtitle,
                            fontSize = 12.sp,
                            color = colors.textTertiary
                        )
                    }
                    
                    Icon(
                        imageVector = if (isExpanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                        contentDescription = null,
                        tint = colors.textMuted,
                        modifier = Modifier.size(20.dp)
                    )
                }
                
                // Links
                if (isExpanded) {
                    Column(
                        modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        links.forEach { link ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(
                                        if (link.highlight) colors.bronze.copy(alpha = 0.1f)
                                        else colors.surfaceBorder.copy(alpha = 0.3f)
                                    )
                                    .border(
                                        1.dp,
                                        if (link.highlight) colors.bronze.copy(alpha = 0.25f)
                                        else colors.surfaceBorder,
                                        RoundedCornerShape(8.dp)
                                    )
                                    .clickable {
                                        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(link.url))
                                        context.startActivity(intent)
                                    }
                                    .padding(12.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = link.name,
                                        fontSize = 14.sp,
                                        fontWeight = FontWeight.Medium,
                                        color = if (link.highlight) colors.bronze else colors.textPrimary
                                    )
                                    Text(
                                        text = link.desc,
                                        fontSize = 12.sp,
                                        color = colors.textTertiary
                                    )
                                }
                                
                                Icon(
                                    imageVector = Icons.Default.OpenInNew,
                                    contentDescription = null,
                                    tint = colors.textMuted,
                                    modifier = Modifier.size(16.dp)
                                )
                            }
                        }
                    }
                }
                
                // Divider
                if (index < sections.size - 1) {
                    HorizontalDivider(color = colors.surfaceBorder)
                }
            }
        }
    }
}
