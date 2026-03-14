# Meta API Execution Packet — 605b.ai

## Current Completed Assets

- Ad Account ID: `act_1813825642661559`
- Campaign ID: `6906439117737` (`605b Launch - Cold Traffic`, `PAUSED`)
- Ad Set ID: `6906439770337` (`Cold - Broad - US`, `PAUSED`)
- Pixel ID: `918881184164588`
- Landing URL: `https://605b.ai`
- Page exists in Business Manager: `605b.ai`

## Current Blocker

- `/me/accounts` returns `{"data":[]}` for the current token identity.
- Campaign and ad set creation works, but Page asset visibility for creative creation is missing through `/me/accounts`.

## Exact Order of Execution

1. Resolve `BUSINESS_ID` from ad account metadata.
2. Resolve `PAGE_ID` from `owned_pages`; fallback to `client_pages`.
3. If `PAGE_ID` still empty: run the 30-second manual asset assignment.
4. Re-run Page resolution.
5. Create ad creative.
6. Create ad (status `PAUSED`).
7. Verify campaign/ad set/ad tree.

---

## Shell Command Packet

```bash
#!/usr/bin/env bash
set -euo pipefail

# REQUIRED PLACEHOLDERS
export TOKEN="<TOKEN>"

# KNOWN IDs
export API_VERSION="v19.0"
export AD_ACCOUNT_ID="act_1813825642661559"
export CAMPAIGN_ID="6906439117737"
export ADSET_ID="6906439770337"
export PIXEL_ID="918881184164588"
export LANDING_URL="https://605b.ai"
export PAGE_NAME="605b.ai"

echo "== STEP 1: Resolve BUSINESS_ID =="
BUSINESS_ID=$(curl -s -G "https://graph.facebook.com/${API_VERSION}/${AD_ACCOUNT_ID}" \
  --data-urlencode "fields=id,name,business,owner_business" \
  --data-urlencode "access_token=${TOKEN}" | jq -r '.business.id // .owner_business.id // empty')

if [ -z "${BUSINESS_ID}" ]; then
  echo "ERROR: Could not resolve BUSINESS_ID from ${AD_ACCOUNT_ID}"
  exit 1
fi
echo "BUSINESS_ID=${BUSINESS_ID}"

echo "== STEP 2: Resolve PAGE_ID from owned_pages =="
PAGE_ID=$(curl -s -G "https://graph.facebook.com/${API_VERSION}/${BUSINESS_ID}/owned_pages" \
  --data-urlencode "fields=id,name,tasks" \
  --data-urlencode "limit=200" \
  --data-urlencode "access_token=${TOKEN}" \
  | jq -r --arg PAGE_NAME "${PAGE_NAME}" '.data[]? | select(.name==$PAGE_NAME) | .id' | head -1)

if [ -z "${PAGE_ID}" ]; then
  echo "== owned_pages empty for ${PAGE_NAME}; trying client_pages =="
  PAGE_ID=$(curl -s -G "https://graph.facebook.com/${API_VERSION}/${BUSINESS_ID}/client_pages" \
    --data-urlencode "fields=id,name,tasks" \
    --data-urlencode "limit=200" \
    --data-urlencode "access_token=${TOKEN}" \
    | jq -r --arg PAGE_NAME "${PAGE_NAME}" '.data[]? | select(.name==$PAGE_NAME) | .id' | head -1)
fi

if [ -z "${PAGE_ID}" ]; then
  echo "PAGE_ID_NOT_RESOLVED"
  echo "MANUAL_FIX_REQUIRED=YES"
  echo "Run the 30-second manual fix, then rerun this script."
  exit 2
fi
echo "PAGE_ID=${PAGE_ID}"

echo "== STEP 3: Create creative =="
CREATIVE_RESPONSE=$(curl -s -X POST "https://graph.facebook.com/${API_VERSION}/${AD_ACCOUNT_ID}/adcreatives" \
  -d "name=Video - Problem Awareness - Creative" \
  --data-urlencode "object_story_spec={\"page_id\":\"${PAGE_ID}\",\"link_data\":{\"link\":\"${LANDING_URL}\",\"message\":\"Most people have no idea what is actually on their credit report.\n\n605b analyzes your report, identifies issues, and helps generate dispute documentation.\n\nUnderstand your credit file before it costs you.\",\"name\":\"Understand Your Credit Report\",\"description\":\"Analyze and generate dispute documentation\",\"call_to_action\":{\"type\":\"LEARN_MORE\",\"value\":{\"link\":\"${LANDING_URL}\"}}}}" \
  -d "access_token=${TOKEN}")

CREATIVE_ID=$(echo "${CREATIVE_RESPONSE}" | jq -r '.id // empty')
if [ -z "${CREATIVE_ID}" ]; then
  echo "ERROR: Creative creation failed"
  echo "${CREATIVE_RESPONSE}" | jq
  exit 3
fi
echo "CREATIVE_ID=${CREATIVE_ID}"

echo "== STEP 4: Create ad =="
AD_RESPONSE=$(curl -s -X POST "https://graph.facebook.com/${API_VERSION}/${AD_ACCOUNT_ID}/ads" \
  -d "name=Video - Problem Awareness" \
  -d "adset_id=${ADSET_ID}" \
  -d "creative={\"creative_id\":\"${CREATIVE_ID}\"}" \
  -d "status=PAUSED" \
  -d "access_token=${TOKEN}")

AD_ID=$(echo "${AD_RESPONSE}" | jq -r '.id // empty')
if [ -z "${AD_ID}" ]; then
  echo "ERROR: Ad creation failed"
  echo "${AD_RESPONSE}" | jq
  exit 4
fi
echo "AD_ID=${AD_ID}"

echo "== STEP 5: Verify tree =="
curl -s -G "https://graph.facebook.com/${API_VERSION}/${CAMPAIGN_ID}" \
  --data-urlencode "fields=id,name,status,adsets{id,name,status,daily_budget,promoted_object,ads{id,name,status,creative{id,name}}}" \
  --data-urlencode "access_token=${TOKEN}" \
  | jq
```

---

## Exact 30-Second Manual Fix (Only if `PAGE_ID_NOT_RESOLVED`)

1. Open: `business.facebook.com/settings`
2. Go to: **Users**
3. Go to: **System Users**
4. Select: system user tied to the current token identity
5. Click: **Add Assets**
6. Select tab: **Pages**
7. Select page: `605b.ai`
8. Grant: **Create ads** (or **Full Control** if available)
9. Save
10. Re-run the shell command packet from STEP 2 onward

