# Meta Marketing API — Next Steps

**Date:** 2026-03-10
**Status:** Ad Set created. Ad creation blocked on Page access.

---

## Completed Assets

| Asset | ID | Status |
|---|---|---|
| Ad Account | `act_1813825642661559` | Active |
| Campaign | `6906439117737` | PAUSED — `605b Launch - Cold Traffic` |
| Ad Set | `6906439770337` | PAUSED — `Cold - Broad - US` ($20/day) |
| Pixel | `918881184164588` | Active — `605b Main Pixel` |
| Landing Page | `https://605b.ai` | Deployed |

## What's Missing

1. **Page ID** — needed for ad creative `object_story_spec`
2. **Ad Creative** — requires Page ID to create
3. **Ad** — requires Ad Creative ID to create

---

## Blocker: `/me/accounts` Returns Empty

### Command that failed

```bash
curl "https://graph.facebook.com/v19.0/me/accounts?access_token=TOKEN"
# Response: {"data":[]}
```

### Most Likely Cause

The token was generated as an **App-scoped User Token** or **System User Token** through the Meta Developer App dashboard. These token types resolve `/me` to the app or system user identity — NOT to the personal Facebook user who owns the Page.

The Page `605b.ai` is owned by the **Business Manager**, not directly by the `/me` identity represented by this token. Business-owned Pages do not appear in `/me/accounts` — they appear in the **Business Manager's owned pages endpoint**.

### Why This Happens

- `/me/accounts` only returns Pages where the **token identity** has a Page role (admin/editor)
- System User tokens represent a synthetic identity that doesn't have Page roles by default
- Business-owned Pages must be queried via the Business Manager API or the Page must be explicitly assigned to the System User

---

## Fix Path

### Option A: Query Business-Owned Pages (no manual step)

If you know the Business Manager ID, query its owned pages directly:

```bash
# Step 1: Find your Business Manager ID
curl "https://graph.facebook.com/v19.0/me?fields=id,name&access_token=TOKEN"

# Step 2: List business-owned pages
# Replace BUSINESS_ID with the actual business ID
curl "https://graph.facebook.com/v19.0/BUSINESS_ID/owned_pages?access_token=TOKEN"
```

If the token has `business_management` permission, this returns all pages owned by the business, including `605b.ai`.

### Option B: Assign Page to System User (30-second manual step)

If Option A returns empty or errors, the System User needs Page assignment:

1. Go to **business.facebook.com** → Settings → Accounts → Pages
2. Find `605b.ai` page
3. Click it → **Assign People** → find the System User or your user
4. Grant **Content** or **Full Control** access
5. Re-run `/me/accounts` — Page will now appear

### Option C: Use Page ID Directly (if you can find it)

If you already know the Page ID (from the Page's About section URL or Business Manager):

```bash
# Test direct Page access
curl "https://graph.facebook.com/v19.0/PAGE_ID?fields=id,name,access_token&access_token=TOKEN"
```

To find Page ID from Business Manager:
- Go to business.facebook.com → Settings → Accounts → Pages
- Click the 605b.ai page — the ID is in the URL or details panel

---

## Commands to Run Once Page Access Is Fixed

### Step 1: Confirm Page ID

```bash
PAGE_ID="<paste page ID here>"
TOKEN="<your token>"

curl "https://graph.facebook.com/v19.0/${PAGE_ID}?fields=id,name&access_token=${TOKEN}"
```

### Step 2: Create Ad Creative

```bash
curl -X POST "https://graph.facebook.com/v19.0/act_1813825642661559/adcreatives" \
  -d "name=Video - Problem Awareness - Creative" \
  -d "object_story_spec={
    \"page_id\": \"${PAGE_ID}\",
    \"link_data\": {
      \"link\": \"https://605b.ai\",
      \"message\": \"Most people have no idea what is actually on their credit report.\n\n605b analyzes your report, identifies issues, and helps generate dispute documentation.\n\nUnderstand your credit file before it costs you.\",
      \"name\": \"Understand Your Credit Report\",
      \"description\": \"Analyze and generate dispute documentation\",
      \"call_to_action\": {
        \"type\": \"LEARN_MORE\",
        \"value\": {
          \"link\": \"https://605b.ai\"
        }
      }
    }
  }" \
  -d "access_token=${TOKEN}"
```

> **Note:** This creates a link ad. For video, replace `link_data` with `video_data` and include the video asset ID. If no video is uploaded yet, use link ad first, then swap creative later.

To upload a video first:

```bash
curl -X POST "https://graph.facebook.com/v19.0/act_1813825642661559/advideos" \
  -F "source=@/path/to/video.mp4" \
  -F "title=605b Problem Awareness" \
  -F "access_token=${TOKEN}"
```

Then use `video_data` in the creative:

```bash
curl -X POST "https://graph.facebook.com/v19.0/act_1813825642661559/adcreatives" \
  -d "name=Video - Problem Awareness - Creative" \
  -d "object_story_spec={
    \"page_id\": \"${PAGE_ID}\",
    \"video_data\": {
      \"video_id\": \"VIDEO_ID_FROM_UPLOAD\",
      \"message\": \"Most people have no idea what is actually on their credit report.\n\n605b analyzes your report, identifies issues, and helps generate dispute documentation.\n\nUnderstand your credit file before it costs you.\",
      \"title\": \"Understand Your Credit Report\",
      \"link_description\": \"Analyze and generate dispute documentation\",
      \"call_to_action\": {
        \"type\": \"LEARN_MORE\",
        \"value\": {
          \"link\": \"https://605b.ai\"
        }
      }
    }
  }" \
  -d "access_token=${TOKEN}"
```

### Step 3: Create Ad (Draft)

```bash
CREATIVE_ID="<from step 2 response>"

curl -X POST "https://graph.facebook.com/v19.0/act_1813825642661559/ads" \
  -d "name=Video - Problem Awareness" \
  -d "adset_id=6906439770337" \
  -d "creative={\"creative_id\": \"${CREATIVE_ID}\"}" \
  -d "status=PAUSED" \
  -d "access_token=${TOKEN}"
```

### Step 4: Verify

```bash
# Verify ad exists under the ad set
curl "https://graph.facebook.com/v19.0/6906439770337/ads?fields=id,name,status,creative&access_token=${TOKEN}"

# Verify full campaign tree
curl "https://graph.facebook.com/v19.0/6906439117737?fields=id,name,status,adsets{id,name,status,ads{id,name,status}}&access_token=${TOKEN}"
```

---

## Decision Tree

```
Can you query business-owned pages?
├── YES → get Page ID → skip to Step 2
└── NO
    ├── Do you know the Page ID already?
    │   ├── YES → test direct access → skip to Step 2
    │   └── NO → go to Business Manager UI → get Page ID
    └── Does direct Page access work with current token?
        ├── YES → proceed to Step 2
        └── NO → assign Page to System User in Business Manager (30 sec)
```

## Expected Result

After running Steps 1–4:
- Campaign `6906439117737` → PAUSED
- Ad Set `6906439770337` → PAUSED
- Ad (new) → PAUSED
- Creative (new) → linked to Ad
- Full draft structure visible in Ads Manager
- Ready to publish when video creative and pixel events are confirmed
