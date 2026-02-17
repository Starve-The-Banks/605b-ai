/**
 * Session-scoped event deduplication for Meta Pixel.
 * Prevents duplicate Lead/Purchase/PageView across Strict Mode and route transitions.
 * Uses sessionStorage (cleared when tab closes). No PII.
 *
 * Key format: meta:<EventName>:<context>
 * Examples: meta:Lead:onboarding, meta:Purchase:checkout:cs_xxx, meta:PageView:last
 */

const PREFIX = 'meta:';

function getKey(eventName, context) {
  return `${PREFIX}${eventName}:${context}`;
}

/**
 * Check if we should fire (not already fired this session).
 * @param {string} eventName - e.g. 'Lead', 'Purchase', 'PageView'
 * @param {string} context - e.g. 'onboarding', 'checkout:cs_xxx', 'last'
 * @returns {boolean} true if safe to fire
 */
export function shouldFire(eventName, context) {
  if (typeof window === 'undefined') return false;
  try {
    const key = getKey(eventName, context);
    return !sessionStorage.getItem(key);
  } catch {
    return true; // storage full/disabled: allow fire
  }
}

/**
 * Mark event as fired. Call after firing.
 * @param {string} eventName
 * @param {string} context
 */
export function markFired(eventName, context) {
  if (typeof window === 'undefined') return;
  try {
    const key = getKey(eventName, context);
    sessionStorage.setItem(key, '1');
  } catch {
    // ignore
  }
}

/**
 * Fire only if not already fired this session. Marks as fired on success.
 * @param {string} eventName
 * @param {string} context
 * @param {() => void} fire - callback that performs the actual fire
 * @returns {boolean} true if fired
 */
export function fireOnce(eventName, context, fire) {
  if (!shouldFire(eventName, context)) return false;
  fire();
  markFired(eventName, context);
  return true;
}
