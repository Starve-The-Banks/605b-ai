import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { timingSafeEqual } from 'crypto';

// Lazy initialization to avoid build-time errors
let redis = null;

function getRedis() {
  if (!redis) {
    const { Redis } = require('@upstash/redis');
    redis = Redis.fromEnv();
  }
  return redis;
}

// Tier features (must match webhook)
const TIER_FEATURES = {
  free: {
    pdfAnalyses: 1,
    pdfExport: false,
    templates: 'none',
    aiChat: false,
    auditExport: false,
    identityTheftWorkflow: false,
    creditorTemplates: false,
    escalationTemplates: false,
    disputeTracker: false,
  },
  toolkit: {
    pdfAnalyses: 1,
    pdfExport: true,
    templates: 'basic',
    aiChat: false,
    auditExport: false,
    identityTheftWorkflow: false,
    creditorTemplates: false,
    escalationTemplates: false,
    disputeTracker: true,
  },
  advanced: {
    pdfAnalyses: 3,
    pdfExport: true,
    templates: 'full',
    aiChat: true,
    auditExport: true,
    identityTheftWorkflow: false,
    creditorTemplates: true,
    escalationTemplates: true,
    disputeTracker: true,
  },
  'identity-theft': {
    pdfAnalyses: -1,
    pdfExport: true,
    templates: 'full',
    aiChat: true,
    auditExport: true,
    identityTheftWorkflow: true,
    creditorTemplates: true,
    escalationTemplates: true,
    disputeTracker: true,
    attorneyExport: true,
  },
};

const ADDON_GRANTS = {
  'extra-analysis': {
    type: 'increment',
    field: 'pdfAnalysesRemaining',
    amount: 1,
  },
  'ai-credits': {
    type: 'increment',
    field: 'aiCreditsRemaining',
    amount: 50,
  },
  'attorney-export': {
    type: 'unlock',
    field: 'attorneyExport',
    value: true,
  },
};

const MAX_RETRIES = 5;
const IDEMPOTENCY_TTL_SECONDS = 90 * 24 * 60 * 60;
const FAILED_GRANT_TTL_SECONDS = 30 * 24 * 60 * 60;

// Redis keys
const QUEUE_KEY = 'stripe:failed_grants_queue';
const DEAD_LETTER_KEY = 'stripe:failed_grants_dead';

// ===========================================
// CONSTANT-TIME AUTH
// ===========================================

/**
 * Constant-time comparison to prevent timing attacks
 */
function constantTimeCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false;
  }

  // Pad to same length to prevent length-based timing leaks
  const maxLen = Math.max(a.length, b.length);
  const aPadded = a.padEnd(maxLen, '\0');
  const bPadded = b.padEnd(maxLen, '\0');

  try {
    return timingSafeEqual(Buffer.from(aPadded), Buffer.from(bPadded)) && a.length === b.length;
  } catch {
    return false;
  }
}

/**
 * Verify authorization header
 * ONLY accepts: Authorization: Bearer ${CRON_SECRET}
 * Does NOT allow query params for secret
 */
function verifyAuth(authHeader) {
  const cronSecret = process.env.CRON_SECRET;

  // If CRON_SECRET is not set, reject all requests
  if (!cronSecret) {
    console.error('[AUTH] CRON_SECRET not configured');
    return false;
  }

  // Require Authorization header
  if (!authHeader) {
    return false;
  }

  // Must be Bearer token format
  if (!authHeader.startsWith('Bearer ')) {
    return false;
  }

  const token = authHeader.slice(7); // Remove 'Bearer '

  // Constant-time comparison
  return constantTimeCompare(token, cronSecret);
}

// ===========================================
// OBSERVABILITY: Daily failure counter
// ===========================================

function getTodayKey() {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  return `stripe:failed_grants:${today}`;
}

async function incrementDailyCounter(redisClient) {
  const key = getTodayKey();
  await redisClient.incr(key);
  // Set TTL of 90 days on first increment
  await redisClient.expire(key, 90 * 24 * 60 * 60);
}

// ===========================================
// IDEMPOTENCY CHECK
// ===========================================

/**
 * Check if entitlement already granted for this session
 */
async function isAlreadyGranted(redisClient, userId, sessionId) {
  // Check session-specific grant marker
  const grantKey = `stripe:grant:${userId}:${sessionId}`;
  const granted = await redisClient.get(grantKey);
  if (granted) return true;

  // Also check entitlement record
  const entitlement = await redisClient.get(`entitlement:${userId}`);
  if (entitlement) {
    const data = typeof entitlement === 'string' ? JSON.parse(entitlement) : entitlement;
    if (data.sessionId === sessionId) return true;
  }

  return false;
}

/**
 * Mark session as granted (idempotency marker)
 */
async function markSessionGranted(redisClient, userId, sessionId, productType, productId) {
  const grantKey = `stripe:grant:${userId}:${sessionId}`;
  await redisClient.set(grantKey, JSON.stringify({
    productType,
    productId,
    grantedAt: new Date().toISOString(),
  }), { ex: IDEMPOTENCY_TTL_SECONDS });
}

// ===========================================
// POST /api/stripe/retry-grants
// ===========================================

/**
 * POST /api/stripe/retry-grants
 *
 * Retry failed entitlement grants using non-stalling queue processing.
 * Protected by CRON_SECRET via Authorization header only.
 *
 * Query params:
 * - limit: Max number of grants to retry (default 10, max 50)
 * - eventId: Retry a specific event ID
 */
export async function POST(request) {
  // Verify authorization (constant-time, header only)
  const headersList = await headers();
  const authHeader = headersList.get('authorization');

  if (!verifyAuth(authHeader)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const redisClient = getRedis();
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 50);
  const specificEventId = searchParams.get('eventId');

  const results = {
    processed: 0,
    succeeded: 0,
    failed: 0,
    skipped: 0,
    movedToDeadLetter: 0,
    details: [],
  };

  try {
    if (specificEventId) {
      // Retry specific event (doesn't use queue pop)
      await processEvent(redisClient, specificEventId, results, false);
    } else {
      // Non-stalling queue processing with LPOP
      for (let i = 0; i < limit; i++) {
        // LPOP: Atomically remove from queue head
        const eventId = await redisClient.lpop(QUEUE_KEY);

        if (!eventId) {
          // Queue is empty
          break;
        }

        await processEvent(redisClient, eventId, results, true);
      }
    }

    return NextResponse.json({
      success: true,
      ...results,
    });

  } catch (error) {
    console.error('Retry grants error:', error);
    return NextResponse.json(
      { error: 'Failed to process retry grants', details: error?.message },
      { status: 500 }
    );
  }
}

/**
 * Process a single failed grant event
 */
async function processEvent(redisClient, eventId, results, wasPopped) {
  const key = `stripe:failed_grant:${eventId}`;
  const failedGrantData = await redisClient.get(key);

  if (!failedGrantData) {
    // Already removed or expired - clean up queue if not already popped
    if (!wasPopped) {
      await redisClient.lrem(QUEUE_KEY, 0, eventId);
    }
    results.skipped++;
    return;
  }

  const failedGrant = typeof failedGrantData === 'string'
    ? JSON.parse(failedGrantData)
    : failedGrantData;

  // Skip already resolved
  if (failedGrant.status === 'resolved') {
    results.skipped++;
    results.details.push({
      eventId,
      status: 'skipped',
      reason: 'Already resolved',
    });
    // Clean up the record
    await redisClient.del(key);
    return;
  }

  // Check retry count BEFORE incrementing
  const currentRetries = failedGrant.retryCount || 0;

  if (currentRetries >= MAX_RETRIES) {
    // Move to dead-letter queue
    await moveToDeadLetter(redisClient, eventId, failedGrant);
    results.movedToDeadLetter++;
    results.details.push({
      eventId,
      status: 'dead_letter',
      reason: `Max retries (${MAX_RETRIES}) exceeded`,
    });
    return;
  }

  results.processed++;

  // Increment retry count
  failedGrant.retryCount = currentRetries + 1;
  failedGrant.lastRetryAt = new Date().toISOString();

  try {
    const { userId, productType, productId, sessionId, amountTotal } = failedGrant;

    if (!userId) {
      // Can't process without userId - move to dead letter
      failedGrant.status = 'needs_manual_review';
      await redisClient.set(key, JSON.stringify(failedGrant), { ex: FAILED_GRANT_TTL_SECONDS });
      await moveToDeadLetter(redisClient, eventId, failedGrant);
      results.movedToDeadLetter++;
      results.details.push({
        eventId,
        status: 'dead_letter',
        reason: 'Missing userId - requires manual resolution',
      });
      return;
    }

    // IDEMPOTENCY: Check if already granted
    const alreadyGranted = await isAlreadyGranted(redisClient, userId, sessionId);
    if (alreadyGranted) {
      // Already granted - mark resolved and clean up
      failedGrant.status = 'resolved';
      failedGrant.resolution = 'already_granted';
      await redisClient.set(key, JSON.stringify(failedGrant), { ex: FAILED_GRANT_TTL_SECONDS });
      results.succeeded++;
      results.details.push({
        eventId,
        status: 'success',
        reason: 'Already granted (idempotent)',
      });
      return;
    }

    // Attempt to grant based on product type
    if (productType === 'tier' && productId) {
      await grantTierEntitlement(redisClient, {
        userId,
        productId,
        sessionId,
        amountTotal,
        eventId,
      });
    } else if (productType === 'addon' && productId) {
      await grantAddonEntitlement(redisClient, {
        userId,
        productId,
        sessionId,
        amountTotal,
        eventId,
      });
    } else {
      throw new Error(`Unknown product type: ${productType}`);
    }

    // Mark as granted for idempotency
    await markSessionGranted(redisClient, userId, sessionId, productType, productId);

    // Success - mark resolved and clean up
    failedGrant.status = 'resolved';
    failedGrant.resolution = 'retry_succeeded';
    failedGrant.resolvedAt = new Date().toISOString();
    await redisClient.set(key, JSON.stringify(failedGrant), { ex: FAILED_GRANT_TTL_SECONDS });

    results.succeeded++;
    results.details.push({
      eventId,
      userId,
      productType,
      productId,
      status: 'success',
      retryCount: failedGrant.retryCount,
    });

    console.log(`[RETRY_SUCCESS] Granted ${productType}:${productId} to user ${userId} on retry ${failedGrant.retryCount}`);

  } catch (retryError) {
    // Still failing - update record
    failedGrant.lastError = retryError?.message || String(retryError);
    await redisClient.set(key, JSON.stringify(failedGrant), { ex: FAILED_GRANT_TTL_SECONDS });

    // Check if we've now hit max retries
    if (failedGrant.retryCount >= MAX_RETRIES) {
      await moveToDeadLetter(redisClient, eventId, failedGrant);
      results.movedToDeadLetter++;
      results.details.push({
        eventId,
        status: 'dead_letter',
        reason: `Failed after ${MAX_RETRIES} retries: ${retryError?.message}`,
        retryCount: failedGrant.retryCount,
      });
    } else {
      // Re-enqueue for future retry (add to end of queue)
      await redisClient.rpush(QUEUE_KEY, eventId);
      results.failed++;
      results.details.push({
        eventId,
        status: 'failed',
        reason: retryError?.message,
        retryCount: failedGrant.retryCount,
        requeuedForRetry: true,
      });
    }

    console.error(`[RETRY_FAILED] Event ${eventId} retry ${failedGrant.retryCount} failed:`, retryError);
  }
}

/**
 * Move event to dead-letter queue
 */
async function moveToDeadLetter(redisClient, eventId, failedGrant) {
  // Add to dead-letter list
  await redisClient.lpush(DEAD_LETTER_KEY, eventId);

  // Update status
  failedGrant.status = 'dead_letter';
  failedGrant.movedToDeadLetterAt = new Date().toISOString();

  const key = `stripe:failed_grant:${eventId}`;
  await redisClient.set(key, JSON.stringify(failedGrant), { ex: FAILED_GRANT_TTL_SECONDS });

  console.error(`[DEAD_LETTER] Event ${eventId} moved to dead-letter queue after ${failedGrant.retryCount} retries`);
}

// ===========================================
// GET /api/stripe/retry-grants
// ===========================================

/**
 * GET /api/stripe/retry-grants
 *
 * Get queue stats and failed grants list.
 * Protected by CRON_SECRET.
 */
export async function GET(request) {
  const headersList = await headers();
  const authHeader = headersList.get('authorization');

  if (!verifyAuth(authHeader)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const redisClient = getRedis();
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
  const includeStats = searchParams.get('stats') !== 'false';

  try {
    // Get queue lengths
    const queueLength = await redisClient.llen(QUEUE_KEY);
    const deadLetterLength = await redisClient.llen(DEAD_LETTER_KEY);

    // Get pending events (peek, don't pop)
    const eventIds = await redisClient.lrange(QUEUE_KEY, 0, limit - 1);
    const failedGrants = [];

    for (const eventId of eventIds) {
      const data = await redisClient.get(`stripe:failed_grant:${eventId}`);
      if (data) {
        const grant = typeof data === 'string' ? JSON.parse(data) : data;
        failedGrants.push({
          eventId,
          userId: grant.userId,
          productType: grant.productType,
          productId: grant.productId,
          amountTotal: grant.amountTotal,
          failedAt: grant.failedAt,
          retryCount: grant.retryCount || 0,
          status: grant.status,
          lastError: grant.lastError || grant.error,
          lastRetryAt: grant.lastRetryAt,
        });
      }
    }

    const response = {
      queue: {
        length: queueLength,
        deadLetterLength: deadLetterLength,
      },
      failedGrants: {
        count: failedGrants.length,
        items: failedGrants,
      },
    };

    // Add daily counters if requested
    if (includeStats) {
      const today = new Date().toISOString().slice(0, 10);
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

      const [todayCount, yesterdayCount] = await Promise.all([
        redisClient.get(`stripe:failed_grants:${today}`),
        redisClient.get(`stripe:failed_grants:${yesterday}`),
      ]);

      response.dailyStats = {
        [today]: parseInt(todayCount || '0', 10),
        [yesterday]: parseInt(yesterdayCount || '0', 10),
      };
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Get failed grants error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch failed grants' },
      { status: 500 }
    );
  }
}

// ===========================================
// GRANT HELPERS
// ===========================================

/**
 * Grant tier entitlement (atomic operation)
 */
async function grantTierEntitlement(redisClient, { userId, productId, sessionId, amountTotal, eventId }) {
  const features = TIER_FEATURES[productId] || TIER_FEATURES.free;

  // Fetch existing data
  let existingData = {};
  try {
    const existing = await redisClient.get(`user:${userId}:tier`);
    if (existing) {
      existingData = typeof existing === 'string' ? JSON.parse(existing) : existing;
    }
  } catch (e) {
    // Ignore parse errors, start fresh
  }

  const userTierData = {
    tier: productId,
    features: features,
    purchasedAt: new Date().toISOString(),
    stripeSessionId: sessionId,
    amountPaid: amountTotal,
    pdfAnalysesUsed: existingData.pdfAnalysesUsed || 0,
    pdfAnalysesRemaining: features.pdfAnalyses,
    aiCreditsUsed: existingData.aiCreditsUsed || 0,
    aiCreditsRemaining: features.aiChat ? -1 : 0,
    accessRevoked: false,
    accessFrozen: false,
    grantedViaRetry: true,
    retryEventId: eventId,
  };

  // Set tier data
  await redisClient.set(`user:${userId}:tier`, JSON.stringify(userTierData));

  // Set entitlement marker for idempotency
  await redisClient.set(`entitlement:${userId}`, JSON.stringify({
    tier: productId,
    sessionId,
    grantedAt: new Date().toISOString(),
    grantedViaRetry: true,
  }), { ex: IDEMPOTENCY_TTL_SECONDS });

  // Update profile (best effort)
  try {
    const existingProfile = await redisClient.get(`user:${userId}:profile`);
    const profile = existingProfile
      ? (typeof existingProfile === 'string' ? JSON.parse(existingProfile) : existingProfile)
      : {};

    await redisClient.set(`user:${userId}:profile`, JSON.stringify({
      ...profile,
      tier: productId,
      tierPurchasedAt: new Date().toISOString(),
    }));
  } catch (profileError) {
    console.error('Non-critical: Failed to update profile during retry:', profileError);
  }
}

/**
 * Grant addon entitlement (atomic operation)
 */
async function grantAddonEntitlement(redisClient, { userId, productId, sessionId, amountTotal, eventId }) {
  const addonGrant = ADDON_GRANTS[productId];
  if (!addonGrant) {
    throw new Error(`Unknown addon: ${productId}`);
  }

  // Fetch existing tier data
  const existingTier = await redisClient.get(`user:${userId}:tier`);
  const tierData = existingTier
    ? (typeof existingTier === 'string' ? JSON.parse(existingTier) : existingTier)
    : {};

  // Check for duplicate addon (idempotency within tier data)
  const existingAddons = tierData.addons || [];
  const alreadyHasAddon = existingAddons.some(a => a.stripeSessionId === sessionId);
  if (alreadyHasAddon) {
    console.log(`[SKIP] Addon already granted for session ${sessionId}`);
    return;
  }

  if (addonGrant.type === 'increment') {
    const currentValue = tierData[addonGrant.field] || 0;
    tierData[addonGrant.field] = currentValue === -1 ? -1 : currentValue + addonGrant.amount;
  } else if (addonGrant.type === 'unlock') {
    tierData.features = tierData.features || {};
    tierData.features[addonGrant.field] = addonGrant.value;
  }

  tierData.addons = existingAddons;
  tierData.addons.push({
    addonId: productId,
    purchasedAt: new Date().toISOString(),
    stripeSessionId: sessionId,
    amountPaid: amountTotal,
    grantedViaRetry: true,
  });

  await redisClient.set(`user:${userId}:tier`, JSON.stringify(tierData));
}
