/**
 * Beta Whitelist System
 *
 * Grants full, unrestricted access to specific users for beta testing.
 * Controlled via BETA_WHITELIST_EMAILS environment variable.
 *
 * This is designed to be easily removable - just delete this file
 * and remove the imports/checks that reference it.
 */

/**
 * Check if a user email is on the beta whitelist
 * @param {string|null|undefined} userEmail - The user's email address
 * @returns {boolean} True if the user is whitelisted for beta access
 */
export function isBetaWhitelisted(userEmail) {
  if (!userEmail) return false;

  const whitelistEnv = process.env.BETA_WHITELIST_EMAILS;
  if (!whitelistEnv) return false;

  const whitelist = whitelistEnv
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(e => e.length > 0);

  return whitelist.includes(userEmail.toLowerCase());
}

/**
 * Get beta entitlements for a whitelisted user
 * Returns the highest tier with unlimited access
 * @returns {object} Full entitlements object
 */
export function getBetaEntitlements() {
  return {
    tier: 'identity-theft', // Highest tier
    isBeta: true,
    unlimited: true,
    // Feature flags - all enabled
    features: {
      aiChat: true,
      fullTemplates: true,
      letterDownloads: true,
      disputeTracker: true,
      auditExport: true,
      identityTheftWorkflow: true,
      creditorTemplates: true,
      voiceNarration: true,
    },
    // Unlimited usage
    limits: {
      analyze: Infinity,
      chat: Infinity,
      tts: Infinity,
      ttsChars: Infinity,
    },
  };
}

/**
 * Check beta status and return entitlements if whitelisted
 * Use this at the start of tier/entitlement checks
 * @param {string|null|undefined} userEmail
 * @returns {object|null} Beta entitlements if whitelisted, null otherwise
 */
export function checkBetaAccess(userEmail) {
  if (isBetaWhitelisted(userEmail)) {
    return getBetaEntitlements();
  }
  return null;
}
