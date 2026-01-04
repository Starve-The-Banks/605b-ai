# 605b.ai - Statute-Driven Credit Repair Workflow

AI-powered credit repair assistant with legal workflow automation.

## Features

### 🔄 Complete Workflow
1. **INTAKE** — Identify fraudulent accounts through guided questions
2. **EVIDENCE** — Build your case file (FTC report, ID, breach docs)
3. **GENERATOR** — Create statute-compliant dispute letters
4. **TRACKER** — Monitor deadlines (4 days for §605B, 30 for §611)
5. **ESCALATION** — CFPB & State AG complaint guidance
6. **AUDIT LOG** — Timestamped proof trail for litigation

### 📝 Letter Templates
- §605B Identity Theft Block (4-day requirement)
- §611 Standard Disputes (30-day requirement)
- FDCPA §809 Debt Validation
- CFPB Complaint Template
- Appeal/Escalation Letters

### 🤖 AI Chat
- Natural conversation about your situation
- Statute-grounded guidance
- Step-by-step instructions

### 📅 Deadline Tracking
- Automatic deadline calculation
- Visual countdown
- Overdue alerts
- One-click escalation

### 📋 Audit Log
- Every action timestamped
- Exportable JSON for litigation
- CFPB complaint evidence

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Add your API key
cp .env.example .env.local
# Edit .env.local with your Anthropic API key

# 3. Run development server
npm run dev

# 4. Open http://localhost:3000
```

---

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Connect to Vercel: vercel.com/new
3. Add environment variable: `ANTHROPIC_API_KEY`
4. Deploy

### Custom Domain

In Vercel dashboard:
1. Go to Settings → Domains
2. Add `605b.ai` or your domain
3. Update DNS as instructed

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Your Claude API key from console.anthropic.com |

---

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **AI:** Claude API (Sonnet)
- **Styling:** Inline styles (no dependencies)
- **Storage:** localStorage for client-side persistence

---

## Cost Estimate

| Usage | Monthly Cost |
|-------|-------------|
| 100 users | ~$15 |
| 1,000 users | ~$150 |
| 10,000 users | ~$1,500 |

Based on ~$0.02-0.05 per conversation.

---

## Legal Disclaimers

This tool provides educational information about consumer protection laws. It is not legal advice. Consult a qualified attorney for legal matters.

---

## License

MIT
