import { NextResponse } from 'next/server';
import { createUploadSession, UploadSessionError } from '@/lib/analyze/uploadSessions';
import { authExpiredResponse, resolveApiAuth } from '@/lib/apiAuth';

export const runtime = 'nodejs';

function errorResponse(code, message, status = 400) {
  return NextResponse.json(
    { success: false, error: { code, message } },
    { status }
  );
}

export async function POST(request) {
  const { userId } = await resolveApiAuth(request, 'POST /api/analyze/upload-session');
  if (!userId) {
    return authExpiredResponse('AUTH_EXPIRED');
  }

  let body = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  try {
    const session = await createUploadSession(userId, {
      filename: body?.filename,
      fileSize: body?.fileSize,
    });
    console.log('[UPLOAD SESSION CREATED]', { uploadId: session.uploadId, userId });

    return NextResponse.json({
      uploadId: session.uploadId,
      uploadUrl: `/api/analyze/upload-session/${session.uploadId}/chunk`,
      method: 'POST',
      expiresAt: session.expiresAt,
    });
  } catch (err) {
    console.error('[UPLOAD FLOW ERROR]', err);
    if (err instanceof UploadSessionError) {
      return errorResponse(err.code, err.message, err.status);
    }
    console.error('[AnalyzeUploadSession] create failed:', err?.stack || err);
    return errorResponse('UPLOAD_SESSION_FAILED', 'Upload session could not be created', 500);
  }
}
