# Meta Execution Packet — 605b.ai

Step-by-step instructions for setting up and running compliant Meta ads.

---

## 1. BUSINESS MANAGER SETUP

### 1.1 Naming Conventions

| Element | Convention | Example |
|---|---|---|
| Business Account | Legal entity name | `Ninth Wave Analytics LLC` |
| Ad Account | `{Abbrev}_{Product}_{Geo}_{Channel}_{##}` | `NWA_605b_US_Paid_01` |
| Pixel | `{product}_web_pixel_{env}` | `605b_web_pixel_prod` |
| Campaign | `{product}_{objective}_{audience}_{date}` | `605b_traffic_broad_2026Q1` |
| Ad Set | `{audience}_{placement}_{date}` | `broad_advantage_mar26` |
| Ad | `{angle}_{variant}_{format}` | `idtheft_v1_single` |

### 1.2 Business Manager Admin Email

Use a branded email address: `ads@605b.ai` or `meta@605b.ai`

Do NOT use a personal Gmail/Yahoo address. Meta associates the admin email with the business identity.

---

## 2. DOMAIN VERIFICATION

### Steps

1. Go to **Business Settings → Brand Safety → Domains**
2. Click **Add Domain**, enter `605b.ai`
3. Choose **DNS TXT Verification** (recommended)
4. Copy the TXT record value provided by Meta
5. Go to your DNS registrar (wherever 605b.ai DNS is managed)
6. Add a TXT record:
   - **Host/Name:** `@` or blank
   - **Type:** TXT
   - **Value:** (paste the value from Meta)
   - **TTL:** 3600 or default
7. Return to Meta Business Manager
8. Wait 15 minutes to 72 hours for DNS propagation
9. Click **Verify**
10. Once verified, assign your pixel to the verified domain under **Brand Safety → Domains → [605b.ai] → Assign Assets**

### Troubleshooting

- If verification fails, wait 24 hours and retry
- Confirm the TXT record is visible: `dig TXT 605b.ai` or use an online DNS checker
- Ensure there are no conflicting TXT records

---

## 3. BUSINESS VERIFICATION

### Required Documents (have these ready before starting)

- [ ] **Delaware LLC Certificate of Formation** (Articles of Organization)
- [ ] **EIN Confirmation Letter** (IRS Letter 147C or CP 575)
- [ ] **Bank statement OR utility bill** showing "Ninth Wave Analytics LLC" and matching address
- [ ] **Website URL:** https://605b.ai (must be live with Privacy Policy and Terms of Service)

### Steps

1. Go to **Business Settings → Security Center**
2. Click **Start Verification**
3. Select business category: **Technology / Software** (NOT "Financial Services")
4. Enter legal business name: **Ninth Wave Analytics LLC** (must exactly match state filing)
5. Enter business address (must match documents)
6. Enter phone number: **(760) 666-4106**
7. Enter website: **https://605b.ai**
8. Upload required documents
9. Meta will review within 1-5 business days
10. You may receive a phone call or email for additional verification

### Critical Rules

- Business name in Meta MUST exactly match the LLC filing — "Ninth Wave Analytics LLC"
- Address must match across all documents (even formatting: "St" vs "Street" matters)
- Do NOT use a PO box
- Do NOT select "Financial Services" as the business category

---

## 4. PIXEL SETUP + EVENT CHECKLIST

### Existing Pixel Configuration

The Meta Pixel is already configured in `app/components/TrackingPixels.jsx`:
- Environment variable: `NEXT_PUBLIC_META_PIXEL_ID`
- Loads in production only
- Fires `PageView` on load

### Required Standard Events

Verify these events are firing correctly:

| Event | Trigger Point | Status |
|---|---|---|
| `PageView` | Every page load | ✅ Configured (TrackingPixels.jsx) |
| `ViewContent` | Pricing page view | Verify in `lib/tracking.js` |
| `InitiateCheckout` | Click "Buy" on pricing | Verify in `lib/tracking.js` |
| `Purchase` | Stripe webhook success | Verify in Stripe webhook handler |

### Pixel Verification Steps

1. Install **Meta Pixel Helper** Chrome extension
2. Visit https://605b.ai in production
3. Confirm `PageView` fires
4. Navigate to `/pricing` — confirm `ViewContent` fires
5. Click a purchase button — confirm `InitiateCheckout` fires
6. Complete a test purchase — confirm `Purchase` fires

### Aggregated Event Measurement (AEM)

After domain verification:
1. Go to **Events Manager → Settings → Aggregated Event Measurement**
2. Click **Configure Web Events** for `605b.ai`
3. Set event priority (highest to lowest):
   1. Purchase
   2. InitiateCheckout
   3. ViewContent
   4. PageView

---

## 5. SPECIAL AD CATEGORY SELECTION

### At Campaign Creation

1. When creating a new campaign, you will see "Special Ad Categories"
2. Select **"Credit"**
3. This MUST be selected for EVERY campaign, not just some

### Why "Credit" and Not Other Categories

| Category | Applies? | Reason |
|---|---|---|
| Credit | **YES** | Subject matter relates to credit reports and credit disputes |
| Housing | No | Not a housing product |
| Employment | No | Not an employment product |
| Social Issues | No | Not a social/political campaign |

### Consequences of NOT Selecting "Credit"

- Meta's automated systems will flag ads containing keywords like "credit report," "dispute," "FCRA," "credit bureau"
- Flagged ads are rejected, and repeated rejections can trigger ad account suspension
- Account suspension can take weeks to resolve and may be permanent
- It is far safer to accept the targeting restrictions than to risk account loss

---

## 6. FOUR-WEEK WARM-UP PLAN

See `META_LAUNCH_STACK.md` for detailed warm-up schedule and budget ramp.

**Summary:**

| Week | Objective | Daily Budget | Notes |
|---|---|---|---|
| 1 | Traffic | $5-10 | Educational creative only |
| 2 | Traffic | $15-25 | A/B test angles |
| 3 | ViewContent | $25-50 | Optimize for pricing page views |
| 4 | Conversions | $50-75 | Optimize for InitiateCheckout |

**Budget Increase Rule:** Never more than 30% increase in a single day.

---

## 7. RISK CONTROLS — PREVENTING SUSPENSION

### What Triggers Suspensions

| Trigger | Risk | Prevention |
|---|---|---|
| Not selecting Credit Special Ad Category | Very High | Always select Credit |
| Outcome guarantee language in ads | Very High | Use banned-phrases list (META_LAUNCH_STACK.md) |
| Before/after score imagery | Very High | Never use score comparisons |
| Personal attribute targeting violations | High | Don't ask questions about personal credit status |
| Landing page mismatch | High | Ensure LP matches ad claims |
| Sudden budget spikes | Medium | Follow ramp schedule |
| High negative feedback score | Medium | Monitor feedback, pause low-quality ads |
| Missing privacy policy on LP | Medium | Already published at /privacy |
| Unverified domain | Medium | Complete domain verification first |

### If an Ad Is Rejected

1. **Do NOT resubmit the same ad.** This triggers additional scrutiny.
2. Read the specific rejection reason in Ads Manager.
3. Identify the policy violation (usually in the copy or landing page).
4. Modify the ad to address the specific issue.
5. Wait 24 hours before resubmitting.
6. If rejected again, create a NEW ad with different copy rather than editing.

### If Your Account Is Restricted

1. Go to **Account Quality** in Business Manager.
2. Read the specific restriction reason.
3. If it's a misclassification (e.g., flagged as credit repair), submit an appeal explaining:
   - 605b.ai is self-service software, not a credit repair service
   - You have selected the Credit Special Ad Category
   - You do not guarantee outcomes or act on behalf of users
   - Link to your Terms of Service showing CROA disclaimer
4. Appeals take 1-5 business days.
5. While waiting, do NOT create new ad accounts or Business Managers — this triggers permanent bans.

---

## 8. LANDING PAGE COMPLIANCE CHECKLIST

Verify these elements are present on any page linked from Meta ads:

### Required Elements

- [x] Privacy Policy link in footer (all pages)
- [x] Terms of Service link in footer (all pages)
- [x] Contact page link in footer (all pages) — **NEW: /contact page created**
- [x] Physical business location in footer: "Ninth Wave Analytics LLC — Oceanside, CA"
- [x] Phone number in footer: (760) 666-4106
- [x] Support email in footer: support@605b.ai
- [x] "Not legal advice" disclaimer
- [x] "Not a credit repair organization" disclaimer
- [x] "No guaranteed outcomes" disclaimer
- [x] One-time purchase / no subscription language on pricing page
- [x] Refund policy clearly stated ("All sales are final")
- [x] Self-service positioning (user generates, reviews, sends — not "we do it for you")

### Prohibited Elements on Landing Pages

- No credit score numbers or score-change claims
- No before/after comparisons
- No testimonials claiming specific credit outcomes
- No "guaranteed" language of any kind
- No competitor-disparaging language
- No urgency/scarcity language ("limited time," "act now," "only X spots")

---

## 9. PRE-LAUNCH CHECKLIST

Complete in this order:

- [ ] Domain verification complete
- [ ] Business verification complete
- [ ] Pixel installed and firing PageView, ViewContent, InitiateCheckout
- [ ] Aggregated Event Measurement configured
- [ ] Landing pages pass compliance checklist (Section 8)
- [ ] Ad creative reviewed against banned-phrases list
- [ ] Special Ad Category "Credit" selected
- [ ] Week 1 campaign created with Traffic objective
- [ ] Daily budget set to $5
- [ ] Single ad set with single creative (identity theft education angle)
- [ ] Launch
