# 605b.ai

Credit dispute documentation software for identity theft victims. Built on FCRA Section 605B procedures.

## What It Is

Self-service software tools to help users:
- Analyze credit reports and identify disputable items
- Generate FCRA-compliant letter templates
- Track dispute deadlines and bureau response windows
- Maintain an audit trail for documentation

## What It Is NOT

- ❌ Not a credit repair organization (CRO)
- ❌ Not a credit repair service
- ❌ Not a law firm or legal service
- ❌ Does not send letters on your behalf
- ❌ Does not contact creditors or bureaus for you
- ❌ No outcome guarantees

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Auth:** Clerk
- **Database:** Upstash Redis
- **Payments:** Stripe (one-time payments only)
- **AI:** Anthropic Claude
- **TTS:** ElevenLabs (optional)
- **Hosting:** Vercel

## Route Map

### Public Routes (no auth required)
```
/                   → Landing page
/pricing            → Pricing tiers
/privacy            → Privacy policy
/terms              → Terms of service
/sign-in            → Clerk sign-in
/sign-up            → Clerk sign-up
```

### Protected Routes (auth required)
```
/dashboard          → Main app (PDF analysis)
/dashboard/ai-strategist → AI chat assistant
/dashboard/templates     → Letter template library
/dashboard/tracker       → Dispute tracking
/dashboard/flagged       → Flagged items
/dashboard/audit-log     → Action history
/dashboard/settings      → User preferences
```

### API Routes
```
/api/analyze        → PDF analysis (Claude)
/api/chat           → AI chat (Claude)
/api/tts            → Text-to-speech (ElevenLabs)
/api/user-data/*    → User data persistence
/api/stripe/*       → Payment processing
```

## Local Development

```bash
# Install dependencies
npm install --legacy-peer-deps

# Copy environment template
cp .env.example .env.local

# Fill in your API keys in .env.local

# Run development server
npm run dev
```

## Environment Variables

See `.env.example` for all required variables:
- `ANTHROPIC_API_KEY` - Claude API
- `CLERK_*` - Authentication
- `UPSTASH_*` - Redis database
- `STRIPE_*` - Payments
- `ELEVENLABS_API_KEY` - TTS (optional)


## E2E Tests (Purchase Meta Pixel)

Two-lane verification system that keeps production safe:

### One-time auth setup

```bash
# Opens a browser — sign in manually, session is saved for all future tests
npm run auth:save
```

### Lane 1: Prod-safe pixel verification (no charges)

Verifies the Meta Purchase pixel fires correctly against production WITHOUT
creating any real Stripe checkout or charging anything. Intercepts the
`/api/stripe/session` response to simulate a paid session.

```bash
npm run purchase:pixel:prod-safe
```

### Lane 2: Full Stripe checkout E2E (preview only, test mode)

Runs a real Stripe Checkout with test card 4242 against a **preview deployment**
that uses Stripe test-mode keys. Never touches production Stripe.

```bash
PREVIEW_URL=https://your-preview-url.vercel.app npm run purchase:pixel:preview-e2e
```

### Stripe test-mode setup for Lane 2

1. Go to [Stripe Dashboard](https://dashboard.stripe.com) and toggle **Test mode** (top-right switch)
2. Copy your test API keys from Developers > API keys:
   - `sk_test_...` (Secret key)
   - `pk_test_...` (Publishable key)
3. Create three test-mode Prices (Products > + Add product, or use existing products):
   - **Dispute Toolkit**: $39.00 USD, one-time → copy `price_...` ID
   - **Advanced Dispute Suite**: $89.00 USD, one-time → copy `price_...` ID
   - **605B Identity Theft Toolkit**: $179.00 USD, one-time → copy `price_...` ID
4. Set Vercel Preview env vars:

```bash
vercel env add STRIPE_SECRET_KEY_TEST preview --scope 605b-ai
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST preview --scope 605b-ai
vercel env add STRIPE_TOOLKIT_PRICE_ID_TEST preview --scope 605b-ai
vercel env add STRIPE_ADVANCED_PRICE_ID_TEST preview --scope 605b-ai
vercel env add STRIPE_IDENTITY_THEFT_PRICE_ID_TEST preview --scope 605b-ai
vercel env add STRIPE_MODE preview --scope 605b-ai   # value: test
```

5. Redeploy preview: `git push origin main` (or `vercel --scope 605b-ai`)
6. Run: `PREVIEW_URL=https://... npm run purchase:pixel:preview-e2e`

### Checklist

- [ ] `npm run auth:save` — sign in once, save session
- [ ] `npm run purchase:pixel:prod-safe` — verify pixel fires (no charges)
- [ ] Set Stripe test keys on Vercel Preview
- [ ] Redeploy preview
- [ ] `PREVIEW_URL=https://... npm run purchase:pixel:preview-e2e` — full checkout E2E

## Deployment

Deployed on Vercel (project **605b-ai**, scope `--scope 605b-ai`). Environment variables configured in Vercel dashboard.

```bash
# Build for production
npm run build

# Deploy to production (use safe script; never use raw vercel --prod)
npm run vercel:prod:safe

# Verify domain routing
npm run vercel:check:domains

# Auto-deploy on push to main (via Vercel Git integration)
git push origin main
```

## Legal Entity

**Ninth Wave Analytics LLC**  
Delaware Limited Liability Company

## License

Proprietary. All rights reserved.

Copyright © 2026 Ninth Wave Analytics LLC

## Disclaimer

605b.ai provides self-service software tools and educational information only. We are not a credit repair organization, law firm, or credit counseling service. We do not provide legal advice, credit repair services, or guarantees of any outcomes. Results depend entirely on individual circumstances. See `/terms` for full disclaimer.
