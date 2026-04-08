import pdfParse from 'pdf-parse';
import Anthropic from '@anthropic-ai/sdk';
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getRedis } from '@/lib/redis';

// Vercel request body limits are tight; stay under ~4.5MB platform ceiling
const MAX_FILE_SIZE = 4 * 1024 * 1024;

export const runtime = 'nodejs';
export const maxDuration = 60;

// AI analysis timeout (30 seconds)
const AI_TIMEOUT_MS = 30 * 1000;
const AI_MODEL = process.env.ANTHROPIC_ANALYZE_MODEL || 'claude-sonnet-4-20250514';

// Anthropic client instance
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const ANALYSIS_SYSTEM_PROMPT = `You are the most thorough credit report analysis system in the industry. You analyze consumer reports from ALL bureau types and produce exhaustive, actionable findings.

REPORT TYPE DETECTION:
First, identify the report source from content patterns:
- Equifax, Experian, TransUnion (traditional credit bureaus)
- ChexSystems (bank account closures, fraud flags, involuntary closures)
- LexisNexis (insurance risk, employment history, address history, public records)
- Early Warning Services / EWS (deposit account screening, fraud indicators)
- Innovis (fourth credit bureau, similar to traditional bureaus)
- SageStream (alternative credit data, thin-file consumers)
- NCTUE (utility and telecom payment history)
- If you cannot determine the source, use "Unknown"

ANALYSIS DEPTH — for every account/item found:
1. Identify the specific inaccuracy or concern
2. Cite the exact FCRA statute that applies (§611, §605B, §623, §609, §605A, §604, §605)
3. Assess severity: "high" (clear violation, strong dispute basis), "medium" (likely disputable), "low" (minor or informational)
4. Provide a specific dispute recommendation (not generic advice)
5. Estimate dispute success likelihood: "Strong" / "Moderate" / "Possible"
6. Identify the reasoning (why this is disputable under law)

WHAT TO LOOK FOR:
- Accounts not belonging to the consumer (mixed files, identity theft)
- Incorrect balances, credit limits, or high-balance amounts
- Wrong payment history (late payments that were on time)
- Incorrect account status (open vs closed, current vs delinquent)
- Wrong dates (date opened, date of first delinquency, last activity)
- Duplicate accounts (same debt reported by original creditor AND collector)
- Re-aged debts (date of first delinquency moved forward to extend reporting)
- Accounts past the 7-year reporting period (10 for bankruptcies)
- Unauthorized hard inquiries
- Incorrect personal information (names, addresses, employers, SSN variations)
- For ChexSystems: involuntary closures that may be inaccurate, fraud flags you didn't cause
- For LexisNexis: incorrect insurance scores, wrong employment/address data
- For EWS: incorrect account closure reasons, fraud indicators that are wrong

CROSS-BUREAU INCONSISTENCIES:
If the report contains data from multiple bureaus or if accounts reference different bureau reporting, flag any inconsistencies (different balances, different statuses, different dates for the same account).

POSITIVE FACTORS:
Identify accounts in good standing, long payment histories, low utilization, and other positive elements.

OUTPUT FORMAT — return ONLY a valid JSON object with this exact structure:
{
  "reportType": "Equifax" | "Experian" | "TransUnion" | "ChexSystems" | "LexisNexis" | "EWS" | "Innovis" | "SageStream" | "NCTUE" | "Unknown",
  "summary": {
    "overallAssessment": "2-3 paragraph comprehensive assessment",
    "potentialIssues": <number>,
    "highPriorityItems": <number>,
    "reportDate": "extracted date if visible, or null"
  },
  "findings": [
    {
      "id": "finding-1",
      "type": "accuracy" | "identity" | "timeliness" | "completeness" | "inquiry" | "personal-info",
      "severity": "high" | "medium" | "low",
      "account": "Creditor name or account identifier",
      "issue": "Specific description of the problem found",
      "statute": "FCRA §611" | "FCRA §605B" | "FCRA §623" | etc,
      "recommendation": "Specific action to take",
      "reasoning": "Why this is disputable under the cited statute",
      "successLikelihood": "Strong" | "Moderate" | "Possible"
    }
  ],
  "positiveFactors": ["Account X has 5 years of on-time payments", ...],
  "crossBureauInconsistencies": [
    {
      "item": "Account or data point",
      "details": "What differs and why it matters"
    }
  ],
  "personalInfo": {
    "namesFound": ["list of name variations found"],
    "addressesFound": ["list of addresses found"],
    "issues": ["any personal info discrepancies"]
  },
  "actionPlan": [
    "Step 1: Priority action",
    "Step 2: Next action",
    ...
  ]
}

CRITICAL RULES:
- Return ONLY the JSON object. No markdown, no code fences, no explanation text before or after.
- Every finding MUST have a specific statute citation.
- Be exhaustive — do not skip items. Analyze every account and tradeline visible.
- For specialty reports (ChexSystems, EWS, LexisNexis), adapt your analysis to their specific data formats.
- Never promise outcomes. Use "may be disputable" or "potential violation" language.
- Never request SSN, DOB, or other PII in your response.`;

function errorResponse(code, message, status = 200) {
  return NextResponse.json(
    {
      success: false,
      error: { code, message }
    },
    { status }
  );
}

function successResponse(data) {
  const resp = {
    success: true,
    filesProcessed: data.filesProcessed || [],
    analysis: data.analysis || {},
    remaining: data.remaining || 0,
  };
  if (typeof data.pdfAnalysesUsed === 'number') {
    resp.pdfAnalysesUsed = data.pdfAnalysesUsed;
  }
  return NextResponse.json(resp);
}

/** React Native often omits MIME or sends octet-stream; web may send application/pdf */
function isLikelyPdfFile(file) {
  const name = (file.name || '').toLowerCase();
  const t = (file.type || '').toLowerCase();
  if (name.endsWith('.pdf')) return true;
  if (t === 'application/pdf' || t === 'application/x-pdf') return true;
  if (t === 'application/octet-stream' || t === '') return true;
  return false;
}

export async function POST(request) {
  const startTime = Date.now();
  const contentType = request.headers.get('content-type') || '';
  console.log('[Analyze] POST start', {
    method: request.method,
    contentTypePreview: contentType.slice(0, 120)
  });

  try {
    // =========================
    // 1. AUTHENTICATION
    // =========================
    let authResult;
    try {
      authResult = await auth();
    } catch (authErr) {
      console.error('[Analyze] Clerk auth() threw error:', authErr?.stack || authErr);
      return errorResponse("AUTH_ERROR", "Authentication service unavailable", 503);
    }

    const { userId } = authResult;
    if (!userId) {
      console.warn('[Analyze] Unauthorized request - no userId');
      return errorResponse("AUTH_REQUIRED", "Authentication required", 401);
    }

    // =========================
    // 2. PARSE FORM DATA
    // =========================
    let formData;
    try {
      formData = await request.formData();
    } catch (err) {
      console.error('[Analyze] FormData parsing failed:', err);
      return errorResponse("INVALID_REQUEST", "Invalid form data", 400);
    }

    // Mobile client sends field name 'files' (not 'file')
    let file = formData.get('files');
    
    if (!file) {
      console.warn('[Analyze] No file in formData - checking for \'file\' field');
      file = formData.get('file');
      if (!file) {
        return errorResponse("NO_FILE", "No file uploaded", 400);
      }
      console.log('[Analyze] Found file in \'file\' field instead of \'files\'');
    }

    console.log('[Analyze] File received:', {
      name: file.name,
      type: file.type,
      size: file.size
    });

    // =========================
    // 3. VALIDATE FILE
    // =========================
    if (!isLikelyPdfFile(file)) {
      console.warn('[Analyze] Invalid file type:', file.type, file.name);
      return errorResponse("INVALID_TYPE", "Only PDF files are supported", 400);
    }

    if (file.size > MAX_FILE_SIZE) {
      console.warn('[Analyze] File too large:', file.size);
      return errorResponse("FILE_TOO_LARGE", "File must be under 4MB", 413);
    }

    // =========================
    // 4. CONVERT TO BUFFER
    // =========================
    let bytes, buffer;
    try {
      bytes = await file.arrayBuffer();
      buffer = Buffer.from(bytes);
      console.log('[Analyze] File converted to buffer, size:', buffer.length);
    } catch (err) {
      console.error('[Analyze] Buffer conversion failed:', err);
      return errorResponse("FILE_READ_ERROR", "Could not read uploaded file", 422);
    }

    // Additional buffer size validation after conversion
    if (buffer.length > MAX_FILE_SIZE) {
      console.warn('[Analyze] Buffer size exceeds limit after conversion:', buffer.length);
      return errorResponse("FILE_TOO_LARGE", "File must be under 4MB", 413);
    }

    // =========================
    // 5. PDF PARSING (SAFE)
    // =========================
    let pdfData;
    try {
      console.log('[Analyze] Starting PDF parsing...');
      pdfData = await pdfParse(buffer);
      console.log('[Analyze] PDF parsed successfully, text length:', pdfData.text?.length || 0);
    } catch (err) {
      console.error('[Analyze] PDF parsing failed:', err);
      
      // Check for specific PDF issues
      const errorMsg = err.message?.toLowerCase() || '';
      
      if (errorMsg.includes('password') || errorMsg.includes('encrypted')) {
        return errorResponse("PASSWORD_PROTECTED", "Password-protected PDFs are not supported", 422);
      }
      
      if (errorMsg.includes('xref') || errorMsg.includes('corrupt') || errorMsg.includes('damaged')) {
        return errorResponse("CORRUPT_PDF", "PDF file appears to be corrupted", 422);
      }
      
      return errorResponse("INVALID_PDF", "Could not read PDF file - please try another file", 422);
    }

    const extractedText = pdfData.text || '';
    
    if (extractedText.length < 50) {
      console.warn('[Analyze] PDF text too short:', extractedText.length);
      return errorResponse("EMPTY_PDF", "PDF appears to have no readable text content", 422);
    }

    // Check for scanned PDFs with no text layer (image-only PDFs)
    const wordsFound = extractedText.split(/\s+/).filter(word => word.length > 2).length;
    if (wordsFound < 10) {
      console.warn('[Analyze] PDF appears to be image-only (no text layer):', { 
        textLength: extractedText.length, 
        wordsFound,
        fileName: file.name 
      });
      return errorResponse("IMAGE_ONLY_PDF", "This PDF appears to be a scanned image without text. Please use a PDF with searchable text.", 422);
    }

    // =========================
    // 6. AI ANALYSIS (SAFE)
    // =========================
    let analysisResult;
    let aiTimeout;
    let aiController;
    
    try {
      console.log('[Analyze] Starting AI analysis...');
      
      if (!process.env.ANTHROPIC_API_KEY) {
        console.error('[Analyze] ANTHROPIC_API_KEY not configured');
        return errorResponse("CONFIGURATION_ERROR", "Analysis service is not properly configured", 503);
      }

      // Truncate text to fit within token limits — generous for deep analysis
      const maxTextLength = 20000;
      const textToAnalyze = extractedText.length > maxTextLength 
        ? (() => {
            console.warn('[Analyze] Text truncated for analysis:', {
              originalLength: extractedText.length,
              truncatedLength: maxTextLength,
              fileName: file.name
            });
            return extractedText.slice(0, maxTextLength) + '\n\n[Content truncated for analysis]';
          })()
        : extractedText;

      // Create timeout controller for AI request
      aiController = new AbortController();
      aiTimeout = setTimeout(() => {
        console.warn('[Analyze] AI request timeout after', AI_TIMEOUT_MS, 'ms');
        aiController.abort();
      }, AI_TIMEOUT_MS);

      const response = await anthropic.messages.create({
        model: AI_MODEL,
        max_tokens: 4000,
        system: ANALYSIS_SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: `Analyze this credit/consumer report and return ONLY valid JSON matching the schema described in your instructions.\n\nReport text:\n${textToAnalyze}`
          }
        ]
      }, {
        signal: aiController.signal
      });

      if (aiTimeout) clearTimeout(aiTimeout);

      const aiResponse = response.content?.[0]?.text || '';
      console.log('[Analyze] AI analysis completed, response length:', aiResponse.length);

      // Validate AI response is not empty
      if (!aiResponse || aiResponse.trim().length < 20) {
        console.error('[Analyze] AI returned empty or minimal response:', aiResponse?.slice(0, 100));
        return errorResponse("AI_UNAVAILABLE", "Analysis service returned incomplete results - please try again", 502);
      }

      // Parse AI response into structured format
      try {
        analysisResult = parseAnalysisResponse(aiResponse);
      } catch (parseErr) {
        console.error('[Analyze] parseAnalysisResponse failed:', parseErr?.stack || parseErr);
        return errorResponse("PROCESSING_FAILED", "Analysis could not be completed - please try again", 502);
      }

    } catch (err) {
      console.error('[Analyze] AI analysis failed:', err?.stack || err);
      
      // Clear timeout if it's still active
      if (aiTimeout) clearTimeout(aiTimeout);
      const errorMessage = String(err?.message || '').toLowerCase();
      
      // Handle specific error types
      if (err.name === 'AbortError') {
        return errorResponse("AI_TIMEOUT", "Analysis took too long - please try again", 408);
      }
      
      if (err.status === 429) {
        return errorResponse("RATE_LIMITED", "Analysis service is currently busy - please try again in a moment", 429);
      }

      if (
        err.status === 401 ||
        err.status === 403 ||
        err.status === 404 ||
        errorMessage.includes('authentication_error') ||
        errorMessage.includes('invalid x-api-key') ||
        errorMessage.includes('model:')
      ) {
        return errorResponse("CONFIGURATION_ERROR", "Analysis service is temporarily misconfigured. Please contact support.", 503);
      }

      if (err.status >= 500 || err.status === undefined) {
        return errorResponse("AI_UNAVAILABLE", "Analysis service is temporarily unavailable - please try again later", 502);
      }

      return errorResponse("AI_UNAVAILABLE", "Analysis could not be completed - please try again", 502);
    }

    // =========================
    // 7. UPDATE USAGE & SUCCESS RESPONSE
    // =========================
    const duration = Date.now() - startTime;
    console.log('[Analyze] Analysis completed successfully in', duration, 'ms');
    
    // Update user's analysis usage count
    let remaining = 0;
    let newUsedCount = 1;
    try {
      const redisClient = getRedis();
      const tierKey = `user:${userId}:tier`;
      const tierRaw = await redisClient.get(tierKey);
      
      let tierData;
      if (tierRaw) {
        tierData = typeof tierRaw === 'string' ? JSON.parse(tierRaw) : tierRaw;
      } else {
        // Fresh Redis or beta user with no tier key yet — seed with free defaults
        tierData = { tier: 'free', features: { pdfAnalyses: 1 }, pdfAnalysesUsed: 0 };
        console.warn('[Analyze] No tier data in Redis for user, seeding:', userId);
      }

      const currentUsed = tierData.pdfAnalysesUsed || 0;
      const maxAnalyses = tierData.features?.pdfAnalyses ?? 1;
      const newUsed = currentUsed + 1;
      newUsedCount = newUsed;

      const updatedTierData = {
        ...tierData,
        pdfAnalysesUsed: newUsed,
        pdfAnalysesRemaining: maxAnalyses === -1 ? -1 : Math.max(0, maxAnalyses - newUsed),
      };

      await redisClient.set(tierKey, JSON.stringify(updatedTierData));
      remaining = updatedTierData.pdfAnalysesRemaining;

      console.log('[Analyze] Updated usage:', {
        userId,
        oldUsed: currentUsed,
        newUsed,
        maxAnalyses,
        remaining,
      });
    } catch (usageErr) {
      console.error('[Analyze] Failed to update usage count:', usageErr);
    }
    
    return successResponse({
      filesProcessed: [{ 
        name: file.name, 
        pages: pdfData.numpages || 1 
      }],
      analysis: analysisResult,
      remaining: remaining === -1 ? 999 : remaining,
      pdfAnalysesUsed: newUsedCount,
    });

  } catch (err) {
    console.error('[Analyze] UNHANDLED ERROR in POST /api/analyze:', err?.stack || err);
    return errorResponse("PROCESSING_FAILED", "An unexpected error occurred during analysis", 500);
  }
}

function parseAnalysisResponse(aiResponse) {
  const maxResponseLength = 80000;
  const text = aiResponse.length > maxResponseLength
    ? aiResponse.slice(0, maxResponseLength)
    : aiResponse;

  // Strip markdown code fences if the model wrapped the JSON
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim();

  try {
    const parsed = JSON.parse(cleaned);
    return {
      reportType: parsed.reportType || 'Unknown',
      summary: {
        overallAssessment: parsed.summary?.overallAssessment || 'Analysis completed',
        potentialIssues: typeof parsed.summary?.potentialIssues === 'number' ? parsed.summary.potentialIssues : (parsed.findings?.length || 0),
        highPriorityItems: typeof parsed.summary?.highPriorityItems === 'number' ? parsed.summary.highPriorityItems : (parsed.findings?.filter(f => f.severity === 'high').length || 0),
        reportDate: parsed.summary?.reportDate || null,
      },
      findings: (parsed.findings || []).slice(0, 30).map((f, i) => ({
        id: f.id || `finding-${i}`,
        type: f.type || 'accuracy',
        severity: f.severity || 'medium',
        account: f.account || 'Unknown Account',
        issue: f.issue || '',
        statute: f.statute || '',
        recommendation: f.recommendation || '',
        reasoning: f.reasoning || '',
        successLikelihood: f.successLikelihood || 'Moderate',
      })),
      positiveFactors: (parsed.positiveFactors || []).slice(0, 15),
      crossBureauInconsistencies: (parsed.crossBureauInconsistencies || []).slice(0, 10).map(c => ({
        item: c.item || '',
        details: c.details || '',
      })),
      personalInfo: parsed.personalInfo || {},
      actionPlan: (parsed.actionPlan || []).slice(0, 10),
    };
  } catch (jsonErr) {
    console.warn('[Analyze] JSON parse failed, falling back to text parsing:', jsonErr.message);
    return fallbackTextParse(text);
  }
}

function fallbackTextParse(text) {
  const sections = text.split(/(?:SUMMARY|HIGH PRIORITY|POTENTIAL ISSUES|POSITIVE FACTORS|RECOMMENDATIONS):/i);
  const highPriority = (text.match(/HIGH PRIORITY ITEMS?:(.*?)(?:POTENTIAL|POSITIVE|$)/is)?.[1] || '')
    .split('\n').filter(l => l.trim()).map((l, i) => ({
      id: `high-${i}`, type: 'accuracy', severity: 'high',
      account: 'Credit Report', issue: l.trim(),
      statute: 'FCRA §611', recommendation: 'Dispute this item with the credit bureau',
      reasoning: '', successLikelihood: 'Moderate',
    }));
  const potential = (text.match(/POTENTIAL ISSUES:(.*?)(?:POSITIVE|RECOMMENDATIONS|$)/is)?.[1] || '')
    .split('\n').filter(l => l.trim()).map((l, i) => ({
      id: `potential-${i}`, type: 'potential', severity: 'medium',
      account: 'Credit Report', issue: l.trim(),
      statute: 'FCRA §611', recommendation: 'Review and consider disputing',
      reasoning: '', successLikelihood: 'Possible',
    }));
  const positiveFactors = (text.match(/POSITIVE FACTORS:(.*?)(?:RECOMMENDATIONS|$)/is)?.[1] || '')
    .split('\n').map(l => l.trim()).filter(Boolean).slice(0, 10);

  return {
    reportType: 'Unknown',
    summary: {
      overallAssessment: sections[1]?.trim() || 'Analysis completed',
      potentialIssues: potential.length,
      highPriorityItems: highPriority.length,
      reportDate: null,
    },
    findings: [...highPriority, ...potential].slice(0, 20),
    positiveFactors,
    crossBureauInconsistencies: [],
    personalInfo: {},
    actionPlan: [],
  };
}