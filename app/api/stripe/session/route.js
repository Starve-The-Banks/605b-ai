import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';

/**
 * GET /api/stripe/session?session_id=cs_xxx
 * Returns { value, currency } for a paid Checkout Session.
 * Used for Meta Pixel Purchase event (Stripe as source of truth).
 * Requires auth; session must belong to user and be paid/complete.
 */
export async function GET(request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');
    if (!sessionId) {
      return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });
    }

    if (!/^cs_[a-zA-Z0-9_]+$/.test(sessionId)) {
      return NextResponse.json({ error: 'Invalid session_id format' }, { status: 400 });
    }

    const stripeClient = getStripe();
    let session;
    try {
      session = await stripeClient.checkout.sessions.retrieve(sessionId);
    } catch (stripeError) {
      return NextResponse.json(
        { error: 'Session not found', details: stripeError.message },
        { status: 404 }
      );
    }

    const sessionUserId = session.metadata?.clerkUserId || session.client_reference_id;
    if (sessionUserId !== userId) {
      return NextResponse.json({ error: 'Session does not belong to this user' }, { status: 403 });
    }

    const isPaid = session.payment_status === 'paid';
    const isComplete = session.status === 'complete';
    if (!isPaid || !isComplete) {
      return NextResponse.json(
        { error: 'Payment not complete', payment_status: session.payment_status, status: session.status },
        { status: 402 }
      );
    }

    const amountTotal = session.amount_total ?? 0;
    const value = Math.round(amountTotal / 100);
    const currency = (session.currency || 'usd').toUpperCase();

    return NextResponse.json({ value, currency });
  } catch (error) {
    console.error('[stripe/session] Error:', error);
    return NextResponse.json({ error: 'Failed to retrieve session' }, { status: 500 });
  }
}
