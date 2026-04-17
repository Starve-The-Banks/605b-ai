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
 * Sanitize env var value: strip quotes, literal \n, and whitespace.
 * Vercel env vars sometimes contain trailing literal \n or wrapping quotes.
 */
function sanitizeEnv(raw) {
  if (!raw) return '';
  return raw.replace(/\\n/g, '').replace(/^["']|["']$/g, '').trim();
}

/**
 * Hardcoded App Store / Play Store reviewer emails.
 *
 * Reviewer accounts are NOT beta-whitelisted. Apple requires that reviewers
 * see the paywall and in-app purchase UI so they can evaluate the IAP flow.
 * Instead, reviewers keep `tier: 'free'` (paywall visible) but get all
 * `features.*` flags unlocked on the server so no feature can block them.
 * The tier API route applies this policy — see `/api/user-data/tier`.
 *
 * Feature-gating endpoints (e.g. `/api/analyze`) may also check
 * `isReviewerEmail(...)` to bypass per-user rate limits or usage counters
 * during review, without affecting any other user.
 *
 * RULES:
 *   - Only exact matches on this list are affected.
 *   - Never put a real user's email here — these are review-only accounts.
 *   - Do not remove without coordinating with App Store Connect / Play Console.
 */
const RESERVED_REVIEWER_EMAILS = Object.freeze([
  'reviewer@605b.ai',
]);

export function isReviewerEmail(email) {
  const normalized = typeof email === 'string' ? email.trim().toLowerCase() : '';
  return !!normalized && RESERVED_REVIEWER_EMAILS.includes(normalized);
}

/**
 * True if ANY of the provided emails matches a reserved reviewer account.
 */
export function isReviewerRequest({ emails = [] } = {}) {
  return Array.isArray(emails) && emails.some(isReviewerEmail);
}

/**
 * Parse a comma-separated env var into a clean array.
 */
function parseList(envValue) {
  return sanitizeEnv(envValue)
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(e => e.length > 0);
}

/**
 * Check if an email is on the beta whitelist.
 * Case-insensitive, trims whitespace, strips Vercel env artifacts.
 */
export function isBetaWhitelisted(userEmail) {
  const normalized = typeof userEmail === 'string' ? userEmail.trim().toLowerCase() : '';
  if (!normalized) return false;

  const whitelist = parseList(process.env.BETA_WHITELIST_EMAILS);
  if (!whitelist.length) return false;

  return whitelist.includes(normalized);
}

/**
 * Check if a Clerk user ID is on the beta whitelist.
 * Useful when Clerk email is unavailable (cross-instance, missing claim).
 */
export function isBetaWhitelistedByUserId(userId) {
  if (!userId) return false;
  const ids = parseList(process.env.BETA_WHITELIST_USER_IDS);
  if (!ids.length) return false;
  return ids.includes(userId);
}

/**
 * Unified check: returns true if the user is beta-whitelisted by any method.
 * Checks all provided emails (case-insensitive) and the userId.
 *
 * NOTE: Reviewer accounts are intentionally NOT beta-whitelisted here.
 * See `isReviewerEmail` above and `/api/user-data/tier/route.js` for the
 * reviewer policy (free tier visible, features unlocked server-side).
 */
export function isBetaUser({ emails = [], userId = null } = {}) {
  const emailMatch = emails.some(e => isBetaWhitelisted(e));
  const userIdMatch = isBetaWhitelistedByUserId(userId);

  if (emailMatch || userIdMatch) {
    console.log('[BETA] Match found:', {
      emailMatch,
      userIdMatch,
      matchedEmail: emailMatch ? emails.find(e => isBetaWhitelisted(e)) : null,
      userId: userIdMatch ? userId : null,
    });
    return true;
  }

  return false;
}

/**
 * Return parsed allowlist state for diagnostics.
 */
export function getBetaAllowlistState() {
  return {
    emailAllowlist: parseList(process.env.BETA_WHITELIST_EMAILS),
    userIdAllowlist: parseList(process.env.BETA_WHITELIST_USER_IDS),
    rawEmailEnv: process.env.BETA_WHITELIST_EMAILS ? `(${process.env.BETA_WHITELIST_EMAILS.length} chars)` : 'NOT SET',
    rawUserIdEnv: process.env.BETA_WHITELIST_USER_IDS ? `(${process.env.BETA_WHITELIST_USER_IDS.length} chars)` : 'NOT SET',
  };
}
