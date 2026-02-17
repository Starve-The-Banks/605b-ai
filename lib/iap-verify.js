/**
 * Server-side IAP receipt verification for Apple App Store and Google Play.
 *
 * Apple: Uses the legacy verifyReceipt endpoint (works with StoreKit 1 receipts).
 *        For StoreKit 2 / App Store Server API v2, a signed JWT approach would
 *        be needed — but react-native-iap v14 still sends StoreKit 1 receipts.
 *
 * Google: Uses the Google Play Developer API via google-auth-library.
 *         Requires a service account JSON key with Play Developer API access.
 *
 * Environment variables required:
 *   APPLE_IAP_SHARED_SECRET    — from App Store Connect > Shared Secret
 *   GOOGLE_SERVICE_ACCOUNT_JSON — stringified JSON of the service account key
 *                                 (or GOOGLE_SERVICE_ACCOUNT_KEY_PATH for file path)
 */

import { GoogleAuth } from 'google-auth-library';

// ---------------------------------------------------------------------------
// Apple App Store receipt verification
// ---------------------------------------------------------------------------

const APPLE_VERIFY_PROD = 'https://buy.itunes.apple.com/verifyReceipt';
const APPLE_VERIFY_SANDBOX = 'https://sandbox.itunes.apple.com/verifyReceipt';

/**
 * Verify an Apple IAP receipt.
 *
 * @param {string} receiptData — base64-encoded receipt from the device
 * @param {string} productId  — expected product ID
 * @returns {{ valid: boolean, productId?: string, transactionId?: string, error?: string }}
 */
export async function verifyAppleReceipt(receiptData, productId) {
  const sharedSecret = process.env.APPLE_IAP_SHARED_SECRET;
  if (!sharedSecret) {
    // In production, missing secret = verification failure (never bypass)
    if (process.env.NODE_ENV === 'production') {
      console.error('[IAP-Apple] APPLE_IAP_SHARED_SECRET not set in production — rejecting');
      return { valid: false, error: 'Server configuration error. Contact support.' };
    }
    console.warn('[IAP-Apple] APPLE_IAP_SHARED_SECRET not set — skipping verification (dev mode)');
    return { valid: true, productId, transactionId: 'unverified', sandbox: true };
  }

  const payload = {
    'receipt-data': receiptData,
    password: sharedSecret,
    'exclude-old-transactions': true,
  };

  // Try production first; Apple returns status 21007 if it's a sandbox receipt
  let res = await fetch(APPLE_VERIFY_PROD, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  let body = await res.json();

  // 21007 = sandbox receipt sent to production endpoint
  if (body.status === 21007) {
    res = await fetch(APPLE_VERIFY_SANDBOX, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    body = await res.json();
  }

  if (body.status !== 0) {
    return {
      valid: false,
      error: `Apple verification failed with status ${body.status}`,
    };
  }

  // Find the matching in_app purchase
  const latestReceipts = body.latest_receipt_info || body.receipt?.in_app || [];
  const match = latestReceipts.find((r) => r.product_id === productId);

  if (!match) {
    return {
      valid: false,
      error: `Product ${productId} not found in receipt`,
    };
  }

  // Check cancellation
  if (match.cancellation_date) {
    return {
      valid: false,
      error: 'Purchase was cancelled/refunded',
    };
  }

  return {
    valid: true,
    productId: match.product_id,
    transactionId: match.transaction_id || match.original_transaction_id,
    sandbox: body.environment === 'Sandbox',
  };
}

// ---------------------------------------------------------------------------
// Google Play receipt verification
// ---------------------------------------------------------------------------

let googleAuthClient = null;

/**
 * Get or create a Google Auth client for Play Developer API.
 */
function getGoogleAuth() {
  if (googleAuthClient) return googleAuthClient;

  const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  const keyPath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH;

  if (!keyJson && !keyPath) {
    return null;
  }

  const credentials = keyJson ? JSON.parse(keyJson) : undefined;

  googleAuthClient = new GoogleAuth({
    credentials,
    keyFile: keyJson ? undefined : keyPath,
    scopes: ['https://www.googleapis.com/auth/androidpublisher'],
  });

  return googleAuthClient;
}

/**
 * Verify a Google Play purchase.
 *
 * @param {string} purchaseToken — purchase token from the device
 * @param {string} productId    — expected product ID
 * @returns {{ valid: boolean, productId?: string, transactionId?: string, error?: string }}
 */
export async function verifyGoogleReceipt(purchaseToken, productId) {
  const googleAuth = getGoogleAuth();
  const packageName = process.env.GOOGLE_PLAY_PACKAGE_NAME || 'com.creditclear.app';

  if (!googleAuth) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[IAP-Google] No service account configured in production — rejecting');
      return { valid: false, error: 'Server configuration error. Contact support.' };
    }
    console.warn('[IAP-Google] No service account configured — skipping verification (dev mode)');
    return { valid: true, productId, transactionId: 'unverified', sandbox: true };
  }

  try {
    const client = await googleAuth.getClient();
    const token = await client.getAccessToken();

    const url =
      `https://androidpublisher.googleapis.com/androidpublisher/v3/` +
      `applications/${packageName}/purchases/products/${productId}/tokens/${purchaseToken}`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token.token}`,
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      return {
        valid: false,
        error: `Google verification failed: ${res.status} ${errText.slice(0, 200)}`,
      };
    }

    const data = await res.json();

    // purchaseState: 0 = Purchased, 1 = Cancelled, 2 = Pending
    if (data.purchaseState === 1) {
      return { valid: false, error: 'Purchase was cancelled' };
    }
    if (data.purchaseState === 2) {
      return { valid: false, error: 'Purchase is still pending' };
    }

    return {
      valid: true,
      productId,
      transactionId: data.orderId || purchaseToken.slice(0, 40),
      sandbox: data.purchaseType === 0, // 0 = test/sandbox
    };
  } catch (err) {
    return {
      valid: false,
      error: `Google verification error: ${err.message}`,
    };
  }
}
