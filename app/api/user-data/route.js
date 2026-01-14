import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Lazy initialization to avoid build-time errors
let redis = null;

function getRedis() {
  if (!redis) {
    const { Redis } = require('@upstash/redis');
    redis = Redis.fromEnv();
  }
  return redis;
}

// Limits to prevent abuse
const MAX_DISPUTES = 100;
const MAX_AUDIT_LOG = 1000;
const MAX_FLAGGED_ITEMS = 500;

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

    const redisClient = getRedis();
    const body = await request.json();
    let { disputes, auditLog, flaggedItems } = body;

    // Validate and truncate arrays to prevent abuse
    if (!Array.isArray(disputes)) disputes = [];
    if (!Array.isArray(auditLog)) auditLog = [];
    if (!Array.isArray(flaggedItems)) flaggedItems = [];

    // Enforce limits (keep most recent)
    disputes = disputes.slice(-MAX_DISPUTES);
    auditLog = auditLog.slice(-MAX_AUDIT_LOG);
    flaggedItems = flaggedItems.slice(-MAX_FLAGGED_ITEMS);

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
