import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getRestoreBodyError } from '@/lib/iap-request';
import { getRedis } from '@/lib/redis';
import { getIapEnvStatus, verifyAppleReceipt, verifyGoogleReceipt } from '@/lib/iap-verify';

/**
 * POST /api/mobile/iap/restore
 *
 * Restores previously purchased IAP entitlements.
 * Verifies each receipt server-side before granting.
 *
 * Request body:
 *   { platform: 'ios' | 'android', receipts: [{ receiptData, productId, transactionId }] }
 */

// Must match mobile client (creditclear-mobile/src/payments/config.ts)
// and store product IDs registered in App Store Connect / Google Play Console.
const PRODUCT_TO_TIER = {
  'com.creditclear.toolkit': 'toolkit',
  'com.creditclear.advanced': 'advanced',
  'com.creditclear.identitytheft': 'identity-theft',
};

const TIER_LEVEL = {
  'free': 0,
  'toolkit': 1,
  'advanced': 2,
  'identity-theft': 3,
};

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
    console.error('[IAP Restore] auth failed');
    return { userId: null };
  }
}

export async function POST(request) {
  try {
    const envStatus = getIapEnvStatus();
    console.info('[IAP Restore] env', {
      APPLE_IAP_SHARED_SECRET: envStatus.appleSharedSecretLoaded,
      GOOGLE_SERVICE_ACCOUNT_JSON: envStatus.googleServiceAccountLoaded,
      GOOGLE_PLAY_PACKAGE_NAME: envStatus.googlePackageNameLoaded,
    });

    const body = await safeJson(request);
    const bodyError = getRestoreBodyError(body);
    if (bodyError) {
      return badRequest();
    }

    const { platform, receipts } = body;

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

    console.info(`[IAP Restore] userId=${userId} platform=${platform} receipts=${receipts.length}`);

    const redisClient = getRedis();

    // Verify each receipt and determine highest valid tier
    let highestTier = 'free';
    const restoredTransactions = [];

    for (const receipt of receipts) {
      if (!receipt || !receipt.receiptData || !receipt.productId || !receipt.transactionId) {
        console.warn('[IAP Restore] Skipping malformed receipt entry');
        continue;
      }

      const tier = PRODUCT_TO_TIER[receipt.productId];
      if (!tier) continue;

      // Check idempotency first
      const idempKey = `idempo:iap:${receipt.transactionId}`;
      const cached = await redisClient.get(idempKey);
      if (cached) {
        // Already verified — use cached result
        if ((TIER_LEVEL[tier] || 0) > (TIER_LEVEL[highestTier] || 0)) {
          highestTier = tier;
        }
        restoredTransactions.push(receipt.transactionId);
        continue;
      }

      // Server-side verification
      let verification;
      if (platform === 'ios') {
        verification = await verifyAppleReceipt(receipt.receiptData, receipt.productId);
      } else {
        verification = await verifyGoogleReceipt(receipt.receiptData, receipt.productId);
      }

      if (verification.error === 'server misconfigured') {
        return serverMisconfigured();
      }

      if (verification.valid) {
        if ((TIER_LEVEL[tier] || 0) > (TIER_LEVEL[highestTier] || 0)) {
          highestTier = tier;
        }
        restoredTransactions.push(verification.transactionId || receipt.transactionId);

        // Cache idempotency for this transaction (7 days)
        await redisClient.set(idempKey, JSON.stringify({ tier, verified: true }), { ex: 604800 });
      } else {
        console.warn(`[IAP Restore] Verification failed for ${receipt.productId}: ${verification.error}`);
      }
    }

    if (highestTier === 'free') {
      return NextResponse.json({
        success: true,
        restoredTier: 'free',
        tierData: { tier: 'free', features: {} },
        restoredTransactions: [],
      });
    }

    // Grant the highest verified tier
    const features = TIER_FEATURES[highestTier];

    const tierData = {
      tier: highestTier,
      features,
      purchasedAt: new Date().toISOString(),
      purchaseSource: `mobile_${platform}_restore`,
      verified: true,
      pdfAnalysesUsed: 0,
      pdfAnalysesRemaining: features.pdfAnalyses === -1 ? -1 : features.pdfAnalyses,
      aiCreditsUsed: 0,
      aiCreditsRemaining: features.aiChat ? -1 : 0,
    };

    await redisClient.set(`user:${userId}:tier`, JSON.stringify(tierData));

    console.info(`[IAP Restore] Granted ${highestTier} to userId=${userId} (${restoredTransactions.length} verified)`);

    return NextResponse.json({
      success: true,
      restoredTier: highestTier,
      tierData,
      restoredTransactions,
    });
  } catch (error) {
    console.error('[IAP Restore] Error:', error);
    return NextResponse.json(
      { error: 'restore failed' },
      { status: 400 }
    );
  }
}
