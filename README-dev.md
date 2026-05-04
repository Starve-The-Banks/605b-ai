# Local Developer Notes

## AI Assistant Validation (Local Only)

1. Start server:
   `ENABLE_DEV_TOKEN_ENDPOINT=true npm run dev`

2. Log into app in browser.

3. Run:
   `npm run validate:ai:local`

Notes:
- The dev token endpoint is guarded by `ENABLE_DEV_TOKEN_ENDPOINT=true`.
- Validator auto-token fallback is disabled outside localhost.

## Sentry Source-Map Upload Setup

- Use server-side env vars only for Sentry source-map upload: `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`.
- Never commit a real `SENTRY_AUTH_TOKEN` to git.
- Add `SENTRY_AUTH_TOKEN` in Vercel Environment Variables for each target environment.
- Token permissions should include org/project release upload access.

Vercel commands:

`vercel env add SENTRY_AUTH_TOKEN production`

`vercel env add SENTRY_AUTH_TOKEN preview`

`vercel env add SENTRY_AUTH_TOKEN development`
