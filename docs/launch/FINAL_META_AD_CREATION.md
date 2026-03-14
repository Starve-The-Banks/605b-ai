# Final Meta Ad Creation

## Overview
This document outlines the final steps to create the Meta Ad Creative and Ad for the `605b Launch - Cold Traffic` campaign.

## Current State
- **Ad Account ID:** `act_1813825642661559`
- **Campaign ID:** `6906439117737` (PAUSED)
- **Adset ID:** `6906439770337` (PAUSED)
- **Page ID:** `933996326470724` (Resolved via Business Manager API)
- **Image Hash:** `d4b76d0230c5a4664f19c420eaa44cbf` (Resolved via Ad Images API)

## Automated Setup Script
The script `meta-ads-ingest/finish-meta-ad-setup.js` has been created to automatically generate the Ad Creative and Ad.

## Blocker: App in Development Mode
Currently, the API execution is blocked by the following Meta API error:
> "Ads creative post was created by an app that is in development mode. It must be in public to create this ad."

### Manual Fix Required
To resolve this, the Facebook App used to generate the access token must be switched to **Live** mode.

**Exact Click Path:**
1. Go to [Meta App Dashboard](https://developers.facebook.com/apps/).
2. Select your App.
3. In the top navigation bar, find the **App Mode** toggle.
4. Switch the toggle from **Development** to **Live**.
5. (If prompted) Complete any required Data Use Checkups or Business Verification steps.

Once the app is Live, run the setup script:
```bash
cd meta-ads-ingest
node finish-meta-ad-setup.js
```