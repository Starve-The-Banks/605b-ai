# Meta Ads Management Standard Access — Review Checklist

Run this checklist before submitting for App Review.

## Pre-Submission

- [ ] **App in Live mode** — Development mode will not count toward telemetry
- [ ] **Token valid** — Long-lived token with `ads_read` or `ads_management`
- [ ] **Seeder running** — LaunchAgent or cron running every 3 hours for at least 15 days

## Verify Compliance

```bash
cd meta-ads-ingest
npm run telemetry:report
cat logs/telemetry_15d_report.txt
```

- [ ] **READY TO SUBMIT: YES** in `telemetry_15d_report.txt`
- [ ] **≥1500 successful calls** — `meets_calls_threshold: YES`
- [ ] **Error rate <15%** — `meets_error_threshold: YES`
- [ ] **Target <5% error** — `target_error_rate_ok: YES` (recommended)

## Proof for Review

1. **Screenshot** `logs/telemetry_15d_report.txt` — attach or screenshare if asked
2. **Summary JSON** `logs/telemetry_15d_summary.json` — optional backup proof

## Quick Commands

```bash
npm run seed-meta-telemetry:dry   # Validate config
npm run seed-meta-telemetry       # One manual run
npm run telemetry:report          # Generate report
```
