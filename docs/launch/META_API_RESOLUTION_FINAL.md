# Meta API Resolution Final — 605b.ai

## Current State

- Ad account: `act_1813825642661559`
- Campaign: `6906439117737` (`605b Launch - Cold Traffic`, `PAUSED`)
- Ad set: `6906439770337` (`Cold - Broad - US`, `PAUSED`, `daily_budget=2000`)
- Pixel: `918881184164588` (`605b Main Pixel`)
- Landing URL: `https://605b.ai`
- Blocker: no Page resolution via `/me/accounts` (`{"data":[]}`)

## Root Cause

The token identity can manage the ad account (campaign/ad set creation works) but does not have Page visibility through `/me/accounts`.

For business/system-user tokens, `/me/accounts` is frequently empty. Page must be resolved through the Business asset graph (`/{business_id}/owned_pages` or `/{business_id}/client_pages`) and the system user must have Page asset permission for ad creation.

## Exact API-First Execution Order

```bash
export TOKEN="<ACCESS_TOKEN>"
export API="v19.0"
export AD_ACCOUNT_ID="act_1813825642661559"
export CAMPAIGN_ID="6906439117737"
export ADSET_ID="6906439770337"
export PIXEL_ID="918881184164588"
export PAGE_NAME="605b.ai"
```

### Command 1 — Resolve Business ID from ad account

```bash
BUSINESS_ID=$(curl -s -G "https://graph.facebook.com/${API}/${AD_ACCOUNT_ID}" \
  --data-urlencode "fields=id,name,business,owner_business" \
  --data-urlencode "access_token=${TOKEN}" | jq -r '.business.id // .owner_business.id')
echo "BUSINESS_ID=${BUSINESS_ID}"
```

### Command 2 — Query business-owned pages

```bash
curl -s -G "https://graph.facebook.com/${API}/${BUSINESS_ID}/owned_pages" \
  --data-urlencode "fields=id,name,tasks" \
  --data-urlencode "limit=200" \
  --data-urlencode "access_token=${TOKEN}" | jq
```

### Command 3 — Resolve `PAGE_ID` by name (with client_pages fallback)

```bash
PAGE_ID=$(curl -s -G "https://graph.facebook.com/${API}/${BUSINESS_ID}/owned_pages" \
  --data-urlencode "fields=id,name,tasks" \
  --data-urlencode "limit=200" \
  --data-urlencode "access_token=${TOKEN}" | \
  jq -r --arg PAGE_NAME "${PAGE_NAME}" '.data[] | select(.name==$PAGE_NAME) | .id' | head -1)

if [ -z "${PAGE_ID}" ]; then
  PAGE_ID=$(curl -s -G "https://graph.facebook.com/${API}/${BUSINESS_ID}/client_pages" \
    --data-urlencode "fields=id,name,tasks" \
    --data-urlencode "limit=200" \
    --data-urlencode "access_token=${TOKEN}" | \
    jq -r --arg PAGE_NAME "${PAGE_NAME}" '.data[] | select(.name==$PAGE_NAME) | .id' | head -1)
fi

echo "PAGE_ID=${PAGE_ID}"
```

If `PAGE_ID` is set, continue directly to creative + ad creation.

## Manual Fix (Only If `PAGE_ID` Is Still Empty)

Use this once, then rerun Command 3.

1. `business.facebook.com/settings`
2. **Users** → **System Users**
3. Select system user used for this token (`605b Ads Automation`)
4. **Add Assets** → **Pages**
5. Select Page: `605b.ai`
6. Grant Page task: **Create ads** (and keep Full Control if available)
7. Save

Also confirm token has these scopes: `ads_management`, `business_management`, `pages_show_list`, `pages_read_engagement`, `pages_manage_ads`.

## Final Creative Command (Draft-ready creative)

```bash
CREATIVE_ID=$(curl -s -X POST "https://graph.facebook.com/${API}/${AD_ACCOUNT_ID}/adcreatives" \
  -d "name=Video - Problem Awareness - Creative" \
  --data-urlencode "object_story_spec={\"page_id\":\"${PAGE_ID}\",\"link_data\":{\"link\":\"https://605b.ai\",\"message\":\"Most people have no idea what is actually on their credit report.\n\n605b analyzes your report, identifies issues, and helps generate dispute documentation.\n\nUnderstand your credit file before it costs you.\",\"name\":\"Understand Your Credit Report\",\"description\":\"Analyze and generate dispute documentation\",\"call_to_action\":{\"type\":\"LEARN_MORE\",\"value\":{\"link\":\"https://605b.ai\"}}}}" \
  -d "access_token=${TOKEN}" | jq -r '.id')
echo "CREATIVE_ID=${CREATIVE_ID}"
```

## Final Ad Command (PAUSED draft ad)

```bash
AD_ID=$(curl -s -X POST "https://graph.facebook.com/${API}/${AD_ACCOUNT_ID}/ads" \
  -d "name=Video - Problem Awareness" \
  -d "adset_id=${ADSET_ID}" \
  -d "creative={\"creative_id\":\"${CREATIVE_ID}\"}" \
  -d "status=PAUSED" \
  -d "access_token=${TOKEN}" | jq -r '.id')
echo "AD_ID=${AD_ID}"
```

## Final Verify Command (Campaign tree)

```bash
curl -s -G "https://graph.facebook.com/${API}/${CAMPAIGN_ID}" \
  --data-urlencode "fields=id,name,status,adsets{id,name,status,daily_budget,promoted_object,ads{id,name,status,creative{id,name}}}" \
  --data-urlencode "access_token=${TOKEN}" | jq
```

Expected end state:
- Campaign `6906439117737` = `PAUSED`
- Ad set `6906439770337` = `PAUSED`
- New creative exists
- New ad exists and `PAUSED`
