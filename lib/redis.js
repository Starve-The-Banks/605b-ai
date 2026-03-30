/**
 * Shared Redis client: real Upstash when env is set, in-memory fallback when not.
 * Use this in user-data and flagged routes so local dev runs without Redis configured.
 *
 * URL/token resolution matches @upstash/redis Redis.fromEnv():
 * - UPSTASH_REDIS_REST_URL || KV_REST_API_URL
 * - UPSTASH_REDIS_REST_TOKEN || KV_REST_API_TOKEN
 * (Vercel KV integration injects KV_REST_*; Upstash dashboard uses UPSTASH_REDIS_*.)
 */

let redis = null;
let fallbackLogOnce = false;
let usingFallback = false;
const REDIS_RETRY_ATTEMPTS = 3;
const REDIS_RETRY_BASE_DELAY_MS = 250;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableRedisError(err) {
  const message = String(err?.message || '').toLowerCase();
  return (
    err instanceof TypeError ||
    message.includes('fetch failed') ||
    message.includes('network') ||
    message.includes('econnreset') ||
    message.includes('etimedout') ||
    message.includes('socket hang up')
  );
}

async function withRedisRetry(operation, fn) {
  let lastError;
  for (let attempt = 1; attempt <= REDIS_RETRY_ATTEMPTS; attempt += 1) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (!isRetryableRedisError(err) || attempt === REDIS_RETRY_ATTEMPTS) {
        throw err;
      }
      // eslint-disable-next-line no-console
      console.warn(
        `[redis] ${operation} failed (attempt ${attempt}/${REDIS_RETRY_ATTEMPTS}); retrying.`,
        err?.message || err
      );
      await sleep(REDIS_RETRY_BASE_DELAY_MS * attempt);
    }
  }
  throw lastError;
}

function wrapRedisClient(client) {
  return new Proxy(client, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      if (typeof value !== 'function') return value;
      return (...args) => withRedisRetry(String(prop), () => value.apply(target, args));
    },
  });
}

/** In-memory fallback: get/set/eval so flagged, user-data, and rateLimit work without Redis. */
function createFallbackClient() {
  const store = new Map();

  if (!fallbackLogOnce) {
    fallbackLogOnce = true;
    // eslint-disable-next-line no-console
    console.warn(
      '[redis] No REST URL/token (UPSTASH_REDIS_* or KV_REST_*); using in-memory fallback (data not persisted).'
    );
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

  const url =
    process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  if (url && token) {
    try {
      const { Redis } = require('@upstash/redis');
      redis = wrapRedisClient(Redis.fromEnv());
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
