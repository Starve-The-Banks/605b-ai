/**
 * LANE 2: Real Stripe Checkout E2E on preview deployment (test mode).
 *
 * Runs ONLY against a preview deployment URL (not production).
 * Authenticates via .playwright/auth.json, goes to /pricing, checks disclaimer,
 * clicks Toolkit buy, completes Stripe Checkout with 4242 test card,
 * waits for redirect to /dashboard?success=true&session_id=cs_...&tier=toolkit,
 * asserts facebook.com/tr Purchase fires with id=918881184164588 and value=39.
 *
 * Env: PREVIEW_URL (required, e.g. https://605b-xxxxx.vercel.app)
 *
 * Run: npm run purchase:pixel:preview-e2e
 */
const { test } = require('@playwright/test');
const { chromium } = require('playwright');
const { isAppError, assertPurchaseRequest, META_PIXEL_ID } = require('./helpers/pixel-assert.cjs');
const { hasStorageState, getStorageStatePath, ensureAuth } = require('./helpers/auth-state.cjs');

const PREVIEW_URL = process.env.PREVIEW_URL;

test.describe('Lane 2: Preview E2E Purchase', () => {
  test('full Stripe test checkout fires Purchase pixel with value=39', async () => {
    if (!PREVIEW_URL) {
      test.skip(true, 'PREVIEW_URL not set — this test runs only against preview deployments');
    }
    if (PREVIEW_URL && PREVIEW_URL.includes('www.605b.ai')) {
      test.skip(true, 'PREVIEW_URL must NOT be production (www.605b.ai)');
    }

    const browser = await chromium.launch({
      channel: 'chromium',
      headless: false,
      args: ['--no-sandbox', '--disable-extensions', '--disable-dev-shm-usage'],
    });

    const contextOpts = {
      ignoreHTTPSErrors: true,
      recordVideo: { dir: '.playwright/videos/' },
    };
    if (hasStorageState()) {
      contextOpts.storageState = getStorageStatePath();
    }
    const context = await browser.newContext(contextOpts);
    await context.tracing.start({ screenshots: true, snapshots: true });

    const page = await context.newPage();

    if (!hasStorageState()) {
      await ensureAuth(page, PREVIEW_URL);
    }

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
      if (url.includes('www.facebook.com/tr')) {
        fbTrRequests.push({ url, postData: req.postData() });
      }
    });

    try {
      await page.goto(PREVIEW_URL + '/pricing', { waitUntil: 'networkidle' });

      const disclaimerCheckbox = page.getByRole('checkbox', { name: /self-service/i });
      if (await disclaimerCheckbox.isVisible({ timeout: 3000 }).catch(() => false)) {
        await disclaimerCheckbox.check();
      }

      const buyBtn = page.getByRole('button', { name: /Buy Dispute Toolkit|Buy.*39/i });
      await buyBtn.waitFor({ state: 'visible', timeout: 8000 });
      await buyBtn.click();

      await page.waitForURL(/checkout\.stripe\.com/, { timeout: 15000 });

      const linkDismissSelectors = [
        'button:has-text("Continue without Link")',
        'button:has-text("No thanks")',
        '[aria-label="Close"]',
        'button:has-text("Pay with card")',
      ];
      for (const sel of linkDismissSelectors) {
        const btn = page.locator(sel).first();
        if (await btn.isVisible({ timeout: 1500 }).catch(() => false)) {
          await btn.click();
          break;
        }
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
          await input.waitFor({ state: 'visible', timeout: 8000 });
          await input.fill('4242424242424242');
          cardFilled = true;
          break;
        } catch (_) {}
      }
      if (!cardFilled) throw new Error('Could not find card input iframe');

      for (const sel of ['iframe[title="Secure expiration date input frame"]', 'iframe[title*="expir"]']) {
        try {
          const frame = page.frameLocator(sel).first();
          const input = frame.locator('input[name="exp-date"], input[placeholder*="MM"]').first();
          await input.waitFor({ state: 'visible', timeout: 5000 });
          await input.fill('12/34');
          break;
        } catch (_) {}
      }

      for (const sel of ['iframe[title="Secure CVC input frame"]', 'iframe[title*="CVC"]']) {
        try {
          const frame = page.frameLocator(sel).first();
          const input = frame.locator('input[name="cvc"], input[placeholder*="CVC"]').first();
          await input.waitFor({ state: 'visible', timeout: 5000 });
          await input.fill('123');
          break;
        } catch (_) {}
      }

      const payButton = page.getByRole('button', { name: /pay|subscribe/i });
      await payButton.waitFor({ state: 'visible', timeout: 5000 });
      await payButton.click();

      await page.waitForURL(/\/dashboard\?.*success=true.*session_id=cs_/, { timeout: 45000 });

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
    } catch (err) {
      await context.tracing.stop({ path: '.playwright/trace-preview-e2e.zip' });
      await browser.close();
      throw err;
    }

    await context.tracing.stop({ path: '.playwright/trace-preview-e2e.zip' });
    await browser.close();

    if (appConsoleErrors.length > 0) {
      console.log('FAIL: App console errors:', JSON.stringify(appConsoleErrors, null, 2));
      throw new Error('Console errors from app bundle: ' + appConsoleErrors.map((e) => e.text).join('; '));
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
