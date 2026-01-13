import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

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

// Updated tier features to match new pricing structure
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

// ===========================================
// IDEMPOTENCY & LOOKUP HELPERS
// ===========================================

const IDEMPOTENCY_TTL_SECONDS = 90 * 24 * 60 * 60; // 90 days

async function isEventProcessed(redisClient, eventId) {
  const key = `stripe:event:${eventId}`;
  const exists = await redisClient.get(key);
  return !!exists;
}

async function markEventProcessed(redisClient, eventId, eventType) {
  const key = `stripe:event:${eventId}`;
  await redisClient.set(key, JSON.stringify({
    processedAt: new Date().toISOString(),
    eventType: eventType,
  }), { ex: IDEMPOTENCY_TTL_SECONDS });
}

// ===========================================
// REVERSE MAPPING: Store all Stripe ID → userId lookups
// ===========================================

async function storeReverseMappings(redisClient, { sessionId, paymentIntentId, chargeId, customerId, userId }) {
  const mappings = [
    sessionId && [`stripe:session:${sessionId}:user`, userId],
    paymentIntentId && [`stripe:pi:${paymentIntentId}:user`, userId],
    chargeId && [`stripe:charge:${chargeId}:user`, userId],
    customerId && [`stripe:customer:${customerId}:user`, userId],
  ].filter(Boolean);

  for (const [key, value] of mappings) {
    await redisClient.set(key, value, { ex: IDEMPOTENCY_TTL_SECONDS });
  }
}

// Resolve userId from any Stripe ID using the mapping chain
async function resolveUserFromStripeIds(redisClient, stripeClient, { chargeId, paymentIntentId, customerId, sessionId }) {
  // 1. Try session ID first (most reliable)
  if (sessionId) {
    const userId = await redisClient.get(`stripe:session:${sessionId}:user`);
    if (userId) return userId;
  }

  // 2. Try payment intent
  if (paymentIntentId) {
    const userId = await redisClient.get(`stripe:pi:${paymentIntentId}:user`);
    if (userId) return userId;
  }

  // 3. Try charge ID
  if (chargeId) {
    const userId = await redisClient.get(`stripe:charge:${chargeId}:user`);
    if (userId) return userId;
    
    // If not found, fetch the charge to get payment_intent
    try {
      const charge = await stripeClient.charges.retrieve(chargeId);
      if (charge.payment_intent) {
        const piUserId = await redisClient.get(`stripe:pi:${charge.payment_intent}:user`);
        if (piUserId) return piUserId;
      }
    } catch (e) {
      console.error('Error fetching charge:', e);
    }
  }

  // 4. Try customer ID (least specific, but useful)
  if (customerId) {
    const userId = await redisClient.get(`stripe:customer:${customerId}:user`);
    if (userId) return userId;
  }

  return null;
}

// ===========================================
// PURCHASE RECORD STORAGE
// ===========================================

async function storePurchaseRecord(redisClient, sessionId, data) {
  const key = `stripe:purchase:${sessionId}`;
  await redisClient.set(key, JSON.stringify(data), { ex: IDEMPOTENCY_TTL_SECONDS });
}

async function getPurchaseRecord(redisClient, sessionId) {
  const key = `stripe:purchase:${sessionId}`;
  const record = await redisClient.get(key);
  return record ? (typeof record === 'string' ? JSON.parse(record) : record) : null;
}

// ===========================================
// GRANT IDEMPOTENCY: Check if already granted for this session
// ===========================================

async function isAlreadyGranted(redisClient, userId, sessionId) {
  const entitlement = await redisClient.get(`entitlement:${userId}`);
  if (!entitlement) return false;
  
  const data = typeof entitlement === 'string' ? JSON.parse(entitlement) : entitlement;
  return data.sessionId === sessionId;
}

async function markEntitlementGranted(redisClient, userId, tier, sessionId) {
  await redisClient.set(`entitlement:${userId}`, JSON.stringify({
    tier,
    sessionId,
    grantedAt: new Date().toISOString(),
  }), { ex: IDEMPOTENCY_TTL_SECONDS });
}

// ===========================================
// ACCESS CONTROL HELPERS
// ===========================================

async function freezeUserAccess(redisClient, userId, reason, eventId) {
  try {
    const existingTier = await redisClient.get(`user:${userId}:tier`);
    const tierData = existingTier 
      ? (typeof existingTier === 'string' ? JSON.parse(existingTier) : existingTier)
      : {};

    tierData.accessFrozen = true;
    tierData.frozenAt = new Date().toISOString();
    tierData.frozenReason = reason;
    tierData.frozenEventId = eventId;
    // Keep accessRevoked false - frozen is temporary pending dispute resolution

    await redisClient.set(`user:${userId}:tier`, JSON.stringify(tierData));

    // Audit log
    await addAuditEntry(redisClient, userId, {
      type: 'access_change',
      action: 'access_frozen',
      details: { reason, stripeEventId: eventId },
    });

    console.log(`[FROZEN] User ${userId} - Reason: ${reason}`);
    return true;
  } catch (e) {
    console.error('Error freezing user access:', e);
    return false;
  }
}

async function revokeUserAccess(redisClient, userId, reason, eventId) {
  try {
    const existingTier = await redisClient.get(`user:${userId}:tier`);
    const tierData = existingTier 
      ? (typeof existingTier === 'string' ? JSON.parse(existingTier) : existingTier)
      : {};

    tierData.accessRevoked = true;
    tierData.accessFrozen = false; // Clear frozen state
    tierData.revokedAt = new Date().toISOString();
    tierData.revokedReason = reason;
    tierData.revokedEventId = eventId;

    await redisClient.set(`user:${userId}:tier`, JSON.stringify(tierData));

    // Audit log
    await addAuditEntry(redisClient, userId, {
      type: 'access_change',
      action: 'access_revoked',
      details: { reason, stripeEventId: eventId },
    });

    console.log(`[REVOKED] User ${userId} - Reason: ${reason}`);
    return true;
  } catch (e) {
    console.error('Error revoking user access:', e);
    return false;
  }
}

async function restoreUserAccess(redisClient, userId, reason, eventId) {
  try {
    const existingTier = await redisClient.get(`user:${userId}:tier`);
    const tierData = existingTier 
      ? (typeof existingTier === 'string' ? JSON.parse(existingTier) : existingTier)
      : {};

    tierData.accessRevoked = false;
    tierData.accessFrozen = false;
    tierData.restoredAt = new Date().toISOString();
    tierData.restoredReason = reason;
    tierData.restoredEventId = eventId;

    await redisClient.set(`user:${userId}:tier`, JSON.stringify(tierData));

    // Audit log
    await addAuditEntry(redisClient, userId, {
      type: 'access_change',
      action: 'access_restored',
      details: { reason, stripeEventId: eventId },
    });

    console.log(`[RESTORED] User ${userId} - Reason: ${reason}`);
    return true;
  } catch (e) {
    console.error('Error restoring user access:', e);
    return false;
  }
}

// Flag user for manual review (partial refunds, suspicious activity)
async function flagUserForReview(redisClient, userId, reason, eventId, metadata = {}) {
  try {
    const existingTier = await redisClient.get(`user:${userId}:tier`);
    const tierData = existingTier 
      ? (typeof existingTier === 'string' ? JSON.parse(existingTier) : existingTier)
      : {};

    tierData.flaggedForReview = true;
    tierData.flaggedAt = new Date().toISOString();
    tierData.flaggedReason = reason;
    tierData.flaggedEventId = eventId;
    tierData.flaggedMetadata = metadata;

    await redisClient.set(`user:${userId}:tier`, JSON.stringify(tierData));

    // Also add to a review queue for easy lookup
    await redisClient.lpush('review:queue', JSON.stringify({
      userId,
      reason,
      eventId,
      metadata,
      flaggedAt: new Date().toISOString(),
    }));

    // Audit log
    await addAuditEntry(redisClient, userId, {
      type: 'flag',
      action: 'flagged_for_review',
      details: { reason, stripeEventId: eventId, ...metadata },
    });

    console.log(`[FLAGGED] User ${userId} - Reason: ${reason}`);
    return true;
  } catch (e) {
    console.error('Error flagging user:', e);
    return false;
  }
}

async function addAuditEntry(redisClient, userId, entry) {
  const auditEntry = {
    id: `${entry.action}_${Date.now()}`,
    ...entry,
    timestamp: new Date().toISOString(),
  };

  const existingAudit = await redisClient.get(`user:${userId}:audit`);
  const auditLog = existingAudit 
    ? (typeof existingAudit === 'string' ? JSON.parse(existingAudit) : existingAudit)
    : [];
  auditLog.unshift(auditEntry);
  await redisClient.set(`user:${userId}:audit`, JSON.stringify(auditLog.slice(0, 1000)));
}

// ===========================================
// MAIN WEBHOOK HANDLER
// ===========================================

export async function POST(request) {
  const stripeClient = getStripe();
  const redisClient = getRedis();
  
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event;

  try {
    event = stripeClient.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Idempotency guard: Skip if already processed
  const alreadyProcessed = await isEventProcessed(redisClient, event.id);
  if (alreadyProcessed) {
    console.log(`Event ${event.id} already processed, skipping`);
    return NextResponse.json({ received: true, skipped: true });
  }

  // Mark as processed immediately to prevent race conditions
  await markEventProcessed(redisClient, event.id, event.type);

  try {
    switch (event.type) {
      // ============================================
      // PAYMENT SUCCESS - Grant access
      // ============================================
      case 'checkout.session.completed': {
        const session = event.data.object;
        
        // CRITICAL: Only grant access if payment is confirmed
        if (session.payment_status !== 'paid') {
          console.log(`Session ${session.id} not paid yet (status: ${session.payment_status}), skipping`);
          break;
        }
        
        const clerkUserId = session.metadata?.clerkUserId || session.client_reference_id;
        const productType = session.metadata?.productType;
        const productId = session.metadata?.productId;
        const isUpgrade = session.metadata?.isUpgrade === 'true';
        const upgradeFrom = session.metadata?.upgradeFrom;
        const disclaimerAccepted = session.metadata?.disclaimerAccepted === 'true';
        const disclaimerVersion = session.metadata?.disclaimerVersion;
        const disclaimerTimestamp = session.metadata?.disclaimerTimestamp;

        if (!clerkUserId) {
          console.error('Missing clerkUserId in checkout session');
          break;
        }

        // Store ALL reverse mappings for future event resolution
        await storeReverseMappings(redisClient, {
          sessionId: session.id,
          paymentIntentId: session.payment_intent,
          customerId: session.customer,
          userId: clerkUserId,
          // chargeId will be stored when we get charge events
        });

        // Store purchase record
        await storePurchaseRecord(redisClient, session.id, {
          userId: clerkUserId,
          customerId: session.customer,
          paymentIntentId: session.payment_intent,
          productType,
          productId,
          amountTotal: session.amount_total,
          disclaimerVersion,
          disclaimerTimestamp,
          processedAt: new Date().toISOString(),
        });

        if (productType === 'tier' && productId) {
          // GRANT IDEMPOTENCY: Check if already granted for this session
          const alreadyGranted = await isAlreadyGranted(redisClient, clerkUserId, session.id);
          if (alreadyGranted) {
            console.log(`[SKIP] Tier already granted for user ${clerkUserId}, session ${session.id}`);
            break;
          }

          const features = TIER_FEATURES[productId] || TIER_FEATURES.free;

          let existingData = {};
          try {
            const existing = await redisClient.get(`user:${clerkUserId}:tier`);
            if (existing) {
              existingData = typeof existing === 'string' ? JSON.parse(existing) : existing;
            }
          } catch (e) {
            console.error('Error parsing existing tier data:', e);
          }

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
            disclaimerAccepted: disclaimerAccepted,
            disclaimerVersion: disclaimerVersion,
            disclaimerTimestamp: disclaimerTimestamp,
            pdfAnalysesUsed: existingData.pdfAnalysesUsed || 0,
            pdfAnalysesRemaining: pdfAnalysesRemaining,
            aiCreditsUsed: existingData.aiCreditsUsed || 0,
            aiCreditsRemaining: features.aiChat ? -1 : 0,
            isUpgrade: isUpgrade,
            upgradedFrom: upgradeFrom || null,
            accessRevoked: false,
            accessFrozen: false,
            previousPurchases: [
              ...(existingData.previousPurchases || []),
              ...(isUpgrade ? [{
                tier: upgradeFrom,
                purchasedAt: existingData.purchasedAt,
                amountPaid: existingData.amountPaid,
              }] : []),
            ],
          };

          await redisClient.set(`user:${clerkUserId}:tier`, JSON.stringify(userTierData));

          // Mark entitlement as granted (for idempotency)
          await markEntitlementGranted(redisClient, clerkUserId, productId, session.id);

          // Update profile
          const existingProfile = await redisClient.get(`user:${clerkUserId}:profile`);
          const profile = existingProfile 
            ? (typeof existingProfile === 'string' ? JSON.parse(existingProfile) : existingProfile)
            : {};
          
          await redisClient.set(`user:${clerkUserId}:profile`, JSON.stringify({
            ...profile,
            tier: productId,
            tierPurchasedAt: new Date().toISOString(),
            stripeCustomerId: session.customer,
          }));

          // Audit log
          await addAuditEntry(redisClient, clerkUserId, {
            type: 'purchase',
            action: isUpgrade ? 'tier_upgrade' : 'tier_purchase',
            details: {
              tier: productId,
              amount: session.amount_total,
              isUpgrade,
              upgradeFrom,
              stripeEventId: event.id,
              stripeSessionId: session.id,
            },
          });

          console.log(`[PURCHASE] User ${clerkUserId} ${isUpgrade ? 'upgraded to' : 'purchased'} ${productId} tier`);
        }

        if (productType === 'addon' && productId) {
          const addonGrant = ADDON_GRANTS[productId];
          
          if (addonGrant) {
            const existingTier = await redisClient.get(`user:${clerkUserId}:tier`);
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
              stripeSessionId: session.id,
              amountPaid: session.amount_total,
            });

            await redisClient.set(`user:${clerkUserId}:tier`, JSON.stringify(tierData));

            await addAuditEntry(redisClient, clerkUserId, {
              type: 'purchase',
              action: 'addon_purchase',
              details: {
                addon: productId,
                amount: session.amount_total,
                stripeEventId: event.id,
              },
            });

            console.log(`[ADDON] User ${clerkUserId} purchased add-on: ${productId}`);
          }
        }

        break;
      }

      // ============================================
      // CHARGE CREATED - Store charge → user mapping
      // ============================================
      case 'charge.succeeded': {
        const charge = event.data.object;
        
        // Store charge ID mapping for future refund/dispute resolution
        const userId = await resolveUserFromStripeIds(redisClient, stripeClient, {
          paymentIntentId: charge.payment_intent,
          customerId: charge.customer,
        });
        
        if (userId) {
          await redisClient.set(`stripe:charge:${charge.id}:user`, userId, { ex: IDEMPOTENCY_TTL_SECONDS });
          console.log(`[CHARGE] Stored mapping: charge ${charge.id} → user ${userId}`);
        }
        
        break;
      }

      // ============================================
      // PAYMENT SUCCESS (alternate event)
      // ============================================
      case 'payment_intent.succeeded': {
        // We use checkout.session.completed as canonical event
        console.log(`[INFO] Payment succeeded: ${event.data.object.id}`);
        break;
      }

      // ============================================
      // PAYMENT FAILED
      // ============================================
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        console.log(`[FAILED] Payment failed: ${paymentIntent.id} - ${paymentIntent.last_payment_error?.message}`);
        break;
      }

      // ============================================
      // REFUND - Handle full vs partial differently
      // ============================================
      case 'charge.refunded': {
        const charge = event.data.object;
        const isFullRefund = charge.amount_refunded >= charge.amount;
        
        console.log(`[REFUND] Charge ${charge.id}, refunded: ${charge.amount_refunded}/${charge.amount}, full: ${isFullRefund}`);
        
        // Resolve user from our mappings
        const userId = await resolveUserFromStripeIds(redisClient, stripeClient, {
          chargeId: charge.id,
          paymentIntentId: charge.payment_intent,
          customerId: charge.customer,
        });
        
        if (!userId) {
          console.error(`[REFUND] Could not resolve userId for charge ${charge.id} - MANUAL REVIEW REQUIRED`);
          break;
        }
        
        if (isFullRefund) {
          // Full refund → REVOKE access
          await revokeUserAccess(redisClient, userId, 'full_refund', event.id);
        } else {
          // Partial refund → FLAG for manual review, don't change tier
          await flagUserForReview(redisClient, userId, 'partial_refund', event.id, {
            chargeId: charge.id,
            amountRefunded: charge.amount_refunded,
            amountTotal: charge.amount,
            refundPercentage: Math.round((charge.amount_refunded / charge.amount) * 100),
          });
        }
        
        break;
      }

      // ============================================
      // DISPUTE CREATED - FREEZE immediately
      // ============================================
      case 'charge.dispute.created': {
        const dispute = event.data.object;
        console.log(`[DISPUTE CREATED] Dispute ${dispute.id} on charge ${dispute.charge}, reason: ${dispute.reason}`);
        
        // Resolve user
        const userId = await resolveUserFromStripeIds(redisClient, stripeClient, {
          chargeId: dispute.charge,
        });
        
        if (userId) {
          // FREEZE access immediately (not revoke - pending resolution)
          await freezeUserAccess(redisClient, userId, `dispute_${dispute.reason}`, event.id);
        } else {
          console.error(`[DISPUTE] Could not resolve userId for charge ${dispute.charge} - MANUAL REVIEW REQUIRED`);
        }
        
        // Store dispute record
        await redisClient.set(`stripe:dispute:${dispute.id}`, JSON.stringify({
          disputeId: dispute.id,
          chargeId: dispute.charge,
          userId: userId || 'UNKNOWN',
          reason: dispute.reason,
          amount: dispute.amount,
          status: dispute.status,
          createdAt: new Date().toISOString(),
        }), { ex: IDEMPOTENCY_TTL_SECONDS });
        
        break;
      }

      // ============================================
      // DISPUTE FUNDS WITHDRAWN - Confirm revocation
      // ============================================
      case 'charge.dispute.funds_withdrawn': {
        const dispute = event.data.object;
        console.log(`[DISPUTE WITHDRAWN] Dispute ${dispute.id} - funds withdrawn`);
        
        // Funds taken = we're likely losing. Ensure frozen/revoked.
        const userId = await resolveUserFromStripeIds(redisClient, stripeClient, {
          chargeId: dispute.charge,
        });
        
        if (userId) {
          // Upgrade from frozen to revoked
          await revokeUserAccess(redisClient, userId, 'dispute_funds_withdrawn', event.id);
        }
        
        break;
      }

      // ============================================
      // DISPUTE CLOSED - Restore if won
      // ============================================
      case 'charge.dispute.closed': {
        const dispute = event.data.object;
        console.log(`[DISPUTE CLOSED] Dispute ${dispute.id} - status: ${dispute.status}`);
        
        const userId = await resolveUserFromStripeIds(redisClient, stripeClient, {
          chargeId: dispute.charge,
        });
        
        if (!userId) {
          console.error(`[DISPUTE CLOSED] Could not resolve userId for charge ${dispute.charge}`);
          break;
        }
        
        if (dispute.status === 'won') {
          // We won the dispute - RESTORE access
          await restoreUserAccess(redisClient, userId, 'dispute_won', event.id);
        } else if (dispute.status === 'lost') {
          // We lost - ensure access is revoked (not just frozen)
          await revokeUserAccess(redisClient, userId, 'dispute_lost', event.id);
        }
        // For 'warning_closed' or other statuses, leave as-is
        
        break;
      }

      // ============================================
      // UNHANDLED EVENTS
      // ============================================
      default:
        console.log(`[UNHANDLED] Event type: ${event.type}`);
    }
  } catch (processingError) {
    // Log error but still return 200 to prevent Stripe retries
    console.error('[ERROR] Processing webhook event:', processingError);
  }

  return NextResponse.json({ received: true });
}
