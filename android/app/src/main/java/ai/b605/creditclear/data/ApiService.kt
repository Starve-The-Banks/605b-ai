package ai.b605.creditclear.data

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.flowOn
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import kotlinx.serialization.json.putJsonArray
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.IOException
import java.util.concurrent.TimeUnit
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ApiService @Inject constructor() {
    
    private val client = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .writeTimeout(30, TimeUnit.SECONDS)
        .build()
    
    private val json = Json { ignoreUnknownKeys = true }
    
    companion object {
        private const val BASE_URL = "https://605b.ai/api"
    }
    
    fun sendChatMessage(messages: List<ChatMessage>, systemPrompt: String): Flow<String> = flow {
        val jsonBody = buildJsonObject {
            putJsonArray("messages") {
                messages.forEach { msg ->
                    add(buildJsonObject {
                        put("role", msg.role.name.lowercase())
                        put("content", msg.content)
                    })
                }
            }
            put("systemPrompt", systemPrompt)
        }
        
        val request = Request.Builder()
            .url("$BASE_URL/chat")
            .post(jsonBody.toString().toRequestBody("application/json".toMediaType()))
            .build()
        
        val response = client.newCall(request).execute()
        
        if (!response.isSuccessful) {
            throw IOException("API error: ${response.code}")
        }
        
        response.body?.let { body ->
            val reader = body.charStream().buffered()
            val buffer = StringBuilder()
            var char: Int
            
            while (reader.read().also { char = it } != -1) {
                buffer.append(char.toChar())
                emit(buffer.toString())
            }
        }
    }.flowOn(Dispatchers.IO)
    
    suspend fun sendChatMessageSimple(messages: List<ChatMessage>, systemPrompt: String): String {
        val jsonBody = buildJsonObject {
            putJsonArray("messages") {
                messages.forEach { msg ->
                    add(buildJsonObject {
                        put("role", msg.role.name.lowercase())
                        put("content", msg.content)
                    })
                }
            }
            put("systemPrompt", systemPrompt)
        }
        
        val request = Request.Builder()
            .url("$BASE_URL/chat")
            .post(jsonBody.toString().toRequestBody("application/json".toMediaType()))
            .build()
        
        val response = client.newCall(request).execute()
        
        if (!response.isSuccessful) {
            throw IOException("API error: ${response.code}")
        }
        
        return response.body?.string() ?: ""
    }
}

object SystemPrompts {
    const val CHAT_STRATEGIST = """You are the 605b.ai AI strategist — an expert-level credit repair and consumer protection advisor embedded in a credit dispute platform.

YOUR PERSONA:
- You're a knowledgeable ally, not a support bot
- You speak with confidence and authority
- You give specific, actionable advice — never vague platitudes
- You cite statutes naturally (§605B, §611, §809) without being pedantic
- You're encouraging but realistic about timelines and outcomes
- You understand the emotional weight of credit problems

YOUR KNOWLEDGE:
- Deep expertise in FCRA, FDCPA, and state consumer protection laws
- Practical experience with bureau behavior, collector tactics, and dispute strategies
- Understanding of ChexSystems, EWS, LexisNexis, and specialty agencies
- Knowledge of escalation paths: CFPB complaints, state AG, small claims, federal court

RESPONSE STYLE:
- Be direct and confident
- Use short paragraphs, not walls of text
- Include specific next steps when relevant
- Reference statutes naturally
- Match their energy — if they're stressed, acknowledge it; if they're ready to fight, match that

Never say "I'm just an AI" or hedge excessively. You know this stuff cold."""
    
    const val INTRO_MESSAGE = """You've got a strategist in your corner now.

I know the Fair Credit Reporting Act inside and out — every statute, every deadline, every leverage point the bureaus hope you never discover. §605B, §611, §623, FDCPA §809 — I speak this language fluently so you don't have to.

I've guided people from collections nightmares and identity theft disasters to 800+ credit scores. Not by gaming the system — by using the law exactly as it was designed to protect you.

Here's what I can do for you:
→ Analyze your credit reports and spot every disputable item
→ Tell you exactly which letters to send, in what order, and why
→ Track deadlines and tell you when bureaus are violating your rights
→ Escalate strategically when they ignore you
→ Prepare you for legal action if it comes to that

This isn't generic advice. Every situation is different, and I'll give you a specific game plan based on yours.

What's going on with your credit?"""
}
