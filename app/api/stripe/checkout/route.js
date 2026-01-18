import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { stripeCheckoutSchema, validateBody } from '@/lib/validation';

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

// Disclaimer versions - stored server-side, only version sent to Stripe
const DISCLAIMER_VERSIONS = {
  v1: {
    text: "I understand this is self-service software, not a credit repair service. 605b.ai does not send letters on my behalf, contact creditors or bureaus for me, or guarantee any outcome.",
    effectiveDate: "2026-01-13",
  },
};
const CURRENT_DISCLAIMER_VERSION = "v1";

// Tier configuration - priceId is source of truth for full purchase
// amount is used for upgrade calculations
const TIER_CONFIG = {
  free: {
    name: 'Credit Report Analyzer',
    amount: 0,
    features: ['1 PDF analysis (read-only)', 'Issue categorization', 'Educational walkthrough'],
  },
  toolkit: {
    priceId: process.env.STRIPE_TOOLKIT_PRICE_ID,
    amount: 3900,  // $39.00 in cents
    name: 'Dispute Toolkit',
    features: ['Full analysis export', 'Core bureau templates', 'Dispute tracker'],
  },
  advanced: {
    priceId: process.env.STRIPE_ADVANCED_PRICE_ID,
    amount: 8900,  // $89.00 in cents
    name: 'Advanced Dispute Suite',
    features: ['Full template library (62)', 'Creditor templates', 'AI Strategist', 'CFPB/FTC generators'],
  },
  'identity-theft': {
    priceId: process.env.STRIPE_IDENTITY_THEFT_PRICE_ID,
    amount: 17900,  // $179.00 in cents
    name: '605B Identity Theft Toolkit',
    features: ['605B workflows', 'FTC integration', 'Fraud affidavits', 'Attorney-ready docs'],
  },
};

const ADDON_CONFIG = {
  'extra-analysis': {
    priceId: process.env.STRIPE_EXTRA_ANALYSIS_PRICE_ID,
    amount: 700,
    name: 'Additional Report Analysis',
  },
  'ai-credits': {
    priceId: process.env.STRIPE_AI_CREDITS_PRICE_ID,
    amount: 1000,
    name: 'AI Strategist Credits',
  },
  'attorney-export': {
    priceId: process.env.STRIPE_ATTORNEY_EXPORT_PRICE_ID,
    amount: 3900,
    name: 'Attorney Export Pack',
  },
};

// Standalone products (no auth required)
const STANDALONE_PRODUCT_CONFIG = {
  'identity_theft_packet': {
    priceId: process.env.STRIPE_IDENTITY_THEFT_PACKET_PRICE_ID,
    amount: 4900, // $49.00
    name: 'Identity Theft Dispute Packet',
  },
};

// Allowlist of valid tier IDs - reject anything not in this list
const VALID_TIER_IDS = ['free', 'toolkit', 'advanced', 'identity-theft'];
const VALID_ADDON_IDS = ['extra-analysis', 'ai-credits', 'attorney-export'];
const TIER_ORDER = ['free', 'toolkit', 'advanced', 'identity-theft'];

export async function POST(request) {
  try {
    const stripeClient = getStripe();
    const redisClient = getRedis();
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate request body with Zod
    const body = await request.json();
    const { data, error: validationError } = validateBody(stripeCheckoutSchema, body);
    if (validationError) {
      console.log(`[ABUSE] Invalid checkout request from user ${userId}: ${validationError}`);
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const { tierId, addonId, disclaimerAccepted, disclaimerTimestamp } = data;

    // SERVER-SIDE ENFORCEMENT: Require disclaimer for paid products
    if ((tierId && tierId !== 'free') || addonId) {
      if (disclaimerAccepted !== true) {
        console.log(`[ABUSE] Checkout attempted without disclaimer: user ${userId}, tier ${tierId || addonId}`);
        return NextResponse.json({ 
          error: 'Disclaimer acknowledgment required for purchase' 
        }, { status: 400 });
      }
    }

    // Get or create Stripe customer (with proper dedup)
    const customerId = await getOrCreateStripeCustomer(stripeClient, redisClient, user, userId);

    if (addonId) {
      const addon = ADDON_CONFIG[addonId];
      
      if (!addon.priceId) {
        console.error(`Missing priceId for addon: ${addonId}`);
        return NextResponse.json({ error: 'Configuration error' }, { status: 500 });
      }

      const session = await createCheckoutSession(stripeClient, {
        customerId,
        userId,
        priceId: addon.priceId,
        productName: addon.name,
        productType: 'addon',
        productId: addonId,
        disclaimerTimestamp,
      });

      return NextResponse.json({ url: session.url });
    }

    if (tierId) {
      if (tierId === 'free') {
        return NextResponse.json({ 
          redirect: '/dashboard',
          tier: 'free',
        });
      }

      const tier = TIER_CONFIG[tierId];
      
      if (!tier.priceId) {
        console.error(`Missing priceId for tier: ${tierId}`);
        return NextResponse.json({ error: 'Configuration error' }, { status: 500 });
      }

      // Check if user has an existing tier (potential upgrade)
      const existingTierData = await getUserTierData(redisClient, userId);
      const currentTier = existingTierData?.tier;
      const currentTierIndex = currentTier ? TIER_ORDER.indexOf(currentTier) : -1;
      const newTierIndex = TIER_ORDER.indexOf(tierId);

      // Determine if this is an upgrade
      let isUpgrade = false;
      let upgradeFrom = null;
      let amountToCharge = tier.amount;
      let priceId = tier.priceId;

      if (currentTier && currentTierIndex >= 0 && currentTierIndex < newTierIndex) {
        // This is an upgrade!
        isUpgrade = true;
        upgradeFrom = currentTier;

        // Calculate the amount they've already paid
        const amountAlreadyPaid = existingTierData.amountPaid || TIER_CONFIG[currentTier]?.amount || 0;
        
        // Calculate the difference
        amountToCharge = tier.amount - amountAlreadyPaid;

        if (amountToCharge <= 0) {
          // Edge case: they've already paid enough (shouldn't happen normally)
          console.log(`[UPGRADE] User ${userId} has already paid ${amountAlreadyPaid}, new tier costs ${tier.amount}`);
          return NextResponse.json({ 
            error: 'You have already paid for this tier or higher' 
          }, { status: 400 });
        }

        console.log(`[UPGRADE] User ${userId}: ${currentTier} → ${tierId}, paid: ${amountAlreadyPaid}, difference: ${amountToCharge}`);

        // Create a one-time price for the upgrade amount
        const upgradePrice = await stripeClient.prices.create({
          currency: 'usd',
          unit_amount: amountToCharge,
          product_data: {
            name: `Upgrade: ${TIER_CONFIG[currentTier].name} → ${tier.name}`,
            metadata: {
              type: 'tier_upgrade',
              fromTier: currentTier,
              toTier: tierId,
              originalPrice: tier.amount,
              creditApplied: amountAlreadyPaid,
            },
          },
        });

        priceId = upgradePrice.id;
      } else if (currentTier && currentTierIndex >= newTierIndex) {
        // Trying to buy same tier or downgrade
        return NextResponse.json({ 
          error: currentTierIndex === newTierIndex 
            ? 'You already own this tier' 
            : 'Cannot downgrade tiers'
        }, { status: 400 });
      }

      const session = await createCheckoutSession(stripeClient, {
        customerId,
        userId,
        priceId,
        productName: tier.name,
        productType: 'tier',
        productId: tierId,
        disclaimerTimestamp,
        isUpgrade,
        upgradeFrom,
        amountToCharge,
      });

      return NextResponse.json({ url: session.url });
    }

    return NextResponse.json({ error: 'No product specified' }, { status: 400 });

  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

// Get user's current tier data from Redis
async function getUserTierData(redisClient, userId) {
  try {
    const tierData = await redisClient.get(`user:${userId}:tier`);
    if (!tierData) return null;
    return typeof tierData === 'string' ? JSON.parse(tierData) : tierData;
  } catch (e) {
    console.error('Error reading user tier data:', e);
    return null;
  }
}

// Customer deduplication: store stripeCustomerId on user, reuse forever
async function getOrCreateStripeCustomer(stripeClient, redisClient, user, userId) {
  const email = user.emailAddresses[0]?.emailAddress;
  
  // 1. First check if we have a stored stripeCustomerId for this user
  try {
    const userProfile = await redisClient.get(`user:${userId}:profile`);
    if (userProfile) {
      const profile = typeof userProfile === 'string' ? JSON.parse(userProfile) : userProfile;
      if (profile.stripeCustomerId) {
        // Verify customer still exists in Stripe
        try {
          const customer = await stripeClient.customers.retrieve(profile.stripeCustomerId);
          if (!customer.deleted) {
            return profile.stripeCustomerId;
          }
        } catch (e) {
          // Customer doesn't exist, continue to create new one
          console.log('Stored Stripe customer not found, creating new one');
        }
      }
    }
  } catch (e) {
    console.error('Error reading user profile:', e);
  }

  // 2. Fallback: search by email (for migrating existing customers)
  const existingCustomers = await stripeClient.customers.list({
    email: email,
    limit: 1,
  });

  let customerId;

  if (existingCustomers.data.length > 0) {
    customerId = existingCustomers.data[0].id;
  } else {
    // 3. Create new customer
    const customer = await stripeClient.customers.create({
      email: email,
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || undefined,
      metadata: {
        clerkUserId: userId,
      },
    });
    customerId = customer.id;
  }

  // 4. Store stripeCustomerId on user profile for future use
  try {
    const existingProfile = await redisClient.get(`user:${userId}:profile`);
    const profile = existingProfile 
      ? (typeof existingProfile === 'string' ? JSON.parse(existingProfile) : existingProfile)
      : {};
    
    await redisClient.set(`user:${userId}:profile`, JSON.stringify({
      ...profile,
      stripeCustomerId: customerId,
    }));
  } catch (e) {
    console.error('Error storing stripeCustomerId:', e);
  }

  return customerId;
}

async function createCheckoutSession(stripeClient, { customerId, userId, priceId, productName, productType, productId, disclaimerTimestamp, isUpgrade, upgradeFrom, amountToCharge }) {
  // CRITICAL: Validate APP_URL is set
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl || !appUrl.startsWith('http')) {
    console.error('[CONFIG ERROR] NEXT_PUBLIC_APP_URL is not set or invalid:', appUrl);
    throw new Error('Server configuration error: APP_URL not configured. Please contact support.');
  }

  // Use Stripe Price ID as source of truth
  const session = await stripeClient.checkout.sessions.create({
    customer: customerId,
    client_reference_id: userId,
    payment_method_types: ['card'],
    mode: 'payment',
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${appUrl}/dashboard?success=true&${productType}=${productId}${isUpgrade ? '&upgrade=true' : ''}`,
    cancel_url: `${appUrl}/pricing?canceled=true`,
    metadata: {
      clerkUserId: userId,
      productType: productType,
      productId: productId,
      disclaimerAccepted: 'true',
      disclaimerVersion: CURRENT_DISCLAIMER_VERSION,
      disclaimerTimestamp: disclaimerTimestamp || new Date().toISOString(),
      isUpgrade: isUpgrade ? 'true' : 'false',
      upgradeFrom: upgradeFrom || '',
      amountCharged: amountToCharge ? String(amountToCharge) : '',
    },
    invoice_creation: {
      enabled: true,
    },
    allow_promotion_codes: true,
    custom_text: {
      submit: {
        message: isUpgrade 
          ? `Upgrade from ${TIER_CONFIG[upgradeFrom]?.name || upgradeFrom} - you're only paying the difference!`
          : 'By completing this purchase, you acknowledge that 605b.ai provides self-service software tools only and does not perform credit repair services on your behalf.',
      },
    },
  });

  return session;
}

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const redisClient = getRedis();
    const userTierData = await getUserTierData(redisClient, userId);
    const currentTier = userTierData?.tier || 'free';
    const amountPaid = userTierData?.amountPaid || 0;

    // Calculate upgrade prices for each tier
    const tiersWithUpgradePricing = Object.entries(TIER_CONFIG).map(([id, config]) => {
      const currentIndex = TIER_ORDER.indexOf(currentTier);
      const tierIndex = TIER_ORDER.indexOf(id);
      
      let upgradePrice = null;
      let isUpgrade = false;
      
      if (tierIndex > currentIndex && id !== 'free') {
        isUpgrade = true;
        upgradePrice = config.amount - amountPaid;
        if (upgradePrice < 0) upgradePrice = 0;
      }

      return {
        id,
        name: config.name,
        amount: config.amount,
        features: config.features,
        isUpgrade,
        upgradePrice,
        isCurrentTier: id === currentTier,
        isOwned: tierIndex <= currentIndex && currentIndex > 0,
      };
    });

    return NextResponse.json({
      tiers: tiersWithUpgradePricing,
      currentTier,
      amountPaid,
      addons: Object.entries(ADDON_CONFIG).map(([id, config]) => ({
        id,
        name: config.name,
        amount: config.amount,
      })),
    });

  } catch (error) {
    console.error('Error fetching tier info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tier information' },
      { status: 500 }
    );
  }
}
