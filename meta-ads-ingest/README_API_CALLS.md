# Meta Marketing API Call Generator

## Purpose
Generate 100+ successful Meta Marketing API calls to satisfy the requirements for **Ads Management Standard Access** app review.

## Script: `generate-api-calls.js`

### What it does:
1. Makes sequential API calls to various Meta Marketing API endpoints
2. Uses `ads_read` permission (read-only operations)
3. Handles errors and retries automatically
4. Logs progress and success/failure counts
5. Stops after reaching 100 successful API responses

### API Endpoints Used:
- `GET /me/adaccounts` - List ad accounts
- `GET /act_{account_id}/campaigns` - List campaigns
- `GET /act_{account_id}/adsets` - List ad sets  
- `GET /act_{account_id}/ads` - List ads
- `GET /act_{account_id}/insights` - Get account insights

## Prerequisites
✅ `META_ACCESS_TOKEN` in `.env` file  
✅ `META_AD_ACCOUNT_ID` in `.env` file  
✅ Node.js dependencies installed (`axios`, `dotenv`)

## How to Run

### 1. Navigate to the folder
```bash
cd ~/Desktop/creditclear-app/meta-ads-ingest
```

### 2. Verify environment variables
```bash
cat .env
```
Should show:
```
META_ACCESS_TOKEN=EAAVhwlH2KxA...
META_AD_ACCOUNT_ID=act_1813825642661559
```

### 3. Run the script
```bash
node generate-api-calls.js
```

### 4. Monitor progress
The script will show:
- Real-time progress updates
- Success/failure counts
- API response details
- Final summary

### 5. Expected output
```
🚀 Starting Meta Marketing API call generation
Target: 100 successful calls
Ad Account: act_1813825642661559

[1] Making API call: Get Ad Accounts
✅ SUCCESS 1/100: Get Ad Accounts
   Response: 1 items returned

[2] Making API call: Get Campaigns
✅ SUCCESS 2/100: Get Campaigns
   Response: 1 items returned

...

🎉 API CALL GENERATION COMPLETE
✅ Successful calls: 100
❌ Failed calls: 2
📊 Total calls made: 102
⏱️  Total duration: 125 seconds
📈 Success rate: 98.0%

🎯 TARGET ACHIEVED! Meta App Review requirements should be satisfied.
```

## Safety Features
- 1-second delay between API calls
- Automatic retry on server errors (5xx) or rate limits (429)
- Safety stop after 300 total calls to prevent infinite loops
- Graceful shutdown with Ctrl+C

## Troubleshooting

### Common Issues:
1. **Token expired**: Get new access token from Meta App Dashboard
2. **Permission denied**: Ensure token has `ads_read` permission
3. **Rate limits**: Script handles these automatically with retries

### Manual verification:
Test a single API call:
```bash
curl -G "https://graph.facebook.com/v19.0/me/adaccounts" \
  --data-urlencode "access_token=YOUR_TOKEN" \
  --data-urlencode "fields=id,name"
```

## For Meta App Review
This script demonstrates:
✅ Active use of Marketing API  
✅ Multiple successful API interactions  
✅ Proper error handling  
✅ Read-only operations using `ads_read` permission  
✅ Business use case (managing own ad account)  

Run this script before submitting your app for review to ensure you meet the "API usage" requirement.