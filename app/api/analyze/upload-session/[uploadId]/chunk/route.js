import { NextResponse } from 'next/server';
import { authExpiredResponse, resolveApiAuth } from '@/lib/apiAuth';
import {
  getUploadSessionStatus,
  storeChunk,
  validateOwnership,
  UploadSessionError,
} from '@/lib/analyze/uploadSessions';

export const runtime = 'nodejs';

function errorResponse(code, message, status = 400) {
  return NextResponse.json(
    { success: false, error: { code, message } },
    { status }
  );
}

export async function GET(_request, { params }) {
  const { userId } = await resolveApiAuth(_request, 'GET /api/analyze/upload-session/[uploadId]/chunk');
  if (!userId) {
    return authExpiredResponse('AUTH_EXPIRED');
  }

  const uploadId = params?.uploadId;
  if (!uploadId) {
    return errorResponse('ANALYZE_UPLOAD_NOT_FOUND', 'Upload session was not found. Please try again.', 404);
  }

  try {
    const status = await getUploadSessionStatus(uploadId, userId);
    return NextResponse.json({ success: true, ...status });
  } catch (err) {
    console.error('[UPLOAD FLOW ERROR]', err);
    if (err instanceof UploadSessionError) {
      return errorResponse(err.code, err.message, err.status);
    }
    return errorResponse('UPLOAD_SESSION_FAILED', 'Upload session status could not be loaded', 500);
  }
}

export async function POST(request, { params }) {
  const { userId } = await resolveApiAuth(request, 'POST /api/analyze/upload-session/[uploadId]/chunk');
  if (!userId) {
    return authExpiredResponse('AUTH_EXPIRED');
  }

  const uploadId = params?.uploadId;
  if (!uploadId) {
    return errorResponse('ANALYZE_UPLOAD_NOT_FOUND', 'Upload session was not found. Please try again.', 404);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return errorResponse('UPLOAD_SESSION_FAILED', 'Invalid upload chunk request', 400);
  }

  try {
    await validateOwnership(uploadId, userId);
    console.log('[CHUNK RECEIVED]', {
      uploadId,
      index: body?.index,
      size: typeof body?.chunk === 'string' ? body.chunk.length : 0,
    });
    const result = await storeChunk(uploadId, body?.index, body?.chunk, {
      totalChunks: body?.totalChunks,
    });
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    console.error('[UPLOAD FLOW ERROR]', err);
    if (err instanceof UploadSessionError) {
      return errorResponse(err.code, err.message, err.status);
    }
    console.error('[AnalyzeUploadSession] chunk failed:', err?.stack || err);
    return errorResponse('UPLOAD_SESSION_FAILED', 'Upload chunk could not be stored', 500);
  }
}
