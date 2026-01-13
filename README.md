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

## Deployment

Deployed on Vercel. Environment variables configured in Vercel dashboard.

```bash
# Build for production
npm run build

# Deploy (auto on push to main)
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
