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
const FAILED_GRANT_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days for retry queue

async function isEventProcessed(redisClient, eventId) {
  const key = `stripe:event:${eventId}`;
  const exists = await redisClient.get(key);
  return !!exists;
}

async function markEventProcessed(redisClient, eventId, eventType, status = 'success') {
  const key = `stripe:event:${eventId}`;
  await redisClient.set(key, JSON.stringify({
    processedAt: new Date().toISOString(),
    eventType: eventType,
    status: status,
  }), { ex: IDEMPOTENCY_TTL_SECONDS });
}

// ===========================================
// FAILED GRANT RECOVERY SYSTEM
// ===========================================

/**
 * Record a failed entitlement grant for later retry
 * This ensures we never lose a paid purchase even if Redis/DB fails
 */
async function recordFailedGrant(redisClient, {
  eventId,
  eventType,
  userId,
  sessionId,
  productType,
  productId,
  amountTotal,
  error,
  rawEventData,
}) {
  const failedGrant = {
    eventId,
    eventType,
    userId,
    sessionId,
    productType,
    productId,
    amountTotal,
    error: error?.message || String(error),
    errorStack: error?.stack,
    failedAt: new Date().toISOString(),
    retryCount: 0,
    status: 'pending',
    rawEventData: JSON.stringify(rawEventData),
  };

  const key = `stripe:failed_grant:${eventId}`;

  try {
    // Store the failed grant
    await redisClient.set(key, JSON.stringify(failedGrant), { ex: FAILED_GRANT_TTL_SECONDS });

    // Add to failed grants queue for processing
    await redisClient.lpush('stripe:failed_grants_queue', eventId);

    // Also store by userId for easy lookup
    if (userId) {
      await redisClient.lpush(`stripe:failed_grants:user:${userId}`, eventId);
    }

    // Increment daily failure counter for observability
    const today = new Date().toISOString().slice(0, 10);
    const counterKey = `stripe:failed_grants:${today}`;
    await redisClient.incr(counterKey);
    await redisClient.expire(counterKey, 90 * 24 * 60 * 60); // 90 days TTL

    console.error(`[FAILED_GRANT] Recorded failed grant for event ${eventId}, user ${userId}, product ${productType}:${productId}`);

    return true;
  } catch (recordError) {
    // Last resort: log everything to console for manual recovery
    console.error('[CRITICAL] Failed to record failed grant:', {
      originalError: error?.message,
      recordError: recordError?.message,
      failedGrant,
    });
    return false;
  }
}

/**
 * Get failed grant record
 */
async function getFailedGrant(redisClient, eventId) {
  const key = `stripe:failed_grant:${eventId}`;
  const data = await redisClient.get(key);
  if (!data) return null;
  return typeof data === 'string' ? JSON.parse(data) : data;
}

/**
 * Mark a failed grant as resolved
 */
async function markFailedGrantResolved(redisClient, eventId, resolution) {
  const key = `stripe:failed_grant:${eventId}`;
  const existing = await getFailedGrant(redisClient, eventId);
  if (!existing) return false;

  existing.status = 'resolved';
  existing.resolvedAt = new Date().toISOString();
  existing.resolution = resolution;

  await redisClient.set(key, JSON.stringify(existing), { ex: FAILED_GRANT_TTL_SECONDS });

  // Remove from queue
  await redisClient.lrem('stripe:failed_grants_queue', 0, eventId);

  console.log(`[FAILED_GRANT] Marked ${eventId} as resolved: ${resolution}`);
  return true;
}

/**
 * Update retry count for a failed grant
 */
async function incrementFailedGrantRetry(redisClient, eventId) {
  const existing = await getFailedGrant(redisClient, eventId);
  if (!existing) return null;

  existing.retryCount = (existing.retryCount || 0) + 1;
  existing.lastRetryAt = new Date().toISOString();

  const key = `stripe:failed_grant:${eventId}`;
  await redisClient.set(key, JSON.stringify(existing), { ex: FAILED_GRANT_TTL_SECONDS });

  return existing;
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

        console.log(`[WEBHOOK] checkout.session.completed - Session: ${session.id}, Status: ${session.payment_status}`);
        console.log(`[WEBHOOK] Session metadata:`, JSON.stringify(session.metadata, null, 2));

        // CRITICAL: Only grant access if payment is confirmed
        if (session.payment_status !== 'paid') {
          console.log(`[WEBHOOK] Session ${session.id} not paid yet (status: ${session.payment_status}), skipping entitlement grant`);
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

        console.log(`[WEBHOOK] Processing: User=${clerkUserId}, Type=${productType}, Product=${productId}, Upgrade=${isUpgrade}`);

        if (!clerkUserId) {
          console.error('[WEBHOOK] CRITICAL: Missing clerkUserId in checkout session metadata');
          console.error('[WEBHOOK] Session details:', { id: session.id, metadata: session.metadata, client_reference_id: session.client_reference_id });
          // Record this as a failed grant - we have payment but can't identify user
          await recordFailedGrant(redisClient, {
            eventId: event.id,
            eventType: event.type,
            userId: null,
            sessionId: session.id,
            productType,
            productId,
            amountTotal: session.amount_total,
            error: new Error('Missing clerkUserId in checkout session metadata'),
            rawEventData: event.data.object,
          });
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

        // Store purchase record (this is critical - do first)
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

        // Process tier purchase with error recovery
        if (productType === 'tier' && productId) {
          try {
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

            // CRITICAL: Grant the tier entitlement
            console.log(`[WEBHOOK] Granting tier entitlement to user ${clerkUserId}:`, { tier: productId, features: Object.keys(features) });
            await redisClient.set(`user:${clerkUserId}:tier`, JSON.stringify(userTierData));
            console.log(`[WEBHOOK] Successfully stored tier data for user ${clerkUserId}`);

            // Mark entitlement as granted (for idempotency)
            await markEntitlementGranted(redisClient, clerkUserId, productId, session.id);
            console.log(`[WEBHOOK] Marked entitlement as granted for user ${clerkUserId}, session ${session.id}`);

            // Update profile (non-critical, but try)
            try {
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
            } catch (profileError) {
              console.error('Non-critical: Failed to update profile:', profileError);
            }

            // Audit log (non-critical)
            try {
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
            } catch (auditError) {
              console.error('Non-critical: Failed to add audit entry:', auditError);
            }

            console.log(`[WEBHOOK] SUCCESS: User ${clerkUserId} ${isUpgrade ? 'upgraded to' : 'purchased'} ${productId} tier`);
            console.log(`[WEBHOOK] Entitlement grant complete. User should now have access to ${productId} features.`);

          } catch (grantError) {
            // CRITICAL: Grant failed - record for retry
            console.error(`[WEBHOOK] GRANT_FAILED: Tier grant failed for user ${clerkUserId}:`, grantError);
            console.error(`[WEBHOOK] Grant error stack:`, grantError.stack);
            await recordFailedGrant(redisClient, {
              eventId: event.id,
              eventType: event.type,
              userId: clerkUserId,
              sessionId: session.id,
              productType,
              productId,
              amountTotal: session.amount_total,
              error: grantError,
              rawEventData: event.data.object,
            });
            // Update event status to failed
            await markEventProcessed(redisClient, event.id, event.type, 'grant_failed');
          }
        }

        // Process addon purchase with error recovery
        if (productType === 'addon' && productId) {
          try {
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

              // Audit log (non-critical)
              try {
                await addAuditEntry(redisClient, clerkUserId, {
                  type: 'purchase',
                  action: 'addon_purchase',
                  details: {
                    addon: productId,
                    amount: session.amount_total,
                    stripeEventId: event.id,
                  },
                });
              } catch (auditError) {
                console.error('Non-critical: Failed to add addon audit entry:', auditError);
              }

              console.log(`[ADDON] User ${clerkUserId} purchased add-on: ${productId}`);
            }
          } catch (addonError) {
            // CRITICAL: Addon grant failed - record for retry
            console.error(`[GRANT_FAILED] Addon grant failed for user ${clerkUserId}:`, addonError);
            await recordFailedGrant(redisClient, {
              eventId: event.id,
              eventType: event.type,
              userId: clerkUserId,
              sessionId: session.id,
              productType,
              productId,
              amountTotal: session.amount_total,
              error: addonError,
              rawEventData: event.data.object,
            });
            // Update event status to failed
            await markEventProcessed(redisClient, event.id, event.type, 'grant_failed');
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
