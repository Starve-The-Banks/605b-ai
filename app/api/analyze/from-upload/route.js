import { currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { runAnalysisPipeline } from '../route.js';
import { isReviewerRequest } from '@/lib/beta';
import { authExpiredResponse, resolveApiAuth } from '@/lib/apiAuth';
import {
  acquireFinalizationLock,
  finalizeUpload,
  getChunks,
  validateOwnership,
  UploadSessionError,
} from '@/lib/analyze/uploadSessions';

export const runtime = 'nodejs';
export const maxDuration = 60;

function errorResponse(code, message, status = 400) {
  return NextResponse.json(
    { success: false, error: { code, message } },
    { status }
  );
}

export async function POST(request) {
  const t0 = Date.now();

  // ============================================================
  // 1. AUTH — validated once here; NOT re-checked in runAnalysisPipeline
  // ============================================================
  const { userId } = await resolveApiAuth(request, 'POST /api/analyze/from-upload');
  if (!userId) {
    console.warn('[FromUpload] AUTH_EXPIRED at entry');
    return authExpiredResponse('AUTH_EXPIRED');
  }

  // ============================================================
  // 2. REVIEWER BYPASS CHECK
  // ============================================================
  let reviewerBypass = false;
  try {
    const clerkUser = await currentUser();
    const emails = [
      clerkUser?.primaryEmailAddress?.emailAddress,
      ...((clerkUser?.emailAddresses ?? []).map(e => e?.emailAddress)),
    ].filter(Boolean);
    reviewerBypass = isReviewerRequest({ emails });
  } catch (e) {
    console.warn('[FromUpload] Could not fetch reviewer check email:', e?.message || e);
  }

  // ============================================================
  // 3. PARSE REQUEST BODY
  // ============================================================
  let uploadId;
  try {
    const body = await request.json();
    uploadId = body?.uploadId;
  } catch {
    return errorResponse('ANALYZE_UPLOAD_NOT_FOUND', 'Upload session was not found. Please try again.', 404);
  }
  if (!uploadId || typeof uploadId !== 'string') {
    return errorResponse('ANALYZE_UPLOAD_NOT_FOUND', 'Upload session was not found. Please try again.', 404);
  }

  // ============================================================
  // 4. RECONSTRUCT BUFFER FROM CHUNKS
  // ============================================================
  let buffer;
  let filename = 'report.pdf';
  let analysisSucceeded = false;

  try {
    console.log('[FromUpload] RECONSTRUCT START', { uploadId, ms: 0 });
    const meta = await validateOwnership(uploadId, userId);
    filename = meta.filename || 'report.pdf';

    await acquireFinalizationLock(uploadId);
    const chunks = await getChunks(uploadId);
    console.log('[FromUpload] CHUNKS FOUND', { uploadId, count: chunks.length, ms: Date.now() - t0 });

    buffer = Buffer.concat(chunks);
    console.log('[FromUpload] RECONSTRUCT COMPLETE', { uploadId, byteSize: buffer.length, ms: Date.now() - t0 });
  } catch (err) {
    console.error('[FromUpload] Reconstruction failed:', err);
    if (err instanceof UploadSessionError) {
      return errorResponse(err.code, err.message, err.status);
    }
    return errorResponse('UPLOAD_SESSION_FAILED', 'Upload could not be reconstructed. Please try again.', 422);
  }

  // ============================================================
  // 5. RUN ANALYSIS (no re-auth — userId already validated above)
  // ============================================================
  try {
    console.log('[FromUpload] ANALYSIS START', { uploadId, ms: Date.now() - t0 });
    const response = await runAnalysisPipeline(buffer, filename, userId, { reviewerBypass });
    analysisSucceeded = response.status >= 200 && response.status < 300;
    console.log('[FromUpload] ANALYSIS COMPLETE', { uploadId, status: response.status, ms: Date.now() - t0 });
    return response;
  } catch (err) {
    console.error('[FromUpload] runAnalysisPipeline threw:', err?.stack || err);
    return errorResponse('PROCESSING_FAILED', 'Analysis could not be completed. Please try again.', 500);
  } finally {
    // Clean up upload session only on success. On failure, preserve the session
    // so the mobile client can retry without re-uploading chunks.
    if (analysisSucceeded) {
      await finalizeUpload(uploadId).catch((cleanupErr) => {
        console.warn('[FromUpload] Cleanup failed:', cleanupErr?.message || cleanupErr);
      });
    } else {
      console.log('[FromUpload] Skipping cleanup — analysis did not succeed (retry safe)', { uploadId });
    }
  }
}
