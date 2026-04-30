import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getValidateBodyError } from '@/lib/iap-request';
import { getRedis } from '@/lib/redis';
import { getIapEnvStatus, verifyAppleReceipt, verifyGoogleReceipt } from '@/lib/iap-verify';

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
 * If required store secrets are missing for the request platform, the route
 * returns 503 with { error: 'server misconfigured' } — verification is not
 * skipped and entitlements are not granted without successful store verification.
 */

// Map product IDs to tier names.
// These must match exactly what is registered in App Store Connect and
// Google Play Console AND what the mobile client sends in IAP_PRODUCTS
// (see creditclear-mobile/src/payments/config.ts).
const PRODUCT_TO_TIER = {
  'com.creditclear.toolkit': 'toolkit',
  'com.creditclear.advanced': 'advanced',
  'com.creditclear.identitytheft': 'identity-theft',
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

function badRequest() {
  return NextResponse.json({ error: 'missing required fields' }, { status: 400 });
}

function serverMisconfigured() {
  return NextResponse.json({ error: 'server misconfigured' }, { status: 503 });
}

function authExpired() {
  return NextResponse.json(
    { success: false, error: { code: 'AUTH_EXPIRED', message: 'Authentication expired. Please reconnect.' } },
    { status: 401 }
  );
}

function parseStoredJson(rawValue) {
  if (!rawValue) return null;
  if (typeof rawValue === 'string') {
    try {
      return JSON.parse(rawValue);
    } catch {
      return null;
    }
  }
  return rawValue;
}

async function safeJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

async function safeAuth() {
  try {
    return await auth();
  } catch (error) {
    console.error('[IAP Validate] auth failed');
    return { userId: null };
  }
}

export async function POST(request) {
  try {
    const envStatus = getIapEnvStatus();
    console.info('[IAP Validate] env', {
      APPLE_IAP_SHARED_SECRET: envStatus.appleSharedSecretLoaded,
      GOOGLE_SERVICE_ACCOUNT_JSON: envStatus.googleServiceAccountLoaded,
      GOOGLE_PLAY_PACKAGE_NAME: envStatus.googlePackageNameLoaded,
    });

    const body = await safeJson(request);
    const bodyError = getValidateBodyError(body);
    if (bodyError) {
      return badRequest();
    }

    const { platform, receiptData, productId, transactionId } = body;

    const { userId } = await safeAuth();
    if (!userId) {
      return authExpired();
    }

    if (
      (platform === 'ios' && !envStatus.appleSharedSecretLoaded) ||
      (platform === 'android' && !envStatus.googleServiceAccountLoaded)
    ) {
      return serverMisconfigured();
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
      const parsedExisting = parseStoredJson(existing);
      console.info(`[IAP Validate] Idempotent hit for txn=${transactionId}`);
      return NextResponse.json({
        success: true,
        granted: true,
        tier,
        tierData: parsedExisting || {},
        transactionId,
      });
    }

    // Server-side receipt verification
    console.info(`[IAP Validate] userId=${userId} platform=${platform} product=${productId} tier=${tier}`);

    let verification;
    if (platform === 'ios') {
      verification = await verifyAppleReceipt(receiptData, productId);
    } else {
      verification = await verifyGoogleReceipt(receiptData, productId);
    }

    if (!verification.valid) {
      console.warn(`[IAP Validate] Verification failed: ${verification.error}`);
      if (verification.error === 'server misconfigured') {
        return serverMisconfigured();
      }
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

    await redisClient.set(`user:${userId}:tier`, JSON.stringify(tierData));

    // Store idempotency record (7 days)
    await redisClient.set(idempotencyKey, JSON.stringify(tierData), { ex: 604800 });

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
      { error: 'validation failed' },
      { status: 400 }
    );
  }
}
