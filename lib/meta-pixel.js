/**
 * Meta Pixel helper — thin wrapper around fbq().
 * Only fires when NEXT_PUBLIC_META_PIXEL_ID is set and pixel is loaded.
 *
 * Usage:
 *   import { metaPixel } from '@/lib/meta-pixel';
 *   metaPixel.pageView();
 *   metaPixel.track('Purchase', { value: 39, currency: 'USD' });
 */

function fbq(...args) {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq(...args);
  }
}

export const metaPixel = {
  pageView() {
    fbq('track', 'PageView');
  },

  track(eventName, params = {}) {
    fbq('track', eventName, params);
  },

  trackCustom(eventName, params = {}) {
    fbq('trackCustom', eventName, params);
  },

  purchase({ value, currency = 'USD', contentName }) {
    fbq('track', 'Purchase', {
      value,
      currency,
      content_name: contentName,
    });
  },

  initiateCheckout(contentName) {
    fbq('track', 'InitiateCheckout', { content_name: contentName });
  },

  viewContent(contentName) {
    fbq('track', 'ViewContent', { content_name: contentName });
  },

  completeRegistration() {
    fbq('track', 'CompleteRegistration');
  },

  lead() {
    fbq('track', 'Lead');
  },
};
