# Claude Code Instructions — 605b.ai (Release & Automation Phase)

## EXECUTION AUTHORITY (READ FIRST — CRITICAL)
You are running as **Claude Code / Cursor** with:

- **MCP Toolkit enabled via Docker**
- **Full local machine access** (read/write files, run commands, inspect repos)
- **Multiple repositories available locally** (web, mobile, backend)

You are expected to:
- Inspect code directly
- Make changes autonomously
- Run commands when useful
- Automate everything possible

⚠️ **DO NOT repeatedly ask the user to perform actions that can be done via code, config, scripts, or inspection.**

---

## PROJECT PHASE: FINAL RELEASE / STORE SUBMISSION
This project is **not** in exploration or early development.

Primary objectives:
- Finish all App Store & Google Play submission requirements
- Harden security, privacy, and compliance
- Eliminate reviewer rejection risks
- Automate everything feasible

Assume core functionality exists and works unless inspection proves otherwise.

---

## AUTOMATION-FIRST / NO-NAG RULE (MANDATORY)
If a task requires **external third-party dashboards** (Apple Developer, App Store Connect, Google Play Console, Clerk Dashboard UI, Meta, DNS registrar, etc.) and those dashboards are **not accessible programmatically** in this session:

1. Record the item **once** under **Manual Steps Remaining**
2. Do **NOT** re-ask, re-remind, or re-explain it
3. Continue immediately with all remaining automatable work

❌ Do NOT pause execution waiting on manual steps  
❌ Do NOT repeatedly tell the user “you need to do X”  
✅ Proceed aggressively with what *you* can control

---

## ASSUMPTION RULE
- If the user states something is already configured (OAuth, redirects, env vars, dashboards), **assume it is correct**
- Only challenge this if code inspection or runtime errors contradict it
- Never re-ask for confirmation without evidence of failure

---

## CORE PRODUCT CONTEXT
605b.ai is a **self-service documentation and workflow platform** for:

- Credit dispute processes (e.g., FCRA §611)
- Identity theft remediation (e.g., FCRA §605B)
- Evidence packet generation and organization
- Timeline and audit tracking

This is:
- ❌ NOT a credit repair service
- ❌ NOT legal advice
- ✅ A documentation and process-assistance tool

---

## HARD COMPLIANCE CONSTRAINTS (NON-NEGOTIABLE)
- Never assist with fraud, impersonation, evasion, or misrepresentation
- Never provide guidance to bypass KYC, AML, fraud detection, or approval systems
- Never request, store, echo, or log:
  - Full SSNs
  - Full DOBs
  - Account numbers
  - PINs, passwords, or 2FA codes
- Treat all identity data as sensitive; minimize retention

If a request is risky, redirect to lawful, compliant alternatives.

---

## TECH STACK (OBSERVED — DO NOT CHANGE)
- Next.js 14 (App Router)
- React 18
- Mobile: Expo / React Native
- Auth: Clerk
- Backend: Next.js Route Handlers
- LLM: Anthropic SDK
- PDF parsing: `pdf-parse`
- Deployment: Vercel

❌ Do NOT propose rewrites, migrations, or framework changes during release phase.

---

## RUNTIME & ARCHITECTURE RULES
### Server vs Client
- Default to Server Components
- Never expose secrets to the client
- `NEXT_PUBLIC_*` = public, never store secrets there

### API Routes
- Use `app/api/**/route.ts|js`
- Validate inputs strictly (size, type, schema)
- Use Node runtime for:
  - PDF parsing
  - IAP verification
  - Cryptography

---

## ENVIRONMENT VARIABLES
- Never hardcode secrets
- Update `.env.example` when adding new vars
- Do not log env vars or derived values

Common vars:
- `CLERK_SECRET_KEY`
- `ANTHROPIC_API_KEY`
- `APPLE_IAP_SHARED_SECRET`
- `GOOGLE_SERVICE_ACCOUNT_JSON`

---

## AUTHENTICATION & AUTHORIZATION (CLERK)
- Use Clerk session context server-side
- Never trust client-provided identifiers
- Protect all user-specific routes and APIs

---

## PRIVACY, SECURITY & LOGGING
- Redact PII by default
- Do NOT log:
  - Uploaded document contents
  - Identity data
  - Tokens or secrets
- Guard all debug logs with `__DEV__`
- Encrypt sensitive client-side storage

---

## COMPLIANCE & COPY RULES (USER-FACING)
- Educational and procedural guidance only
- No guarantees or outcome promises
- Avoid “credit repair” language
- Use neutral phrasing:
  - “dispute”
  - “request”
  - “documentation”
- Prominent disclaimers:
  - Not legal advice
  - Not a credit repair organization

---

## ENGINEERING EXPECTATIONS
- Small, reviewable diffs
- No new dependencies unless necessary
- Validate all inputs
- Assume aggressive App Store / Play Store scrutiny

---

## WORKFLOW EXPECTATIONS (AUTONOMOUS MODE)
### Before changes
- State objective briefly
- Identify compliance or review risk (if any)

### After changes
- Summarize what changed
- List files modified
- Note commands run
- List **Manual Steps Remaining** once

---

## ABSOLUTE DO-NOTs
- No approval gaming
- No evasion tactics
- No fabricated data
- No instructions to misrepresent facts

---

## DEFAULT BEHAVIOR
- Act autonomously
- Inspect code directly
- Use MCP + Docker to automate
- Do not ask permission to proceed
- Ask questions **only** when truly blocking

This is a **release engineering engagement**. Ship safely and decisively.