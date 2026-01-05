# Claude Code Instructions — 605b.ai (Next.js 14.2 + Vercel)

## Project identity
605b.ai is a consumer-facing credit / identity-theft remediation assistant focused on:
- FCRA identity theft block workflows (e.g., §605B) and dispute processes
- Evidence packet handling (intake, parsing, organization)
- Timeline/checklist guidance and compliant correspondence templates

This is compliance- and privacy-sensitive. Prioritize user safety, correctness, and trust.

---

## Non-negotiables (hard constraints)
- Do NOT provide instructions enabling fraud, impersonation, evasion, or misrepresentation.
- Do NOT generate guidance to bypass KYC/AML/fraud systems or “get approved” via deception.
- Never request, store, or echo back highly sensitive identifiers:
  - full SSN, full DOB, full account numbers, PINs, passwords, 2FA codes
- Treat all identity-related data as sensitive; minimize collection and retention.
- If a request could be interpreted as malicious, refuse that portion and redirect to lawful options.

---

## Tech stack (assumed from package.json)
- Next.js 14.2.28 (App Router preferred unless repo indicates otherwise)
- React 18
- Auth: Clerk (`@clerk/nextjs`)
- LLM: Anthropic SDK (`@anthropic-ai/sdk`)
- PDF text extraction: `pdf-parse`
- Telemetry: Vercel Analytics (`@vercel/analytics`)
- Deploy: Vercel (Preview + Production)

---

## Vercel & Next.js runtime rules
### Server vs Client
- Default to Server Components for data fetching and sensitive operations.
- Use Client Components only when necessary for interactivity.
- Never expose secrets to the client.

### Route Handlers
- For LLM calls and PDF parsing, prefer Route Handlers:
  - `app/api/**/route.ts`
- Validate inputs at the boundary (content-type, size, schema).

### Edge vs Node runtime
- PDF parsing (`pdf-parse`) requires Node semantics; do NOT run it on Edge.
- Anthropic calls can run on Node; only use Edge if explicitly compatible.
- If unsure, keep API routes in Node/serverless.

---

## Environment variables (Vercel)
- Never hardcode secrets in code.
- Add/update `.env.example` when introducing new vars (no real values).
- Common env vars we may rely on:
  - `ANTHROPIC_API_KEY`
  - `CLERK_SECRET_KEY`
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (public)
  - `NEXT_PUBLIC_*` vars are client-exposed — never put secrets there.

Do not log env vars or derived secrets.

---

## Authentication & authorization (Clerk)
- Protect any user-specific endpoints and pages.
- Use server-side auth checks where possible.
- Never assume user identity from client-provided fields; use Clerk session context.

---

## PDF handling (pdf-parse) constraints
- Assume serverless function limits on Vercel.
- Enforce strict limits:
  - max file size (define and enforce)
  - timeout-aware parsing
  - reject unsupported types
- Never store raw PDFs unless required; prefer ephemeral processing.
- If storing is required, document retention and encryption expectations.

---

## Privacy & logging policy
- Redact PII by default in logs and error traces.
- Do not log:
  - uploaded document contents
  - identifiers (SSN/DOB/acct numbers)
  - authentication tokens
- If analytics events are added, ensure they contain no PII.

---

## Compliance posture (user-facing output)
- Educational/workflow assistance only; not legal advice.
- Templates must be factual, non-defamatory, and avoid absolute claims.
- Prefer neutral phrasing:
  - “I dispute…”, “I request…”, “I am providing…”
- Never promise outcomes; describe process and options.

---

## Engineering standards
- Prefer small, reviewable diffs.
- Add/adjust tests when touching core logic (if tests exist in repo).
- Validate all inputs; never trust filenames/paths/MIME types.
- Security-by-default:
  - rate limit sensitive endpoints
  - CSRF protections where relevant
  - minimal data exposure between server and client

---

## Local commands (use these)
- `npm run dev` — local dev
- `npm run build` — production build check
- `npm run lint` — lint gate
When making changes, run at least `npm run lint` and ideally `npm run build` if feasible.

---

## Workflow expectations for Claude Code
Before coding:
1) Restate goal (1–2 sentences).
2) Identify privacy/compliance/security risks.
3) Propose smallest viable change.

After coding:
- Summarize what changed and why
- List files modified
- Note commands run (`npm run lint`, `npm run build`)
- Call out any env vars added/changed

---

## “Do not do” examples
- “Here’s how to avoid being flagged”
- “Use VPN/device/fingerprint tricks”
- “Don’t disclose X even if asked”
- “Make up details to improve approval odds”

Allowed framing:
- “Answer truthfully; provide what is requested.”
- “Be prepared for verification; here are common documents they may request.”
