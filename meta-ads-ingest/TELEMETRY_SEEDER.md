# Meta Telemetry Seeder

Read-only integration verification for **Ads Management Standard Access** review.

## Meta Requirements

- **≥1,500 successful** Marketing API calls in the last 15 days
- **Error rate <15%** (target <5%)

## Quick Install

```bash
cd meta-ads-ingest
npm i
mkdir -p .secrets
cp .env.example .secrets/meta.env   # or create .secrets/meta.env
# Edit .secrets/meta.env and add META_ACCESS_TOKEN=your_token
./scripts/install-launchd-seeder.sh
```

## Verify

```bash
npm run seed-meta-telemetry          # One live run
npm run telemetry:report              # Generate 15-day report
cat logs/telemetry_15d_report.txt    # Check READY TO SUBMIT
```

## Schedule Math

- **Default:** `TARGET_CALLS_PER_RUN=20`, runs every 3 hours (8×/day)
- **Per day:** 20 × 8 = **160 successful calls**
- **Per 15 days:** 160 × 15 = **2,400 successful calls** (exceeds 1,500 with margin)

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `META_ACCESS_TOKEN` | (required) | Long-lived token with `ads_read` or `ads_management` |
| `AD_ACCOUNT_ID` / `META_AD_ACCOUNT_ID` | (optional) | Ad account ID; if missing, discovered from `/me/adaccounts` |
| `META_APP_ID` | (optional) | App ID (recommended) |
| `META_API_VERSION` | `v25.0` | Graph API version (`/^v\d+\.\d+$/`) |
| `TARGET_CALLS_PER_RUN` | `20` | Target calls per run |
| `HARD_CALL_CEILING` | `60` | Safety cap per run |
| `MIN_DELAY_MS` | `1200` | Min delay between calls (+ 0–300ms jitter) |
| `MAX_RETRIES` | `3` | Max retries for 429/5xx/network |
| `PAGE_LIMIT` | `25` | Limit per request |
| `MAX_PAGES_PER_EDGE` | `5` | Max pagination pages per edge |
| `STOP_ON_AUTH_ERROR` | `true` | Stop on 401 |
| `STOP_ON_PERMISSION_ERROR` | `true` | Stop on 403 |
| `STOP_ON_REPEAT_429` | `true` | Stop after 2× 429 in a run |
| `LOG_DIR` | `./logs` | Log directory |

## Artifacts

| File | Description |
|------|-------------|
| `logs/meta-telemetry-YYYY-MM-DD.jsonl` | Per-call JSONL (ts, endpoint, http_status, duration_ms, retries_used, error_category, fb_trace_id, request_id) |
| `logs/telemetry_15d_summary.json` | Rolling 15-day aggregate |
| `logs/telemetry_15d_report.txt` | Human-readable compliance report (attach/screenshare for review) |

## NPM Scripts

```bash
npm run seed-meta-telemetry        # Live run
npm run seed-meta-telemetry:dry    # Dry run (no API calls)
npm run telemetry:report           # Generate report from existing logs
```

## macOS LaunchAgent

```bash
./scripts/install-launchd-seeder.sh
launchctl list | grep meta-telemetry
tail -n 50 ~/Library/Logs/meta-telemetry.out.log
```

Secrets: `.secrets/meta.env` (gitignored). Installer creates template if missing.

## Troubleshooting

### 401 Unauthorized
- Token expired or invalid
- Regenerate long-lived token in Meta App Dashboard
- Update `META_ACCESS_TOKEN` in `.secrets/meta.env`

### 403 Forbidden
- Missing `ads_read` or `ads_management` permission
- App not in Live mode
- Ad account not linked to app

### 429 Rate Limited
- Script backs off automatically (Retry-After)
- After 2× 429 in a run, stops early (STOP_ON_REPEAT_429)
- Reduce `TARGET_CALLS_PER_RUN` or increase `MIN_DELAY_MS`

### 5xx Server Error
- Retried with exponential backoff
- Transient; run exits 0 so scheduler doesn’t thrash

## Purpose

Read-only integration verification / health-check job. No write operations. Safe to run on a schedule.
