import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { Redis } from '@upstash/redis';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const redis = Redis.fromEnv();

// Updated tier features to match new pricing structure
const TIER_FEATURES = {
  free: {
    pdfAnalyses: 1,
    pdfExport: false,
    templates: 'none', // No downloads
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
    templates: 'basic', // Core bureau templates
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
    templates: 'full', // All 62 templates
    aiChat: true,
    auditExport: true,
    identityTheftWorkflow: false,
    creditorTemplates: true,
    escalationTemplates: true,
    disputeTracker: true,
  },
  'identity-theft': {
    pdfAnalyses: -1, // Unlimited
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

// Add-on features
const ADDON_GRANTS = {
  'extra-analysis': {
    type: 'increment',
    field: 'pdfAnalysesRemaining',
    amount: 1,
  },
  'ai-credits': {
    type: 'increment',
    field: 'aiCreditsRemaining',
    amount: 50, // Number of messages
  },
  'attorney-export': {
    type: 'unlock',
    field: 'attorneyExport',
    value: true,
  },
};

export async function POST(request) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      
      // Get metadata
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

      // Handle tier purchase
      if (productType === 'tier' && productId) {
        const features = TIER_FEATURES[productId] || TIER_FEATURES.free;

        // Get existing tier data to preserve usage stats if upgrading
        let existingData = {};
        try {
          const existing = await redis.get(`user:${clerkUserId}:tier`);
          if (existing) {
            existingData = typeof existing === 'string' ? JSON.parse(existing) : existing;
          }
        } catch (e) {
          console.error('Error parsing existing tier data:', e);
        }

        // Calculate remaining analyses
        let pdfAnalysesRemaining = features.pdfAnalyses;
        if (isUpgrade && existingData.pdfAnalysesUsed) {
          // Keep track of used analyses but add new tier's allowance
          const previousAllowance = TIER_FEATURES[upgradeFrom]?.pdfAnalyses || 0;
          const used = existingData.pdfAnalysesUsed || 0;
          
          // If upgrading to unlimited, set to -1
          if (features.pdfAnalyses === -1) {
            pdfAnalysesRemaining = -1;
          } else {
            // Add the difference in allowances
            pdfAnalysesRemaining = features.pdfAnalyses - used;
            if (pdfAnalysesRemaining < 0) pdfAnalysesRemaining = 0;
          }
        }

        // Store the user's tier and features
        const userTierData = {
          tier: productId,
          features: features,
          purchasedAt: new Date().toISOString(),
          stripeSessionId: session.id,
          stripeCustomerId: session.customer,
          amountPaid: session.amount_total,
          // Compliance tracking
          disclaimerAccepted: disclaimerAccepted,
          disclaimerTimestamp: disclaimerTimestamp,
          // Usage tracking
          pdfAnalysesUsed: existingData.pdfAnalysesUsed || 0,
          pdfAnalysesRemaining: pdfAnalysesRemaining,
          aiCreditsUsed: existingData.aiCreditsUsed || 0,
          aiCreditsRemaining: features.aiChat ? -1 : 0, // Unlimited for paid tiers with AI
          // Upgrade tracking
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

        await redis.set(`user:${clerkUserId}:tier`, JSON.stringify(userTierData));

        // Update profile
        const existingProfile = await redis.get(`user:${clerkUserId}:profile`);
        const profile = existingProfile 
          ? (typeof existingProfile === 'string' ? JSON.parse(existingProfile) : existingProfile)
          : {};
        
        await redis.set(`user:${clerkUserId}:profile`, JSON.stringify({
          ...profile,
          tier: productId,
          tierPurchasedAt: new Date().toISOString(),
        }));

        // Log the purchase
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

        const existingAudit = await redis.get(`user:${clerkUserId}:audit`);
        const auditLog = existingAudit 
          ? (typeof existingAudit === 'string' ? JSON.parse(existingAudit) : existingAudit)
          : [];
        auditLog.unshift(auditEntry);
        await redis.set(`user:${clerkUserId}:audit`, JSON.stringify(auditLog.slice(0, 1000)));

        console.log(`User ${clerkUserId} ${isUpgrade ? 'upgraded to' : 'purchased'} ${productId} tier`);
      }

      // Handle add-on purchase
      if (productType === 'addon' && productId) {
        const addonGrant = ADDON_GRANTS[productId];
        
        if (addonGrant) {
          const existingTier = await redis.get(`user:${clerkUserId}:tier`);
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

          // Track add-on purchases
          tierData.addons = tierData.addons || [];
          tierData.addons.push({
            addonId: productId,
            purchasedAt: new Date().toISOString(),
            stripeSessionId: session.id,
            amountPaid: session.amount_total,
          });

          await redis.set(`user:${clerkUserId}:tier`, JSON.stringify(tierData));

          // Audit log
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

          const existingAudit = await redis.get(`user:${clerkUserId}:audit`);
          const auditLog = existingAudit 
            ? (typeof existingAudit === 'string' ? JSON.parse(existingAudit) : existingAudit)
            : [];
          auditLog.unshift(auditEntry);
          await redis.set(`user:${clerkUserId}:audit`, JSON.stringify(auditLog.slice(0, 1000)));

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
      // Handle refunds - potentially revoke access
      const charge = event.data.object;
      console.log('Charge refunded:', charge.id);
      // In production, you might want to downgrade the user's tier
      break;
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      // We don't use subscriptions, but log if one somehow gets created
      console.warn('Subscription event received (should not happen):', event.type);
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
