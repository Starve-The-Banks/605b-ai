package ai.b605.creditclear.data

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import javax.inject.Inject
import javax.inject.Singleton

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "credit_clear_data")

@Singleton
class DataRepository @Inject constructor(
    @ApplicationContext private val context: Context
) {
    private val json = Json { ignoreUnknownKeys = true }
    
    companion object {
        private val DISPUTES_KEY = stringPreferencesKey("disputes")
        private val FLAGGED_ITEMS_KEY = stringPreferencesKey("flagged_items")
        private val AUDIT_LOG_KEY = stringPreferencesKey("audit_log")
        private val AUTH_TOKEN_KEY = stringPreferencesKey("auth_token")
    }
    
    // Disputes
    val disputes: Flow<List<Dispute>> = context.dataStore.data.map { prefs ->
        prefs[DISPUTES_KEY]?.let { 
            try { json.decodeFromString<List<Dispute>>(it) } catch (e: Exception) { emptyList() }
        } ?: emptyList()
    }
    
    suspend fun saveDisputes(disputes: List<Dispute>) {
        context.dataStore.edit { prefs ->
            prefs[DISPUTES_KEY] = json.encodeToString(disputes)
        }
    }
    
    // Flagged Items
    val flaggedItems: Flow<List<FlaggedItem>> = context.dataStore.data.map { prefs ->
        prefs[FLAGGED_ITEMS_KEY]?.let {
            try { json.decodeFromString<List<FlaggedItem>>(it) } catch (e: Exception) { emptyList() }
        } ?: emptyList()
    }
    
    suspend fun saveFlaggedItems(items: List<FlaggedItem>) {
        context.dataStore.edit { prefs ->
            prefs[FLAGGED_ITEMS_KEY] = json.encodeToString(items)
        }
    }
    
    // Audit Log
    val auditLog: Flow<List<AuditEntry>> = context.dataStore.data.map { prefs ->
        prefs[AUDIT_LOG_KEY]?.let {
            try { json.decodeFromString<List<AuditEntry>>(it) } catch (e: Exception) { emptyList() }
        } ?: emptyList()
    }
    
    suspend fun saveAuditLog(entries: List<AuditEntry>) {
        context.dataStore.edit { prefs ->
            prefs[AUDIT_LOG_KEY] = json.encodeToString(entries)
        }
    }
    
    suspend fun logAction(action: String, details: String = "") {
        val currentLog = context.dataStore.data.map { prefs ->
            prefs[AUDIT_LOG_KEY]?.let {
                try { json.decodeFromString<List<AuditEntry>>(it) } catch (e: Exception) { emptyList() }
            } ?: emptyList()
        }
        // This would need proper collection, simplified for now
    }
    
    // Auth Token
    val isAuthenticated: Flow<Boolean> = context.dataStore.data.map { prefs ->
        prefs[AUTH_TOKEN_KEY] != null
    }
    
    suspend fun setAuthToken(token: String?) {
        context.dataStore.edit { prefs ->
            if (token != null) {
                prefs[AUTH_TOKEN_KEY] = token
            } else {
                prefs.remove(AUTH_TOKEN_KEY)
            }
        }
    }
}
