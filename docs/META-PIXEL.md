# Meta Pixel Integration

## Overview

Meta Pixel is installed for conversion-optimized ad campaigns. No PII is sent.

## Installation

- **Location:** app/layout.js mounts TrackingPixels (client component)
- **Pixel base:** app/components/TrackingPixels.jsx loads the Meta Pixel script via next/script when NEXT_PUBLIC_META_PIXEL_ID is set
- **Env:** Pixel loads only in production unless NEXT_PUBLIC_META_PIXEL_PREVIEW=true

## Events

| Event | When | Where | Dedupe Key |
|-------|------|-------|------------|
| **PageView** | Once per unique route (path+search) per session | TrackingPixels via lib/metaPixel.pageview(routeKey) | meta:PageView:&lt;pathname&gt;?&lt;search&gt; |
| **Lead** | Onboarding complete or skip only (not on tier redirect) | app/dashboard/layout.jsx handleOnboardingComplete, handleOnboardingSkip | meta:Lead:onboarding |
| **Purchase** | Confirmed success only (success=true + session_id) | (1) Dashboard ?success=true&tier=...&session_id=... (2) identity-theft/success session_id | meta:Purchase:checkout:&lt;session_id&gt; |

## Deduplication

- lib/eventDedupe.js uses sessionStorage. Prevents duplicates across React Strict Mode and route transitions.
- Lead: single fire per session at onboarding completion (complete or skip). No lead on tier selection redirect.
- Purchase: single fire per session_id per session.
- PageView: single fire per unique route per session (no double-fire on mount).

## Parameters

- **Lead:** { content_name: signup } (no PII)
- **Purchase:** { content_name: tier, value, currency } (value only when known)

## UTM Handling

- lib/utm.js preserves utm_source, utm_medium, utm_campaign, utm_term, utm_content, and fbclid when redirecting
- fbclid (Meta click ID) is preserved for attribution
- Used in OnboardingWizard when redirecting to /pricing
- No PII stored

## Local Verification

1. Set NEXT_PUBLIC_META_PIXEL_ID and NEXT_PUBLIC_META_PIXEL_PREVIEW=true in .env.local
2. Build and run: npm run build && npm run start
3. DevTools Console: typeof fbq should be function
4. Complete onboarding → Lead; complete payment → Purchase

## Manual Steps Remaining (Meta Events Manager)

1. Domain verification: Add and verify your domain in Events Manager
2. Aggregated Event Measurement (AEM): Configure priority for conversion events (Purchase, Lead, PageView)
3. Test Events: Use Events Manager to verify events are received
