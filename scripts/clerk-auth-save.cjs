#!/usr/bin/env node
/**
 * Interactive Clerk login — saves Playwright storageState to .playwright/auth.json.
 * Run once: node scripts/clerk-auth-save.cjs
 * Then all specs reuse the saved session without email/password.
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = process.env.BASE_URL || 'https://www.605b.ai';
const AUTH_FILE = path.join(__dirname, '..', '.playwright', 'auth.json');

(async () => {
  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });

  const browser = await chromium.launch({
    channel: 'chromium',
    headless: false,
    args: ['--disable-extensions'],
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(BASE_URL + '/sign-in', { waitUntil: 'domcontentloaded', timeout: 60000 });

  console.log('\n=== Sign in manually in the browser window ===');
  console.log('Once you reach /dashboard, the session will be saved automatically.');
  console.log('You have 5 minutes.\n');

  await page.waitForURL(/\/dashboard/, { timeout: 300_000 });
  console.log('Dashboard reached — saving storageState...');

  await context.storageState({ path: AUTH_FILE });
  console.log('Saved to', AUTH_FILE);

  await browser.close();
})();
