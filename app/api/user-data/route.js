import { NextResponse } from 'next/server';
import { getRedis } from '@/lib/redis';
import { userDataSchema, validateBody } from '@/lib/validation';
import { authExpiredResponse, resolveApiAuth } from '@/lib/apiAuth';

// Get user data
export async function GET(request) {
  try {
    const { userId } = await resolveApiAuth(request, 'GET /api/user-data');

    if (!userId) {
      return authExpiredResponse('AUTH_REQUIRED');
    }

    const redisClient = getRedis();
    const data = await redisClient.get(`user:${userId}:data`);

    return NextResponse.json({
      disputes: data?.disputes || [],
      auditLog: data?.auditLog || [],
      flaggedItems: data?.flaggedItems || []
    });
  } catch (error) {
    console.error('[user-data GET]', error?.stack || error);
    return NextResponse.json(
      {
        disputes: [],
        auditLog: [],
        flaggedItems: [],
        degraded: true,
      },
      { status: 200 }
    );
  }
}

// Save user data
export async function POST(request) {
  try {
    const { userId } = await resolveApiAuth(request, 'POST /api/user-data');

    if (!userId) {
      return authExpiredResponse('AUTH_REQUIRED');
    }

    // Validate request body with Zod
    const body = await request.json();
    const { data, error: validationError } = validateBody(userDataSchema, body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const { disputes, auditLog, flaggedItems } = data;

    const redisClient = getRedis();
    await redisClient.set(`user:${userId}:data`, {
      disputes,
      auditLog,
      flaggedItems,
      updatedAt: new Date().toISOString()
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[user-data POST]', error?.stack || error);
    return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
  }
}
