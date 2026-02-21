/**
 * Purchase Meta Pixel E2E Test
 *
 * Verifies that the Purchase event fires with correct value/currency when
 * navigating to /dashboard?success=true&session_id=...&tier=toolkit after
 * a paid Stripe Checkout Session.
 *
 * Requires:
 *   STRIPE_SECRET_KEY (test key sk_test_...)
 *   CLERK_TEST_USER_ID
 *   CLERK_TEST_USER_EMAIL
 *   CLERK_TEST_USER_PASSWORD
 *   META_PIXEL_ID (optional, defaults to 918881184164588)
 *
 * Run: npx playwright test tests/purchase-pixel.spec.cjs
 * Debug: npm run test:e2e -- --headed
 */
const { test } = require('@playwright/test');
const { chromium } = require('playwright');
const Stripe = require('stripe').default;

const BASE_URL = 'https://www.605b.ai';
const META_PIXEL_ID = process.env.META_PIXEL_ID || '918881184164588';

/** Errors from our app (605b.ai) - fail test. Ignore Stripe/Meta/third-party noise. */
function isAppError(text, location) {
  if (!text && !location) return false;
  const s = [text, location].filter(Boolean).join(' ');
  if (/605b\.ai|www\.605b\.ai|\/_next\/|\/dashboard/.test(s)) return true;
  if (/checkout\.stripe\.com|facebook\.com|connect\.facebook\.net|stripe\.com/.test(s)) return false;
  return false;
}

test.describe('Purchase Meta Pixel', () => {
  test('fires Purchase event with value=39 when Stripe session is paid', async () => {
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
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: 3900,
            product_data: { name: '605b.ai Dispute Toolkit' },
          },
          quantity: 1,
        },
      ],
      success_url: BASE_URL + '/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}&tier=toolkit',
      cancel_url: BASE_URL + '/pricing?canceled=true',
      metadata: { clerkUserId },
    });

    const sessionUrl = session.url;
    if (!sessionUrl) {
      throw new Error('Stripe session has no URL');
    }

    const browser = await chromium.launch({
      channel: 'chromium',
      headless: true,
      args: ['--no-sandbox', '--disable-extensions', '--disable-dev-shm-usage'],
    });

    const context = await browser.newContext({
      ignoreHTTPSErrors: true,
    });

    const page = await context.newPage();

    const appConsoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() !== 'error') return;
      const text = msg.text();
      const loc = (msg.location && typeof msg.location === 'function' ? msg.location().url : '') || '';
      if (isAppError(text, loc)) {
        appConsoleErrors.push({ text, location: loc });
      }
    });

    const fbTrRequests = [];
    const fbeventsUrls = [];
    page.on('request', (req) => {
      const url = req.url();
      if (url.includes('www.facebook.com/tr')) {
        fbTrRequests.push({ url, postData: req.postData() });
      }
      if (url.includes('connect.facebook.net') && url.includes('fbevents')) {
        fbeventsUrls.push(url);
      }
    });

    await page.goto(BASE_URL + '/sign-in', { waitUntil: 'networkidle' });
    await page.getByLabel(/email/i).fill(clerkEmail);
    await page.getByLabel(/password/i).fill(clerkPassword);
    await page.getByRole('button', { name: /sign in|continue/i }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });

    await page.goto(sessionUrl, { waitUntil: 'networkidle' });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);

    const linkDismissSelectors = [
      'button:has-text("Continue without Link")',
      'button:has-text("No thanks")',
      '[aria-label="Close"]',
      'button:has-text("Pay with card")',
    ];
    for (const sel of linkDismissSelectors) {
      try {
        const btn = page.locator(sel).first();
        if (await btn.isVisible({ timeout: 500 })) {
          await btn.click();
          await page.waitForTimeout(500);
          break;
        }
      } catch (_) {}
    }

    const cardFrameSelectors = [
      'iframe[title="Secure card number input frame"]',
      'iframe[title*="card number"]',
      'iframe[title*="card"]',
    ];
    let cardFilled = false;
    for (const sel of cardFrameSelectors) {
      try {
        const frame = page.frameLocator(sel).first();
        const input = frame.locator('input[name="cardnumber"], input[placeholder*="Card"]').first();
        await input.waitFor({ state: 'visible', timeout: 5000 });
        await input.fill('4242424242424242');
        cardFilled = true;
        break;
      } catch (_) {}
    }
    if (!cardFilled) throw new Error('Could not find card input iframe');

    const expFrameSelectors = [
      'iframe[title="Secure expiration date input frame"]',
      'iframe[title*="expir"]',
    ];
    for (const sel of expFrameSelectors) {
      try {
        const frame = page.frameLocator(sel).first();
        const input = frame.locator('input[name="exp-date"], input[placeholder*="MM"]').first();
        await input.waitFor({ state: 'visible', timeout: 2000 });
        await input.fill('12/34');
        break;
      } catch (_) {}
    }

    const cvcFrameSelectors = [
      'iframe[title="Secure CVC input frame"]',
      'iframe[title*="CVC"]',
    ];
    for (const sel of cvcFrameSelectors) {
      try {
        const frame = page.frameLocator(sel).first();
        const input = frame.locator('input[name="cvc"], input[placeholder*="CVC"]').first();
        await input.waitFor({ state: 'visible', timeout: 2000 });
        await input.fill('123');
        break;
      } catch (_) {}
    }

    const payButton = page.getByRole('button', { name: /pay|subscribe/i });
    await payButton.click();

    await page.waitForURL(/\/dashboard\?.*success=true.*session_id=cs_/, { timeout: 45000 });
    const finalUrl = page.url();
    const sessionIdMatch = finalUrl.match(/session_id=(cs_[a-zA-Z0-9_]+)/);
    const sessionId = sessionIdMatch ? sessionIdMatch[1] : null;

    if (!sessionId) {
      await browser.close();
      throw new Error('Did not land on success URL with session_id. Final URL: ' + finalUrl);
    }

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3500);

    await browser.close();

    if (appConsoleErrors.length > 0) {
      console.log('FAIL: App console errors:', JSON.stringify(appConsoleErrors, null, 2));
      throw new Error('Console errors from app bundle: ' + appConsoleErrors.map((e) => e.text).join('; '));
    }

    const purchaseReqs = fbTrRequests.filter((r) => {
      const s = [r.url, r.postData].filter(Boolean).join(' ');
      return s.includes('ev=Purchase') || s.includes('"ev":"Purchase"');
    });

    const hasEvPurchase = purchaseReqs.length > 0;
    const hasId = purchaseReqs.some((r) => {
      const s = [r.url, r.postData].filter(Boolean).join(' ');
      return s.includes('id=' + META_PIXEL_ID) || s.includes('"id":"' + META_PIXEL_ID + '"');
    });
    const hasValue39 = purchaseReqs.some((r) => {
      const s = [r.url, r.postData].filter(Boolean).join(' ');
      return s.includes('value=39') || s.includes('"value":39') || s.includes('cd[value]=39');
    });

    const passed = hasEvPurchase && hasId && hasValue39;

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
