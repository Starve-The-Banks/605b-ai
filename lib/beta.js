/**
 * Beta / Tester Access System
 *
 * Grants full access (identity-theft tier) to specific users for beta testing.
 * Source of truth: two Vercel environment variables.
 *
 * HOW TO ADD A BETA TESTER:
 *   1. Get the tester's email address OR Clerk user ID (user_xxxx).
 *   2. In Vercel Dashboard → 605b-ai → Settings → Environment Variables:
 *      - BETA_WHITELIST_EMAILS: comma-separated emails (case-insensitive)
 *      - BETA_WHITELIST_USER_IDS: comma-separated Clerk user IDs
 *   3. Add the value, save, and redeploy (or wait for next deploy).
 *
 * HOW TO REVOKE:
 *   Remove the email or user ID from the env var and redeploy.
 *
 * ARCHITECTURE:
 *   - Backend only: the tier API route (GET /api/user-data/tier) checks
 *     these lists before reading Redis. Beta users get tier: 'identity-theft'
 *     with isBeta: true and all features unlocked.
 *   - Mobile has no local beta logic; it reads tier from the API like
 *     everyone else. The isBeta flag is stripped from local cache for
 *     security (can't be injected client-side).
 *   - Separate from TestFlight/Play distribution. TestFlight = install
 *     access. Whitelist = paywall bypass. Both are needed for a tester.
 *
 * ENV EXAMPLES (do not put real emails in code):
 *   BETA_WHITELIST_EMAILS=alice@example.com,bob@example.com
 *   BETA_WHITELIST_USER_IDS=user_2abc123,user_2def456
 */

/**
 * Check if an email is on the beta whitelist.
 * Case-insensitive, trims whitespace.
 */
export function isBetaWhitelisted(userEmail) {
  const normalized = typeof userEmail === 'string' ? userEmail.trim().toLowerCase() : '';
  if (!normalized) return false;

  const whitelistEnv = process.env.BETA_WHITELIST_EMAILS;
  if (!whitelistEnv) return false;

  const whitelist = whitelistEnv
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(e => e.length > 0);

  return whitelist.includes(normalized);
}

/**
 * Check if a Clerk user ID is on the beta whitelist.
 * Useful when Clerk email is unavailable (cross-instance, missing claim).
 */
export function isBetaWhitelistedByUserId(userId) {
  if (!userId) return false;
  const env = process.env.BETA_WHITELIST_USER_IDS;
  if (!env) return false;
  const ids = env.split(',').map(e => e.trim()).filter(Boolean);
  return ids.includes(userId);
}

/**
 * Unified check: returns true if the user is beta-whitelisted by any method.
 * Checks all provided emails (case-insensitive) and the userId.
 */
export function isBetaUser({ emails = [], userId = null } = {}) {
  if (emails.some(e => isBetaWhitelisted(e))) return true;
  if (isBetaWhitelistedByUserId(userId)) return true;
  return false;
}
