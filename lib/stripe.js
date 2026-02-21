/**
 * Centralized Stripe client factory.
 *
 * Key selection (preview-safe test mode):
 *   - STRIPE_MODE==='test' OR VERCEL_ENV==='preview' → use STRIPE_SECRET_KEY_TEST
 *   - Otherwise → use STRIPE_SECRET_KEY (live)
 *
 * Falls back to STRIPE_SECRET_KEY when no _TEST key is set.
 */

let _stripe = null;
let _resolvedKey = null;

function isTestMode() {
  return (
    process.env.STRIPE_MODE === 'test' ||
    process.env.VERCEL_ENV === 'preview'
  );
}

function getStripeSecretKey() {
  if (isTestMode() && process.env.STRIPE_SECRET_KEY_TEST) {
    return process.env.STRIPE_SECRET_KEY_TEST;
  }
  return process.env.STRIPE_SECRET_KEY;
}

export function getStripe() {
  const key = getStripeSecretKey();
  if (_stripe && _resolvedKey === key) return _stripe;
  const Stripe = require('stripe').default;
  _stripe = new Stripe(key);
  _resolvedKey = key;
  return _stripe;
}

export function getStripePriceId(envBase) {
  if (isTestMode()) {
    const testKey = envBase + '_TEST';
    if (process.env[testKey]) return process.env[testKey];
  }
  return process.env[envBase];
}

export { isTestMode, getStripeSecretKey };
