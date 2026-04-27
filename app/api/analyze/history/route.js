import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getRedis } from '@/lib/redis';
import {
  analysisRecordToResponse,
  listRecentAnalyses,
} from '@/lib/analysisStore';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const redisClient = getRedis();
    const analyses = await listRecentAnalyses(redisClient, userId, 10);
    return NextResponse.json({
      success: true,
      analyses: analyses.map(analysisRecordToResponse),
    });
  } catch (error) {
    console.error('[analyze history GET]', error?.stack || error);
    return NextResponse.json({ error: 'Failed to load analysis history' }, { status: 500 });
  }
}
