/**
 * Conversion event helpers for Meta Pixel and Google Ads.
 * Call these from client components when key actions happen.
 *
 * Usage:
 *   import { trackSignUp, trackPurchase } from '@/lib/tracking';
 *   trackSignUp();
 *   trackPurchase({ tier: 'toolkit', value: 39 });
 */

/**
 * Track a custom event across all configured pixels.
 * @param {string} eventName - e.g. 'SignUp', 'Purchase', 'StartTrial'
 * @param {object} params - optional event parameters
 */
export function trackEvent(eventName, params = {}) {
  if (typeof window === 'undefined') return;

  // Meta Pixel
  if (window.fbq) {
    window.fbq('track', eventName, params);
  }

  // Google Ads / gtag
  if (window.gtag) {
    window.gtag('event', eventName, params);
  }
}

/** Fire when a user completes sign-up / onboarding. */
export function trackSignUp(method = 'email') {
  trackEvent('CompleteRegistration', { method });
}

/** Fire when a user completes a purchase. */
export function trackPurchase({ tier, value, currency = 'USD' }) {
  trackEvent('Purchase', { content_name: tier, value, currency });
}

/** Fire when a user starts checkout. */
export function trackInitiateCheckout(tier) {
  trackEvent('InitiateCheckout', { content_name: tier });
}

/** Fire when a user views pricing. */
export function trackViewPricing() {
  trackEvent('ViewContent', { content_name: 'pricing' });
}
