/**
 * Purchase Meta Pixel Direct E2E Test (no Stripe UI)
 *
 * Creates a Checkout Session, marks it paid via Stripe test helpers (PaymentIntent
 * confirm), then navigates directly to /dashboard?success=true&session_id=...
 * Asserts facebook.com/tr Purchase fires with id=918881184164588 and value 39.
 *
 * Fallback: if Stripe cannot mark session paid programmatically, intercepts
 * /api/stripe/session to return { value: 39, currency: 'USD' } and navigates
 * with the session_id (tests client-side pixel logic).
 *
 * Run: npx playwright test tests/purchase-pixel-direct.spec.cjs
 */
const { test } = require('@playwright/test');
const { chromium } = require('playwright');
const Stripe = require('stripe').default;
const { isAppError, assertPurchaseRequest, META_PIXEL_ID } = require('./helpers/pixel-assert.cjs');

const BASE_URL = 'https://www.605b.ai';

async function tryMarkSessionPaid(stripe, sessionId) {
  const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['payment_intent'] });
  const pi = session.payment_intent;
  if (!pi || typeof pi !== 'object') return false;
  const piId = typeof pi === 'string' ? pi : pi.id;
  if (!piId) return false;
  try {
    await stripe.paymentIntents.confirm(piId, { payment_method: 'pm_card_visa' });
    const updated = await stripe.checkout.sessions.retrieve(sessionId);
    return updated.payment_status === 'paid' && updated.status === 'complete';
  } catch (_) {
    return false;
  }
}

test.describe('Purchase Meta Pixel (direct)', () => {
  test('fires Purchase with value=39 when navigating directly to success URL', async () => {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    const clerkUserId = process.env.CLERK_TEST_USER_ID;
    const clerkEmail = process.env.CLERK_TEST_USER_EMAIL;
    const clerkPassword = process.env.CLERK_TEST_USER_PASSWORD;

    if (!stripeKey || !clerkUserId || !clerkEmail || !clerkPassword) {
      test.skip(true, 'Missing env: STRIPE_SECRET_KEY, CLERK_TEST_USER_ID, CLERK_TEST_USER_EMAIL, CLERK_TEST_USER_PASSWORD');
    }
    if (stripeKey && !stripeKey.startsWith('sk_test_')) {
      test.skip(true, 'STRIPE_SECRET_KEY must be a test key (sk_test_...)');
    }

    const stripe = new Stripe(stripeKey);
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price_data: { currency: 'usd', unit_amount: 3900, product_data: { name: '605b.ai Dispute Toolkit' } }, quantity: 1 }],
      success_url: BASE_URL + '/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}&tier=toolkit',
      cancel_url: BASE_URL + '/pricing?canceled=true',
      metadata: { clerkUserId },
    });
    const sessionId = session.id;
    const successUrl = BASE_URL + '/dashboard?success=true&session_id=' + sessionId + '&tier=toolkit';

    const sessionPaid = await tryMarkSessionPaid(stripe, sessionId);

    const browser = await chromium.launch({
      channel: 'chromium',
      headless: true,
      args: ['--no-sandbox', '--disable-extensions', '--disable-dev-shm-usage'],
    });
    const context = await browser.newContext({ ignoreHTTPSErrors: true });
    const page = await context.newPage();

    const appConsoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() !== 'error') return;
      const text = msg.text();
      const loc = (msg.location && typeof msg.location === 'function' ? msg.location().url : '') || '';
      if (isAppError(text, loc)) appConsoleErrors.push({ text, location: loc });
    });

    const fbTrRequests = [];
    page.on('request', (req) => {
      const url = req.url();
      if (url.includes('www.facebook.com/tr')) fbTrRequests.push({ url, postData: req.postData() });
    });

    if (!sessionPaid) {
      await page.route('**/api/stripe/session*', (route) => {
        const u = route.request().url();
        if (u.includes('session_id=')) {
          route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ value: 39, currency: 'USD' }) });
        } else {
          route.continue();
        }
      });
    }

    await page.goto(BASE_URL + '/sign-in', { waitUntil: 'networkidle' });
    await page.getByLabel(/email/i).fill(clerkEmail);
    await page.getByLabel(/password/i).fill(clerkPassword);
    await page.getByRole('button', { name: /sign in|continue/i }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });

    await page.goto(successUrl, { waitUntil: 'networkidle' });

    await page.waitForRequest(
      (req) => {
        const u = req.url();
        if (!u.includes('www.facebook.com/tr')) return false;
        const pd = req.postData() || '';
        return pd.includes('ev=Purchase') || pd.includes('"ev":"Purchase"');
      },
      { timeout: 15000 }
    ).catch(() => null);

    await page.waitForLoadState('networkidle');
    await browser.close();

    if (appConsoleErrors.length > 0) {
      console.log('FAIL: App console errors:', JSON.stringify(appConsoleErrors, null, 2));
      throw new Error('Console errors from app bundle: ' + appConsoleErrors.map((e) => e.text).join('; '));
    }

    const { passed, purchaseReqs, hasEvPurchase, hasId, hasValue39 } = assertPurchaseRequest(fbTrRequests, META_PIXEL_ID);
    if (passed) {
      console.log('PASS');
    } else {
      console.log('FAIL');
      console.log('Matched Purchase request URL(s):', purchaseReqs.map((r) => r.url).join('\n'));
      console.log('All fbTrRequests:', JSON.stringify(fbTrRequests.map((r) => ({ url: r.url, postData: (r.postData || '').slice(0, 200) })), null, 2));
      console.log('hasEvPurchase:', hasEvPurchase, 'hasId:', hasId, 'hasValue39:', hasValue39);
      throw new Error('Purchase event assertion failed');
    }
  });
});
