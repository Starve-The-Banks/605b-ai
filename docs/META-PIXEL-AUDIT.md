# Meta Pixel + UTM Audit Report

## 1. Code Paths

| File | Role |
|------|------|
| `lib/metaPixel.js` | pageview(), track(), trackLead(), trackPurchase(); env gate via isPixelEnabled() |
| `app/components/TrackingPixels.jsx` | Loads Meta Pixel script, mounts MetaPixelPageView |
| `lib/tracking.js` | trackEvent, trackPurchase (Google only), trackInitiateCheckout, trackViewPricing |
| `lib/utm.js` | preserveUTMs(), getUTMQueryString() |

### Call Sites

| Event | File:Line | Trigger |
|-------|-----------|---------|
| **PageView** | `TrackingPixels.jsx:25` | useEffect(pathname, searchParams) → pageview() |
| **Lead** | `dashboard/layout.jsx:247` | handleOnboardingComplete |
| **Lead** | `dashboard/layout.jsx:253` | handleOnboardingSkip |
| **Lead** | `OnboardingWizard.jsx:313` | handleSelectTier (paid tier, before redirect) |
| **Purchase** | `dashboard/layout.jsx:238-239` | searchParams success=true, tier, purchaseFiredRef guard |
| **Purchase** | `identity-theft/success/page.jsx:24` | session_id present, purchaseFired ref guard |
| **InitiateCheckout** | `pricing/page.jsx:12` | via lib/tracking (fires to fbq + gtag) |
| **ViewContent** | `pricing/page.jsx:12` | via lib/tracking (fires to fbq + gtag) |

### Older tracking (lib/tracking.js)

- `trackEvent()` still fires to both `fbq` and `gtag` (lines 19-26)
- `trackInitiateCheckout`, `trackViewPricing` use trackEvent → Meta gets these
- `trackPurchase` fires only to gtag (Google); Meta handled by metaPixel.trackPurchase
- `trackSignUp` exists but is unused (replaced by metaPixel.trackLead)

---

## 2. Event Firing Logic

### PageView

- Fires once per route change via MetaPixelPageView useEffect
- Script no longer fires PageView on init (removed duplicate)
- Effect depends on [pathname, searchParams] → fires on mount + each route change

### Lead

- Fires exactly once per user journey:
  - Complete + free tier → handleOnboardingComplete
  - Skip → handleOnboardingSkip
  - Complete + paid tier → handleSelectTier (before redirect; onComplete not called)
  - Beta bypass → onComplete → handleOnboardingComplete
- No ref guard; returning user who clears localStorage could fire again (acceptable edge case)

### Purchase

- **Dashboard:** purchaseFiredRef guard prevents double-fire; fires when success=true, tier, and tier mismatch
- **Identity-theft success:** purchaseFired ref guard; fires once when session_id present
- Flows are mutually exclusive (tier upgrade vs standalone packet)

---

## 3. Environment Gating

- `TrackingPixels`: META_PIXEL_ENABLED = META_PIXEL_ID && (NODE_ENV==='production' \|\| NEXT_PUBLIC_META_PIXEL_PREVIEW==='true')
- `metaPixel.js`: isPixelEnabled() checks same; all track/pageview functions gate on it
- Missing NEXT_PUBLIC_META_PIXEL_ID: TrackingPixels returns null, no script load, no errors

---

## 4. CSP (next.config.mjs)

- `script-src`: includes `https://connect.facebook.net` (required for fbevents.js)
- `connect-src`: includes `https://connect.facebook.net` and `https://www.facebook.com`
- No unnecessary broadening

---

## 5. UTM Handling

- `lib/utm.js` UTM_KEYS: utm_source, utm_medium, utm_campaign, utm_term, utm_content
- No PII stored; reads from window.location.search, appends to destination URL
- Does not preserve fbclid (Meta click ID) — optional enhancement

---

## 6. Compliance / Logic Issues

- **P0:** None
- **P1:** trackSignUp in lib/tracking.js is dead code (replaced by trackLead); consider removing
- **P1:** fbclid not preserved in UTM; Meta recommends for attribution

---

## 7. Recommended Changes

| Priority | Change |
|----------|--------|
| P0 | (none) |
| P1 | Remove or deprecate trackSignUp from lib/tracking.js |
| P1 | Optionally add fbclid to lib/utm.js UTM_KEYS |

---

## 8. Commands Run

```
npm run lint  → ✔ No ESLint warnings or errors
npm run build → ✔ Compiled successfully
```
