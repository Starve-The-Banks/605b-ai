#!/usr/bin/env node
/**
 * Execute full Stripe purchase flow in headed mode against production.
 * Usage: node scripts/run-purchase-pixel-headed.cjs
 * Env: CLERK_TEST_USER_EMAIL, CLERK_TEST_USER_PASSWORD
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

for (const p of ['.env.local', '.env']) {
  const fp = path.join(process.cwd(), p);
  if (fs.existsSync(fp)) {
    for (const line of fs.readFileSync(fp, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
    break;
  }
}

const BASE_URL = 'https://www.605b.ai';
const META_PIXEL_ID = '918881184164588';
const PURCHASE_TIMEOUT_MS = 20000;

async function main() {
  const email = process.env.CLERK_TEST_USER_EMAIL;
  const password = process.env.CLERK_TEST_USER_PASSWORD;
  if (!email || !password) {
    console.log('FAIL: Missing CLERK_TEST_USER_EMAIL or CLERK_TEST_USER_PASSWORD');
    process.exit(1);
  }

  const browser = await chromium.launch({
    channel: 'chromium',
    headless: false,
    args: ['--no-sandbox', '--disable-extensions', '--disable-dev-shm-usage'],
  });

  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    recordTrace: true,
  });

  const page = await context.newPage();

  const fbTrRequests = [];
  page.on('request', (req) => {
    const url = req.url();
    if (url.includes('www.facebook.com/tr')) {
      fbTrRequests.push({ url, postData: req.postData() });
    }
  });

  try {
    await page.goto(BASE_URL + '/sign-in', { waitUntil: 'networkidle' });
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole('button', { name: /sign in|continue/i }).click();
    await page.waitForURL(/\/dashboard|\/pricing|\/$/, { timeout: 15000 });

    await page.goto(BASE_URL + '/pricing', { waitUntil: 'networkidle' });

    await page.getByRole('checkbox', { name: /I understand this is self-service/ }).check();
    await page.getByRole('button', { name: /Buy Dispute Toolkit|Buy.*39/ }).click();

    await page.waitForURL(/checkout\.stripe\.com/, { timeout: 15000 });

    const linkDismissSelectors = [
      'button:has-text("Continue without Link")',
      'button:has-text("No thanks")',
      '[aria-label="Close"]',
      'button:has-text("Pay with card")',
    ];
    for (const sel of linkDismissSelectors) {
      const btn = page.locator(sel).first();
      if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) {
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

    const expFrameSelectors = ['iframe[title="Secure expiration date input frame"]', 'iframe[title*="expir"]'];
    for (const sel of expFrameSelectors) {
      try {
        const frame = page.frameLocator(sel).first();
        const input = frame.locator('input[name="exp-date"], input[placeholder*="MM"]').first();
        await input.waitFor({ state: 'visible', timeout: 5000 });
        await input.fill('12/34');
        break;
      } catch (_) {}
    }

    const cvcFrameSelectors = ['iframe[title="Secure CVC input frame"]', 'iframe[title*="CVC"]'];
    for (const sel of cvcFrameSelectors) {
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

    const purchaseReq = await page.waitForRequest(
      (req) => {
        const u = req.url();
        if (!u.includes('www.facebook.com/tr')) return false;
        const pd = req.postData() || '';
        const hasPurchase = pd.includes('ev=Purchase') || pd.includes('"ev":"Purchase"');
        const hasId = pd.includes('id=' + META_PIXEL_ID) || pd.includes('"id":"' + META_PIXEL_ID + '"');
        return hasPurchase && hasId;
      },
      { timeout: PURCHASE_TIMEOUT_MS }
    ).catch(() => null);

    await page.waitForLoadState('networkidle');

    if (purchaseReq) {
      const fullUrl = purchaseReq.url();
      const postData = purchaseReq.postData() || '';
      console.log('PASS');
      console.log('Purchase tr request URL:', fullUrl);
      if (postData) console.log('PostData (first 500 chars):', postData.slice(0, 500));
    } else {
      console.log('FAIL: No Purchase request within ' + PURCHASE_TIMEOUT_MS / 1000 + ' seconds');
      console.log('All captured facebook.com/tr requests:');
      fbTrRequests.forEach((r, i) => {
        console.log('--- Request', i + 1, '---');
        console.log('URL:', r.url);
        console.log('PostData:', (r.postData || '').slice(0, 500));
      });
      process.exit(1);
    }
  } finally {
    await context.close();
    await browser.close();
  }
}

main().catch((err) => {
  console.error('FAIL:', err.message);
  process.exit(1);
});
