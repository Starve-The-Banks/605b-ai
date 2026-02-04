import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { logError } from '@/lib/logging';

// Lazy initialization
let redis = null;
let stripe = null;

function getRedis() {
  if (!redis) {
    const { Redis } = require('@upstash/redis');
    redis = Redis.fromEnv();
  }
  return redis;
}

function getStripe() {
  if (!stripe) {
    const Stripe = require('stripe').default;
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripe;
}

function isAllowlisted(userId, user) {
  const allowlist = process.env.DEBUG_ENTITLEMENTS_ALLOWLIST;
  if (!allowlist) return false;
  const entries = allowlist
    .split(',')
    .map(entry => entry.trim().toLowerCase())
    .filter(Boolean);
  if (!entries.length) return false;
  const email = user?.emailAddresses?.[0]?.emailAddress?.toLowerCase();
  return entries.includes(userId?.toLowerCase()) || (email && entries.includes(email));
}

/**
 * GET /api/debug/entitlements
 *
 * Debug endpoint to view current user's entitlement state.
 * Requires authentication.
 */
export async function GET() {
  try {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (process.env.NODE_ENV === 'production' && !isAllowlisted(userId, user)) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const redisClient = getRedis();

    // Gather all entitlement-related data
    const [
      tierData,
      profileData,
      entitlementData,
      auditData,
    ] = await Promise.all([
      redisClient.get(`user:${userId}:tier`),
      redisClient.get(`user:${userId}:profile`),
      redisClient.get(`entitlement:${userId}`),
      redisClient.get(`user:${userId}:audit`),
    ]);

    // Parse JSON data safely
    const parseTierData = tierData ? (typeof tierData === 'string' ? JSON.parse(tierData) : tierData) : null;
    const parseProfileData = profileData ? (typeof profileData === 'string' ? JSON.parse(profileData) : profileData) : null;
    const parseEntitlementData = entitlementData ? (typeof entitlementData === 'string' ? JSON.parse(entitlementData) : entitlementData) : null;
    const parseAuditData = auditData ? (typeof auditData === 'string' ? JSON.parse(auditData) : auditData) : [];

    // Get recent audit entries (last 10)
    const recentAudit = Array.isArray(parseAuditData) ? parseAuditData.slice(0, 10) : [];

    // Check for any pending grants in the failed grants queue
    let pendingGrants = [];
    try {
      const queueLength = await redisClient.llen('stripe:failed_grants_queue');
      if (queueLength > 0) {
        const queueItems = await redisClient.lrange('stripe:failed_grants_queue', 0, 100);
        for (const eventId of queueItems) {
          const grantData = await redisClient.get(`stripe:failed_grant:${eventId}`);
          if (grantData) {
            const parsed = typeof grantData === 'string' ? JSON.parse(grantData) : grantData;
            if (parsed.userId === userId) {
              pendingGrants.push({
                eventId,
                productType: parsed.productType,
                productId: parsed.productId,
                failedAt: parsed.failedAt,
                retryCount: parsed.retryCount,
                status: parsed.status,
              });
            }
          }
        }
      }
    } catch (e) {
      logError('Error checking pending grants', e, { userId });
    }

    // Look up any Stripe session mappings
    let stripeSessionId = parseTierData?.stripeSessionId || null;
    let stripeCustomerId = parseProfileData?.stripeCustomerId || parseTierData?.stripeCustomerId || null;

    // Check if there's a grant record for this user
    let grantRecords = [];
    if (stripeSessionId) {
      const grantKey = `stripe:grant:${userId}:${stripeSessionId}`;
      const grantData = await redisClient.get(grantKey);
      if (grantData) {
        const parsed = typeof grantData === 'string' ? JSON.parse(grantData) : grantData;
        grantRecords.push({
          sessionId: stripeSessionId,
          ...parsed,
        });
      }
    }

    // Fetch recent checkout sessions from Stripe for this customer
    let recentStripeSessions = [];
    if (stripeCustomerId) {
      try {
        const stripeClient = getStripe();
        const sessions = await stripeClient.checkout.sessions.list({
          customer: stripeCustomerId,
          limit: 5,
        });
        recentStripeSessions = sessions.data.map(s => ({
          id: s.id,
          paymentStatus: s.payment_status,
          amountTotal: s.amount_total,
          currency: s.currency,
          created: new Date(s.created * 1000).toISOString(),
          metadata: {
            productType: s.metadata?.productType,
            productId: s.metadata?.productId,
            userId: s.metadata?.clerkUserId || s.metadata?.userId,
            env: s.metadata?.env,
            mode: s.metadata?.stripeMode,
          },
          clientReferenceId: s.client_reference_id,
        }));
      } catch (e) {
        logError('Error fetching Stripe sessions', e, { userId });
      }
    }

    // Environment and configuration info
    const stripeMode = process.env.STRIPE_SECRET_KEY?.startsWith('sk_live') ? 'live' : 'test';
    const webhookConfigured = !!process.env.STRIPE_WEBHOOK_SECRET;

    return NextResponse.json({
      debug: true,
      timestamp: new Date().toISOString(),
      environment: {
        vercelEnv: process.env.VERCEL_ENV || 'unknown',
        nodeEnv: process.env.NODE_ENV || 'unknown',
        appUrl: process.env.NEXT_PUBLIC_APP_URL || 'not set',
        stripeMode: stripeMode,
        webhookConfigured: webhookConfigured,
      },
      user: {
        id: userId,
        email: user?.emailAddresses?.[0]?.emailAddress || 'unknown',
        name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'unknown',
      },
      entitlement: {
        currentTier: parseTierData?.tier || 'free',
        features: parseTierData?.features || null,
        purchasedAt: parseTierData?.purchasedAt || null,
        amountPaid: parseTierData?.amountPaid || 0,
        accessRevoked: parseTierData?.accessRevoked || false,
        accessFrozen: parseTierData?.accessFrozen || false,
        isUpgrade: parseTierData?.isUpgrade || false,
        upgradedFrom: parseTierData?.upgradedFrom || null,
        reconciledAt: parseTierData?.reconciledAt || null,
        reconcileSource: parseTierData?.reconcileSource || null,
      },
      stripe: {
        sessionId: stripeSessionId,
        customerId: stripeCustomerId,
        paymentIntentId: parseTierData?.stripePaymentIntentId || null,
        mode: stripeMode,
        recentSessions: recentStripeSessions,
      },
      grants: {
        entitlementRecord: parseEntitlementData,
        grantRecords: grantRecords,
        pendingGrants: pendingGrants,
        idempotencyKeyExists: stripeSessionId ? !!(await redisClient.get(`stripe:grant:${userId}:${stripeSessionId}`)) : false,
      },
      profile: {
        tier: parseProfileData?.tier || null,
        stripeCustomerId: parseProfileData?.stripeCustomerId || null,
        onboardingComplete: parseProfileData?.onboardingComplete || false,
      },
      recentAudit: recentAudit.map(entry => ({
        action: entry.action,
        type: entry.type,
        timestamp: entry.timestamp,
        details: entry.details,
      })),
      rawTierData: parseTierData,
    });

  } catch (error) {
    logError('Error fetching entitlements', error);
    return NextResponse.json(
      { error: 'Failed to fetch entitlements' },
      { status: 500 }
    );
  }
}
