import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { POST as analyzePost } from '../route.js';
import {
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

async function getUserId() {
  try {
    const { userId } = await auth();
    return userId;
  } catch {
    return null;
  }
}

export async function POST(request) {
  const userId = await getUserId();
  if (!userId) {
    return errorResponse('AUTH_REQUIRED', 'Authentication required', 401);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return errorResponse('ANALYZE_UPLOAD_NOT_FOUND', 'Upload session was not found. Please try again.', 404);
  }

  const uploadId = body?.uploadId;
  if (!uploadId || typeof uploadId !== 'string') {
    return errorResponse('ANALYZE_UPLOAD_NOT_FOUND', 'Upload session was not found. Please try again.', 404);
  }

  let shouldCleanup = false;
  try {
    const meta = await validateOwnership(uploadId, userId);
    const chunks = await getChunks(uploadId);
    const buffer = Buffer.concat(chunks);
    shouldCleanup = true;

    const formData = new FormData();
    const filename = meta.filename || 'report.pdf';
    formData.append('files', new Blob([buffer], { type: 'application/pdf' }), filename);

    const analyzeRequest = new Request(request.url, {
      method: 'POST',
      body: formData,
    });

    return await analyzePost(analyzeRequest);
  } catch (err) {
    if (err instanceof UploadSessionError) {
      return errorResponse(err.code, err.message, err.status);
    }
    console.error('[AnalyzeFromUpload] failed:', err?.stack || err);
    return errorResponse('PDF_PARSE_FAILED', 'Analysis could not be completed. Please try again.', 422);
  } finally {
    if (shouldCleanup) {
      await finalizeUpload(uploadId).catch((cleanupErr) => {
        console.warn('[AnalyzeFromUpload] cleanup failed:', cleanupErr?.message || cleanupErr);
      });
    }
  }
}
