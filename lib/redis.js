/**
 * Shared Redis client: real Upstash when env is set, in-memory fallback when not.
 * Use this in user-data and flagged routes so local dev runs without UPSTASH_* configured.
 * Production should set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.
 */

let redis = null;
let fallbackLogOnce = false;
let usingFallback = false;

/** In-memory fallback: get/set/eval so flagged, user-data, and rateLimit work without Redis. */
function createFallbackClient() {
  const store = new Map();

  if (!fallbackLogOnce) {
    fallbackLogOnce = true;
    // eslint-disable-next-line no-console
    console.warn('[redis] UPSTASH_REDIS_REST_URL/TOKEN not set; using in-memory fallback (data not persisted).');
  }

  return {
    async get(key) {
      const v = store.get(key);
      return v === undefined ? null : v;
    },
    async set(key, value, _opts) {
      store.set(key, value);
      return 'OK';
    },
    // Rate limit: allow all when Redis unavailable (fail-open for dev).
    async eval(_script, keys, args) {
      const a = args || [];
      if (a.length >= 3) {
        // rateLimitChars: return [allowed, total, ttl]
        return [1, Number(a[0]) || 0, Number(a[2]) || 86400];
      }
      const windowSeconds = Number(a[0]) ?? 86400;
      return [1, windowSeconds];
    },
  };
}

/**
 * Returns Redis client: real Upstash if env configured, otherwise in-memory fallback.
 * @returns {Promise<{ get: Function, set: Function, eval?: Function }>}
 */
function getRedis() {
  if (redis !== null) return redis;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (url && token) {
    try {
      const { Redis } = require('@upstash/redis');
      redis = Redis.fromEnv();
      return redis;
    } catch (err) {
      if (!fallbackLogOnce) {
        fallbackLogOnce = true;
        // eslint-disable-next-line no-console
        console.warn('[redis] Upstash init failed; using in-memory fallback.', err?.message || err);
      }
      usingFallback = true;
      redis = createFallbackClient();
      return redis;
    }
  }

  usingFallback = true;
  redis = createFallbackClient();
  return redis;
}

/** True when using in-memory fallback (no real Redis). */
function isFallback() {
  if (redis === null) getRedis();
  return usingFallback;
}

export { getRedis, isFallback };
