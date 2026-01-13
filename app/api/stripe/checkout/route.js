import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

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

// Disclaimer text version - stored with each purchase for chargeback defense
const DISCLAIMER_TEXT_V1 = "I understand this is self-service software, not a credit repair service. 605b.ai does not send letters on my behalf, contact creditors or bureaus for me, or guarantee any outcome.";
const CURRENT_DISCLAIMER_VERSION = "v1";

// Tier configuration - matches pricing page exactly
// Server-side price mapping - client only sends tier ID, never amount
const TIER_CONFIG = {
  free: {
    name: 'Credit Report Analyzer',
    amount: 0,
    features: ['1 PDF analysis (read-only)', 'Issue categorization', 'Educational walkthrough'],
  },
  toolkit: {
    priceId: process.env.STRIPE_TOOLKIT_PRICE_ID,
    amount: 3900,
    name: 'Dispute Toolkit',
    features: ['Full analysis export', 'Core bureau templates', 'Dispute tracker'],
  },
  advanced: {
    priceId: process.env.STRIPE_ADVANCED_PRICE_ID,
    amount: 8900,
    name: 'Advanced Dispute Suite',
    features: ['Full template library (62)', 'Creditor templates', 'AI Strategist', 'CFPB/FTC generators'],
  },
  'identity-theft': {
    priceId: process.env.STRIPE_IDENTITY_THEFT_PRICE_ID,
    amount: 17900,
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

    const body = await request.json();
    const { tierId, addonId, disclaimerAccepted, disclaimerTimestamp, upgradeFrom } = body;

    // Validate tier/addon ID against allowlist (security: prevent injection)
    if (tierId && !VALID_TIER_IDS.includes(tierId)) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
    }
    if (addonId && !VALID_ADDON_IDS.includes(addonId)) {
      return NextResponse.json({ error: 'Invalid add-on' }, { status: 400 });
    }

    // Require disclaimer for paid products
    if ((tierId && tierId !== 'free') || addonId) {
      if (!disclaimerAccepted) {
        return NextResponse.json({ 
          error: 'Disclaimer acknowledgment required for purchase' 
        }, { status: 400 });
      }
    }

    // Get or create Stripe customer (with proper dedup)
    const customerId = await getOrCreateStripeCustomer(stripeClient, redisClient, user, userId);

    if (addonId) {
      const addon = ADDON_CONFIG[addonId];
      // Amount comes from server config, not client

      const session = await createCheckoutSession(stripeClient, {
        customerId,
        userId,
        product: addon,
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
      // Amount comes from server config, not client
      let finalAmount = tier.amount;
      let isUpgrade = false;
      
      if (upgradeFrom && TIER_CONFIG[upgradeFrom]) {
        const currentTierIndex = TIER_ORDER.indexOf(upgradeFrom);
        const newTierIndex = TIER_ORDER.indexOf(tierId);
        
        if (newTierIndex > currentTierIndex) {
          finalAmount = tier.amount - TIER_CONFIG[upgradeFrom].amount;
          isUpgrade = true;
        } else {
          return NextResponse.json({ 
            error: 'Cannot downgrade tiers' 
          }, { status: 400 });
        }
      }

      const session = await createCheckoutSession(stripeClient, {
        customerId,
        userId,
        product: { ...tier, amount: finalAmount },
        productType: 'tier',
        productId: tierId,
        disclaimerTimestamp,
        isUpgrade,
        upgradeFrom,
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

async function createCheckoutSession(stripeClient, { customerId, userId, product, productType, productId, disclaimerTimestamp, isUpgrade, upgradeFrom }) {
  let productName = `605b.ai ${product.name}`;
  let productDescription = `One-time software license`;
  
  if (isUpgrade) {
    productName = `605b.ai ${product.name} (Upgrade)`;
    productDescription = `Upgrade from ${TIER_CONFIG[upgradeFrom]?.name || upgradeFrom}`;
  }

  const session = await stripeClient.checkout.sessions.create({
    customer: customerId,
    client_reference_id: userId,
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: productName,
            description: productDescription,
          },
          unit_amount: product.amount,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true&${productType}=${productId}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
    metadata: {
      clerkUserId: userId,
      productType: productType,
      productId: productId,
      // Store disclaimer acceptance with text version for chargeback defense
      disclaimerAccepted: 'true',
      disclaimerVersion: CURRENT_DISCLAIMER_VERSION,
      disclaimerText: DISCLAIMER_TEXT_V1,
      disclaimerTimestamp: disclaimerTimestamp || new Date().toISOString(),
      isUpgrade: isUpgrade ? 'true' : 'false',
      upgradeFrom: upgradeFrom || '',
    },
    invoice_creation: {
      enabled: true,
    },
    allow_promotion_codes: true,
    custom_text: {
      submit: {
        message: 'By completing this purchase, you acknowledge that 605b.ai provides self-service software tools only and does not perform credit repair services on your behalf.',
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

    return NextResponse.json({
      tiers: Object.entries(TIER_CONFIG).map(([id, config]) => ({
        id,
        name: config.name,
        amount: config.amount,
        features: config.features,
      })),
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
