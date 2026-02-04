import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Lazy initialization to avoid build-time errors
let stripe = null;
let redis = null;

function getStripe() {
  if (!stripe) {
    const Stripe = require('stripe').default;
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripe;
}

function getRedis() {
  if (!redis) {
    const { Redis } = require('@upstash/redis');
    redis = Redis.fromEnv();
  }
  return redis;
}

// Grant idempotency key prefix - MUST match webhook/route.js
const GRANT_KEY_PREFIX = 'grant:session:';
const IDEMPOTENCY_TTL_SECONDS = 90 * 24 * 60 * 60; // 90 days

/**
 * Atomically try to acquire grant lock for a session.
 * Returns true if this call acquired the lock (grant not yet done).
 * Returns false if grant was already completed by webhook or sync-session.
 */
async function tryAcquireGrantLock(redisClient, sessionId, userId, tier, source) {
  const key = `${GRANT_KEY_PREFIX}${sessionId}`;
  const value = JSON.stringify({
    userId,
    tier,
    grantedAt: new Date().toISOString(),
    source, // 'webhook' or 'sync-session'
  });
  
  // SETNX: Set only if key does not exist (atomic operation)
  const result = await redisClient.set(key, value, { ex: IDEMPOTENCY_TTL_SECONDS, nx: true });
  return result === 'OK';
}

/**
 * Get grant info for a session (for returning already-granted info)
 */
async function getGrantInfo(redisClient, sessionId) {
  const key = `${GRANT_KEY_PREFIX}${sessionId}`;
  const data = await redisClient.get(key);
  if (!data) return null;
  return typeof data === 'string' ? JSON.parse(data) : data;
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

/**
 * POST /api/stripe/sync-session
 *
 * Fallback endpoint to sync entitlements from a Stripe checkout session.
 * Called by the frontend when redirected back from Stripe with session_id.
 * This ensures entitlements are granted even if webhooks are delayed.
 */
export async function POST(request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
    }

    // Validate sessionId format (basic sanitization)
    if (!/^cs_[a-zA-Z0-9_]+$/.test(sessionId)) {
      console.error(`[SYNC] Invalid sessionId format: ${sessionId}`);
      return NextResponse.json({ error: 'Invalid sessionId format' }, { status: 400 });
    }

    const stripeClient = getStripe();
    const redisClient = getRedis();

    console.log(`[SYNC] User ${userId} requesting sync for session ${sessionId}`);

    // Retrieve the checkout session from Stripe
    let session;
    try {
      session = await stripeClient.checkout.sessions.retrieve(sessionId);
    } catch (stripeError) {
      console.error(`[SYNC] Failed to retrieve session ${sessionId}:`, stripeError.message);
      return NextResponse.json({
        error: 'Session not found',
        details: stripeError.message
      }, { status: 404 });
    }

    // SECURITY: Verify this session belongs to the requesting user
    const sessionUserId = session.metadata?.clerkUserId || session.client_reference_id;
    if (sessionUserId !== userId) {
      console.error(`[SYNC] User mismatch: session user ${sessionUserId} !== requesting user ${userId}`);
      return NextResponse.json({
        error: 'Session does not belong to this user'
      }, { status: 403 });
    }

    // Check payment status
    if (session.payment_status !== 'paid') {
      console.log(`[SYNC] Session ${sessionId} not paid (status: ${session.payment_status})`);
      return NextResponse.json({
        granted: false,
        reason: 'payment_not_complete',
        paymentStatus: session.payment_status,
      });
    }

    // Check if entitlement already exists for this session using unified key
    // This key is shared with webhook to prevent double-grants
    const existingGrant = await getGrantInfo(redisClient, sessionId);
    if (existingGrant) {
      console.log(`[SYNC] Grant already exists for session ${sessionId} (by ${existingGrant.source})`);

      // Return current tier data
      const tierData = await redisClient.get(`user:${userId}:tier`);
      const parsedTierData = tierData ? (typeof tierData === 'string' ? JSON.parse(tierData) : tierData) : null;

      return NextResponse.json({
        granted: true,
        alreadyGranted: true,
        grantedBy: existingGrant.source,
        tier: existingGrant.tier,
        tierData: parsedTierData,
      });
    }

    // Extract product info from session
    const productType = session.metadata?.productType;
    const productId = session.metadata?.productId;
    const isUpgrade = session.metadata?.isUpgrade === 'true';
    const upgradeFrom = session.metadata?.upgradeFrom;

    console.log(`[SYNC] Processing: Type=${productType}, Product=${productId}, Upgrade=${isUpgrade}`);

    if (productType === 'tier' && productId) {
      // ATOMIC GRANT LOCK: Try to acquire lock before granting
      // This prevents race with webhook - only one can succeed
      const acquiredGrant = await tryAcquireGrantLock(redisClient, sessionId, userId, productId, 'sync-session');
      if (!acquiredGrant) {
        // Grant already exists (webhook beat us) - return current tier data
        console.log(`[SYNC] Grant lock not acquired for session ${sessionId} - webhook already granted`);
        const tierData = await redisClient.get(`user:${userId}:tier`);
        const parsedTierData = tierData ? (typeof tierData === 'string' ? JSON.parse(tierData) : tierData) : null;
        
        return NextResponse.json({
          granted: true,
          alreadyGranted: true,
          grantedBy: 'webhook',
          tier: productId,
          tierData: parsedTierData,
        });
      }

      const features = TIER_FEATURES[productId] || TIER_FEATURES.free;

      // Get existing tier data
      let existingData = {};
      try {
        const existing = await redisClient.get(`user:${userId}:tier`);
        if (existing) {
          existingData = typeof existing === 'string' ? JSON.parse(existing) : existing;
        }
      } catch (e) {
        console.error('[SYNC] Error parsing existing tier data:', e);
      }

      // Calculate remaining analyses
      let pdfAnalysesRemaining = features.pdfAnalyses;
      if (isUpgrade && existingData.pdfAnalysesUsed) {
        const used = existingData.pdfAnalysesUsed || 0;
        if (features.pdfAnalyses === -1) {
          pdfAnalysesRemaining = -1;
        } else {
          pdfAnalysesRemaining = features.pdfAnalyses - used;
          if (pdfAnalysesRemaining < 0) pdfAnalysesRemaining = 0;
        }
      }

      const userTierData = {
        tier: productId,
        features: features,
        purchasedAt: new Date().toISOString(),
        stripeSessionId: session.id,
        stripePaymentIntentId: session.payment_intent,
        stripeCustomerId: session.customer,
        amountPaid: session.amount_total,
        disclaimerAccepted: session.metadata?.disclaimerAccepted === 'true',
        disclaimerVersion: session.metadata?.disclaimerVersion,
        disclaimerTimestamp: session.metadata?.disclaimerTimestamp,
        pdfAnalysesUsed: existingData.pdfAnalysesUsed || 0,
        pdfAnalysesRemaining: pdfAnalysesRemaining,
        aiCreditsUsed: existingData.aiCreditsUsed || 0,
        aiCreditsRemaining: features.aiChat ? -1 : 0,
        isUpgrade: isUpgrade,
        upgradedFrom: upgradeFrom || null,
        accessRevoked: false,
        accessFrozen: false,
        syncedAt: new Date().toISOString(),
        syncSource: 'sync-session',
        previousPurchases: [
          ...(existingData.previousPurchases || []),
          ...(isUpgrade ? [{
            tier: upgradeFrom,
            purchasedAt: existingData.purchasedAt,
            amountPaid: existingData.amountPaid,
          }] : []),
        ],
      };

      // Grant the tier entitlement
      console.log(`[SYNC] Granting tier ${productId} to user ${userId}`);
      await redisClient.set(`user:${userId}:tier`, JSON.stringify(userTierData));

      // Store reverse mappings
      await redisClient.set(`stripe:session:${sessionId}:user`, userId, { ex: IDEMPOTENCY_TTL_SECONDS });
      if (session.payment_intent) {
        await redisClient.set(`stripe:pi:${session.payment_intent}:user`, userId, { ex: IDEMPOTENCY_TTL_SECONDS });
      }
      if (session.customer) {
        await redisClient.set(`stripe:customer:${session.customer}:user`, userId, { ex: IDEMPOTENCY_TTL_SECONDS });
      }

      console.log(`[SYNC] SUCCESS: User ${userId} granted ${productId} tier via sync-session`);

      return NextResponse.json({
        granted: true,
        tier: productId,
        tierData: userTierData,
        isUpgrade,
        upgradeFrom,
      });
    }

    // Handle addon sync (if needed)
    if (productType === 'addon' && productId) {
      // For now, just mark as synced - addons should be handled similarly
      console.log(`[SYNC] Addon sync requested for ${productId} - not fully implemented`);
      return NextResponse.json({
        granted: false,
        reason: 'addon_sync_not_implemented',
        productType,
        productId,
      });
    }

    return NextResponse.json({
      granted: false,
      reason: 'unknown_product_type',
      productType,
      productId,
    });

  } catch (error) {
    console.error('[SYNC] Error syncing session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to sync session' },
      { status: 500 }
    );
  }
}
