/**
 * UTM preservation for analytics. No PII.
 * Append UTM params and fbclid when redirecting so ad attribution carries through.
 */

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid'];

/**
 * Get current UTM params from window.location.search.
 * @returns {string} Query string fragment (e.g. '&utm_source=facebook&utm_medium=paid')
 */
export function getUTMQueryString() {
  if (typeof window === 'undefined') return '';
  const params = new URLSearchParams(window.location.search);
  const utmParams = new URLSearchParams();
  for (const key of UTM_KEYS) {
    const val = params.get(key);
    if (val) utmParams.set(key, val);
  }
  const str = utmParams.toString();
  return str ? `&${str}` : '';
}

/**
 * Append current UTM params to a URL. Use when redirecting.
 * @param {string} url - Base URL (e.g. '/pricing?recommended=toolkit')
 * @returns {string} URL with UTMs appended
 */
export function preserveUTMs(url) {
  const qs = getUTMQueryString();
  if (!qs) return url;
  try {
    const u = new URL(url, window.location.origin);
    const sep = u.search ? '&' : '?';
    u.search += sep + qs.slice(1); // remove leading &
    return u.pathname + u.search;
  } catch {
    return url + (url.includes('?') ? '&' : '?') + qs.slice(1);
  }
}
