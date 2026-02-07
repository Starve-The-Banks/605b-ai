import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getRedis } from '@/lib/redis';

/**
 * GET /api/user-data/profile
 * Returns the current user's profile (onboarding, assessment, etc.) from Redis or empty when unset.
 * Used by dashboard layout and useUserData to check onboarding status.
 */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const redis = getRedis();
    const raw = await redis.get(`user:${userId}:profile`);
    const profile =
      raw === null || raw === undefined
        ? {}
        : typeof raw === 'string'
          ? (() => {
              try {
                return JSON.parse(raw);
              } catch {
                return {};
              }
            })()
          : raw;

    return NextResponse.json({ profile: profile || {} });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

/**
 * POST /api/user-data/profile
 * Saves profile (onboarding complete, assessment, etc.). No-op when Redis unavailable (e.g. local dev fallback).
 */
export async function POST(request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const profile = body?.profile ?? {};

    const redis = getRedis();
    const value =
      typeof profile === 'string' ? profile : JSON.stringify(profile);
    await redis.set(`user:${userId}:profile`, value);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 });
  }
}
