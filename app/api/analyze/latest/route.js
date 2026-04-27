import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getRedis } from '@/lib/redis';
import {
  analysisRecordToResponse,
  getLatestAnalysis,
} from '@/lib/analysisStore';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const redisClient = getRedis();
    const latest = await getLatestAnalysis(redisClient, userId);
    return NextResponse.json({
      success: true,
      analysis: analysisRecordToResponse(latest),
    });
  } catch (error) {
    console.error('[analyze latest GET]', error?.stack || error);
    return NextResponse.json({ error: 'Failed to load latest analysis' }, { status: 500 });
  }
}
