# Analyze tab persistence (web dashboard)

## What is persisted

| Data | Browser (localStorage) | Server (Redis via profile) |
|------|------------------------|----------------------------|
| Analysis **summary** (mock issues JSON) | Yes, key `605b_analyze_snapshot_<clerkUserId>` | Yes, field `profile.analyzeSnapshot` when signed in |
| Original **PDF bytes** | No | **No** — never uploaded in current implementation |

The analyzer UI still uses **client-side mock results** after a simulated delay; there is **no** `/api/...` route that accepts multipart PDF upload for this dashboard flow.

## Product intent

- **Persisted:** Parsed/summary analysis state (issue list + summary counts) so users can return to the list after navigation or reload.
- **Not persisted:** Full credit report PDFs / binary uploads — would require a dedicated upload pipeline, storage, and retention policy (not implemented here).

## Related backend (not wired to Analyze tab)

- `POST /api/user-data/flagged` can store **flagged line items** in Redis (`user:{id}:flagged`). The dashboard **Flagged** page currently uses **localStorage** (`605b_flagged`) from the parent page; syncing that list to Redis is a separate integration.

## Cross-device behavior

When signed in, the analysis summary may sync to `profile.analyzeSnapshot` so a **new device** can load the same summary (newer `savedAt` wins vs local). PDFs still must be re-selected locally to “analyze again.”
