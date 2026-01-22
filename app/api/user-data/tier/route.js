import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { tierPostSchema, validateBody } from '@/lib/validation';
import { isBetaWhitelisted } from '@/lib/beta';

// Lazy initialization to avoid build-time errors
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

// Product ID to tier mapping
const PRICE_TO_TIER = {
  [process.env.STRIPE_TOOLKIT_PRICE_ID]: 'toolkit',
  [process.env.STRIPE_ADVANCED_PRICE_ID]: 'advanced',
  [process.env.STRIPE_IDENTITY_THEFT_PRICE_ID]: 'identity-theft',
};

/**
 * Self-heal: Attempt to recover entitlements from Stripe if missing
 * This ensures paid users are never stranded even if webhook failed
 */
async function attemptStripeRecovery(redisClient, userId, userEmail) {
  try {
    const stripeClient = getStripe();

    // First, check if we have a stored Stripe customer ID
    const profileRaw = await redisClient.get(`user:${userId}:profile`);
    const profile = profileRaw ? (typeof profileRaw === 'string' ? JSON.parse(profileRaw) : profileRaw) : null;
    const stripeCustomerId = profile?.stripeCustomerId;

    console.log(`[RECONCILE] Attempting recovery for user ${userId}, customer ${stripeCustomerId || 'none'}, email ${userEmail}`);

    let sessions = [];

    // Try to find checkout sessions by customer ID first
    if (stripeCustomerId) {
      try {
        const customerSessions = await stripeClient.checkout.sessions.list({
          customer: stripeCustomerId,
          limit: 20,
          expand: ['data.line_items'],
        });
        sessions = customerSessions.data;
        console.log(`[RECONCILE] Found ${sessions.length} sessions for customer ${stripeCustomerId}`);
      } catch (e) {
        console.error('[RECONCILE] Error fetching sessions by customer:', e.message);
      }
    }

    // If no sessions found by customer, try by email (slower but works for migration)
    if (sessions.length === 0 && userEmail) {
      try {
        // Search for customers by email
        const customers = await stripeClient.customers.list({
          email: userEmail,
          limit: 5,
        });

        for (const customer of customers.data) {
          const customerSessions = await stripeClient.checkout.sessions.list({
            customer: customer.id,
            limit: 20,
            expand: ['data.line_items'],
          });
          sessions = sessions.concat(customerSessions.data);

          // Store customer ID for future use
          if (!stripeCustomerId && customerSessions.data.length > 0) {
            await redisClient.set(`user:${userId}:profile`, JSON.stringify({
              ...profile,
              stripeCustomerId: customer.id,
            }));
          }
        }
        console.log(`[RECONCILE] Found ${sessions.length} sessions by email ${userEmail}`);
      } catch (e) {
        console.error('[RECONCILE] Error fetching sessions by email:', e.message);
      }
    }

    // Find the most recent PAID session with a tier product
    const paidSession = sessions
      .filter(s => s.payment_status === 'paid')
      .sort((a, b) => b.created - a.created)
      .find(s => {
        // Check metadata for productType = tier
        if (s.metadata?.productType === 'tier') return true;
        // Or check line items for known tier prices
        const lineItem = s.line_items?.data?.[0];
        if (lineItem?.price?.id && PRICE_TO_TIER[lineItem.price.id]) return true;
        return false;
      });

    if (!paidSession) {
      console.log(`[RECONCILE] No paid tier sessions found for user ${userId}`);
      return null;
    }

    console.log(`[RECONCILE] Found paid session ${paidSession.id} for user ${userId}`);

    // Determine the tier from metadata or line items
    let tier = paidSession.metadata?.productId;
    if (!tier) {
      const lineItem = paidSession.line_items?.data?.[0];
      tier = lineItem?.price?.id ? PRICE_TO_TIER[lineItem.price.id] : null;
    }

    if (!tier || !TIER_FEATURES[tier]) {
      console.log(`[RECONCILE] Could not determine tier from session ${paidSession.id}`);
      return null;
    }

    // Grant the entitlement
    const features = TIER_FEATURES[tier];
    const tierData = {
      tier: tier,
      features: features,
      purchasedAt: new Date(paidSession.created * 1000).toISOString(),
      stripeSessionId: paidSession.id,
      stripePaymentIntentId: paidSession.payment_intent,
      stripeCustomerId: paidSession.customer,
      amountPaid: paidSession.amount_total,
      pdfAnalysesUsed: 0,
      pdfAnalysesRemaining: features.pdfAnalyses,
      aiCreditsUsed: 0,
      aiCreditsRemaining: features.aiChat ? -1 : 0,
      accessRevoked: false,
      accessFrozen: false,
      reconciledAt: new Date().toISOString(),
      reconcileSource: 'stripe-recovery',
    };

    // Persist the entitlement
    await redisClient.set(`user:${userId}:tier`, JSON.stringify(tierData));

    // Also set idempotency key
    await redisClient.set(`stripe:grant:${userId}:${paidSession.id}`, JSON.stringify({
      productType: 'tier',
      productId: tier,
      grantedAt: new Date().toISOString(),
      grantSource: 'reconcile',
    }), { ex: 90 * 24 * 60 * 60 });

    // Audit log
    const existingAudit = await redisClient.get(`user:${userId}:audit`);
    const auditLog = existingAudit
      ? (typeof existingAudit === 'string' ? JSON.parse(existingAudit) : existingAudit)
      : [];
    auditLog.unshift({
      id: `reconcile_${Date.now()}`,
      type: 'entitlement',
      action: 'reconciled_from_stripe',
      details: {
        tier,
        sessionId: paidSession.id,
        amountPaid: paidSession.amount_total,
      },
      timestamp: new Date().toISOString(),
    });
    await redisClient.set(`user:${userId}:audit`, JSON.stringify(auditLog.slice(0, 1000)));

    console.log(`[RECONCILE] SUCCESS: Granted ${tier} to user ${userId} from session ${paidSession.id}`);

    return tierData;

  } catch (error) {
    console.error('[RECONCILE] Error during Stripe recovery:', error);
    return null;
  }
}

// Default tier features
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

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({
        tierData: {
          tier: 'free',
          features: TIER_FEATURES.free,
          pdfAnalysesUsed: 0,
          pdfAnalysesRemaining: 1,
        },
      });
    }

    // Check for beta whitelist access
    const user = await currentUser();
    const userEmail = user?.emailAddresses?.[0]?.emailAddress;

    if (isBetaWhitelisted(userEmail)) {
      return NextResponse.json({
        tierData: {
          tier: 'identity-theft',
          features: TIER_FEATURES['identity-theft'],
          pdfAnalysesUsed: 0,
          pdfAnalysesRemaining: -1, // Unlimited
          isBeta: true,
        },
      });
    }

    const redisClient = getRedis();
    const tierDataRaw = await redisClient.get(`user:${userId}:tier`);

    // If no tier data found, try to self-heal from Stripe
    if (!tierDataRaw) {
      console.log(`[TIER] No tier data found for user ${userId}, attempting self-heal from Stripe`);

      const recoveredTierData = await attemptStripeRecovery(redisClient, userId, userEmail);

      if (recoveredTierData) {
        console.log(`[TIER] Self-heal successful for user ${userId}: ${recoveredTierData.tier}`);
        return NextResponse.json({ tierData: recoveredTierData });
      }

      return NextResponse.json({
        tierData: {
          tier: 'free',
          features: TIER_FEATURES.free,
          pdfAnalysesUsed: 0,
          pdfAnalysesRemaining: 1,
        },
      });
    }

    const tierData = typeof tierDataRaw === 'string' ? JSON.parse(tierDataRaw) : tierDataRaw;

    // CRITICAL: Ensure highest tier has ALL features
    if (tierData.tier && TIER_FEATURES[tierData.tier]) {
      tierData.features = { ...TIER_FEATURES[tierData.tier], ...tierData.features };
    }

    return NextResponse.json({ tierData });

  } catch (error) {
    console.error('Error fetching tier:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tier data' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate request body with Zod
    const body = await request.json();
    const { data, error: validationError } = validateBody(tierPostSchema, body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const { tier } = data;

    if (tier !== 'free') {
      return NextResponse.json({ 
        error: 'Paid tiers can only be activated through purchase' 
      }, { status: 400 });
    }

    const redisClient = getRedis();
    const tierData = {
      tier: 'free',
      features: TIER_FEATURES.free,
      setAt: new Date().toISOString(),
      pdfAnalysesUsed: 0,
      pdfAnalysesRemaining: 1,
    };

    await redisClient.set(`user:${userId}:tier`, JSON.stringify(tierData));

    return NextResponse.json({ tierData });

  } catch (error) {
    console.error('Error setting tier:', error);
    return NextResponse.json(
      { error: 'Failed to set tier' },
      { status: 500 }
    );
  }
}
