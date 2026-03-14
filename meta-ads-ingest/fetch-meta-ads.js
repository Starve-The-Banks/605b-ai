const { Client } = require('pg');
const axios = require('axios');
require('dotenv').config();

const API_VERSION = 'v19.0';
const BASE_URL = `https://graph.facebook.com/${API_VERSION}`;
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const AD_ACCOUNT_ID = process.env.META_AD_ACCOUNT_ID;

// Clean JSON logger
const log = (level, message, data = {}) => {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...data
  }));
};

// Wait function for rate limiting
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Fetch with exponential backoff for rate limits
async function fetchWithRetry(url, params = {}, retries = 5) {
  // Attach token to params
  params.access_token = ACCESS_TOKEN;
  
  for (let i = 0; i < retries; i++) {
    try {
      const response = await axios.get(url, { params });
      return response.data;
    } catch (error) {
      const status = error.response?.status;
      const errorData = error.response?.data?.error;
      
      // Meta API rate limits often return 400 or 429 with specific error codes (e.g., 17, 80004)
      const isRateLimit = status === 429 || (errorData && (errorData.code === 17 || errorData.code === 80004));
      
      if (isRateLimit && i < retries - 1) {
        const waitTime = Math.pow(2, i) * 10000; // 10s, 20s, 40s, 80s
        log('WARN', 'Rate limit hit, backing off', { waitTimeMs: waitTime, attempt: i + 1 });
        await delay(waitTime);
      } else {
        log('ERROR', 'Meta API Request Failed', { 
          url, 
          status, 
          error: errorData || error.message 
        });
        throw error;
      }
    }
  }
  throw new Error('Max retries reached');
}

// Handle Meta API cursor-based pagination
async function fetchAllPages(endpoint, params) {
  let allData = [];
  let url = `${BASE_URL}/${AD_ACCOUNT_ID}/${endpoint}`;
  
  while (url) {
    log('INFO', `Fetching page for ${endpoint}`, { url: url.split('?')[0] });
    const response = await fetchWithRetry(url, params);
    
    if (response.data && Array.isArray(response.data)) {
      allData = allData.concat(response.data);
    }
    
    // Check for next page
    if (response.paging && response.paging.next) {
      url = response.paging.next;
      // Clear params since they are already embedded in the paging.next URL
      params = {}; 
    } else {
      url = null;
    }
  }
  
  return allData;
}

async function syncCampaigns(db) {
  log('INFO', 'Starting campaigns sync');
  const campaigns = await fetchAllPages('campaigns', {
    fields: 'id,name,status'
  });

  let upserted = 0;
  for (const campaign of campaigns) {
    await db.query(`
      INSERT INTO campaigns (id, name, status, updated_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        status = EXCLUDED.status,
        updated_at = CURRENT_TIMESTAMP
    `, [campaign.id, campaign.name, campaign.status]);
    upserted++;
  }
  log('INFO', 'Completed campaigns sync', { count: upserted });
}

async function syncAdsets(db) {
  log('INFO', 'Starting adsets sync');
  const adsets = await fetchAllPages('adsets', {
    fields: 'id,name,status,campaign_id,daily_budget'
  });

  let upserted = 0;
  for (const adset of adsets) {
    await db.query(`
      INSERT INTO adsets (id, campaign_id, name, status, daily_budget, updated_at)
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
      ON CONFLICT (id) DO UPDATE SET
        campaign_id = EXCLUDED.campaign_id,
        name = EXCLUDED.name,
        status = EXCLUDED.status,
        daily_budget = EXCLUDED.daily_budget,
        updated_at = CURRENT_TIMESTAMP
    `, [adset.id, adset.campaign_id, adset.name, adset.status, adset.daily_budget]);
    upserted++;
  }
  log('INFO', 'Completed adsets sync', { count: upserted });
}

async function syncAds(db) {
  log('INFO', 'Starting ads sync');
  const ads = await fetchAllPages('ads', {
    fields: 'id,name,status,adset_id,campaign_id'
  });

  let upserted = 0;
  for (const ad of ads) {
    await db.query(`
      INSERT INTO ads (id, adset_id, campaign_id, name, status, updated_at)
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
      ON CONFLICT (id) DO UPDATE SET
        adset_id = EXCLUDED.adset_id,
        campaign_id = EXCLUDED.campaign_id,
        name = EXCLUDED.name,
        status = EXCLUDED.status,
        updated_at = CURRENT_TIMESTAMP
    `, [ad.id, ad.adset_id, ad.campaign_id, ad.name, ad.status]);
    upserted++;
  }
  log('INFO', 'Completed ads sync', { count: upserted });
}

async function syncInsights(db) {
  log('INFO', 'Starting insights sync (Last 7 Days)');
  
  // Fetch insights at the ad level, broken down by day
  const insights = await fetchAllPages('insights', {
    fields: 'campaign_id,adset_id,ad_id,spend,impressions,clicks,cpc,ctr,reach,actions',
    level: 'ad',
    time_range: JSON.stringify({
      since: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      until: new Date().toISOString().split('T')[0]
    }),
    time_increment: 1 // Daily breakdown
  });

  let upserted = 0;
  for (const row of insights) {
    await db.query(`
      INSERT INTO insights (
        date_start, date_stop, campaign_id, adset_id, ad_id, 
        spend, impressions, clicks, cpc, ctr, reach, actions
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (date_start, ad_id) DO UPDATE SET
        spend = EXCLUDED.spend,
        impressions = EXCLUDED.impressions,
        clicks = EXCLUDED.clicks,
        cpc = EXCLUDED.cpc,
        ctr = EXCLUDED.ctr,
        reach = EXCLUDED.reach,
        actions = EXCLUDED.actions,
        updated_at = CURRENT_TIMESTAMP
    `, [
      row.date_start,
      row.date_stop,
      row.campaign_id,
      row.adset_id,
      row.ad_id,
      row.spend || 0,
      row.impressions || 0,
      row.clicks || 0,
      row.cpc || 0,
      row.ctr || 0,
      row.reach || 0,
      row.actions ? JSON.stringify(row.actions) : null
    ]);
    upserted++;
  }
  log('INFO', 'Completed insights sync', { count: upserted });
}

async function main() {
  log('INFO', 'Starting Meta Ads Ingestion Job');

  if (!ACCESS_TOKEN || !AD_ACCOUNT_ID) {
    log('FATAL', 'Missing META_ACCESS_TOKEN or META_AD_ACCOUNT_ID in environment.');
    process.exit(1);
  }

  const db = new Client({
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    database: process.env.POSTGRES_DB,
  });

  try {
    await db.connect();
    log('INFO', 'Connected to PostgreSQL database');

    await syncCampaigns(db);
    await syncAdsets(db);
    await syncAds(db);
    await syncInsights(db);

    log('INFO', 'Meta Ads Ingestion Job Completed Successfully');
  } catch (err) {
    log('FATAL', 'Ingestion job failed', { error: err.message, stack: err.stack });
    process.exit(1);
  } finally {
    await db.end();
  }
}

main();
