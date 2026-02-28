# Launch Ops — 605b.ai

## Quick Start

```bash
# Check local Meta Pixel env config
node scripts/launch/check-meta-env.mjs

# Smoke test production for pixel presence
node scripts/launch/smoke-prod-meta-pixel.mjs

# Run all launch readiness checks (lint + build + pixel)
bash scripts/launch/run-launch-checks.sh
```

## Checklists (complete in this order)

| # | Document | Purpose |
|---|---|---|
| 1 | [META_VERIFICATION_CHECKLIST.md](META_VERIFICATION_CHECKLIST.md) | Step-by-step Meta setup: domain, business, pixel, warm-up |
| 2 | [META_PIXEL_PROD_TEST_PLAN.md](META_PIXEL_PROD_TEST_PLAN.md) | Verify pixel fires correct events on production |
| 3 | [META_REVIEWER_COMPLIANCE_SNIPPETS.md](META_REVIEWER_COMPLIANCE_SNIPPETS.md) | Safe copy + banned phrases + appeal templates |
| 4 | [SOCIAL_ACCOUNT_SETUP_CHECKLIST.md](SOCIAL_ACCOUNT_SETUP_CHECKLIST.md) | LinkedIn, X, Discord account setup |

## Reference Documents

| Document | Purpose |
|---|---|
| [META_LAUNCH_STACK.md](META_LAUNCH_STACK.md) | Ad angles, headlines, primary texts, warm-up schedule |
| [META_EXECUTION_PACKET.md](META_EXECUTION_PACKET.md) | Business Manager naming, domain/business verification, pixel setup |
| [SOCIAL_LAUNCH_PACKET.md](SOCIAL_LAUNCH_PACKET.md) | LinkedIn posts, X tweets, Discord channel/roles/auto-mod |

## Strict Order of Operations

1. **Deploy** trust signals (SiteFooter + /contact page) to production
2. **Verify** footer consistency across all pages
3. **Set** `NEXT_PUBLIC_META_PIXEL_ID` in Vercel production env vars → **redeploy**
4. **Run** `node scripts/launch/smoke-prod-meta-pixel.mjs` to confirm pixel
5. **Complete** Meta Business Manager setup (Step 3 in checklist)
6. **Complete** domain verification (Step 4 in checklist)
7. **Complete** business verification (Step 5 in checklist)
8. **Set up** LinkedIn + X accounts (Social Account Setup Checklist)
9. **Create** first ad campaign with Credit Special Ad Category
10. **Follow** warm-up spend plan (Traffic only for 14 days)

## Scripts

| Script | What it does |
|---|---|
| `scripts/launch/check-meta-env.mjs` | Checks local .env files for Meta Pixel config |
| `scripts/launch/smoke-prod-meta-pixel.mjs` | Fetches prod HTML, checks for pixel patterns |
| `scripts/launch/run-launch-checks.sh` | Runs all checks: env, lint, build, prod smoke |
| `scripts/verify-meta-pixel.mjs` | Full Playwright browser test (requires `npx playwright install`) |
