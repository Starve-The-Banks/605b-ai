---
name: Landing page polish
overview: Four targeted additions to the landing page to reduce friction and build trust, without redesigning anything.
todos:
  - id: pricing-hint
    content: Add pricing hint line below hero CTA buttons
    status: completed
  - id: stats-copy
    content: Update middle stat to '3 Credit Bureaus Supported'
    status: completed
  - id: dashboard-preview
    content: Add dashboard preview section with screenshot (waiting on image from user)
    status: completed
  - id: hero-mobile-spacing
    content: Tighten hero vertical spacing on mobile breakpoint
    status: completed
isProject: false
---

# Landing Page Polish

All changes are in a single file: `app/page.jsx`. No new dependencies, no new routes, no structural changes.

## 1. Pricing hint below hero CTA

Add a single line below the "Start Report Analysis" button:

```jsx
<p className="hero-pricing-hint">Free to analyze your report. Upgrade when you're ready to act.</p>
```

Styled as small muted text (13px, `var(--text-muted)`), similar to the existing `hero-disclaimer`. Sits between the buttons and the disclaimer so the user knows cost isn't a barrier before scrolling.

## 2. Social proof stats — make them concrete

The existing stats section shows:

- "62 Statute-Specific Templates"
- "30 Day Response Window"
- "7 Federal Statutes Covered"

These are feature stats, not proof of usage. Replace the middle one with a usage-oriented stat that signals real activity. For example:

- "3 Credit Bureaus Supported" (concrete and immediately meaningful)

This is a minor copy change — keeps the section honest without fabricating numbers.

## 3. Dashboard preview section

Add a new section between Features and Steps (or between Steps and CTA) that shows a real screenshot of the dashboard with a short caption. Structure:

```jsx
<section className="preview">
  <div className="section-header">
    <div className="section-eyebrow">Inside the Platform</div>
    <h2 className="section-title">Your reinvestigation command center</h2>
    <p className="section-desc">Upload reports, generate letters, track deadlines — all in one place.</p>
  </div>
  <div className="preview-frame">
    <Image src="/dashboard-preview.png" ... />
  </div>
</section>
```

The preview frame will have:

- Rounded corners, subtle border (`var(--border)`), slight shadow
- Max-width constrained so it doesn't stretch on ultrawide
- Responsive: scales down cleanly on mobile

**Blocked on:** You providing a dashboard screenshot. I'll save it to `public/dashboard-preview.png` and wire it up.

## 4. Tighten hero density (mobile)

On mobile the hero currently shows: eyebrow + headline + description + 2 buttons + disclaimer + terminal. Reduce the gap between elements slightly:

- Reduce `hero-desc` bottom margin from default to 20px on mobile
- Reduce `hero-buttons` bottom margin
- This keeps all content but makes it feel less sprawling on small screens

No content is removed — just tighter spacing.

---

## What is NOT changing

- No new colors, fonts, or animations
- No new sections beyond the dashboard preview
- No changes to routing, auth, or components outside `app/page.jsx`
- Terminal animation, feature cards, steps, CTA, footer — all untouched

