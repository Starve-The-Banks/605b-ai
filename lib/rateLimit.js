import { logError } from '@/lib/logging';

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
 * Rate limiter using Redis with atomic TTL-on-first-incr
 * Uses Lua script to atomically increment and set TTL on first increment
 * This prevents race conditions where TTL might not get set
 * @param {string} userId - User ID
 * @param {string} action - Action type (e.g., 'analyze', 'chat', 'tts')
 * @param {number} limit - Max requests allowed
 * @param {number} windowSeconds - Time window in seconds (default 24 hours)
 * @returns {Promise<{allowed: boolean, remaining: number, resetIn: number}>}
 */
export async function rateLimit(
  userId,
  action,
  limit,
  windowSeconds = 86400,
  options = {}
) {
  const redisClient = getRedis();
  const key = `ratelimit:${userId}:${action}`;
  const { failClosed = false } = options;

  try {
    // Atomic TTL-on-first-incr using Lua script
    // This ensures TTL is set atomically with the first increment
    const luaScript = `
      local current = redis.call('INCR', KEYS[1])
      if current == 1 then
        redis.call('EXPIRE', KEYS[1], ARGV[1])
      end
      local ttl = redis.call('TTL', KEYS[1])
      return {current, ttl}
    `;

    const result = await redisClient.eval(luaScript, [key], [windowSeconds]);
    const [newCount, ttl] = result;

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
    // Fail-open for availability unless explicitly configured.
    logError('Rate limit error', error, { action, failClosed });
    if (failClosed) {
      return { allowed: false, remaining: 0, resetIn: windowSeconds };
    }
    return { allowed: true, remaining: limit, resetIn: windowSeconds };
  }
}

/**
 * Character-based rate limiter for TTS
 * Tracks total characters used per month using atomic Lua script
 */
export async function rateLimitChars(
  userId,
  chars,
  monthlyLimit = 40000,
  options = {}
) {
  const redisClient = getRedis();
  const now = new Date();
  const monthKey = `ratelimit:${userId}:tts_chars:${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const secondsUntilReset = Math.floor((endOfMonth - now) / 1000);

  try {
    // Atomic check-and-increment using Lua script
    // This prevents race conditions where two requests might both pass the check
    const luaScript = `
      local current = tonumber(redis.call('GET', KEYS[1]) or '0')
      local chars = tonumber(ARGV[1])
      local limit = tonumber(ARGV[2])
      local ttl_seconds = tonumber(ARGV[3])

      if current + chars > limit then
        return {0, current, redis.call('TTL', KEYS[1])}
      end

      local newTotal = redis.call('INCRBY', KEYS[1], chars)
      if newTotal == chars then
        redis.call('EXPIRE', KEYS[1], ttl_seconds)
      end
      local ttl = redis.call('TTL', KEYS[1])
      return {1, newTotal, ttl}
    `;

    const result = await redisClient.eval(luaScript, [monthKey], [chars, monthlyLimit, secondsUntilReset]);
    const [allowed, total, ttl] = result;

    if (!allowed) {
      return {
        allowed: false,
        remaining: Math.max(0, monthlyLimit - total),
        resetIn: ttl > 0 ? ttl : secondsUntilReset
      };
    }

    return {
      allowed: true,
      remaining: Math.max(0, monthlyLimit - total),
      resetIn: ttl > 0 ? ttl : secondsUntilReset
    };
  } catch (error) {
    // Fail-open for availability unless explicitly configured.
    const { failClosed = false } = options;
    logError('Rate limit chars error', error, { failClosed });
    if (failClosed) {
      return { allowed: false, remaining: 0, resetIn: secondsUntilReset };
    }
    return { allowed: true, remaining: monthlyLimit, resetIn: secondsUntilReset };
  }
}

// Default limits
export const LIMITS = {
  analyze: 5,
  chat: 50,
  tts: 15,
  ttsChars: 40000,
  identityTheftCheckout: 5,
  emailNotifications: 10
};
