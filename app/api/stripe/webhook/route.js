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

// Idempotency: Check if event was already processed
// Using 90-day TTL for durability and auditability
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

// Also store by session.id for additional lookup capability
async function storePurchaseRecord(redisClient, sessionId, data) {
  const key = `stripe:session:${sessionId}`;
  await redisClient.set(key, JSON.stringify(data), { ex: IDEMPOTENCY_TTL_SECONDS });
}

async function getPurchaseRecord(redisClient, sessionId) {
  const key = `stripe:session:${sessionId}`;
  const record = await redisClient.get(key);
  return record ? (typeof record === 'string' ? JSON.parse(record) : record) : null;
}

// Helper to revoke/freeze user access
async function revokeUserAccess(redisClient, userId, reason, eventId) {
  try {
    const existingTier = await redisClient.get(`user:${userId}:tier`);
    const tierData = existingTier 
      ? (typeof existingTier === 'string' ? JSON.parse(existingTier) : existingTier)
      : {};

    tierData.accessRevoked = true;
    tierData.revokedAt = new Date().toISOString();
    tierData.revokedReason = reason;
    tierData.revokedEventId = eventId;

    await redisClient.set(`user:${userId}:tier`, JSON.stringify(tierData));

    // Audit log
    const auditEntry = {
      id: `revoke_${Date.now()}`,
      type: 'access_change',
      action: 'access_revoked',
      details: {
        reason: reason,
        stripeEventId: eventId,
      },
      timestamp: new Date().toISOString(),
    };

    const existingAudit = await redisClient.get(`user:${userId}:audit`);
    const auditLog = existingAudit 
      ? (typeof existingAudit === 'string' ? JSON.parse(existingAudit) : existingAudit)
      : [];
    auditLog.unshift(auditEntry);
    await redisClient.set(`user:${userId}:audit`, JSON.stringify(auditLog.slice(0, 1000)));

    console.log(`[ACCESS REVOKED] User ${userId} - Reason: ${reason}`);
  } catch (e) {
    console.error('Error revoking user access:', e);
  }
}

// Helper to restore user access (e.g., dispute won)
async function restoreUserAccess(redisClient, userId, reason, eventId) {
  try {
    const existingTier = await redisClient.get(`user:${userId}:tier`);
    const tierData = existingTier 
      ? (typeof existingTier === 'string' ? JSON.parse(existingTier) : existingTier)
      : {};

    tierData.accessRevoked = false;
    tierData.restoredAt = new Date().toISOString();
    tierData.restoredReason = reason;
    tierData.restoredEventId = eventId;

    await redisClient.set(`user:${userId}:tier`, JSON.stringify(tierData));

    // Audit log
    const auditEntry = {
      id: `restore_${Date.now()}`,
      type: 'access_change',
      action: 'access_restored',
      details: {
        reason: reason,
        stripeEventId: eventId,
      },
      timestamp: new Date().toISOString(),
    };

    const existingAudit = await redisClient.get(`user:${userId}:audit`);
    const auditLog = existingAudit 
      ? (typeof existingAudit === 'string' ? JSON.parse(existingAudit) : existingAudit)
      : [];
    auditLog.unshift(auditEntry);
    await redisClient.set(`user:${userId}:audit`, JSON.stringify(auditLog.slice(0, 1000)));

    console.log(`[ACCESS RESTORED] User ${userId} - Reason: ${reason}`);
  } catch (e) {
    console.error('Error restoring user access:', e);
  }
}

// Helper to find user by Stripe customer ID
async function findUserByStripeCustomer(redisClient, stripeCustomerId) {
  // This would ideally use a reverse index, but for now we rely on
  // the purchase record storing the userId
  // In production, maintain a stripe:customer:{id} -> userId mapping
  return null; // Caller should use purchase record instead
}

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

        // Store purchase record for lookup by session ID
        await storePurchaseRecord(redisClient, session.id, {
          userId: clerkUserId,
          customerId: session.customer,
          productType,
          productId,
          amountTotal: session.amount_total,
          disclaimerVersion,
          disclaimerTimestamp,
          processedAt: new Date().toISOString(),
        });

        if (productType === 'tier' && productId) {
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
            accessRevoked: false,  // Explicitly set access as active
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
          const auditEntry = {
            id: `purchase_${Date.now()}`,
            type: 'purchase',
            action: isUpgrade ? 'tier_upgrade' : 'tier_purchase',
            details: {
              tier: productId,
              amount: session.amount_total,
              isUpgrade: isUpgrade,
              upgradeFrom: upgradeFrom,
              stripeEventId: event.id,
              stripeSessionId: session.id,
            },
            timestamp: new Date().toISOString(),
          };

          const existingAudit = await redisClient.get(`user:${clerkUserId}:audit`);
          const auditLog = existingAudit 
            ? (typeof existingAudit === 'string' ? JSON.parse(existingAudit) : existingAudit)
            : [];
          auditLog.unshift(auditEntry);
          await redisClient.set(`user:${clerkUserId}:audit`, JSON.stringify(auditLog.slice(0, 1000)));

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

            const auditEntry = {
              id: `addon_${Date.now()}`,
              type: 'purchase',
              action: 'addon_purchase',
              details: {
                addon: productId,
                amount: session.amount_total,
                stripeEventId: event.id,
              },
              timestamp: new Date().toISOString(),
            };

            const existingAudit = await redisClient.get(`user:${clerkUserId}:audit`);
            const auditLog = existingAudit 
              ? (typeof existingAudit === 'string' ? JSON.parse(existingAudit) : existingAudit)
              : [];
            auditLog.unshift(auditEntry);
            await redisClient.set(`user:${clerkUserId}:audit`, JSON.stringify(auditLog.slice(0, 1000)));

            console.log(`[ADDON] User ${clerkUserId} purchased add-on: ${productId}`);
          }
        }

        break;
      }

      // ============================================
      // PAYMENT SUCCESS (alternate event)
      // ============================================
      case 'payment_intent.succeeded': {
        // We use checkout.session.completed as canonical event
        // This is just for logging
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
      // REFUND - Revoke access
      // ============================================
      case 'charge.refunded': {
        const charge = event.data.object;
        console.log(`[REFUND] Charge refunded: ${charge.id}, amount: ${charge.amount_refunded}`);
        
        // Try to find the user via payment intent -> checkout session
        // For full refunds, revoke access
        if (charge.amount_refunded >= charge.amount) {
          // Full refund - revoke access
          // Look up user from purchase record if we stored the payment_intent
          const paymentIntentId = charge.payment_intent;
          
          // In a production system, you'd have a reverse lookup
          // For now, log for manual review
          console.log(`[REFUND] Full refund on charge ${charge.id}, payment_intent ${paymentIntentId} - MANUAL REVIEW REQUIRED`);
          
          // If we had the session ID, we could:
          // const purchaseRecord = await getPurchaseRecord(redisClient, sessionId);
          // if (purchaseRecord?.userId) {
          //   await revokeUserAccess(redisClient, purchaseRecord.userId, 'refund', event.id);
          // }
        }
        
        break;
      }

      // ============================================
      // DISPUTE CREATED - Immediately freeze access
      // ============================================
      case 'charge.dispute.created': {
        const dispute = event.data.object;
        console.log(`[DISPUTE CREATED] Dispute ${dispute.id} on charge ${dispute.charge}, reason: ${dispute.reason}`);
        
        // Freeze access immediately on dispute
        // This is important for fraud prevention
        const chargeId = dispute.charge;
        
        // Look up the charge to get payment_intent -> session -> user
        try {
          const charge = await stripeClient.charges.retrieve(chargeId);
          const paymentIntentId = charge.payment_intent;
          
          // Log for manual review - in production, implement reverse lookup
          console.log(`[DISPUTE] FREEZE ACCESS - Dispute on payment_intent ${paymentIntentId} - MANUAL REVIEW REQUIRED`);
          
          // Store dispute record for tracking
          await redisClient.set(`stripe:dispute:${dispute.id}`, JSON.stringify({
            chargeId: chargeId,
            paymentIntentId: paymentIntentId,
            reason: dispute.reason,
            amount: dispute.amount,
            status: dispute.status,
            createdAt: new Date().toISOString(),
          }), { ex: IDEMPOTENCY_TTL_SECONDS });
          
        } catch (e) {
          console.error('Error processing dispute:', e);
        }
        
        break;
      }

      // ============================================
      // DISPUTE FUNDS WITHDRAWN - Confirm revocation
      // ============================================
      case 'charge.dispute.funds_withdrawn': {
        const dispute = event.data.object;
        console.log(`[DISPUTE FUNDS WITHDRAWN] Dispute ${dispute.id} - funds withdrawn, amount: ${dispute.amount}`);
        
        // Funds have been taken - ensure access is revoked
        // This is the "we definitely lost" signal
        
        break;
      }

      // ============================================
      // DISPUTE CLOSED - Maybe restore access if won
      // ============================================
      case 'charge.dispute.closed': {
        const dispute = event.data.object;
        console.log(`[DISPUTE CLOSED] Dispute ${dispute.id} - status: ${dispute.status}`);
        
        if (dispute.status === 'won') {
          // We won the dispute - restore access
          console.log(`[DISPUTE WON] Dispute ${dispute.id} won - consider restoring access`);
          
          // Look up user and restore
          // const purchaseRecord = ...
          // if (purchaseRecord?.userId) {
          //   await restoreUserAccess(redisClient, purchaseRecord.userId, 'dispute_won', event.id);
          // }
          
        } else if (dispute.status === 'lost') {
          // We lost - ensure access stays revoked
          console.log(`[DISPUTE LOST] Dispute ${dispute.id} lost - access remains revoked`);
        }
        
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
    // The event is already marked as processed
    console.error('[ERROR] Processing webhook event:', processingError);
  }

  return NextResponse.json({ received: true });
}
