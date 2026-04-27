import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getRedis } from '@/lib/redis';
import {
  AnalysisStoreError,
  analysisRecordToResponse,
  getAnalysisById,
  softDeleteAnalysis,
} from '@/lib/analysisStore';

export const runtime = 'nodejs';

function errorResponse(error) {
  if (error instanceof AnalysisStoreError) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
  }
  return NextResponse.json({ error: 'Analysis request failed' }, { status: 500 });
}

export async function GET(_request, { params }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const redisClient = getRedis();
    const analysis = await getAnalysisById(redisClient, params.id, userId);
    return NextResponse.json({
      success: true,
      analysis: analysisRecordToResponse(analysis),
    });
  } catch (error) {
    console.error('[analyze id GET]', error?.stack || error);
    return errorResponse(error);
  }
}

export async function DELETE(_request, { params }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const redisClient = getRedis();
    const deleted = await softDeleteAnalysis(redisClient, params.id, userId);
    return NextResponse.json({
      success: true,
      analysis: analysisRecordToResponse(deleted),
    });
  } catch (error) {
    console.error('[analyze id DELETE]', error?.stack || error);
    return errorResponse(error);
  }
}
