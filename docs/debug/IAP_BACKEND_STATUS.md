# IAP Backend Status

Date: 2026-03-19

## Routes

- `app/api/mobile/iap/validate/route.js`
- `app/api/mobile/iap/restore/route.js`

## What Was Fixed

- Added safe env presence reporting via `getIapEnvStatus()` in `lib/iap-verify.js`
- Added safe request-body validators in `lib/iap-request.js`
- Hardened Apple verification:
  - uses `https://buy.itunes.apple.com/verifyReceipt`
  - falls back to `https://sandbox.itunes.apple.com/verifyReceipt`
  - passes shared secret as `password`
  - handles network and JSON parse failures safely
- Hardened Google verification:
  - safely parses `GOOGLE_SERVICE_ACCOUNT_JSON` with `JSON.parse`
  - returns `server misconfigured` on parse/config failure
  - initializes `GoogleAuth` safely
  - uses package name `ai.app605b` by default
  - rejects mismatched package names as `server misconfigured`
- Hardened both API routes:
  - empty or invalid body returns `{ "error": "missing required fields" }`
  - missing store env returns `{ "error": "server misconfigured" }`
  - all top-level failures return structured JSON, not 500
- Added missing `middleware.js` using `clerkMiddleware()` so `auth()` can work correctly on API routes

## Env Status

### Vercel

Verified with `vercel env ls`:

- `APPLE_IAP_SHARED_SECRET`: present in Development, Preview, Production
- `GOOGLE_SERVICE_ACCOUNT_JSON`: present in Development, Preview, Production
- `GOOGLE_PLAY_PACKAGE_NAME`: present in Development, Preview, Production

### Local runtime

Using current local env:

- `APPLE_IAP_SHARED_SECRET`: missing
- `GOOGLE_SERVICE_ACCOUNT_JSON`: missing
- `GOOGLE_PLAY_PACKAGE_NAME`: missing, defaulting to `ai.app605b`
- effective Google package name check: matches expected `ai.app605b`

## Local Smoke Tests

### Empty payloads

Local requests returned safe structured JSON:

- `POST /api/mobile/iap/validate` with `{}` -> `{ "error": "missing required fields" }`
- `POST /api/mobile/iap/restore` with `{}` -> `{ "error": "missing required fields" }`

### Valid-shaped unauthenticated payloads

Local requests returned safe auth JSON:

- `POST /api/mobile/iap/validate` -> `{ "error": "Unauthorized" }`
- `POST /api/mobile/iap/restore` -> `{ "error": "Unauthorized" }`

### Direct verifier checks

With local env missing:

- Apple verifier returns `{ valid: false, error: "server misconfigured" }`
- Google verifier returns `{ valid: false, error: "server misconfigured" }`

## Readiness

Code paths are now defensive and structured.

Production env vars are present in Vercel.

Remaining verification needed:

- one authenticated iOS test purchase against production deployment
- one authenticated Android test purchase against production deployment
- confirm `GOOGLE_PLAY_PACKAGE_NAME` value in Vercel is exactly `ai.app605b`

## Files Changed

- `lib/iap-verify.js`
- `lib/iap-request.js`
- `app/api/mobile/iap/validate/route.js`
- `app/api/mobile/iap/restore/route.js`
- `middleware.js`
