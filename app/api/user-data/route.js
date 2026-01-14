import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { userDataSchema, validateBody } from '@/lib/validation';

// Lazy initialization to avoid build-time errors
let redis = null;

function getRedis() {
  if (!redis) {
    const { Redis } = require('@upstash/redis');
    redis = Redis.fromEnv();
  }
  return redis;
}

// Get user data
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const redisClient = getRedis();
    const data = await redisClient.get(`user:${userId}:data`);

    return NextResponse.json({
      disputes: data?.disputes || [],
      auditLog: data?.auditLog || [],
      flaggedItems: data?.flaggedItems || []
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

// Save user data
export async function POST(request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
    return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
  }
}
