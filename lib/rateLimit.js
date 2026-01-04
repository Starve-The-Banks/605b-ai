import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

/**
 * Rate limiter using Redis
 * @param {string} userId - User ID
 * @param {string} action - Action type (e.g., 'analyze', 'chat')
 * @param {number} limit - Max requests allowed
 * @param {number} windowSeconds - Time window in seconds (default 24 hours)
 * @returns {Promise<{allowed: boolean, remaining: number, resetIn: number}>}
 */
export async function rateLimit(userId, action, limit, windowSeconds = 86400) {
  const key = `ratelimit:${userId}:${action}`;
  const now = Math.floor(Date.now() / 1000);

  try {
    // Get current count and TTL
    const [count, ttl] = await Promise.all([
      redis.get(key),
      redis.ttl(key)
    ]);

    const currentCount = count ? parseInt(count, 10) : 0;

    if (currentCount >= limit) {
      return {
        allowed: false,
        remaining: 0,
        resetIn: ttl > 0 ? ttl : windowSeconds
      };
    }

    // Increment counter
    if (currentCount === 0) {
      // First request in window - set with expiry
      await redis.setex(key, windowSeconds, 1);
    } else {
      await redis.incr(key);
    }

    return {
      allowed: true,
      remaining: limit - currentCount - 1,
      resetIn: ttl > 0 ? ttl : windowSeconds
    };
  } catch (error) {
    console.error('Rate limit error:', error);
    // Fail open - allow request if Redis fails
    return { allowed: true, remaining: limit, resetIn: windowSeconds };
  }
}

// Default limits
export const LIMITS = {
  analyze: 5,    // 5 PDF analyses per day
  chat: 50       // 50 chat messages per day
};
