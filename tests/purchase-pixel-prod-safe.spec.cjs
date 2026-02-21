/**
 * LANE 1: Prod-safe Purchase pixel verification.
 *
 * Does NOT touch real Stripe checkout or charge anything.
 * Navigates to /dashboard?success=true&session_id=cs_fake_toolkit&tier=toolkit
 * and intercepts /api/stripe/session to return { value: 39, currency: 'USD' }.
 * Asserts facebook.com/tr fires with ev=Purchase, id=918881184164588, value=39.
 *
 * Auth: reuses .playwright/auth.json (run scripts/clerk-auth-save.cjs first).
 *
 * Run: npm run purchase:pixel:prod-safe
 */
const { test } = require('@playwright/test');
const { chromium } = require('playwright');
const { isAppError, assertPurchaseRequest, META_PIXEL_ID } = require('./helpers/pixel-assert.cjs');
const { hasStorageState, getStorageStatePath, ensureAuth } = require('./helpers/auth-state.cjs');

const BASE_URL = process.env.BASE_URL || 'https://www.605b.ai';

test.describe('Lane 1: Prod-safe Purchase pixel', () => {
  test('fires Purchase ev with value=39 via intercepted /api/stripe/session', async () => {
    const browser = await chromium.launch({
      channel: 'chromium',
      headless: false,
      args: ['--no-sandbox', '--disable-extensions', '--disable-dev-shm-usage'],
    });

    const contextOpts = { ignoreHTTPSErrors: true };
    if (hasStorageState()) {
      contextOpts.storageState = getStorageStatePath();
    }
    const context = await browser.newContext(contextOpts);
    const page = await context.newPage();

    if (!hasStorageState()) {
      await ensureAuth(page, BASE_URL);
    }

    const appConsoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() !== 'error') return;
      const text = msg.text();
      const loc = (msg.location && typeof msg.location === 'function' ? msg.location().url : '') || '';
      if (isAppError(text, loc)) appConsoleErrors.push({ text, location: loc });
    });

    const fbTrRequests = [];
    let fbeventsLoaded = false;
    page.on('request', (req) => {
      const url = req.url();
      if (url.includes('www.facebook.com/tr')) {
        fbTrRequests.push({ url, postData: req.postData() });
      }
      if (url.includes('connect.facebook.net') && url.includes('fbevents')) {
        fbeventsLoaded = true;
      }
    });

    await page.route('**/api/stripe/session*', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ value: 39, currency: 'USD' }),
      });
    });

    const successUrl = BASE_URL + '/dashboard?success=true&session_id=cs_fake_toolkit&tier=toolkit';
    await page.goto(successUrl, { waitUntil: 'networkidle' });

    await page.waitForRequest(
      (req) => {
        const u = req.url();
        if (!u.includes('www.facebook.com/tr')) return false;
        const s = [u, req.postData() || ''].join(' ');
        return s.includes('ev=Purchase') || s.includes('"ev":"Purchase"');
      },
      { timeout: 20000 }
    ).catch(() => null);

    await page.waitForLoadState('networkidle');
    await browser.close();

    if (appConsoleErrors.length > 0) {
      console.log('FAIL: App console errors:', JSON.stringify(appConsoleErrors, null, 2));
      throw new Error('Console errors from app bundle: ' + appConsoleErrors.map((e) => e.text).join('; '));
    }

    if (!fbeventsLoaded) {
      console.log('FAIL: fbevents.js was never loaded');
      throw new Error('fbevents.js not loaded');
    }

    const { passed, purchaseReqs, hasEvPurchase, hasId, hasValue39 } = assertPurchaseRequest(fbTrRequests, META_PIXEL_ID);
    if (passed) {
      console.log('PASS');
      console.log('Purchase tr URL:', purchaseReqs[0]?.url?.slice(0, 300));
    } else {
      console.log('FAIL');
      console.log('Matched Purchase request URL(s):', purchaseReqs.map((r) => r.url).join('\n'));
      console.log('All fbTrRequests:', JSON.stringify(fbTrRequests.map((r) => ({
        url: r.url,
        postData: (r.postData || '').slice(0, 200),
      })), null, 2));
      console.log('hasEvPurchase:', hasEvPurchase, 'hasId:', hasId, 'hasValue39:', hasValue39);
      throw new Error('Purchase event assertion failed');
    }
  });
});
