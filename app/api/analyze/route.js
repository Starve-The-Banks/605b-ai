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
  return NextResponse.json({
    success: true,
    filesProcessed: data.filesProcessed || [],
    analysis: data.analysis || {},
    remaining: data.remaining || 0
  });
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

      // Truncate text to fit within token limits
      const maxTextLength = 12000; // Conservative limit for Claude
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
        max_tokens: 2000,
        messages: [
          {
            role: "user",
            content: `You are a credit report analysis expert. Analyze this credit report and provide findings in a structured format.

Focus on:
- Potential inaccuracies or errors
- Items that could be disputed under FCRA
- Account status discrepancies
- Personal information errors
- High-priority issues

Credit report text:
${textToAnalyze}

Please provide your analysis in this exact format:

SUMMARY:
[Brief overview of the report]

HIGH PRIORITY ITEMS:
[List items that should be disputed first]

POTENTIAL ISSUES:
[List all potential inaccuracies found]

POSITIVE FACTORS:
[List any positive elements]

RECOMMENDATIONS:
[Specific next steps]`
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
    try {
      const redisClient = getRedis();
      const tierKey = `user:${userId}:tier`;
      const tierRaw = await redisClient.get(tierKey);
      
      if (tierRaw) {
        const tierData = typeof tierRaw === 'string' ? JSON.parse(tierRaw) : tierRaw;
        const currentUsed = tierData.pdfAnalysesUsed || 0;
        const maxAnalyses = tierData.features?.pdfAnalyses || 1;
        
        // Increment usage count
        const newUsed = currentUsed + 1;
        const updatedTierData = {
          ...tierData,
          pdfAnalysesUsed: newUsed,
          pdfAnalysesRemaining: maxAnalyses === -1 ? -1 : Math.max(0, maxAnalyses - newUsed),
        };
        
        // Save updated tier data
        await redisClient.set(tierKey, JSON.stringify(updatedTierData));
        remaining = updatedTierData.pdfAnalysesRemaining;
        
        console.log('[Analyze] Updated usage:', {
          userId,
          oldUsed: currentUsed,
          newUsed,
          maxAnalyses,
          remaining
        });
      } else {
        console.warn('[Analyze] No tier data found for user:', userId);
        remaining = 0;
      }
    } catch (usageErr) {
      console.error('[Analyze] Failed to update usage count:', usageErr);
      // Continue with response - don't fail analysis due to usage tracking issue
      remaining = 0;
    }
    
    return successResponse({
      filesProcessed: [{ 
        name: file.name, 
        pages: pdfData.numpages || 1 
      }],
      analysis: analysisResult,
      remaining: remaining === -1 ? 999 : remaining // Convert unlimited to large number for mobile
    });

  } catch (err) {
    console.error('[Analyze] UNHANDLED ERROR in POST /api/analyze:', err?.stack || err);
    return errorResponse("PROCESSING_FAILED", "An unexpected error occurred during analysis", 500);
  }
}

// Helper function to parse AI response into expected structure
function parseAnalysisResponse(aiResponse) {
  // Truncate AI response if excessively large (prevent memory issues)
  const maxResponseLength = 50000; // 50KB limit
  const truncatedResponse = aiResponse.length > maxResponseLength 
    ? aiResponse.slice(0, maxResponseLength) 
    : aiResponse;

  if (aiResponse.length > maxResponseLength) {
    console.warn('[Analyze] AI response truncated for safety:', {
      originalLength: aiResponse.length,
      truncatedLength: maxResponseLength
    });
  }
  
  // Simple parsing - could be enhanced with more sophisticated text processing
  const sections = truncatedResponse.split(/(?:SUMMARY|HIGH PRIORITY|POTENTIAL ISSUES|POSITIVE FACTORS|RECOMMENDATIONS):/i);
  
  return {
    summary: {
      overallAssessment: sections[1]?.trim() || "Analysis completed",
      potentialIssues: (truncatedResponse.match(/POTENTIAL ISSUES:(.*?)(?:POSITIVE|RECOMMENDATIONS|$)/is)?.[1] || '').split('\n').filter(line => line.trim()).length,
      highPriorityItems: (truncatedResponse.match(/HIGH PRIORITY ITEMS:(.*?)(?:POTENTIAL|POSITIVE|$)/is)?.[1] || '').split('\n').filter(line => line.trim()).length
    },
    findings: extractFindings(truncatedResponse),
    positiveFactors: extractPositiveFactors(truncatedResponse),
    crossBureauInconsistencies: [],
    personalInfo: {} // Could extract personal info if needed
  };
}

function extractFindings(text) {
  const findings = [];
  const highPrioritySection = text.match(/HIGH PRIORITY ITEMS:(.*?)(?:POTENTIAL|POSITIVE|$)/is)?.[1] || '';
  const potentialSection = text.match(/POTENTIAL ISSUES:(.*?)(?:POSITIVE|RECOMMENDATIONS|$)/is)?.[1] || '';
  
  // Extract high priority items
  const highPriorityLines = highPrioritySection.split('\n').filter(line => line.trim() && !line.match(/^[-•*]/));
  highPriorityLines.forEach((line, index) => {
    if (line.trim()) {
      findings.push({
        id: `high-${index}`,
        type: 'accuracy',
        severity: 'high',
        account: 'Credit Report',
        issue: line.trim(),
        recommendation: 'Dispute this item with the credit bureau',
        successLikelihood: 'Medium to High'
      });
    }
  });

  // Extract potential issues
  const potentialLines = potentialSection.split('\n').filter(line => line.trim() && !line.match(/^[-•*]/));
  potentialLines.forEach((line, index) => {
    if (line.trim()) {
      findings.push({
        id: `potential-${index}`,
        type: 'potential',
        severity: 'medium',
        account: 'Credit Report', 
        issue: line.trim(),
        recommendation: 'Review and consider disputing',
        successLikelihood: 'Medium'
      });
    }
  });

  return findings.slice(0, 20); // Limit to top 20 findings
}

function extractPositiveFactors(text) {
  const positiveSection = text.match(/POSITIVE FACTORS:(.*?)(?:RECOMMENDATIONS|$)/is)?.[1] || '';
  return positiveSection
    .split('\n')
    .filter(line => line.trim() && !line.match(/^[-•*]/))
    .map(line => line.trim())
    .filter(Boolean)
    .slice(0, 10);
}