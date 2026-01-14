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

// Tier features (must match webhook and retry-grants)
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

const IDEMPOTENCY_TTL_SECONDS = 90 * 24 * 60 * 60;
const FAILED_GRANT_TTL_SECONDS = 30 * 24 * 60 * 60;

// Redis keys
const DEAD_LETTER_KEY = 'stripe:failed_grants_dead';

// ===========================================
// CONSTANT-TIME AUTH
// ===========================================

function constantTimeCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false;
  }

  const maxLen = Math.max(a.length, b.length);
  const aPadded = a.padEnd(maxLen, '\0');
  const bPadded = b.padEnd(maxLen, '\0');

  try {
    return timingSafeEqual(Buffer.from(aPadded), Buffer.from(bPadded)) && a.length === b.length;
  } catch {
    return false;
  }
}

function verifyAuth(authHeader) {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error('[AUTH] CRON_SECRET not configured');
    return false;
  }

  if (!authHeader) {
    return false;
  }

  if (!authHeader.startsWith('Bearer ')) {
    return false;
  }

  const token = authHeader.slice(7);
  return constantTimeCompare(token, cronSecret);
}

// ===========================================
// IDEMPOTENCY CHECK
// ===========================================

async function isAlreadyGranted(redisClient, userId, sessionId) {
  const grantKey = `stripe:grant:${userId}:${sessionId}`;
  const granted = await redisClient.get(grantKey);
  if (granted) return true;

  const entitlement = await redisClient.get(`entitlement:${userId}`);
  if (entitlement) {
    const data = typeof entitlement === 'string' ? JSON.parse(entitlement) : entitlement;
    if (data.sessionId === sessionId) return true;
  }

  return false;
}

async function markSessionGranted(redisClient, userId, sessionId, productType, productId) {
  const grantKey = `stripe:grant:${userId}:${sessionId}`;
  await redisClient.set(grantKey, JSON.stringify({
    productType,
    productId,
    grantedAt: new Date().toISOString(),
    grantedViaDeadLetterReplay: true,
  }), { ex: IDEMPOTENCY_TTL_SECONDS });
}

// ===========================================
// GET /api/stripe/retry-grants/dead-letter
// ===========================================

/**
 * GET /api/stripe/retry-grants/dead-letter
 *
 * Get the first N dead-letter eventIds with details.
 * Protected by CRON_SECRET.
 *
 * Query params:
 * - limit: Max number of events to return (default 20, max 100)
 */
export async function GET(request) {
  const headersList = await headers();
  const authHeader = headersList.get('authorization');

  if (!verifyAuth(authHeader)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const redisClient = getRedis();
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);

  try {
    const deadLetterLength = await redisClient.llen(DEAD_LETTER_KEY);
    const eventIds = await redisClient.lrange(DEAD_LETTER_KEY, 0, limit - 1);

    const deadLetterEvents = [];

    for (const eventId of eventIds) {
      const data = await redisClient.get(`stripe:failed_grant:${eventId}`);
      if (data) {
        const grant = typeof data === 'string' ? JSON.parse(data) : data;
        deadLetterEvents.push({
          eventId,
          userId: grant.userId,
          productType: grant.productType,
          productId: grant.productId,
          amountTotal: grant.amountTotal,
          failedAt: grant.failedAt,
          retryCount: grant.retryCount || 0,
          status: grant.status,
          lastError: grant.lastError || grant.error,
          movedToDeadLetterAt: grant.movedToDeadLetterAt,
        });
      } else {
        // Event data expired but still in queue - include minimal info
        deadLetterEvents.push({
          eventId,
          status: 'data_expired',
          note: 'Event data has expired, only eventId available',
        });
      }
    }

    return NextResponse.json({
      deadLetter: {
        totalLength: deadLetterLength,
        returnedCount: deadLetterEvents.length,
        events: deadLetterEvents,
      },
    });

  } catch (error) {
    console.error('Get dead-letter error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dead-letter queue' },
      { status: 500 }
    );
  }
}

// ===========================================
// POST /api/stripe/retry-grants/dead-letter
// ===========================================

/**
 * POST /api/stripe/retry-grants/dead-letter
 *
 * Replay a specific dead-letter event after a code fix.
 * Protected by CRON_SECRET.
 *
 * Query params:
 * - eventId: (required) The event ID to replay
 *
 * This resets the retry count to 0 and attempts the grant again.
 * If successful, removes from dead-letter queue.
 * If failed, re-adds to dead-letter queue (does not go back to main queue).
 */
export async function POST(request) {
  const headersList = await headers();
  const authHeader = headersList.get('authorization');

  if (!verifyAuth(authHeader)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const redisClient = getRedis();
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get('eventId');

  if (!eventId) {
    return NextResponse.json(
      { error: 'eventId query parameter is required' },
      { status: 400 }
    );
  }

  try {
    const key = `stripe:failed_grant:${eventId}`;
    const failedGrantData = await redisClient.get(key);

    if (!failedGrantData) {
      return NextResponse.json(
        { error: 'Event not found or data has expired' },
        { status: 404 }
      );
    }

    const failedGrant = typeof failedGrantData === 'string'
      ? JSON.parse(failedGrantData)
      : failedGrantData;

    // Verify it's actually in dead-letter status
    if (failedGrant.status !== 'dead_letter' && failedGrant.status !== 'needs_manual_review') {
      return NextResponse.json(
        { error: `Event status is '${failedGrant.status}', not in dead-letter queue` },
        { status: 400 }
      );
    }

    const { userId, productType, productId, sessionId, amountTotal } = failedGrant;

    // IDEMPOTENCY: Check if already granted
    if (userId && sessionId) {
      const alreadyGranted = await isAlreadyGranted(redisClient, userId, sessionId);
      if (alreadyGranted) {
        // Already granted - mark resolved and remove from dead-letter
        failedGrant.status = 'resolved';
        failedGrant.resolution = 'already_granted_on_replay';
        failedGrant.resolvedAt = new Date().toISOString();
        await redisClient.set(key, JSON.stringify(failedGrant), { ex: FAILED_GRANT_TTL_SECONDS });
        await redisClient.lrem(DEAD_LETTER_KEY, 0, eventId);

        return NextResponse.json({
          success: true,
          eventId,
          status: 'already_granted',
          message: 'Entitlement was already granted (idempotent)',
        });
      }
    }

    if (!userId) {
      return NextResponse.json({
        success: false,
        eventId,
        status: 'needs_manual_review',
        message: 'Cannot replay: missing userId. Manual resolution required.',
        failedGrant: {
          productType,
          productId,
          amountTotal,
          sessionId: failedGrant.sessionId,
        },
      }, { status: 422 });
    }

    // Reset replay metadata
    failedGrant.replayAttemptedAt = new Date().toISOString();
    failedGrant.previousRetryCount = failedGrant.retryCount;

    try {
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

      // Success - mark resolved and remove from dead-letter queue
      failedGrant.status = 'resolved';
      failedGrant.resolution = 'dead_letter_replay_succeeded';
      failedGrant.resolvedAt = new Date().toISOString();
      await redisClient.set(key, JSON.stringify(failedGrant), { ex: FAILED_GRANT_TTL_SECONDS });
      await redisClient.lrem(DEAD_LETTER_KEY, 0, eventId);

      console.log(`[DEAD_LETTER_REPLAY_SUCCESS] Granted ${productType}:${productId} to user ${userId}`);

      return NextResponse.json({
        success: true,
        eventId,
        userId,
        productType,
        productId,
        status: 'granted',
        message: 'Entitlement granted successfully via dead-letter replay',
      });

    } catch (replayError) {
      // Still failing - update record but keep in dead-letter
      failedGrant.lastError = replayError?.message || String(replayError);
      failedGrant.lastReplayError = replayError?.message || String(replayError);
      failedGrant.lastReplayAt = new Date().toISOString();
      await redisClient.set(key, JSON.stringify(failedGrant), { ex: FAILED_GRANT_TTL_SECONDS });

      console.error(`[DEAD_LETTER_REPLAY_FAILED] Event ${eventId} replay failed:`, replayError);

      return NextResponse.json({
        success: false,
        eventId,
        userId,
        productType,
        productId,
        status: 'failed',
        error: replayError?.message,
        message: 'Replay failed - event remains in dead-letter queue',
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Dead-letter replay error:', error);
    return NextResponse.json(
      { error: 'Failed to replay dead-letter event', details: error?.message },
      { status: 500 }
    );
  }
}

// ===========================================
// GRANT HELPERS (same as retry-grants)
// ===========================================

async function grantTierEntitlement(redisClient, { userId, productId, sessionId, amountTotal, eventId }) {
  const features = TIER_FEATURES[productId] || TIER_FEATURES.free;

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
    grantedViaDeadLetterReplay: true,
    replayEventId: eventId,
  };

  await redisClient.set(`user:${userId}:tier`, JSON.stringify(userTierData));

  await redisClient.set(`entitlement:${userId}`, JSON.stringify({
    tier: productId,
    sessionId,
    grantedAt: new Date().toISOString(),
    grantedViaDeadLetterReplay: true,
  }), { ex: IDEMPOTENCY_TTL_SECONDS });

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
    console.error('Non-critical: Failed to update profile during dead-letter replay:', profileError);
  }
}

async function grantAddonEntitlement(redisClient, { userId, productId, sessionId, amountTotal, eventId }) {
  const addonGrant = ADDON_GRANTS[productId];
  if (!addonGrant) {
    throw new Error(`Unknown addon: ${productId}`);
  }

  const existingTier = await redisClient.get(`user:${userId}:tier`);
  const tierData = existingTier
    ? (typeof existingTier === 'string' ? JSON.parse(existingTier) : existingTier)
    : {};

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
    grantedViaDeadLetterReplay: true,
  });

  await redisClient.set(`user:${userId}:tier`, JSON.stringify(tierData));
}
