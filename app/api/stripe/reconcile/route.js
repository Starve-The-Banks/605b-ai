import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Lazy initialization
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

// Tier features - must match other files
const TIER_FEATURES = {
  free: {
    pdfAnalyses: 1,
    pdfExport: false,
    letterDownloads: false,
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
    letterDownloads: true,
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
    letterDownloads: true,
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
    letterDownloads: true,
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

// Price ID to tier mapping
const PRICE_TO_TIER = {
  [process.env.STRIPE_TOOLKIT_PRICE_ID]: 'toolkit',
  [process.env.STRIPE_ADVANCED_PRICE_ID]: 'advanced',
  [process.env.STRIPE_IDENTITY_THEFT_PRICE_ID]: 'identity-theft',
};

// Amount to tier mapping (fallback if price ID doesn't match)
const AMOUNT_TO_TIER = {
  3900: 'toolkit',      // $39
  8900: 'advanced',     // $89
  17900: 'identity-theft', // $179
  18000: 'identity-theft', // $180 (possible rounding)
};

/**
 * POST /api/stripe/reconcile
 *
 * Reconciles entitlements from Stripe for stranded paid users.
 * This is the "never stranded" guarantee - if webhook fails, this fixes it.
 */
export async function POST(request) {
  try {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = user?.emailAddresses?.[0]?.emailAddress;
    console.log(`[RECONCILE] Starting reconciliation for user ${userId}, email ${userEmail}`);

    const stripeClient = getStripe();
    const redisClient = getRedis();

    // 1. Get user profile to find stripeCustomerId
    const profileRaw = await redisClient.get(`user:${userId}:profile`);
    const profile = profileRaw ? (typeof profileRaw === 'string' ? JSON.parse(profileRaw) : profileRaw) : null;
    let stripeCustomerId = profile?.stripeCustomerId;

    // 2. Check if entitlements already exist and are not free
    const existingTierRaw = await redisClient.get(`user:${userId}:tier`);
    if (existingTierRaw) {
      const existingTier = typeof existingTierRaw === 'string' ? JSON.parse(existingTierRaw) : existingTierRaw;
      if (existingTier.tier && existingTier.tier !== 'free') {
        console.log(`[RECONCILE] User ${userId} already has tier: ${existingTier.tier}`);
        return NextResponse.json({
          success: true,
          alreadyHadEntitlements: true,
          tier: existingTier.tier,
          tierData: existingTier,
        });
      }
    }

    // 3. If no stripeCustomerId, try to find one by email
    if (!stripeCustomerId && userEmail) {
      console.log(`[RECONCILE] No stripeCustomerId found, searching by email: ${userEmail}`);
      try {
        const customers = await stripeClient.customers.list({
          email: userEmail,
          limit: 5,
        });
        if (customers.data.length > 0) {
          stripeCustomerId = customers.data[0].id;
          console.log(`[RECONCILE] Found customer by email: ${stripeCustomerId}`);

          // Store for future use
          await redisClient.set(`user:${userId}:profile`, JSON.stringify({
            ...profile,
            stripeCustomerId: stripeCustomerId,
          }));
        }
      } catch (e) {
        console.error('[RECONCILE] Error searching customers by email:', e.message);
      }
    }

    if (!stripeCustomerId) {
      return NextResponse.json({
        error: 'No Stripe customer found for this user',
        suggestion: 'If you have paid, please contact support with your payment receipt.',
      }, { status: 400 });
    }

    // 4. Fetch checkout sessions from Stripe
    console.log(`[RECONCILE] Fetching sessions for customer ${stripeCustomerId}`);
    let sessions = [];
    try {
      const customerSessions = await stripeClient.checkout.sessions.list({
        customer: stripeCustomerId,
        limit: 25,
        expand: ['data.line_items'],
      });
      sessions = customerSessions.data;
      console.log(`[RECONCILE] Found ${sessions.length} sessions`);
    } catch (e) {
      console.error('[RECONCILE] Error fetching sessions:', e.message);
      return NextResponse.json({
        error: 'Failed to fetch Stripe sessions',
        details: e.message,
      }, { status: 500 });
    }

    // 5. Find the most recent PAID session
    const paidSessions = sessions
      .filter(s => s.payment_status === 'paid')
      .sort((a, b) => b.created - a.created);

    console.log(`[RECONCILE] Found ${paidSessions.length} paid sessions`);

    if (paidSessions.length === 0) {
      return NextResponse.json({
        error: 'No paid sessions found for this customer',
        stripeCustomerId: stripeCustomerId,
        sessionsChecked: sessions.length,
      }, { status: 404 });
    }

    // 6. Safety check - verify session belongs to this user
    let validSession = null;
    for (const session of paidSessions) {
      const sessionUserId = session.client_reference_id || session.metadata?.userId || session.metadata?.clerkUserId;
      const sessionEmail = session.customer_details?.email || session.metadata?.userEmail || session.metadata?.email;

      // Best case: userId matches
      if (sessionUserId === userId) {
        console.log(`[RECONCILE] Found session with matching userId: ${session.id}`);
        validSession = session;
        break;
      }

      // Fallback: customer matches AND email matches (if available)
      if (session.customer === stripeCustomerId) {
        if (!sessionEmail || sessionEmail.toLowerCase() === userEmail?.toLowerCase()) {
          console.log(`[RECONCILE] Found session with matching customer (email check passed): ${session.id}`);
          validSession = session;
          break;
        }
      }
    }

    if (!validSession) {
      console.log(`[RECONCILE] No valid session found that matches user identity`);
      return NextResponse.json({
        error: 'Could not verify session ownership',
        suggestion: 'Please contact support if you believe this is an error.',
        paidSessionsFound: paidSessions.length,
      }, { status: 403 });
    }

    // 7. Determine tier from session
    let tier = null;

    // Try metadata first
    tier = validSession.metadata?.productId;
    console.log(`[RECONCILE] Tier from metadata: ${tier}`);

    // Try line items
    if (!tier && validSession.line_items?.data?.length > 0) {
      const lineItem = validSession.line_items.data[0];
      const priceId = lineItem.price?.id;
      tier = PRICE_TO_TIER[priceId];
      console.log(`[RECONCILE] Tier from price ID ${priceId}: ${tier}`);
    }

    // Try amount (fallback)
    if (!tier) {
      const amount = validSession.amount_total;
      tier = AMOUNT_TO_TIER[amount];
      console.log(`[RECONCILE] Tier from amount ${amount}: ${tier}`);
    }

    // Default to highest tier for large amounts (safety net for $180 payment)
    if (!tier && validSession.amount_total >= 17000) {
      tier = 'identity-theft';
      console.log(`[RECONCILE] Defaulting to identity-theft for amount ${validSession.amount_total}`);
    }

    if (!tier || !TIER_FEATURES[tier]) {
      return NextResponse.json({
        error: 'Could not determine tier from session',
        sessionId: validSession.id,
        amount: validSession.amount_total,
        metadata: validSession.metadata,
      }, { status: 500 });
    }

    // 8. Grant entitlements
    console.log(`[RECONCILE] Granting tier ${tier} to user ${userId}`);
    const features = TIER_FEATURES[tier];
    const tierData = {
      tier: tier,
      features: features,
      purchasedAt: new Date(validSession.created * 1000).toISOString(),
      stripeSessionId: validSession.id,
      stripePaymentIntentId: validSession.payment_intent,
      stripeCustomerId: validSession.customer,
      amountPaid: validSession.amount_total,
      pdfAnalysesUsed: 0,
      pdfAnalysesRemaining: features.pdfAnalyses,
      aiCreditsUsed: 0,
      aiCreditsRemaining: features.aiChat ? -1 : 0,
      accessRevoked: false,
      accessFrozen: false,
      reconciledAt: new Date().toISOString(),
      reconcileSource: 'manual-reconcile',
    };

    // Write entitlement
    await redisClient.set(`user:${userId}:tier`, JSON.stringify(tierData));

    // Write idempotency key
    const idempotencyKey = `stripe:grant:${userId}:${validSession.id}`;
    await redisClient.set(idempotencyKey, JSON.stringify({
      productType: 'tier',
      productId: tier,
      grantedAt: new Date().toISOString(),
      grantSource: 'manual-reconcile',
      sessionId: validSession.id,
      paymentIntentId: validSession.payment_intent,
    }), { ex: 90 * 24 * 60 * 60 }); // 90 days TTL

    // Write audit log
    const existingAudit = await redisClient.get(`user:${userId}:audit`);
    const auditLog = existingAudit
      ? (typeof existingAudit === 'string' ? JSON.parse(existingAudit) : existingAudit)
      : [];
    auditLog.unshift({
      id: `reconcile_manual_${Date.now()}`,
      type: 'entitlement',
      action: 'reconciled_from_stripe',
      details: {
        tier,
        sessionId: validSession.id,
        amountPaid: validSession.amount_total,
        method: 'manual-reconcile',
      },
      timestamp: new Date().toISOString(),
    });
    await redisClient.set(`user:${userId}:audit`, JSON.stringify(auditLog.slice(0, 1000)));

    console.log(`[RECONCILE] SUCCESS: Granted ${tier} to user ${userId} from session ${validSession.id}`);

    return NextResponse.json({
      success: true,
      tier: tier,
      tierData: tierData,
      sessionId: validSession.id,
      amountPaid: validSession.amount_total,
      message: `Successfully reconciled ${tier} tier from Stripe payment.`,
    });

  } catch (error) {
    console.error('[RECONCILE] Error:', error);
    return NextResponse.json({
      error: error.message || 'Reconciliation failed',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    }, { status: 500 });
  }
}

/**
 * GET /api/stripe/reconcile
 *
 * Check reconciliation status without modifying anything.
 */
export async function GET() {
  try {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = user?.emailAddresses?.[0]?.emailAddress;
    const stripeClient = getStripe();
    const redisClient = getRedis();

    // Get profile
    const profileRaw = await redisClient.get(`user:${userId}:profile`);
    const profile = profileRaw ? (typeof profileRaw === 'string' ? JSON.parse(profileRaw) : profileRaw) : null;
    const stripeCustomerId = profile?.stripeCustomerId;

    // Get current entitlements
    const tierRaw = await redisClient.get(`user:${userId}:tier`);
    const tierData = tierRaw ? (typeof tierRaw === 'string' ? JSON.parse(tierRaw) : tierRaw) : null;

    // Check Stripe sessions if we have a customer
    let stripeSessions = [];
    if (stripeCustomerId) {
      try {
        const sessions = await stripeClient.checkout.sessions.list({
          customer: stripeCustomerId,
          limit: 10,
        });
        stripeSessions = sessions.data.map(s => ({
          id: s.id,
          paymentStatus: s.payment_status,
          amount: s.amount_total,
          created: new Date(s.created * 1000).toISOString(),
          clientReferenceId: s.client_reference_id,
          metadataUserId: s.metadata?.userId || s.metadata?.clerkUserId,
        }));
      } catch (e) {
        console.error('[RECONCILE] Error fetching sessions:', e.message);
      }
    }

    const needsReconciliation =
      stripeSessions.some(s => s.paymentStatus === 'paid') &&
      (!tierData || tierData.tier === 'free');

    return NextResponse.json({
      userId,
      email: userEmail,
      stripeCustomerId: stripeCustomerId || null,
      currentTier: tierData?.tier || 'free',
      hasEntitlements: !!(tierData && tierData.tier !== 'free'),
      needsReconciliation,
      stripeSessions,
      instruction: needsReconciliation
        ? 'Call POST /api/stripe/reconcile to fix your entitlements'
        : 'No reconciliation needed',
    });

  } catch (error) {
    console.error('[RECONCILE] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
