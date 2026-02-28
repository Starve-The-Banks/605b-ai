# Meta Pixel Production Test Plan — 605b.ai

Concrete steps to verify Meta Pixel is working on production.

---

## Prerequisites

1. `NEXT_PUBLIC_META_PIXEL_ID` is set in **Vercel → Project Settings → Environment Variables → Production**
2. The value matches your pixel ID from Meta Events Manager (expected: `918881184164588`)
3. The latest deploy includes `app/components/TrackingPixels.jsx`
4. You have the [Meta Pixel Helper](https://chrome.google.com/webstore/detail/meta-pixel-helper/fdgfkebogiimcoedlicjlajpkdmockpc) Chrome extension installed

**Warning:** The pixel only loads when `NODE_ENV === 'production'`. It will NOT fire on `localhost:3000`. You must test on the deployed production URL.

---

## Test Matrix

### Test 1: Homepage PageView

| Step | Action |
|---|---|
| Open | https://www.605b.ai |
| Expected | Pixel Helper shows `PageView` event |
| Verify | Pixel ID matches (click the event in Pixel Helper to see ID) |
| Events Manager | Test Events panel shows `PageView` with URL `/` |

### Test 2: Pricing — ViewContent

| Step | Action |
|---|---|
| Open | https://www.605b.ai/pricing |
| Expected | Pixel Helper shows `PageView` + `ViewContent` |
| Verify | `ViewContent` has parameter `content_name: 'pricing'` |
| Events Manager | Test Events shows `ViewContent` |

### Test 3: Pricing — InitiateCheckout

| Step | Action |
|---|---|
| On pricing page | Click any "Buy" button (must be signed in) |
| Expected | Pixel Helper shows `InitiateCheckout` with `content_name` = tier ID |
| Note | You can cancel checkout after — the event fires on button click |

### Test 4: Sign-Up — Lead

| Step | Action |
|---|---|
| Create a new account | Sign up at https://www.605b.ai/sign-up |
| After redirect to dashboard | Pixel Helper shows `Lead` event |
| Verify | `content_name: 'signup'` |

### Test 5: Purchase (requires test purchase)

| Step | Action |
|---|---|
| Complete a Stripe checkout | Use test mode if available |
| After redirect to dashboard | Pixel Helper shows `Purchase` event |
| Verify | `content_name` = tier name, `value` = price, `currency: 'USD'` |

### Test 6: Other Pages — PageView Only

Visit each and confirm Pixel Helper shows `PageView`:
- [ ] https://www.605b.ai/about
- [ ] https://www.605b.ai/contact
- [ ] https://www.605b.ai/privacy
- [ ] https://www.605b.ai/terms

---

## Expected Event Values

| Event | Trigger Location | Key Parameters |
|---|---|---|
| `PageView` | Every page load (via `TrackingPixels.jsx`) | (none) |
| `ViewContent` | `/pricing` page mount | `{ content_name: 'pricing' }` |
| `InitiateCheckout` | Click "Buy" on pricing | `{ content_name: '<tier_id>' }` |
| `Lead` | Dashboard load after first sign-up | `{ content_name: 'signup' }` |
| `Purchase` | Dashboard load after payment confirmed | `{ content_name: '<tier>', value: <price>, currency: 'USD' }` |

---

## Events Manager Verification

1. Go to https://business.facebook.com → Events Manager
2. Select your pixel (ID: `918881184164588`)
3. Click **Test Events** tab
4. Enter `https://www.605b.ai` in the "Test browser events" field
5. Open the URL in a new tab (same browser)
6. Browse: homepage → pricing → click a buy button
7. Return to Events Manager — events should appear within 30 seconds
8. Verify event names and parameters match the table above

---

## Debug Checklist (Events Not Appearing)

### 1. Check Vercel Environment Variable

Go to **Vercel Dashboard → [Project] → Settings → Environment Variables**

| Variable | Expected | Scope |
|---|---|---|
| `NEXT_PUBLIC_META_PIXEL_ID` | `918881184164588` | Production |

If missing or only set for "Preview":
1. Add it with scope **Production**
2. **Redeploy** the production branch (env var changes require a new deploy)

### 2. Check HTML Source

1. Open https://www.605b.ai in Chrome
2. View Page Source (Ctrl+U / Cmd+U)
3. Search for `connect.facebook.net` — should find the fbevents.js script tag
4. Search for `fbq('init'` — should find initialization with your pixel ID
5. If NOT found, the env var is missing or the deploy is stale

### 3. Check for Ad Blockers

- Disable uBlock Origin, AdBlock, Brave Shields, or any ad blocker
- Pixel Helper won't detect events if the pixel script is blocked

### 4. Check Console Errors

1. Open DevTools (F12) → Console
2. Look for errors containing `fbq`, `fbevents`, or `facebook`
3. Common error: "fbq is not defined" — means the pixel script failed to load

### 5. Check Network Tab

1. Open DevTools → Network tab
2. Reload the page
3. Filter by `facebook` or `fbevents`
4. You should see:
   - `fbevents.js` script load (200 OK)
   - `tr?` pixel fire requests (200 or 204)
5. If `fbevents.js` is blocked or fails, check CSP headers or ad blockers

### 6. Debug Mode

Set `NEXT_PUBLIC_PIXEL_DEBUG=true` in Vercel environment variables and redeploy. This adds console logging:

```
[MetaPixel] META_PIXEL_ID= 91888... typeof window.fbq= function
```

Remove this after debugging.

---

## Automated Checks

### Lightweight (no browser needed)

```bash
node scripts/launch/smoke-prod-meta-pixel.mjs
```

Fetches production HTML and checks for pixel patterns. Outputs PASS/FAIL per route.

### Full Browser (Playwright, requires install)

```bash
node scripts/verify-meta-pixel.mjs
```

Launches a real browser, checks for fbevents.js load and facebook.com/tr requests.

---

## Aggregated Event Measurement (AEM) Setup

After domain verification is complete:

1. Go to **Events Manager → Settings → Aggregated Event Measurement**
2. Click **Configure Web Events** for `605b.ai`
3. Set priority (highest first):
   1. `Purchase`
   2. `InitiateCheckout`
   3. `ViewContent`
   4. `Lead`
   5. `PageView`
4. Save configuration
