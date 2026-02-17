/**
 * Meta Pixel client-side helper.
 * Use for PageView, Lead, Purchase events. No PII.
 *
 * Pixel loads only when NEXT_PUBLIC_META_PIXEL_ID is set and env is production
 * (or NEXT_PUBLIC_META_PIXEL_PREVIEW=true for preview deployments).
 */

import { fireOnce } from '@/lib/eventDedupe';

/** Check if Meta Pixel should run (client-safe). */
function isPixelEnabled() {
  if (typeof window === 'undefined') return false;
  const pid = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  if (!pid) return false;
  const isProduction = process.env.NODE_ENV === 'production';
  const allowPreview = process.env.NEXT_PUBLIC_META_PIXEL_PREVIEW === 'true';
  return isProduction || allowPreview;
}

/**
 * Fire PageView. Call on route changes. Deduped per route (survives Strict Mode).
 * @param {string} routeKey - e.g. pathname + search (e.g. '/pricing?recommended=toolkit')
 */
export function pageview(routeKey) {
  if (!isPixelEnabled() || typeof window === 'undefined') return;
  if (!routeKey) return;
  fireOnce('PageView', routeKey, () => {
    if (window.fbq) {
      window.fbq('track', 'PageView');
    }
  });
}

/**
 * Fire a standard Meta event.
 * @param {string} eventName - e.g. 'Lead', 'Purchase', 'InitiateCheckout'
 * @param {object} [params] - Safe params only (content_name, value, currency). No PII.
 */
export function track(eventName, params = {}) {
  if (!isPixelEnabled() || typeof window === 'undefined') return;
  if (window.fbq) {
    window.fbq('track', eventName, params);
  }
}

/**
 * Fire Lead event (sign-up/onboarding complete). Deduped per session.
 * @param {string} [context='onboarding'] - dedupe context
 */
export function trackLead(context = 'onboarding') {
  fireOnce('Lead', context, () => {
    track('Lead', { content_name: 'signup' });
  });
}

/**
 * Fire Purchase event. Use only when payment is confirmed. Deduped per session_id.
 * @param {object} p - { tier, value, currency, sessionId? }
 * @param {string} sessionId - dedupe key; required for reliable dedupe
 */
export function trackPurchase({ tier, value, currency = 'USD' }, sessionId) {
  const context = sessionId ? `checkout:${sessionId}` : `tier:${tier}:${Date.now()}`;
  fireOnce('Purchase', context, () => {
    const params = { content_name: tier };
    if (typeof value === 'number' && value > 0) params.value = value;
    if (currency) params.currency = currency;
    track('Purchase', params);
  });
}
