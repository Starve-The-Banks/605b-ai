#!/usr/bin/env node
import { chromium } from 'playwright';

const EXPECTED_PIXEL_ID = '918881184164588';
const BASE_URL = 'https://www.605b.ai';

async function verify() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-extensions'],
  });

  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  });

  const results = { fbevents: false, tr: false, trIdMatch: false, consoleErrors: [], network: [] };

  const page = await context.newPage();

  page.on('console', (msg) => {
    const text = msg.text();
    const type = msg.type();
    if (type === 'error') results.consoleErrors.push(text);
  });

  const fbeventsRequests = [];
  const trRequests = [];

  page.on('request', (req) => {
    const url = req.url();
    if (url.includes('connect.facebook.net/en_US/fbevents.js')) fbeventsRequests.push(url);
    if (url.includes('facebook.com/tr') || url.includes('www.facebook.com/tr')) {
      trRequests.push({ url, searchParams: new URL(url).searchParams });
    }
  });

  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);
  } catch (e) {
    results.consoleErrors.push('Navigation error: ' + e.message);
  }

  results.fbevents = fbeventsRequests.length > 0;

  for (const r of trRequests) {
    const id = r.searchParams.get('id') || r.searchParams.get('ids');
    if (id && (id === EXPECTED_PIXEL_ID || id.includes(EXPECTED_PIXEL_ID))) {
      results.tr = true;
      results.trIdMatch = true;
      break;
    }
    if (r.url.includes('tr')) results.tr = true;
  }
  if (results.tr && !results.trIdMatch) {
    const ids = trRequests.map((r) => r.searchParams.get('id') || r.searchParams.get('ids')).filter(Boolean);
    results.trIdMatch = ids.some((id) => id === EXPECTED_PIXEL_ID || (id && id.includes(EXPECTED_PIXEL_ID)));
  }

  results.network = { fbevents: fbeventsRequests, tr: trRequests.map((r) => r.url) };

  const fbeventsErrors = results.consoleErrors.filter((e) =>
    e.toLowerCase().includes('fbq') || e.toLowerCase().includes('fbevents') || e.toLowerCase().includes('facebook')
  );

  const pass = results.fbevents && results.tr && results.trIdMatch && fbeventsErrors.length === 0;

  await browser.close();

  return {
    pass,
    fbevents: results.fbevents,
    tr: results.tr,
    trIdMatch: results.trIdMatch,
    fbeventsErrors,
    consoleErrors: results.consoleErrors,
    network: results.network,
  };
}

verify()
  .then((r) => {
    console.log('\n=== Meta Pixel Verification Report ===\n');
    console.log('(a) fbevents.js loads:', r.fbevents ? 'YES' : 'NO');
    console.log('(b) facebook.com/tr fires:', r.tr ? 'YES' : 'NO');
    console.log('(c) id=918881184164588:', r.trIdMatch ? 'YES' : 'NO');
    console.log('(d) no fbevents runtime errors:', r.fbeventsErrors.length === 0 ? 'YES' : 'NO');
    console.log('\nNetwork:');
    console.log('  fbevents:', r.network.fbevents.length > 0 ? r.network.fbevents[0] : 'NONE');
    console.log('  tr requests:', r.network.tr.length, r.network.tr.slice(0, 3));
    if (r.consoleErrors.length) console.log('\nConsole errors:', r.consoleErrors);
    if (r.fbeventsErrors.length) console.log('\nFbevents errors:', r.fbeventsErrors);
    console.log('\n' + (r.pass ? 'PASS' : 'FAIL') + '\n');
    process.exit(r.pass ? 0 : 1);
  })
  .catch((e) => {
    console.error('Verification failed:', e);
    process.exit(1);
  });
