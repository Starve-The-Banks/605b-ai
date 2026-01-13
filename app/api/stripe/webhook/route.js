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

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      
      const clerkUserId = session.metadata?.clerkUserId;
      const productType = session.metadata?.productType;
      const productId = session.metadata?.productId;
      const isUpgrade = session.metadata?.isUpgrade === 'true';
      const upgradeFrom = session.metadata?.upgradeFrom;
      const disclaimerAccepted = session.metadata?.disclaimerAccepted === 'true';
      const disclaimerTimestamp = session.metadata?.disclaimerTimestamp;

      if (!clerkUserId) {
        console.error('Missing clerkUserId in checkout session');
        break;
      }

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
          disclaimerTimestamp: disclaimerTimestamp,
          pdfAnalysesUsed: existingData.pdfAnalysesUsed || 0,
          pdfAnalysesRemaining: pdfAnalysesRemaining,
          aiCreditsUsed: existingData.aiCreditsUsed || 0,
          aiCreditsRemaining: features.aiChat ? -1 : 0,
          isUpgrade: isUpgrade,
          upgradedFrom: upgradeFrom || null,
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

        const existingProfile = await redisClient.get(`user:${clerkUserId}:profile`);
        const profile = existingProfile 
          ? (typeof existingProfile === 'string' ? JSON.parse(existingProfile) : existingProfile)
          : {};
        
        await redisClient.set(`user:${clerkUserId}:profile`, JSON.stringify({
          ...profile,
          tier: productId,
          tierPurchasedAt: new Date().toISOString(),
        }));

        const auditEntry = {
          id: `purchase_${Date.now()}`,
          type: 'purchase',
          action: isUpgrade ? 'tier_upgrade' : 'tier_purchase',
          details: {
            tier: productId,
            amount: session.amount_total,
            isUpgrade: isUpgrade,
            upgradeFrom: upgradeFrom,
          },
          timestamp: new Date().toISOString(),
        };

        const existingAudit = await redisClient.get(`user:${clerkUserId}:audit`);
        const auditLog = existingAudit 
          ? (typeof existingAudit === 'string' ? JSON.parse(existingAudit) : existingAudit)
          : [];
        auditLog.unshift(auditEntry);
        await redisClient.set(`user:${clerkUserId}:audit`, JSON.stringify(auditLog.slice(0, 1000)));

        console.log(`User ${clerkUserId} ${isUpgrade ? 'upgraded to' : 'purchased'} ${productId} tier`);
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
            },
            timestamp: new Date().toISOString(),
          };

          const existingAudit = await redisClient.get(`user:${clerkUserId}:audit`);
          const auditLog = existingAudit 
            ? (typeof existingAudit === 'string' ? JSON.parse(existingAudit) : existingAudit)
            : [];
          auditLog.unshift(auditEntry);
          await redisClient.set(`user:${clerkUserId}:audit`, JSON.stringify(auditLog.slice(0, 1000)));

          console.log(`User ${clerkUserId} purchased add-on: ${productId}`);
        }
      }

      break;
    }

    case 'payment_intent.succeeded': {
      console.log('Payment succeeded:', event.data.object.id);
      break;
    }

    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object;
      console.log('Payment failed:', paymentIntent.id, paymentIntent.last_payment_error?.message);
      break;
    }

    case 'charge.refunded': {
      const charge = event.data.object;
      console.log('Charge refunded:', charge.id);
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
