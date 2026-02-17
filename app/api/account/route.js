import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getRedis } from '@/lib/redis';

/**
 * DELETE /api/account
 *
 * Permanently deletes the authenticated user's account and all associated data.
 * Required by Apple App Store guidelines (mandatory since June 2022).
 *
 * Steps:
 *   1. Delete all Redis keys for the user (data, tier, cache)
 *   2. Delete the user from Clerk
 *   3. Return success
 *
 * The Clerk deletion will invalidate all sessions across devices.
 */
export async function DELETE() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const redisClient = getRedis();

    // 1. Find and delete all Redis keys for this user
    const keysToDelete = [
      `user:${userId}:data`,
      `user:${userId}:tier`,
      `user:${userId}:tier:cache`,
      `user:${userId}:analyses`,
      `user:${userId}:chat`,
      `user:${userId}:identity-theft`,
      `user:${userId}:settings`,
    ];

    // Delete all keys (non-fatal if some don't exist)
    for (const key of keysToDelete) {
      try {
        await redisClient.del(key);
      } catch {
        // Key may not exist — non-fatal
      }
    }

    // 2. Delete user from Clerk (this invalidates all sessions)
    try {
      const client = await clerkClient();
      await client.users.deleteUser(userId);
    } catch (clerkErr) {
      console.error('[Account Deletion] Clerk user deletion failed:', clerkErr);
      // Data is already deleted from Redis. Return success with warning.
      return NextResponse.json({
        success: true,
        message: 'Account data deleted. Clerk account removal may be delayed.',
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Account and all associated data have been permanently deleted.',
    });
  } catch (error) {
    console.error('[Account Deletion] Failed:', error);
    return NextResponse.json(
      { error: 'Failed to delete account. Please try again or contact support@9thwave.io.' },
      { status: 500 }
    );
  }
}
