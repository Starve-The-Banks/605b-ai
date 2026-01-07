package ai.b605.creditclear.data

import kotlinx.serialization.Serializable
import java.util.UUID

// Chat Message
data class ChatMessage(
    val id: String = UUID.randomUUID().toString(),
    val role: MessageRole,
    val content: String,
    val timestamp: Long = System.currentTimeMillis(),
    val isError: Boolean = false
)

enum class MessageRole {
    USER, ASSISTANT
}

// Dispute
@Serializable
data class Dispute(
    val id: String = UUID.randomUUID().toString(),
    val agency: String,
    val accountName: String,
    val disputeType: DisputeType,
    val status: DisputeStatus = DisputeStatus.PENDING,
    val dateSent: Long,
    val deadlineDate: Long,
    val notes: String? = null,
    val responseReceived: Boolean = false
) {
    val daysRemaining: Int
        get() {
            val diff = deadlineDate - System.currentTimeMillis()
            return (diff / (1000 * 60 * 60 * 24)).toInt()
        }
    
    val isOverdue: Boolean
        get() = daysRemaining < 0 && !responseReceived
}

@Serializable
enum class DisputeType(val displayName: String, val deadline: Int, val colorHex: Long) {
    IDENTITY_THEFT("Identity Theft (§605B)", 4, 0xFFEF4444),
    INACCURACY("Inaccuracy (§611)", 30, 0xFFF59E0B),
    DEBT_VALIDATION("Debt Validation (§809)", 30, 0xFF3B82F6),
    DIRECT_FURNISHER("Direct Furnisher (§623)", 30, 0xFF22C55E)
}

@Serializable
enum class DisputeStatus(val displayName: String) {
    PENDING("Pending"),
    INVESTIGATING("Under Investigation"),
    RESOLVED("Resolved"),
    ESCALATED("Escalated"),
    VIOLATION("Deadline Violated")
}

// Flagged Item
@Serializable
data class FlaggedItem(
    val id: String = UUID.randomUUID().toString(),
    val account: String,
    val issue: String,
    val statute: String,
    val severity: Severity,
    val successLikelihood: String,
    val flaggedAt: Long = System.currentTimeMillis(),
    val bureau: String? = null,
    val notes: String? = null
)

@Serializable
enum class Severity(val colorHex: Long) {
    HIGH(0xFFEF4444),
    MEDIUM(0xFFF59E0B),
    LOW(0xFF22C55E)
}

// Audit Entry
@Serializable
data class AuditEntry(
    val id: String = UUID.randomUUID().toString(),
    val timestamp: Long = System.currentTimeMillis(),
    val action: String,
    val details: String = ""
)

// Analysis Result
@Serializable
data class AnalysisResult(
    val summary: AnalysisSummary? = null,
    val findings: List<Finding> = emptyList(),
    val positiveFactors: List<String>? = null
)

@Serializable
data class AnalysisSummary(
    val totalAccounts: Int,
    val potentialIssues: Int,
    val highPriorityItems: Int,
    val estimatedDisputeTime: String? = null
)

@Serializable
data class Finding(
    val account: String,
    val issue: String,
    val statute: String,
    val severity: String,
    val successLikelihood: String,
    val recommendation: String? = null
) {
    val id: String get() = "$account-$issue"
}

// Letter Template
data class LetterTemplate(
    val id: String,
    val name: String,
    val description: String,
    val deadline: String,
    val category: TemplateCategory,
    val externalUrl: String? = null,
    val content: String? = null
)

enum class TemplateCategory(val displayName: String, val icon: String) {
    IDENTITY_THEFT("Identity Theft Recovery", "shield"),
    DISPUTES("Credit Bureau Disputes", "warning"),
    DEBT_COLLECTION("Debt Collection Defense", "dollar"),
    SPECIALTY("Specialty Agencies", "building"),
    ESCALATION("Escalation & Legal", "scale")
}

// Quick Start Option
data class QuickStartOption(
    val text: String,
    val icon: String
)
