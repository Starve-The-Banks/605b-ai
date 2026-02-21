/**
 * Shared auth-state resolver for Playwright specs.
 * Falls back: storageState file > env-based login > skip.
 */
const path = require('path');
const fs = require('fs');

const AUTH_FILE = path.join(__dirname, '..', '..', '.playwright', 'auth.json');

function hasStorageState() {
  return fs.existsSync(AUTH_FILE);
}

function getStorageStatePath() {
  return AUTH_FILE;
}

async function ensureAuth(page, baseUrl) {
  const email = process.env.CLERK_TEST_USER_EMAIL;
  const password = process.env.CLERK_TEST_USER_PASSWORD;

  if (hasStorageState()) return;

  if (!email || !password) {
    throw new Error(
      'No .playwright/auth.json found and no CLERK_TEST_USER_EMAIL/PASSWORD set.\n' +
      'Run: node scripts/clerk-auth-save.cjs   (interactive one-time login)'
    );
  }

  await page.goto(baseUrl + '/sign-in', { waitUntil: 'networkidle' });
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: /sign in|continue/i }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 15000 });
}

module.exports = { hasStorageState, getStorageStatePath, ensureAuth, AUTH_FILE };
