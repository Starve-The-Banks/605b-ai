# Meta Launch Verification Checklist — 605b.ai

Complete in strict order. Do not skip ahead.

---

## Step 1 — Deploy Trust Signals to Production

- [ ] Merge and deploy the branch containing `SiteFooter` + `/contact` page
- [ ] Verify deploy succeeds on Vercel (check deploy log)
- [ ] Visit https://www.605b.ai and confirm new footer is visible

## Step 2 — Verify Footer Consistency

Open each page in a browser and confirm the footer contains **exactly**:

| Field | Required Value |
|---|---|
| Business name | Ninth Wave Analytics LLC |
| Location | Oceanside, CA |
| Phone | (760) 666-4106 |
| Email | support@605b.ai |
| Privacy link | /privacy (working) |
| Terms link | /terms (working) |
| Contact link | /contact (working) |
| Disclaimer | "software tools and educational guidance only…not a law firm, credit repair organization…" |

**Check pages:** `/`, `/about`, `/pricing`, `/privacy`, `/terms`, `/contact`

## Step 3 — Meta Business Manager Setup

1. Go to https://business.facebook.com
2. Create Business Account (or use existing)
   - **Business name:** `Ninth Wave Analytics LLC` (must exactly match LLC filing)
   - **Business category:** `Technology / Software` (NOT "Financial Services")
3. Add yourself as Admin under **People**
4. Enable **Two-Factor Authentication** for all admins (Settings → Security Center)
5. Create an Ad Account:
   - **Name:** `NWA_605b_US_Paid_01`
   - **Currency:** USD
   - **Time zone:** Pacific Time

## Step 4 — Domain Verification (DNS TXT)

1. Go to **Business Settings → Brand Safety → Domains**
2. Click **Add Domain**, enter `605b.ai`
3. Select **DNS TXT Verification**
4. Copy the TXT record value Meta provides
5. In your DNS registrar, add a TXT record:
   - **Host:** `@` (or blank)
   - **Type:** TXT
   - **Value:** (paste from Meta)
   - **TTL:** 3600
6. Wait 15 min — 72 hours for propagation
7. Return to Meta and click **Verify**
8. After verification, go to **Domains → 605b.ai → Assign Assets** and assign your pixel

**DNS check command:** `dig TXT 605b.ai +short`

## Step 5 — Business Verification

**Documents required (have ready before starting):**
- [ ] Delaware LLC Certificate of Formation
- [ ] EIN Confirmation Letter (IRS Letter 147C or CP 575)
- [ ] Bank statement OR utility bill showing "Ninth Wave Analytics LLC" and address

**Process:**
1. Go to **Settings → Security Center → Start Verification**
2. Select **Technology / Software** as business category
3. Enter legal name: **Ninth Wave Analytics LLC**
4. Enter address (must match documents exactly — "St" vs "Street" matters)
5. Enter phone: **(760) 666-4106**
6. Enter website: **https://605b.ai**
7. Upload documents
8. Wait 1-5 business days

**Consistency warning:** The name, address, and phone must match EXACTLY across:
- Meta Business Manager
- LLC filing
- Website footer
- Stripe account
- WHOIS record (if not privacy-protected)

## Step 6 — Special Ad Category: Credit

**All campaigns MUST use the "Credit" Special Ad Category.**

When creating any campaign:
1. At the campaign level, look for "Special Ad Categories"
2. Select **Credit**
3. This removes age, gender, ZIP, and lookalike targeting
4. This is non-negotiable — failure to mark it risks account suspension

**Why:** Meta's definition of "credit" is broad. Any ad mentioning credit reports, disputes, FCRA, or credit bureaus will be auto-flagged. Proactive classification prevents suspension.

## Step 7 — Pixel Verification

**Prerequisites:** `NEXT_PUBLIC_META_PIXEL_ID` must be set in Vercel production environment.

### Using Meta Pixel Helper (Chrome Extension)

1. Install [Meta Pixel Helper](https://chrome.google.com/webstore/detail/meta-pixel-helper/fdgfkebogiimcoedlicjlajpkdmockpc)
2. Visit https://www.605b.ai
3. Click the Pixel Helper icon — confirm:
   - `PageView` event fires
   - Pixel ID matches your configured ID
4. Visit https://www.605b.ai/pricing
   - Confirm `ViewContent` fires (content_name: 'pricing')
5. Click a "Buy" button on pricing page
   - Confirm `InitiateCheckout` fires

### Using Events Manager

1. Go to **Events Manager** in Meta Business Manager
2. Select your pixel
3. Click **Test Events**
4. Enter `https://www.605b.ai` as the test URL
5. Browse the site in another tab
6. Confirm events appear in the Test Events panel

### Expected Events by Page

| Page | Events |
|---|---|
| `/` (homepage) | `PageView` |
| `/pricing` | `PageView`, `ViewContent` |
| `/pricing` → click Buy | `InitiateCheckout` |
| `/dashboard` (after purchase) | `PageView`, `Lead`, `Purchase` |
| `/contact` | `PageView` |

### Local Verification Script

```bash
node scripts/launch/check-meta-env.mjs     # Check env vars
node scripts/launch/smoke-prod-meta-pixel.mjs  # Check prod HTML for pixel
```

## Step 8 — Warm-Up Spend Plan (Days 1-14)

**Objective: Traffic / Landing Page Views ONLY**

| Days | Budget | Creative | Objective |
|---|---|---|---|
| 1-3 | $5/day | Identity theft education | Traffic |
| 4-7 | $10/day | + credit documentation variant | Traffic |
| 8-10 | $15/day | Evaluate CTR; pause if <1% | Traffic |
| 11-14 | $25/day | Best performer only | Landing Page Views |

**Rules:**
- Do NOT optimize for conversions during this phase
- Do NOT increase budget more than 30% per day
- If an ad is rejected, do NOT resubmit — revise copy, wait 24h, submit new ad

## Step 9 — Retargeting Phase (Days 15-28)

| Days | Budget | Objective | Audience |
|---|---|---|---|
| 15-21 | $30-50/day | ViewContent | Broad + 7-day visitors |
| 22-28 | $50-75/day | InitiateCheckout or Purchase | Broad + retargeting |

## Step 10 — Rejection Response Protocol

### If an Ad Is Rejected

1. **Read** the exact rejection reason in Ads Manager
2. **Do NOT** resubmit the same ad
3. **Do NOT** appeal without first fixing the issue
4. Identify which banned phrase or policy was violated (see `META_REVIEWER_COMPLIANCE_SNIPPETS.md`)
5. Create a **new** ad with revised copy
6. Wait 24 hours before submitting

### If Your Account Is Restricted

1. Check **Account Quality** in Business Manager
2. **Do NOT** create new ad accounts or Business Managers (triggers permanent ban)
3. Submit appeal explaining:
   - 605b.ai is self-service software, not a credit repair service
   - You have selected the Credit Special Ad Category
   - You do not guarantee outcomes
   - Link to Terms of Service (https://www.605b.ai/terms) showing CROA disclaimer
4. Wait 1-5 business days for response

---

## Common Failure Modes

| Problem | Cause | Fix |
|---|---|---|
| Pixel events not appearing | `NEXT_PUBLIC_META_PIXEL_ID` not set in Vercel production | Add env var in Vercel dashboard → redeploy |
| Pixel loads but wrong ID | Env var has whitespace or wrong value | Trim the value, verify against Events Manager |
| Ad rejected for "credit" | Didn't select Credit Special Ad Category | Always select it at campaign creation |
| Ad rejected for guarantees | Copy contains outcome promises | Remove language per banned-phrases list |
| Business verification denied | Name/address mismatch between Meta and docs | Ensure EXACT match across all documents |
| Account suspended after budget spike | Increased budget >50% in one day | Follow ramp schedule, max 30%/day increase |
| Domain verification fails | DNS not propagated or wrong record | Wait 24h; verify with `dig TXT 605b.ai +short` |
| Footer missing on pricing page | Old deploy without SiteFooter | Redeploy latest branch |
