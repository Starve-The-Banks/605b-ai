import * as Sentry from '@sentry/nextjs';
import { currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { tierPostSchema, validateBody } from '@/lib/validation';
import { isBetaUser, isReviewerRequest } from '@/lib/beta';
import { getStripe, getStripePriceId } from '@/lib/stripe';
import { getRedis } from '@/lib/redis';
import { authExpiredResponse, resolveApiAuth } from '@/lib/apiAuth';

const STRIPE_RECOVERY_BUDGET_MS = 10_000;

// Product ID to tier mapping
const PRICE_TO_TIER = {
  [getStripePriceId("STRIPE_TOOLKIT_PRICE_ID")]: 'toolkit',
  [getStripePriceId("STRIPE_ADVANCED_PRICE_ID")]: 'advanced',
  [getStripePriceId("STRIPE_IDENTITY_THEFT_PRICE_ID")]: 'identity-theft',
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

export async function GET(request) {
  const debugMode = request?.url ? new URL(request.url).searchParams.get('debug') === '1' : false;

  try {
    const { userId, authResult: authObj } = await resolveApiAuth(request, 'GET /api/user-data/tier');

    if (!userId) {
      if (debugMode) {
        return NextResponse.json({
          tierData: {
            tier: 'free',
            features: TIER_FEATURES.free,
            pdfAnalysesUsed: 0,
            pdfAnalysesRemaining: 1,
          },
          debug: { reason: 'not_authenticated', userId: null },
        });
      }
      return authExpiredResponse('AUTH_REQUIRED');
    }

    // Check for beta whitelist access (check ALL emails: primary + all from array + session)
    const user = await currentUser();
    const fromArray = (user?.emailAddresses ?? []).map(e => e?.emailAddress).filter(Boolean);
    const primary = user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.find(e => e.id === user.primaryEmailAddressId)?.emailAddress;
    const sessionEmail = authObj?.sessionClaims?.email || authObj?.sessionClaims?.primary_email;
    const allEmailsRaw = [primary, ...fromArray, sessionEmail].filter(Boolean);
    const allEmails = [...new Set(allEmailsRaw.map(e => String(e).trim().toLowerCase()))];
    const userEmail = primary || fromArray[0] || sessionEmail;
    const isReviewer = isReviewerRequest({ emails: allEmails });
    const isWhitelisted = !isReviewer && isBetaUser({ emails: allEmails, userId });

    // NOTE: allowlist contents are never returned to clients — internal data only.
    const debugPayload = debugMode ? {
      userId,
      isWhitelisted,
      isReviewer,
    } : undefined;

    console.log('[TIER] Check:', { userId, isWhitelisted, isReviewer });

    const redisClient = getRedis();

    // Reviewer policy: tier stays 'free' (paywall + pricing must be visible
    // for App Store IAP review), but every `features.*` flag is unlocked so
    // the mobile `canUse()` gates pass on all actions.
    if (isReviewer) {
      let pdfAnalysesUsed = 0;
      try {
        const existingRaw = await redisClient.get(`user:${userId}:tier`);
        if (existingRaw) {
          const existing = typeof existingRaw === 'string' ? JSON.parse(existingRaw) : existingRaw;
          pdfAnalysesUsed = existing.pdfAnalysesUsed || 0;
        }
      } catch (e) {
        console.warn('[TIER] Failed to read reviewer usage from Redis:', e?.message || e);
      }

      const payload = {
        tierData: {
          tier: 'free',
          features: {
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
          pdfAnalysesUsed,
          pdfAnalysesRemaining: -1,
          isReviewer: true,
          bypassPaywall: true,
        },
      };
      if (debugPayload) payload.debug = debugPayload;
      return NextResponse.json(payload);
    }

    if (isWhitelisted) {
      console.log('[TIER] ✓ Granting beta access to:', userEmail, '(matched one of', allEmails.length, 'emails)');

      // Read persisted usage from Redis so counts survive across requests
      let pdfAnalysesUsed = 0;
      try {
        const existingRaw = await redisClient.get(`user:${userId}:tier`);
        if (existingRaw) {
          const existing = typeof existingRaw === 'string' ? JSON.parse(existingRaw) : existingRaw;
          pdfAnalysesUsed = existing.pdfAnalysesUsed || 0;
        }
      } catch (e) {
        console.warn('[TIER] Failed to read beta usage from Redis:', e?.message || e);
      }

      const payload = {
        tierData: {
          tier: 'identity-theft',
          features: TIER_FEATURES['identity-theft'],
          pdfAnalysesUsed,
          pdfAnalysesRemaining: -1,
          isBeta: true,
        },
      };
      if (debugPayload) payload.debug = debugPayload;
      return NextResponse.json(payload);
    }

    const tierDataRaw = await redisClient.get(`user:${userId}:tier`);

    // If no tier data found, try to self-heal from Stripe (bounded time — never hang the client)
    if (!tierDataRaw) {
      console.log(`[TIER] No tier data found for user ${userId}, attempting self-heal from Stripe`);

      let recoveredTierData = null;
      try {
        recoveredTierData = await Promise.race([
          attemptStripeRecovery(redisClient, userId, userEmail),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('stripe_recovery_timeout')), STRIPE_RECOVERY_BUDGET_MS)
          ),
        ]);
      } catch (e) {
        console.warn('[TIER] Self-heal skipped or timed out:', e?.message || e);
      }

      if (recoveredTierData) {
        console.log(`[TIER] Self-heal successful for user ${userId}: ${recoveredTierData.tier}`);
        const payload = { tierData: recoveredTierData };
        if (debugPayload) payload.debug = debugPayload;
        return NextResponse.json(payload);
      }

      // Redis empty + no Stripe recovery — omit pdfAnalysesUsed so client keeps local count
      const freePayload = {
        tierData: {
          tier: 'free',
          features: TIER_FEATURES.free,
          pdfAnalysesRemaining: 1,
        },
      };
      if (debugPayload) freePayload.debug = debugPayload;
      return NextResponse.json(freePayload);
    }

    let tierData;
    try {
      tierData = typeof tierDataRaw === 'string' ? JSON.parse(tierDataRaw) : tierDataRaw;
    } catch (parseErr) {
      console.error('[TIER] Corrupt tier blob in Redis:', parseErr?.message || parseErr);
      const freePayload = {
        tierData: {
          tier: 'free',
          features: TIER_FEATURES.free,
          pdfAnalysesRemaining: 1,
        },
      };
      if (debugPayload) freePayload.debug = debugPayload;
      return NextResponse.json(freePayload);
    }

    // CRITICAL: Ensure highest tier has ALL features
    if (tierData.tier && TIER_FEATURES[tierData.tier]) {
      tierData.features = { ...TIER_FEATURES[tierData.tier], ...tierData.features };
    }

    const payload = { tierData };
    if (debugPayload) payload.debug = debugPayload;
    return NextResponse.json(payload);

  } catch (error) {
    Sentry.captureException(error, { tags: { route: 'api/user-data/tier', method: 'GET' } });
    console.error('Error fetching tier:', error?.stack || error);
    const fallback = {
      tierData: {
        tier: 'free',
        features: TIER_FEATURES.free,
        pdfAnalysesRemaining: 1,
      },
      degraded: true,
    };
    return NextResponse.json(fallback, { status: 200 });
  }
}

export async function POST(request) {
  try {
    const { userId } = await resolveApiAuth(request, 'POST /api/user-data/tier');

    if (!userId) {
      return authExpiredResponse('AUTH_REQUIRED');
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
    console.error('Error setting tier:', error?.stack || error);
    return NextResponse.json(
      {
        tierData: {
          tier: 'free',
          features: TIER_FEATURES.free,
          pdfAnalysesUsed: 0,
          pdfAnalysesRemaining: 1,
        },
        degraded: true,
      },
      { status: 200 }
    );
  }
}
