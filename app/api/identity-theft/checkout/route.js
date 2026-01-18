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

// Product configuration - NEVER accept priceId from client
const PRODUCT_CONFIG = {
  priceId: process.env.STRIPE_IDENTITY_THEFT_PACKET_PRICE_ID,
  name: 'Identity Theft Dispute Packet',
  amount: 4900, // $49.00 in cents
};

export async function POST(request) {
  try {
    const stripeClient = getStripe();
    const redisClient = getRedis();

    // Validate environment configuration
    if (!PRODUCT_CONFIG.priceId) {
      console.error('[CONFIG ERROR] STRIPE_IDENTITY_THEFT_PACKET_PRICE_ID not set');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl || !appUrl.startsWith('http')) {
      console.error('[CONFIG ERROR] NEXT_PUBLIC_APP_URL not set or invalid');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const body = await request.json();
    const { intakeToken } = body;

    if (!intakeToken) {
      return NextResponse.json({ error: 'Intake token required' }, { status: 400 });
    }

    // Verify intake token exists and is valid
    const intakeData = await redisClient.get(`it:intake:${intakeToken}`);
    if (!intakeData) {
      return NextResponse.json({ error: 'Invalid or expired intake token' }, { status: 400 });
    }

    // Create Stripe Checkout Session
    // Note: We do NOT store sensitive data (SSN/DOB) in Stripe metadata
    const session = await stripeClient.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price: PRODUCT_CONFIG.priceId,
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/identity-theft/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/identity-theft?canceled=true`,
      metadata: {
        productType: 'identity_theft_packet',
        productId: 'identity_theft_packet',
        intakeToken: intakeToken, // We'll use this to retrieve form data after payment
        disclaimerVersion: 'v1',
      },
      invoice_creation: {
        enabled: true,
      },
      custom_text: {
        submit: {
          message: 'By completing this purchase, you acknowledge that 605b.ai provides self-service software tools only. You generate, review, and send all materials yourself. All sales are final.',
        },
      },
    });

    // Extend the intake token TTL to allow time for checkout completion
    // Extend to 24 hours from checkout creation
    await redisClient.expire(`it:intake:${intakeToken}`, 86400);

    return NextResponse.json({ url: session.url });

  } catch (error) {
    console.error('Identity theft checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
