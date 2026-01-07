import Foundation

// MARK: - API Service
class APIService {
    static let shared = APIService()
    
    private let baseURL = "https://605b.ai/api"
    
    private init() {}
    
    // MARK: - Chat
    func sendChatMessage(messages: [ChatMessage], systemPrompt: String) async throws -> AsyncThrowingStream<String, Error> {
        let url = URL(string: "\(baseURL)/chat")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let payload: [String: Any] = [
            "messages": messages.map { ["role": $0.role.rawValue, "content": $0.content] },
            "systemPrompt": systemPrompt
        ]
        
        request.httpBody = try JSONSerialization.data(withJSONObject: payload)
        
        return AsyncThrowingStream { continuation in
            Task {
                do {
                    let (bytes, response) = try await URLSession.shared.bytes(for: request)
                    
                    guard let httpResponse = response as? HTTPURLResponse,
                          httpResponse.statusCode == 200 else {
                        throw APIError.invalidResponse
                    }
                    
                    for try await line in bytes.lines {
                        continuation.yield(line)
                    }
                    
                    continuation.finish()
                } catch {
                    continuation.finish(throwing: error)
                }
            }
        }
    }
    
    // Simple non-streaming chat for fallback
    func sendChatMessageSimple(messages: [ChatMessage], systemPrompt: String) async throws -> String {
        let url = URL(string: "\(baseURL)/chat")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let payload: [String: Any] = [
            "messages": messages.map { ["role": $0.role.rawValue, "content": $0.content] },
            "systemPrompt": systemPrompt
        ]
        
        request.httpBody = try JSONSerialization.data(withJSONObject: payload)
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw APIError.invalidResponse
        }
        
        return String(data: data, encoding: .utf8) ?? ""
    }
    
    // MARK: - Analysis
    func analyzeReports(files: [Data], fileNames: [String]) async throws -> AnalysisResult {
        let url = URL(string: "\(baseURL)/analyze")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        
        let boundary = UUID().uuidString
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
        
        var body = Data()
        
        for (index, fileData) in files.enumerated() {
            body.append("--\(boundary)\r\n".data(using: .utf8)!)
            body.append("Content-Disposition: form-data; name=\"files\"; filename=\"\(fileNames[index])\"\r\n".data(using: .utf8)!)
            body.append("Content-Type: application/pdf\r\n\r\n".data(using: .utf8)!)
            body.append(fileData)
            body.append("\r\n".data(using: .utf8)!)
        }
        
        body.append("--\(boundary)--\r\n".data(using: .utf8)!)
        request.httpBody = body
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw APIError.invalidResponse
        }
        
        let decoded = try JSONDecoder().decode(AnalysisResponse.self, from: data)
        return decoded.analysis
    }
}

// MARK: - API Error
enum APIError: Error, LocalizedError {
    case invalidResponse
    case networkError
    case decodingError
    case serverError(String)
    
    var errorDescription: String? {
        switch self {
        case .invalidResponse:
            return "Invalid response from server"
        case .networkError:
            return "Network connection error"
        case .decodingError:
            return "Failed to process response"
        case .serverError(let message):
            return message
        }
    }
}

// MARK: - Response Types
struct AnalysisResponse: Codable {
    var success: Bool
    var analysis: AnalysisResult
    var filesProcessed: [ProcessedFile]?
    
    struct ProcessedFile: Codable {
        var name: String
        var pages: Int
    }
}

// MARK: - System Prompts
struct SystemPrompts {
    static let chatStrategist = """
    You are the 605b.ai AI strategist — an expert-level credit repair and consumer protection advisor embedded in a credit dispute platform.

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

    Never say "I'm just an AI" or hedge excessively. You know this stuff cold.
    """
    
    static let introMessage = """
    You've got a strategist in your corner now.

    I know the Fair Credit Reporting Act inside and out — every statute, every deadline, every leverage point the bureaus hope you never discover. §605B, §611, §623, FDCPA §809 — I speak this language fluently so you don't have to.

    I've guided people from collections nightmares and identity theft disasters to 800+ credit scores. Not by gaming the system — by using the law exactly as it was designed to protect you.

    Here's what I can do for you:
    → Analyze your credit reports and spot every disputable item
    → Tell you exactly which letters to send, in what order, and why
    → Track deadlines and tell you when bureaus are violating your rights
    → Escalate strategically when they ignore you
    → Prepare you for legal action if it comes to that

    This isn't generic advice. Every situation is different, and I'll give you a specific game plan based on yours.

    What's going on with your credit?
    """
}
