# Underwriting Proof — 605b.ai

## What This Is

A **Proof of Operating Activity** document prepared for payment processor underwriting review.

**Company:** Ninth Wave Analytics LLC
**Brand:** 605b.ai
**Document Type:** Marketing Materials

## Files

| File | Description |
|------|-------------|
| `proof-of-operating-activity_605b.ai.pdf` | Final PDF for underwriting upload (6 pages) |
| `screenshots/homepage.png` | Screenshot of https://605b.ai |
| `screenshots/features.png` | Screenshot of features section |
| `screenshots/pricing.png` | Screenshot of pricing section |
| `screenshots/privacy-policy.png` | Screenshot of privacy policy page |
| `screenshots/terms-of-service.png` | Screenshot of terms of service page |
| `screenshot-results.json` | Metadata from automated capture |
| `capture-screenshots.mjs` | Playwright script to capture screenshots |
| `compose-pdf.mjs` | Script to compose the final PDF |

## How to Regenerate

If you need to update screenshots or regenerate the PDF:

```bash
cd underwriting-proof
node capture-screenshots.mjs   # captures fresh screenshots
node compose-pdf.mjs            # rebuilds the PDF
```

Requires: `npm install` (playwright + pdf-lib are in package.json).

## PDF Contents

1. **Cover Page** — Company info, contact, date
2. **Business Overview** — What the product does, revenue model, exclusions
3. **Website Evidence** — Homepage, features, and pricing screenshots
4. **Policies Evidence** — Privacy Policy and Terms of Service screenshots
