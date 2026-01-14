// Lazy initialization to avoid build-time errors
let redis = null;

function getRedis() {
  if (!redis) {
    const { Redis } = require('@upstash/redis');
    redis = Redis.fromEnv();
  }
  return redis;
}

/**
 * Rate limiter using Redis with atomic operations
 * Uses INCR for atomic increment to prevent race conditions
 * @param {string} userId - User ID
 * @param {string} action - Action type (e.g., 'analyze', 'chat', 'tts')
 * @param {number} limit - Max requests allowed
 * @param {number} windowSeconds - Time window in seconds (default 24 hours)
 * @returns {Promise<{allowed: boolean, remaining: number, resetIn: number}>}
 */
export async function rateLimit(userId, action, limit, windowSeconds = 86400) {
  const redisClient = getRedis();
  const key = `ratelimit:${userId}:${action}`;

  try {
    // Use atomic INCR - if key doesn't exist, Redis sets it to 0 then increments to 1
    const newCount = await redisClient.incr(key);

    // If this is the first request, set the expiry
    if (newCount === 1) {
      await redisClient.expire(key, windowSeconds);
    }

    // Get TTL for reset time
    const ttl = await redisClient.ttl(key);

    if (newCount > limit) {
      return {
        allowed: false,
        remaining: 0,
        resetIn: ttl > 0 ? ttl : windowSeconds
      };
    }

    return {
      allowed: true,
      remaining: limit - newCount,
      resetIn: ttl > 0 ? ttl : windowSeconds
    };
  } catch (error) {
    // Log error but allow request to proceed (fail-open for availability)
    // In production, consider fail-closed for security-critical endpoints
    return { allowed: true, remaining: limit, resetIn: windowSeconds };
  }
}

/**
 * Character-based rate limiter for TTS
 * Tracks total characters used per month using atomic operations
 */
export async function rateLimitChars(userId, chars, monthlyLimit = 40000) {
  const redisClient = getRedis();
  const now = new Date();
  const monthKey = `ratelimit:${userId}:tts_chars:${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const secondsUntilReset = Math.floor((endOfMonth - now) / 1000);

  try {
    // Get current usage first to check if allowed
    const currentChars = await redisClient.get(monthKey);
    const used = currentChars ? parseInt(currentChars, 10) : 0;

    if (used + chars > monthlyLimit) {
      return {
        allowed: false,
        remaining: Math.max(0, monthlyLimit - used),
        resetIn: secondsUntilReset
      };
    }

    // Atomic increment by char count
    const newTotal = await redisClient.incrby(monthKey, chars);

    // Set expiry if this is near the start (handles race condition on first request)
    const ttl = await redisClient.ttl(monthKey);
    if (ttl < 0) {
      await redisClient.expire(monthKey, secondsUntilReset);
    }

    return {
      allowed: true,
      remaining: Math.max(0, monthlyLimit - newTotal),
      resetIn: secondsUntilReset
    };
  } catch (error) {
    // Fail-open for availability
    return { allowed: true, remaining: monthlyLimit, resetIn: secondsUntilReset };
  }
}

// Default limits
export const LIMITS = {
  analyze: 5,
  chat: 50,
  tts: 15,
  ttsChars: 40000
};
