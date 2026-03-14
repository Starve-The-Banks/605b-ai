#!/usr/bin/env node
/**
 * Verify Meta Pixel Purchase event fires on toolkit payment success.
 * Simulates /dashboard?success=true&session_id=cs_test_xxx&tier=toolkit
 * Run: node scripts/verify-purchase-pixel.mjs
 */
import { chromium } from 'playwright';

async function verify() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const trRequests = [];
  page.on('request', (req) => {
    const u = req.url();
    if (u.includes('facebook.com/tr')) trRequests.push(u);
  });

  await page.goto('https://www.605b.ai/dashboard?success=true&session_id=cs_test_123&tier=toolkit', {
    waitUntil: 'networkidle',
    timeout: 20000,
  });
  await page.waitForTimeout(4000);

  const purchaseTr = trRequests.filter((u) => u.includes('ev=Purchase') || u.includes('ev%3DPurchase'));
  const hasValue = trRequests.some((u) => u.includes('value') || u.includes('39'));
  console.log('\n=== Purchase Pixel Verification ===\n');
  console.log('Purchase tr requests:', purchaseTr.length);
  console.log('Sample:', purchaseTr[0]?.substring(0, 120) || 'NONE');
  console.log(purchaseTr.length > 0 && (hasValue || purchaseTr[0]?.includes('Purchase')) ? '\nPASS' : '\nFAIL (may need auth - run manual test)');
  await browser.close();
}

verify().catch(console.error);
