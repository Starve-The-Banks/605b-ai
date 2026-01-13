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
 * Rate limiter using Redis
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
    const [count, ttl] = await Promise.all([
      redisClient.get(key),
      redisClient.ttl(key)
    ]);

    const currentCount = count ? parseInt(count, 10) : 0;

    if (currentCount >= limit) {
      return {
        allowed: false,
        remaining: 0,
        resetIn: ttl > 0 ? ttl : windowSeconds
      };
    }

    if (currentCount === 0) {
      await redisClient.setex(key, windowSeconds, 1);
    } else {
      await redisClient.incr(key);
    }

    return {
      allowed: true,
      remaining: limit - currentCount - 1,
      resetIn: ttl > 0 ? ttl : windowSeconds
    };
  } catch (error) {
    console.error('Rate limit error:', error);
    return { allowed: true, remaining: limit, resetIn: windowSeconds };
  }
}

/**
 * Character-based rate limiter for TTS
 * Tracks total characters used per month
 */
export async function rateLimitChars(userId, chars, monthlyLimit = 40000) {
  const redisClient = getRedis();
  const now = new Date();
  const monthKey = `ratelimit:${userId}:tts_chars:${now.getFullYear()}-${now.getMonth() + 1}`;
  
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const secondsUntilReset = Math.floor((endOfMonth - now) / 1000);

  try {
    const currentChars = await redisClient.get(monthKey);
    const used = currentChars ? parseInt(currentChars, 10) : 0;

    if (used + chars > monthlyLimit) {
      return {
        allowed: false,
        remaining: Math.max(0, monthlyLimit - used),
        resetIn: secondsUntilReset
      };
    }

    if (used === 0) {
      await redisClient.setex(monthKey, secondsUntilReset, chars);
    } else {
      await redisClient.incrby(monthKey, chars);
    }

    return {
      allowed: true,
      remaining: monthlyLimit - used - chars,
      resetIn: secondsUntilReset
    };
  } catch (error) {
    console.error('Character rate limit error:', error);
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
