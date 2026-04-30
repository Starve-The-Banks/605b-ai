import * as Sentry from '@sentry/nextjs';
import pdfParse from 'pdf-parse';
import Anthropic from '@anthropic-ai/sdk';
import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getRedis } from '@/lib/redis';
import { rateLimit, LIMITS } from '@/lib/rateLimit';
import { isReviewerRequest } from '@/lib/beta';
import {
  LOW_QUALITY_TEXT_MESSAGE,
  assessExtractedTextQuality,
} from '@/lib/creditReportAnalysis';
import { runAnalyzerPipeline, stripLLMEnrichment } from '@/lib/analyzer/pipeline';
import {
  hashRawText,
  saveAnalysisRecord,
} from '@/lib/analysisStore';

// Vercel request body limits are tight; stay under ~4.5MB platform ceiling
const MAX_FILE_SIZE = 4 * 1024 * 1024;

export const runtime = 'nodejs';
export const maxDuration = 60;

const ANALYZE_BUDGET_MS = 12 * 1000;
const LLM_ENRICH_TIMEOUT_MS = 3 * 1000;
const AI_MODEL = process.env.ANTHROPIC_ANALYZE_MODEL || 'claude-sonnet-4-20250514';

// Anthropic client instance
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

function errorResponse(code, message, status = 200) {
  // Log every early-return error path so iPhone failures are unmistakable
  // when reading Vercel runtime logs. Code + status make the failure type
  // greppable; message is preserved verbatim for the client.
  console.warn('[Analyze] early-return error', { code, status });
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
  if (data.analysisId) {
    resp.analysisId = data.analysisId;
  }
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
  // Temporary triage log — greppable in Vercel runtime logs to confirm POST reaches Node.
  console.log('[ANALYZE POST HIT]', {
    method: request.method,
    contentType: request.headers.get('content-type'),
    userAgent: request.headers.get('user-agent'),
  });
  return Sentry.withScope(async (scope) => {
    scope.setTag('route', 'api/analyze');
    return _handleAnalyze(request);
  });
}

async function _handleAnalyze(request) {
  const startTime = Date.now();

  try {
    // =========================
    // 1. AUTHENTICATION
    // =========================
    let authResult;
    try {
      authResult = await auth();
    } catch (authErr) {
      Sentry.captureException(authErr, { tags: { route: 'api/analyze', stage: 'auth' } });
      console.error('[Analyze] Clerk auth() threw error:', authErr?.stack || authErr);
      return errorResponse("AUTH_EXPIRED", "Authentication expired. Please reconnect.", 401);
    }

    const { userId } = authResult;
    if (!userId) {
      console.warn('[Analyze] Unauthorized request - no userId');
      return errorResponse("AUTH_EXPIRED", "Authentication expired. Please reconnect.", 401);
    }
    Sentry.setUser({ id: userId });

    // =========================
    // 2. RATE LIMIT (before any heavy work)
    // =========================
    // App Store reviewer accounts bypass the per-user rate limit so reviewers
    // can test multiple PDFs during review without hitting a 429. The bypass
    // applies ONLY to the exact reviewer email; no other user is affected.
    let reviewerBypass = false;
    let emails = [];
    try {
      const clerkUser = await currentUser();
      emails = [
        clerkUser?.primaryEmailAddress?.emailAddress,
        ...((clerkUser?.emailAddresses ?? []).map(e => e?.emailAddress)),
      ].filter(Boolean);
      reviewerBypass = isReviewerRequest({ emails });
    } catch (e) {
      console.warn('[Analyze] Could not fetch reviewer check email:', e?.message || e);
    }

    const isDevBypass = process.env.NODE_ENV !== 'production';

    const skipRateLimit = reviewerBypass || isDevBypass;

    if (!skipRateLimit) {
      const rateLimitResult = await rateLimit(userId, 'analyze', LIMITS.analyze, 86400);
      if (!rateLimitResult.allowed) {
        console.warn('[Analyze] Rate limit exceeded for user:', userId);
        return errorResponse(
          "RATE_LIMIT_EXCEEDED",
          `Analysis limit reached. You can run ${LIMITS.analyze} analyses per day. Try again in ${Math.ceil(rateLimitResult.resetIn / 3600)} hour(s).`,
          429
        );
      }
    } else {
      console.log('[RATE LIMIT BYPASSED]', { userId });
      if (reviewerBypass) {
        console.log('[Analyze] Reviewer account — rate limit bypassed');
      }
    }

    // Plan-level usage limit gate (independent of per-day abuse rate limit).
    // This prevents expensive parsing/analyzer work when user entitlement is exhausted.
    try {
      const redisClient = getRedis();
      const tierKey = `user:${userId}:tier`;
      const tierRaw = await redisClient.get(tierKey);
      const tierData = tierRaw
        ? (typeof tierRaw === 'string' ? JSON.parse(tierRaw) : tierRaw)
        : { tier: 'free', features: { pdfAnalyses: 1 }, pdfAnalysesUsed: 0 };
      const maxAnalyses = Number.isFinite(tierData?.features?.pdfAnalyses)
        ? Number(tierData.features.pdfAnalyses)
        : 1;
      const used = Number.isFinite(tierData?.pdfAnalysesUsed)
        ? Number(tierData.pdfAnalysesUsed)
        : 0;

      if (!reviewerBypass && maxAnalyses !== -1 && used >= maxAnalyses) {
        return errorResponse(
          "ANALYSIS_LIMIT_REACHED",
          "Analysis limit reached for your current plan. Please upgrade or try again after your quota resets.",
          403
        );
      }
    } catch (tierErr) {
      console.warn('[Analyze] Tier pre-check failed; continuing with analysis path:', tierErr?.message || tierErr);
    }

    // =========================
    // 3. PARSE FORM DATA
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

    console.log('[Analyze] File received:', { type: file.type, size: file.size });

    // =========================
    // 3. VALIDATE FILE
    // =========================
    if (!isLikelyPdfFile(file)) {
      console.warn('[Analyze] Invalid file type:', file.type);
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
    // 5. MAGIC BYTE VALIDATION
    // =========================
    // Verify the file starts with the PDF signature %PDF regardless of
    // the declared MIME type or file extension. This prevents non-PDF
    // binary files from reaching the parser even when named "report.pdf".
    const pdfMagic = buffer.slice(0, 4).toString('ascii');
    if (pdfMagic !== '%PDF') {
      console.warn('[Analyze] Magic byte check failed — not a valid PDF. Got:', JSON.stringify(pdfMagic));
      return errorResponse("INVALID_TYPE", "Uploaded file is not a valid PDF", 400);
    }

    // =========================
    // 6. PDF PARSING (SAFE)
    // =========================
    let pdfData;
    try {
      console.log('[Analyze] Starting PDF parsing...');
      pdfData = await pdfParse(buffer);
      console.log('[Analyze] PDF parsed successfully', {
        textLength: pdfData.text?.length || 0,
        pages: pdfData.numpages || 0,
      });
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
      
      return errorResponse("TEXT_EXTRACTION_FAILED", "Could not extract readable text from this PDF. Please try another file.", 422);
    }

    const extractedText = pdfData.text || '';
    
    if (extractedText.length < 50) {
      console.warn('[Analyze] PDF text too short:', {
        textLength: extractedText.length,
        pages: pdfData.numpages || 0,
      });
      return errorResponse("REPORT_TEXT_TOO_SHORT", "PDF text was too short to analyze reliably. Please upload a clearer report.", 422);
    }

    // Check for scanned PDFs with no text layer (image-only PDFs)
    const wordsFound = extractedText.split(/\s+/).filter(word => word.length > 2).length;
    if (wordsFound < 10) {
      console.warn('[Analyze] PDF appears to be image-only (no text layer):', { 
        textLength: extractedText.length, 
        wordsFound,
      });
      return errorResponse("TEXT_EXTRACTION_FAILED", "This PDF appears to be a scanned image without readable text. Please use a searchable PDF.", 422);
    }

    const textQuality = assessExtractedTextQuality(extractedText);
    if (!textQuality.analyzable) {
      console.warn('[Analyze] PDF text quality too weak for analysis:', {
        reason: textQuality.reason,
        textLength: extractedText.length,
        wordsFound,
      });
      return errorResponse("LOW_QUALITY_TEXT", LOW_QUALITY_TEXT_MESSAGE, 422);
    }

    // =========================
    // 6. AI ANALYSIS (SAFE)
    // =========================
    let analysisResult;
    
    try {
      console.log('[Analyze] Starting AI analysis...');
      
      if (!process.env.ANTHROPIC_API_KEY) {
        console.warn('[Analyze] ANTHROPIC_API_KEY not configured — running deterministic analyzer only');
      }

      // Truncate text to keep extractor + LLM enrichment within budget.
      const maxTextLength = 20000;
      const textToAnalyze = extractedText.length > maxTextLength
        ? (() => {
            console.warn('[Analyze] Text truncated for analysis:', {
              originalLength: extractedText.length,
              truncatedLength: maxTextLength,
            });
            return extractedText.slice(0, maxTextLength) + '\n\n[Content truncated for analysis]';
          })()
        : extractedText;

      const analyzerStart = Date.now();
      analysisResult = await runAnalyzerPipeline(textToAnalyze, {
        anthropic: process.env.ANTHROPIC_API_KEY ? anthropic : null,
        model: AI_MODEL,
        budgetMs: ANALYZE_BUDGET_MS,
        enrichTimeoutMs: LLM_ENRICH_TIMEOUT_MS,
      });

      const elapsed = Date.now() - analyzerStart;
      let fastPath = analysisResult?.summary?.fastPath === true || elapsed > ANALYZE_BUDGET_MS;
      if (elapsed > ANALYZE_BUDGET_MS) {
        analysisResult = stripLLMEnrichment(analysisResult);
        fastPath = true;
      }
      analysisResult.summary = {
        ...(analysisResult.summary || {}),
        ...(fastPath ? { fastPath: true } : {}),
      };
      console.log('[ANALYZE TIME]', { ms: elapsed, fastPath });

      console.log('[Analyze] Pipeline completed:', {
        reportStatus: analysisResult?.summary?.reportStatus,
        suspectedUncertain: analysisResult?.summary?.suspectedUncertain,
        whyStatus: analysisResult?.diagnostics?.whyStatus,
        pipelineMs: analysisResult?.diagnostics?.pipelineMs,
      });

    } catch (err) {
      const errorMessage = String(err?.message || '').toLowerCase();

      if (err.name === 'AbortError') {
        Sentry.addBreadcrumb({ category: 'analyze', message: 'Analyzer aborted', level: 'warning', data: { budgetMs: ANALYZE_BUDGET_MS } });
        return errorResponse("AI_UNAVAILABLE", "Analysis service is temporarily unavailable - please try again later", 502);
      }
      if (err.status === 429) {
        Sentry.addBreadcrumb({ category: 'analyze', message: 'AI rate limited', level: 'warning' });
        return errorResponse("RATE_LIMITED", "Analysis service is currently busy - please try again in a moment", 429);
      }
      Sentry.captureException(err, { tags: { route: 'api/analyze', stage: 'ai_call' }, extra: { model: AI_MODEL } });
      console.error('[Analyze] AI analysis failed:', err?.stack || err);

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
    let savedAnalysis = null;
    
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

    try {
      const redisClient = getRedis();
      savedAnalysis = await saveAnalysisRecord(redisClient, {
        userId,
        reportType: analysisResult.reportType,
        reportSource: analysisResult.reportSource,
        parserType: analysisResult.parserType,
        extractionConfidence: analysisResult.extractionConfidence,
        needsManualReview: analysisResult.needsManualReview,
        filename: file.name || 'report.pdf',
        summary: analysisResult.summary,
        findings: analysisResult.findings,
        reviewOnly: analysisResult.reviewOnly,
        cleanReport: analysisResult.cleanReport,
        confidence: analysisResult.confidence,
        evidenceQuotes: analysisResult.evidenceQuotes,
        positiveFactors: analysisResult.positiveFactors,
        crossBureauInconsistencies: analysisResult.crossBureauInconsistencies,
        personalInfo: analysisResult.personalInfo,
        actionPlan: analysisResult.actionPlan,
        rawTextHash: hashRawText(extractedText),
        extracted: analysisResult.extracted,
        classifications: analysisResult.classifications,
        diagnostics: analysisResult.diagnostics,
        pipelineVersion: analysisResult.pipelineVersion,
      });
      console.log('[Analyze] Saved analysis record:', {
        userId,
        analysisId: savedAnalysis.id,
        reportType: savedAnalysis.reportType,
      });
    } catch (storeErr) {
      Sentry.captureException(storeErr, { tags: { route: 'api/analyze', stage: 'analysis_persistence' } });
      console.error('[Analyze] Failed to persist analysis:', storeErr?.stack || storeErr);
      return errorResponse("ANALYSIS_SAVE_FAILED", "Analysis completed but could not be saved. Please try again.", 503);
    }

    console.log('[ANALYZE DEBUG]', {
      accounts: analysisResult.extracted?.accounts?.length ?? 0,
      collections: analysisResult.extracted?.collections?.length ?? 0,
      inquiries: analysisResult.extracted?.inquiries?.length ?? 0,
      issues: analysisResult.findings?.length ?? 0,
      reportStatus: analysisResult.summary?.reportStatus,
    });
    
    return successResponse({
      filesProcessed: [{ 
        name: file.name, 
        pages: pdfData.numpages || 1 
      }],
      analysisId: savedAnalysis?.id,
      analysis: analysisResult,
      remaining: remaining === -1 ? 999 : remaining,
      pdfAnalysesUsed: newUsedCount,
    });

  } catch (err) {
    Sentry.captureException(err, { tags: { route: 'api/analyze', stage: 'unhandled' } });
    console.error('[Analyze] UNHANDLED ERROR in POST /api/analyze:', err?.stack || err);
    return errorResponse("PROCESSING_FAILED", "An unexpected error occurred during analysis", 500);
  }
}