# 605b.ai Feature Documentation

> CreditClear - Statute-driven credit repair platform by Ninth Wave Analytics LLC

---

## Feature Inventory

### Landing Pages & Public Routes
- Marketing landing page (605b.ai)
- dispute.tools landing page (search intent targeting)
- fixmy.credit landing page (consumer-focused funnel)
- Legal compliance pages (Terms of Service, Privacy Policy)
- Sign-in / Sign-up flows (Clerk-powered)
- Public resource links (AnnualCreditReport.com, CFPB, FTC)

### Authorized Pages
- User onboarding flow
- Account settings / profile management
- Subscription management
- Support / help center access

### Dashboard Layout + Workflows
Six-page dashboard with gold theme (#f7d047), 3-column layout, collapsible AI sidebar:

1. **Analyze** - Upload and parse credit reports, view flagged items
2. **AI Strategist** - Chat-based guidance for dispute strategy
3. **Templates** - Access 62 letter templates across 7 categories
4. **Tracker** - Monitor dispute status, deadlines, responses
5. **Flagged** - Review problematic items requiring action
6. **Audit** - Complete activity log for compliance and potential litigation

### PDF Credit Report Upload + Parsing
- In-memory PDF processing (no server storage)
- Support for Equifax, Experian, TransUnion formats
- Account extraction and categorization
- Closed account detection (with proper good-standing handling)
- Error identification and flagging logic
- Prominent privacy messaging for user trust

### AI Analysis Endpoints
- Claude API integration for dispute strategy
- Contextual analysis of flagged items
- Statutory compliance checking
- Letter content suggestions
- Voice conversation mode (ElevenLabs TTS)

### Letter Generation (Templates)
62 professionally-crafted templates across 7 categories:
- FCRA Section 605B identity theft disputes
- FCRA general dispute letters
- FDCPA debt collector responses
- FCBA billing error disputes
- Creditor direct communications
- Bureau escalation letters
- State attorney general complaints

Each template includes:
- Proper legal citations
- Statutory requirements
- Deadline calculations
- Certified mail recommendations

### Tracking System
- Dispute status workflow (Draft → Sent → Pending → Resolved)
- Deadline tracking with statutory timeframes
- Response logging
- Follow-up reminders
- Escalation triggers

### Audit Log
- Complete activity history
- Timestamp and action recording
- User action attribution
- Export capabilities (CSV)
- Litigation-ready documentation

### Payments (Stripe)
- Stripe Atlas integration for payment processing
- Subscription management
- Plan tier differentiation
- Secure checkout flow

### TTS Integration (ElevenLabs)
- Voice-to-voice chat functionality
- Rate limiting for API quota protection
- Desktop, mobile, and app support
- Graceful fallback options
- Accessibility-first design

---

## Data Model

### Users
- Clerk-managed authentication
- Google/Apple sign-in options
- Profile information
- Subscription status
- Preferences

### Reports
- Uploaded credit report metadata
- Bureau source (Equifax, Experian, TransUnion)
- Upload timestamp
- Analysis status
- Associated items

### Items
- Individual account/tradeline records
- Account type classification
- Status (Open, Closed, Derogatory, etc.)
- Flagged status with reason codes
- Dispute history

### Letters
- Template reference
- Generated content
- Target recipient (bureau, creditor, collector)
- Associated items
- Send status

### Statuses
- Dispute workflow states
- Timestamp tracking
- Response records
- Resolution outcomes

---

## Integrations

### Claude (Anthropic)
- AI chat functionality
- Dispute strategy analysis
- Letter content assistance
- Contextual guidance

### Upstash (Redis)
- Database persistence
- Session management
- Background sync
- Offline-first data synchronization

### Clerk
- Authentication provider
- User management
- Google/Apple OAuth
- Session handling

### Stripe
- Payment processing
- Subscription management
- Invoice generation
- Webhook handling

### TTS (ElevenLabs)
- Text-to-speech conversion
- Voice conversation mode
- Real-time audio streaming
- Multi-platform support

---

## Non-Functional Requirements

### Security
- In-memory PDF processing (no storage)
- Encrypted data transmission
- Secure authentication (Clerk)
- API key protection
- Rate limiting on sensitive endpoints

### Compliance
- FCRA Section 605B statutory alignment
- FDCPA compliance for collector communications
- FCBA billing dispute requirements
- State consumer protection law coverage
- Privacy policy (legal@9thwave.io)
- Terms of service

### Audit Logs
- Complete action history
- Immutable records
- Timestamp accuracy
- User attribution
- Export for legal proceedings

### Roles/Permissions
- User role (standard access)
- Admin role (system management)
- Support role (customer assistance)
- API access controls
- Feature gating by subscription tier

---

## Technical Notes

- **Path**: `~/Desktop/creditclear-app`
- **Framework**: Next.js
- **Deployment**: Vercel
- **Fix for peer deps**: `.npmrc` with `legacy-peer-deps=true`
- **Layout routing**: Dashboard uses `layout.jsx`
- **Storage strategy**: localStorage primary + Redis background sync

---

*Last updated: January 2025*
