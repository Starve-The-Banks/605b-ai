# Beta fixes — mobile web dashboard (release notes)

## What was fixed

- **Analyze:** “Flag for Action” saves to flagged list with visible confirmation and link; “Generate Letter” goes to Templates. Upload zone: clearer button behavior (`type="button"`, stop propagation on Choose Files).
- **Templates:** Preview opens a real modal; Use Template adds a tracker dispute and navigates to Tracker. Templates page now supplies `logAction` and `addDispute` (previously missing, so buttons did nothing).
- **Flagged:** Generate Letters / per-item letter icon navigate to Templates; View details opens a modal with item text and link to templates.
- **Payment banner:** “Payment Confirmed” no longer appears for every paid user on every load; dismiss persists in `sessionStorage`; checkout `?success=true` clears dismiss and URL is cleaned after a short delay; `useUserTier` no longer sets “sync complete” on generic tier load.
- **Analysis persistence:** Summary results persist in `localStorage` and, when signed in, in `profile.analyzeSnapshot` via existing `/api/user-data/profile` (Redis). See `docs/debug/ANALYZE_PERSISTENCE.md`.

## Known limitation

- **Original PDF credit reports are not uploaded or stored on the server.** Only the **analysis summary** (issue list / mock results) is persisted. Users must choose PDFs again to run a new analysis. Copy in the Analyze tab explains this when a saved summary is shown.

## Manual smoke test — Mobile Safari (6 steps)

1. **Sign in** → open **Dashboard → Analyze**. After a run, use **Flag for Action** and **Generate Letter**; confirm feedback / navigation to Templates.
2. Open **Templates** → tap **Preview** (modal opens) and **Use Template** (lands on **Tracker** with a new row).
3. Open **Flagged** → **Generate Letters**, row **letter** icon, and **View details** (modal); confirm navigation or modal works.
4. Complete or simulate **checkout return** with `?success=true` on dashboard → confirm **Payment Confirmed** can be dismissed with **X** and does not return on every navigation; URL query cleans up.
5. **Reload** the Analyze page after an analysis → summary should **restore**; read the blue notice about PDFs vs summary.
6. (Optional, second device) Same account → summary may **sync** from account when server snapshot is newer; PDFs still require re-upload to analyze again.
