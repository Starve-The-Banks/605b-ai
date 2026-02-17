import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getRedis } from '@/lib/redis';
import { verifyAppleReceipt, verifyGoogleReceipt } from '@/lib/iap-verify';

/**
 * POST /api/mobile/iap/validate
 *
 * Validates an Apple IAP or Google Play Billing receipt with the
 * respective store's server, then grants tier entitlements.
 *
 * Request body:
 *   { platform: 'ios' | 'android', receiptData: string, productId: string, transactionId: string }
 *
 * Environment variables:
 *   APPLE_IAP_SHARED_SECRET      — from App Store Connect
 *   GOOGLE_SERVICE_ACCOUNT_JSON  — stringified service account key JSON
 *
 * If the env vars are not set, verification is skipped (dev/sandbox mode)
 * and a warning is logged. This allows TestFlight and internal testing
 * without blocking on store configuration.
 */

// Map product IDs to tier names
const PRODUCT_TO_TIER = {
  'com.creditclear.app.toolkit': 'toolkit',
  'com.creditclear.app.advanced': 'advanced',
  'com.creditclear.app.identity_theft': 'identity-theft',
};

// Tier feature definitions (must match lib/useUserTier.js)
const TIER_FEATURES = {
  toolkit: {
    pdfAnalyses: 1, pdfExport: true, letterDownloads: true,
    templates: 'basic', aiChat: false, auditExport: false,
    identityTheftWorkflow: false, creditorTemplates: false,
    escalationTemplates: false, disputeTracker: true,
  },
  advanced: {
    pdfAnalyses: 3, pdfExport: true, letterDownloads: true,
    templates: 'full', aiChat: true, auditExport: true,
    identityTheftWorkflow: false, creditorTemplates: true,
    escalationTemplates: true, disputeTracker: true,
  },
  'identity-theft': {
    pdfAnalyses: -1, pdfExport: true, letterDownloads: true,
    templates: 'full', aiChat: true, auditExport: true,
    identityTheftWorkflow: true, creditorTemplates: true,
    escalationTemplates: true, disputeTracker: true,
    attorneyExport: true,
  },
};

export async function POST(request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { platform, receiptData, productId, transactionId } = body;

    if (!platform || !receiptData || !productId || !transactionId) {
      return NextResponse.json(
        { error: 'Missing required fields: platform, receiptData, productId, transactionId' },
        { status: 400 }
      );
    }

    // Determine tier from product ID
    const tier = PRODUCT_TO_TIER[productId];
    if (!tier) {
      return NextResponse.json(
        { success: false, granted: false, error: `Unknown product ID: ${productId}` },
        { status: 400 }
      );
    }

    // Idempotency check (before verification to avoid double-charging)
    const redisClient = getRedis();
    const idempotencyKey = `idempo:iap:${transactionId}`;
    const existing = await redisClient.get(idempotencyKey);
    if (existing) {
      console.info(`[IAP Validate] Idempotent hit for txn=${transactionId}`);
      return NextResponse.json({
        success: true,
        granted: true,
        tier,
        tierData: existing,
        transactionId,
      });
    }

    // Server-side receipt verification
    console.info(`[IAP Validate] userId=${userId} platform=${platform} product=${productId} tier=${tier}`);

    let verification;
    if (platform === 'ios') {
      verification = await verifyAppleReceipt(receiptData, productId);
    } else if (platform === 'android') {
      verification = await verifyGoogleReceipt(receiptData, productId);
    } else {
      return NextResponse.json(
        { success: false, granted: false, error: `Unsupported platform: ${platform}` },
        { status: 400 }
      );
    }

    if (!verification.valid) {
      console.warn(`[IAP Validate] Verification failed: ${verification.error}`);
      return NextResponse.json({
        success: false,
        granted: false,
        error: verification.error || 'Receipt verification failed',
      }, { status: 403 });
    }

    if (verification.sandbox) {
      console.info(`[IAP Validate] Sandbox/test purchase verified for ${productId}`);
    }

    // Grant entitlements
    const features = TIER_FEATURES[tier];
    const tierData = {
      tier,
      features,
      purchasedAt: new Date().toISOString(),
      purchaseSource: `mobile_${platform}`,
      transactionId: verification.transactionId || transactionId,
      productId,
      verified: true,
      sandbox: verification.sandbox || false,
      pdfAnalysesUsed: 0,
      pdfAnalysesRemaining: features.pdfAnalyses === -1 ? -1 : features.pdfAnalyses,
      aiCreditsUsed: 0,
      aiCreditsRemaining: features.aiChat ? -1 : 0,
    };

    await redisClient.set(`user:${userId}:tier`, tierData);

    // Store idempotency record (7 days)
    await redisClient.set(idempotencyKey, tierData, { ex: 604800 });

    console.info(`[IAP Validate] Granted ${tier} to userId=${userId} (verified=${verification.valid})`);

    return NextResponse.json({
      success: true,
      granted: true,
      tier,
      tierData,
      transactionId: verification.transactionId || transactionId,
    });
  } catch (error) {
    console.error('[IAP Validate] Error:', error);
    return NextResponse.json(
      { error: 'Validation failed. Please try again.' },
      { status: 500 }
    );
  }
}
