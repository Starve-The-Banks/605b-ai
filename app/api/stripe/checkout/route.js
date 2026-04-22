import { randomUUID } from 'crypto';

import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { stripeCheckoutSchema, validateBody } from '@/lib/validation';
import { getStripe, getStripePriceId } from '@/lib/stripe';
import { getRedis } from '@/lib/redis';

// Seconds a cached checkout-session URL stays valid in Redis. Stripe session
// URLs are valid for 24h; 15 min is a conservative window that covers every
// realistic retry pattern (double-click, back-button) while still forcing a
// fresh session if the user walks away and comes back much later.
const CHECKOUT_URL_CACHE_TTL_SEC = 15 * 60;

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
    priceId: getStripePriceId('STRIPE_TOOLKIT_PRICE_ID'),
    amount: 3900,  // $39.00 in cents
    name: 'Dispute Toolkit',
    features: ['Full analysis export', 'Core bureau templates', 'Dispute tracker'],
  },
  advanced: {
    priceId: getStripePriceId('STRIPE_ADVANCED_PRICE_ID'),
    amount: 8900,  // $89.00 in cents
    name: 'Advanced Dispute Suite',
    features: ['Full template library (62)', 'Creditor templates', 'AI Strategist', 'CFPB/FTC generators'],
  },
  'identity-theft': {
    priceId: getStripePriceId('STRIPE_IDENTITY_THEFT_PRICE_ID'),
    amount: 17900,  // $179.00 in cents
    name: '605B Identity Theft Toolkit',
    features: ['605B workflows', 'FTC integration', 'Fraud affidavits', 'Attorney-ready docs'],
  },
};

const ADDON_CONFIG = {
  'extra-analysis': {
    priceId: getStripePriceId('STRIPE_EXTRA_ANALYSIS_PRICE_ID'),
    amount: 700,
    name: 'Additional Report Analysis',
  },
  'ai-credits': {
    priceId: getStripePriceId('STRIPE_AI_CREDITS_PRICE_ID'),
    amount: 1000,
    name: 'AI Strategist Credits',
  },
  'attorney-export': {
    priceId: getStripePriceId('STRIPE_ATTORNEY_EXPORT_PRICE_ID'),
    amount: 3900,
    name: 'Attorney Export Pack',
  },
};

// Standalone products (no auth required)
const STANDALONE_PRODUCT_CONFIG = {
  'identity_theft_packet': {
    priceId: getStripePriceId('STRIPE_IDENTITY_THEFT_PACKET_PRICE_ID'),
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

    const { tierId, addonId, disclaimerAccepted, disclaimerTimestamp, intentId: clientIntentId } = data;

    // Client-owned intent UUID is the sole source of idempotency. If the
    // client didn't send one (old bundle during a rolling deploy), we mint a
    // server-side UUID so the request still succeeds — but that single
    // request loses retry-dedup protection. We log it for visibility.
    let intentId = clientIntentId;
    if (!intentId) {
      intentId = randomUUID();
      console.warn(
        `[CHECKOUT COMPAT] Missing intentId from client for user ${userId} (${tierId || addonId}); generated server-side UUID ${intentId}. Client should upgrade to send intentId.`
      );
    }

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
    const userEmail = user?.emailAddresses?.[0]?.emailAddress || '';

    if (addonId) {
      const addon = ADDON_CONFIG[addonId];

      if (!addon || !addon.priceId) {
        console.error(`[CONFIG ERROR] Missing priceId for addon: ${addonId}`);
        return NextResponse.json({
          error: 'This add-on is temporarily unavailable. Please try again later.'
        }, { status: 503 });
      }

      const { url, reused } = await createOrReuseCheckoutSession(stripeClient, redisClient, {
        customerId,
        userId,
        userEmail,
        priceId: addon.priceId,
        productName: addon.name,
        productType: 'addon',
        productId: addonId,
        disclaimerTimestamp,
        intentId,
      });

      return NextResponse.json({ success: true, url, reused });
    }

    if (tierId) {
      if (tierId === 'free') {
        return NextResponse.json({ 
          redirect: '/dashboard',
          tier: 'free',
        });
      }

      const tier = TIER_CONFIG[tierId];

      if (!tier || !tier.priceId) {
        console.error(`[CONFIG ERROR] Missing priceId for tier: ${tierId}`);
        return NextResponse.json({
          error: 'This tier is temporarily unavailable. Please try again later.'
        }, { status: 503 });
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

        // Create a one-time price for the upgrade amount.
        //
        // IDEMPOTENCY: Keyed on user + tier transition + exact amount. If a
        // client retries (network blip, double-submit) with the same intent,
        // Stripe returns the ORIGINAL price resource instead of minting a
        // duplicate. Keys are valid for 24h in Stripe.
        const upgradePriceIdempotencyKey =
          `upgrade-price:${userId}:${currentTier}->${tierId}:${amountToCharge}`;

        const upgradePrice = await stripeClient.prices.create(
          {
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
          },
          { idempotencyKey: upgradePriceIdempotencyKey },
        );

        priceId = upgradePrice.id;
      } else if (currentTier && currentTierIndex >= newTierIndex) {
        // Trying to buy same tier or downgrade
        return NextResponse.json({ 
          error: currentTierIndex === newTierIndex 
            ? 'You already own this tier' 
            : 'Cannot downgrade tiers'
        }, { status: 400 });
      }

      const { url, reused } = await createOrReuseCheckoutSession(stripeClient, redisClient, {
        customerId,
        userId,
        userEmail,
        priceId,
        productName: tier.name,
        productType: 'tier',
        productId: tierId,
        disclaimerTimestamp,
        isUpgrade,
        upgradeFrom,
        amountToCharge,
        intentId,
      });

      return NextResponse.json({ success: true, url, reused });
    }

    return NextResponse.json({ error: 'No product specified' }, { status: 400 });

  } catch (error) {
    // Log full error server-side for debugging; return user-safe message client-side
    console.error('[Stripe checkout] error:', error);

    // Stripe-specific errors have a .type; surface safe message only
    const isStripeError = error?.type?.startsWith?.('Stripe');
    const safeMessage = isStripeError
      ? 'We could not start checkout with our payment processor. Please try again.'
      : 'Unable to complete purchase. Please try again.';

    return NextResponse.json(
      { error: safeMessage },
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

// Create a Stripe Checkout Session, OR return the cached URL from a prior
// identical (userId, intentId) request. Three layers of duplicate protection:
//
//   1. Redis URL cache, keyed `checkout:{userId}:{intentId}` (TTL 15min) —
//      fastest path: on retry, skip Stripe entirely and return cached URL.
//   2. Stripe idempotency key `checkout-session:{userId}:{intentId}` —
//      if two parallel requests race past the cache, Stripe itself serializes
//      them and returns the SAME session to both.
//   3. Same idempotency pattern on the dynamic upgrade-price create call so
//      we never mint duplicate Prices for a retried upgrade.
//
// The intentId is client-owned (UUID generated on first click, reused across
// retries), so these keys are stable for the lifetime of a single purchase
// intent but unique across distinct intents.
async function createOrReuseCheckoutSession(
  stripeClient,
  redisClient,
  { customerId, userId, userEmail, priceId, productName, productType, productId, disclaimerTimestamp, isUpgrade, upgradeFrom, amountToCharge, intentId },
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl || !appUrl.startsWith('http')) {
    console.error('[CONFIG ERROR] NEXT_PUBLIC_APP_URL is not set or invalid:', appUrl);
    throw new Error('Checkout is temporarily unavailable. Please try again later.');
  }

  const cacheKey = `checkout:${userId}:${intentId}`;

  // Layer 1: Redis cache — cheapest retry path.
  try {
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      const cachedUrl = typeof cached === 'string' && cached.startsWith('{')
        ? (JSON.parse(cached).url || null)
        : cached;
      if (cachedUrl) {
        console.log(`[CHECKOUT] Reusing cached session for ${userId}/${intentId}`);
        return { url: cachedUrl, reused: true };
      }
    }
  } catch (err) {
    // Cache failures must NEVER block a real purchase. Log and fall through
    // to Stripe — layer 2 idempotency will still prevent duplicates.
    console.warn('[CHECKOUT] Redis read failed; proceeding without cache:', err?.message || err);
  }

  // Layer 2: Stripe idempotency key. Stable per (user, intent).
  const sessionIdempotencyKey = `checkout-session:${userId}:${intentId}`;

  const session = await stripeClient.checkout.sessions.create(
    {
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
      success_url: `${appUrl}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}&${productType}=${productId}${isUpgrade ? '&upgrade=true' : ''}`,
      cancel_url: `${appUrl}/pricing?canceled=true`,
      metadata: {
        clerkUserId: userId,
        userId: userId,
        userEmail: userEmail || '',
        productType: productType,
        productId: productId,
        disclaimerAccepted: 'true',
        disclaimerVersion: CURRENT_DISCLAIMER_VERSION,
        disclaimerTimestamp: disclaimerTimestamp || new Date().toISOString(),
        intentId: intentId,
        isUpgrade: isUpgrade ? 'true' : 'false',
        upgradeFrom: upgradeFrom || '',
        amountCharged: amountToCharge ? String(amountToCharge) : '',
        env: process.env.VERCEL_ENV || process.env.NODE_ENV || 'unknown',
        stripeMode: process.env.STRIPE_SECRET_KEY?.startsWith('sk_live') ? 'live' : 'test',
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
    },
    { idempotencyKey: sessionIdempotencyKey },
  );

  // Best-effort cache write. If Redis is down, Stripe idempotency still
  // protects us on the next retry.
  try {
    await redisClient.set(
      cacheKey,
      JSON.stringify({ url: session.url, sessionId: session.id }),
      { ex: CHECKOUT_URL_CACHE_TTL_SEC },
    );
  } catch (err) {
    console.warn('[CHECKOUT] Redis write failed; retries will fall through to Stripe:', err?.message || err);
  }

  console.log(
    `[CHECKOUT] Created session ${session.id} for ${userId}/${intentId} (${productType}:${productId}${isUpgrade ? `, upgrade from ${upgradeFrom}` : ''})`
  );

  return { url: session.url, reused: false };
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
