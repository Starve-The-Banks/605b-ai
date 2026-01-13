import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Tier configuration - matches pricing page exactly
// Product type: One-time | Tax category: Digital services/software
const TIER_CONFIG = {
  // FREE tier doesn't go through Stripe
  free: {
    name: 'Credit Report Analyzer',
    amount: 0,
    features: ['1 PDF analysis (read-only)', 'Issue categorization', 'Educational walkthrough'],
  },
  
  // Paid tiers
  toolkit: {
    priceId: process.env.STRIPE_TOOLKIT_PRICE_ID,
    amount: 3900, // $39.00
    name: 'Dispute Toolkit',
    features: ['Full analysis export', 'Core bureau templates', 'Dispute tracker'],
  },
  advanced: {
    priceId: process.env.STRIPE_ADVANCED_PRICE_ID,
    amount: 8900, // $89.00
    name: 'Advanced Dispute Suite',
    features: ['Full template library (62)', 'Creditor templates', 'AI Strategist', 'CFPB/FTC generators'],
  },
  'identity-theft': {
    priceId: process.env.STRIPE_IDENTITY_THEFT_PRICE_ID,
    amount: 17900, // $179.00
    name: '605B Identity Theft Toolkit',
    features: ['605B workflows', 'FTC integration', 'Fraud affidavits', 'Attorney-ready docs'],
  },
};

// Add-ons - also one-time payments
const ADDON_CONFIG = {
  'extra-analysis': {
    priceId: process.env.STRIPE_EXTRA_ANALYSIS_PRICE_ID,
    amount: 700, // $7.00
    name: 'Additional Report Analysis',
  },
  'ai-credits': {
    priceId: process.env.STRIPE_AI_CREDITS_PRICE_ID,
    amount: 1000, // $10.00
    name: 'AI Strategist Credits',
  },
  'attorney-export': {
    priceId: process.env.STRIPE_ATTORNEY_EXPORT_PRICE_ID,
    amount: 3900, // $39.00
    name: 'Attorney Export Pack',
  },
};

// Tier hierarchy for upgrades (pay difference)
const TIER_ORDER = ['free', 'toolkit', 'advanced', 'identity-theft'];

export async function POST(request) {
  try {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { tierId, addonId, disclaimerAccepted, disclaimerTimestamp, upgradeFrom } = body;

    // Validate disclaimer for paid purchases
    if ((tierId && tierId !== 'free') || addonId) {
      if (!disclaimerAccepted) {
        return NextResponse.json({ 
          error: 'Disclaimer acknowledgment required for purchase' 
        }, { status: 400 });
      }
    }

    // Handle add-on purchase
    if (addonId) {
      const addon = ADDON_CONFIG[addonId];
      if (!addon) {
        return NextResponse.json({ error: 'Invalid add-on' }, { status: 400 });
      }

      const session = await createCheckoutSession({
        user,
        userId,
        product: addon,
        productType: 'addon',
        productId: addonId,
        disclaimerTimestamp,
      });

      return NextResponse.json({ url: session.url });
    }

    // Handle tier purchase
    if (tierId) {
      // Free tier doesn't need Stripe
      if (tierId === 'free') {
        return NextResponse.json({ 
          redirect: '/dashboard',
          tier: 'free',
        });
      }

      const tier = TIER_CONFIG[tierId];
      if (!tier) {
        return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
      }

      // Calculate upgrade price if applicable
      let finalAmount = tier.amount;
      let isUpgrade = false;
      
      if (upgradeFrom && TIER_CONFIG[upgradeFrom]) {
        const currentTierIndex = TIER_ORDER.indexOf(upgradeFrom);
        const newTierIndex = TIER_ORDER.indexOf(tierId);
        
        if (newTierIndex > currentTierIndex) {
          // Valid upgrade - charge the difference
          finalAmount = tier.amount - TIER_CONFIG[upgradeFrom].amount;
          isUpgrade = true;
        } else {
          return NextResponse.json({ 
            error: 'Cannot downgrade tiers' 
          }, { status: 400 });
        }
      }

      const session = await createCheckoutSession({
        user,
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

async function createCheckoutSession({ user, userId, product, productType, productId, disclaimerTimestamp, isUpgrade, upgradeFrom }) {
  // Get or create Stripe customer
  let customerId;
  const email = user.emailAddresses[0]?.emailAddress;
  
  const existingCustomers = await stripe.customers.list({
    email: email,
    limit: 1,
  });

  if (existingCustomers.data.length > 0) {
    customerId = existingCustomers.data[0].id;
  } else {
    const customer = await stripe.customers.create({
      email: email,
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || undefined,
      metadata: {
        clerkUserId: userId,
      },
    });
    customerId = customer.id;
  }

  // Build product name with upgrade info if applicable
  let productName = `605b.ai ${product.name}`;
  let productDescription = `One-time software license`;
  
  if (isUpgrade) {
    productName = `605b.ai ${product.name} (Upgrade)`;
    productDescription = `Upgrade from ${TIER_CONFIG[upgradeFrom]?.name || upgradeFrom}`;
  }

  // Create checkout session - ONE-TIME PAYMENT ONLY
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
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
    mode: 'payment', // ONE-TIME, NOT SUBSCRIPTION
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true&${productType}=${productId}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
    metadata: {
      clerkUserId: userId,
      productType: productType,
      productId: productId,
      disclaimerAccepted: 'true',
      disclaimerTimestamp: disclaimerTimestamp || new Date().toISOString(),
      isUpgrade: isUpgrade ? 'true' : 'false',
      upgradeFrom: upgradeFrom || '',
    },
    // Generate invoice for records
    invoice_creation: {
      enabled: true,
    },
    // Allow promo codes
    allow_promotion_codes: true,
    // Custom text for legal compliance
    custom_text: {
      submit: {
        message: 'By completing this purchase, you acknowledge that 605b.ai provides self-service software tools only and does not perform credit repair services on your behalf.',
      },
    },
  });

  return session;
}

// GET handler to check user's current tier
export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // In production, you'd fetch this from your database
    // For now, return tier info structure
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
