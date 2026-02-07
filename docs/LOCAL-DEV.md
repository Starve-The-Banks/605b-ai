# Local development

## Required environment variables

Copy `.env.example` to `.env.local` and set at least:

- **Clerk** – `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` (and sign-in/sign-up URLs if you override them).
- **Anthropic** – `ANTHROPIC_API_KEY` (for AI/analysis features).

## Optional: Upstash Redis

- **UPSTASH_REDIS_REST_URL**, **UPSTASH_REDIS_REST_TOKEN**

If these are **not** set, the app still runs:

- **User-data and flagged items** – Stored in an in-memory fallback (not persisted; lost on restart). `/api/user-data`, `/api/user-data/flagged`, and `/api/user-data/profile` return 200 with empty or in-session data.
- **Rate limiting** – Fails open (all requests allowed) when Redis is unavailable.
- **Payments / webhooks / tier sync** – Require Redis in production; in local dev without Redis, payment and entitlement flows will not persist tier state.

You will see a single log line at first use:  
`[redis] UPSTASH_REDIS_REST_URL/TOKEN not set; using in-memory fallback (data not persisted).`

## Running locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign-in and dashboard should load without Upstash env warnings or `/api/user-data/profile` 404s.
