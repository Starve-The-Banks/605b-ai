# Meta Ads Ingestion

A Node.js worker that fetches campaign, adset, ad, and performance insight data from the Meta Marketing API and stores it in a local PostgreSQL database.

## Why `/me/accounts` returns empty but adsets work

The access token provided (`EAAVhwl...`) is likely a **System User Token** or an **App-scoped User Token** generated via the Meta App Dashboard, rather than a personal user token. 

1. **Ad Account Access:** The token successfully queries `/act_1813825642661559/adsets` because the System User (or the App itself) has been granted explicit permission to manage that specific Ad Account in Business Manager.
2. **Page Access (`/me/accounts`):** The `/me/accounts` endpoint returns the Facebook Pages that the *token's identity* has a role on (like Admin or Editor). Because this token represents a System User or App—not your personal Facebook profile—it doesn't inherently "own" or have roles on any Pages unless they were explicitly assigned to that System User in Business Manager.

To fix the empty `/me/accounts` response if you need Page access (e.g., to create new ads), you must go into Business Manager -> Users -> System Users -> select the user -> Add Assets -> Pages -> assign the relevant Page.

## Setup & Running

1. **Environment Variables**
   Copy the example env file and add your actual token:
   ```bash
   cp .env.example .env
   ```

2. **Run with Docker Compose**
   This will spin up a PostgreSQL database (automatically applying the schema) and run the Node.js ingestion script.
   ```bash
   docker-compose up --build
   ```

3. **Run Locally (without Docker for the worker)**
   If you just want the DB in Docker but want to run the script locally:
   ```bash
   # Start just the database
   docker-compose up -d postgres
   
   # Install dependencies
   npm install
   
   # Run the script
   node fetch-meta-ads.js
   ```

## Scheduling (Cron)

To run this automatically, you can add a cron job on your host machine or server:

```bash
# Run every day at 2:00 AM
0 2 * * * cd /path/to/meta-ads-ingest && /usr/local/bin/node fetch-meta-ads.js >> /var/log/meta-ads.log 2>&1
```

Or, if using Docker, you can set up a cron job to run the container:
```bash
0 2 * * * cd /path/to/meta-ads-ingest && docker-compose up --build worker
```
