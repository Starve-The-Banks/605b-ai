import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

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

/**
 * POST /api/stripe/retry-grants
 *
 * Retry failed entitlement grants.
 * Protected by CRON_SECRET for automated calls.
 *
 * Query params:
 * - limit: Max number of grants to retry (default 10)
 * - eventId: Retry a specific event ID
 */
export async function POST(request) {
  // Verify authorization
  const headersList = await headers();
  const authHeader = headersList.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // Allow if CRON_SECRET matches or if called internally
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const redisClient = getRedis();
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const specificEventId = searchParams.get('eventId');

  const results = {
    processed: 0,
    succeeded: 0,
    failed: 0,
    skipped: 0,
    details: [],
  };

  try {
    let eventIds = [];

    if (specificEventId) {
      // Retry specific event
      eventIds = [specificEventId];
    } else {
      // Get pending events from queue
      eventIds = await redisClient.lrange('stripe:failed_grants_queue', 0, limit - 1);
    }

    for (const eventId of eventIds) {
      const key = `stripe:failed_grant:${eventId}`;
      const failedGrantData = await redisClient.get(key);

      if (!failedGrantData) {
        // Already removed or expired
        await redisClient.lrem('stripe:failed_grants_queue', 0, eventId);
        results.skipped++;
        continue;
      }

      const failedGrant = typeof failedGrantData === 'string'
        ? JSON.parse(failedGrantData)
        : failedGrantData;

      if (failedGrant.status === 'resolved') {
        results.skipped++;
        results.details.push({
          eventId,
          status: 'skipped',
          reason: 'Already resolved',
        });
        continue;
      }

      if (failedGrant.retryCount >= MAX_RETRIES) {
        results.skipped++;
        results.details.push({
          eventId,
          status: 'skipped',
          reason: `Max retries (${MAX_RETRIES}) exceeded`,
        });
        continue;
      }

      results.processed++;

      // Increment retry count
      failedGrant.retryCount = (failedGrant.retryCount || 0) + 1;
      failedGrant.lastRetryAt = new Date().toISOString();

      try {
        const { userId, productType, productId, sessionId, amountTotal, rawEventData } = failedGrant;

        if (!userId) {
          // Can't process without userId - needs manual review
          results.failed++;
          results.details.push({
            eventId,
            status: 'failed',
            reason: 'Missing userId - requires manual resolution',
          });
          failedGrant.status = 'needs_manual_review';
          await redisClient.set(key, JSON.stringify(failedGrant));
          continue;
        }

        // Check if already granted (idempotency)
        const entitlement = await redisClient.get(`entitlement:${userId}`);
        if (entitlement) {
          const entData = typeof entitlement === 'string' ? JSON.parse(entitlement) : entitlement;
          if (entData.sessionId === sessionId) {
            // Already granted!
            failedGrant.status = 'resolved';
            failedGrant.resolution = 'already_granted';
            await redisClient.set(key, JSON.stringify(failedGrant));
            await redisClient.lrem('stripe:failed_grants_queue', 0, eventId);
            results.succeeded++;
            results.details.push({
              eventId,
              status: 'success',
              reason: 'Already granted (idempotent)',
            });
            continue;
          }
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
        }

        // Success!
        failedGrant.status = 'resolved';
        failedGrant.resolution = 'retry_succeeded';
        failedGrant.resolvedAt = new Date().toISOString();
        await redisClient.set(key, JSON.stringify(failedGrant));
        await redisClient.lrem('stripe:failed_grants_queue', 0, eventId);

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
        // Still failing
        failedGrant.lastError = retryError?.message || String(retryError);
        await redisClient.set(key, JSON.stringify(failedGrant));

        results.failed++;
        results.details.push({
          eventId,
          status: 'failed',
          reason: retryError?.message,
          retryCount: failedGrant.retryCount,
        });

        console.error(`[RETRY_FAILED] Event ${eventId} retry ${failedGrant.retryCount} failed:`, retryError);
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
 * GET /api/stripe/retry-grants
 *
 * Get list of failed grants pending retry
 */
export async function GET(request) {
  const headersList = await headers();
  const authHeader = headersList.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const redisClient = getRedis();
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '50', 10);

  try {
    const eventIds = await redisClient.lrange('stripe:failed_grants_queue', 0, limit - 1);
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
        });
      }
    }

    return NextResponse.json({
      count: failedGrants.length,
      queueLength: eventIds.length,
      failedGrants,
    });

  } catch (error) {
    console.error('Get failed grants error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch failed grants' },
      { status: 500 }
    );
  }
}

// Helper: Grant tier entitlement
async function grantTierEntitlement(redisClient, { userId, productId, sessionId, amountTotal, eventId }) {
  const features = TIER_FEATURES[productId] || TIER_FEATURES.free;

  let existingData = {};
  try {
    const existing = await redisClient.get(`user:${userId}:tier`);
    if (existing) {
      existingData = typeof existing === 'string' ? JSON.parse(existing) : existing;
    }
  } catch (e) {
    // Ignore parse errors
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

  await redisClient.set(`user:${userId}:tier`, JSON.stringify(userTierData));

  // Mark entitlement as granted
  await redisClient.set(`entitlement:${userId}`, JSON.stringify({
    tier: productId,
    sessionId,
    grantedAt: new Date().toISOString(),
    grantedViaRetry: true,
  }), { ex: IDEMPOTENCY_TTL_SECONDS });

  // Update profile
  const existingProfile = await redisClient.get(`user:${userId}:profile`);
  const profile = existingProfile
    ? (typeof existingProfile === 'string' ? JSON.parse(existingProfile) : existingProfile)
    : {};

  await redisClient.set(`user:${userId}:profile`, JSON.stringify({
    ...profile,
    tier: productId,
    tierPurchasedAt: new Date().toISOString(),
  }));
}

// Helper: Grant addon entitlement
async function grantAddonEntitlement(redisClient, { userId, productId, sessionId, amountTotal, eventId }) {
  const addonGrant = ADDON_GRANTS[productId];
  if (!addonGrant) {
    throw new Error(`Unknown addon: ${productId}`);
  }

  const existingTier = await redisClient.get(`user:${userId}:tier`);
  const tierData = existingTier
    ? (typeof existingTier === 'string' ? JSON.parse(existingTier) : existingTier)
    : {};

  if (addonGrant.type === 'increment') {
    const currentValue = tierData[addonGrant.field] || 0;
    tierData[addonGrant.field] = currentValue === -1 ? -1 : currentValue + addonGrant.amount;
  } else if (addonGrant.type === 'unlock') {
    tierData.features = tierData.features || {};
    tierData.features[addonGrant.field] = addonGrant.value;
  }

  tierData.addons = tierData.addons || [];
  tierData.addons.push({
    addonId: productId,
    purchasedAt: new Date().toISOString(),
    stripeSessionId: sessionId,
    amountPaid: amountTotal,
    grantedViaRetry: true,
  });

  await redisClient.set(`user:${userId}:tier`, JSON.stringify(tierData));
}
