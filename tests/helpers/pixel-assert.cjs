/**
 * Shared helpers for purchase pixel E2E tests.
 */
const META_PIXEL_ID = process.env.META_PIXEL_ID || '918881184164588';

function isAppError(text, location) {
  if (!text && !location) return false;
  const s = [text, location].filter(Boolean).join(' ');
  if (/605b\.ai|www\.605b\.ai|\/_next\/|\/dashboard/.test(s)) return true;
  if (/checkout\.stripe\.com|facebook\.com|connect\.facebook\.net|stripe\.com/.test(s)) return false;
  return false;
}

function assertPurchaseRequest(fbTrRequests, pixelId = META_PIXEL_ID) {
  const purchaseReqs = fbTrRequests.filter((r) => {
    const s = [r.url, r.postData].filter(Boolean).join(' ');
    return s.includes('ev=Purchase') || s.includes('"ev":"Purchase"');
  });
  const hasEvPurchase = purchaseReqs.length > 0;
  const hasId = purchaseReqs.some((r) => {
    const s = [r.url, r.postData].filter(Boolean).join(' ');
    return s.includes('id=' + pixelId) || s.includes('"id":"' + pixelId + '"');
  });
  const hasValue39 = purchaseReqs.some((r) => {
    const s = [r.url, r.postData].filter(Boolean).join(' ');
    return s.includes('value=39') || s.includes('"value":39') || s.includes('cd[value]=39');
  });
  return { passed: hasEvPurchase && hasId && hasValue39, purchaseReqs, hasEvPurchase, hasId, hasValue39 };
}

module.exports = { isAppError, assertPurchaseRequest, META_PIXEL_ID };
