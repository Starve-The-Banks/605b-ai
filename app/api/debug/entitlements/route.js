import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Lazy initialization
let redis = null;

function getRedis() {
  if (!redis) {
    const { Redis } = require('@upstash/redis');
    redis = Redis.fromEnv();
  }
  return redis;
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
        // Check if any are for this user
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
      console.error('Error checking pending grants:', e);
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

    return NextResponse.json({
      debug: true,
      timestamp: new Date().toISOString(),
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
      },
      stripe: {
        sessionId: stripeSessionId,
        customerId: stripeCustomerId,
        paymentIntentId: parseTierData?.stripePaymentIntentId || null,
      },
      grants: {
        entitlementRecord: parseEntitlementData,
        grantRecords: grantRecords,
        pendingGrants: pendingGrants,
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
    console.error('[DEBUG] Error fetching entitlements:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch entitlements' },
      { status: 500 }
    );
  }
}
