const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const API_VERSION = 'v19.0';
const BASE_URL = `https://graph.facebook.com/${API_VERSION}`;
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const AD_ACCOUNT_ID = process.env.META_AD_ACCOUNT_ID;

const DELAY_MIN = 20000; // 20 seconds
const DELAY_MAX = 30000; // 30 seconds
const RATE_LIMIT_PAUSE = 60000; // 60 seconds
const MAX_TRANSIENT_RETRIES = 2;

let successCount = 0;
let failureCount = 0;
let totalCalls = 0;
const startTime = Date.now();

// Log setup
const logDir = path.join(__dirname, 'logs');
const logFile = path.join(logDir, 'meta_review_maintenance.log');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage);
  fs.appendFileSync(logFile, logMessage + '\n');
}

// Stable endpoint pool (no adsets, no ads)
const endpoints = [
  {
    id: 'adaccounts',
    url: `${BASE_URL}/me/adaccounts`,
    name: 'Get Ad Accounts',
    params: {}
  },
  {
    id: 'campaigns',
    url: `${BASE_URL}/${AD_ACCOUNT_ID}/campaigns`,
    name: 'Get Campaigns',
    params: { fields: 'id,name,status' }
  },
  {
    id: 'insights',
    url: `${BASE_URL}/${AD_ACCOUNT_ID}/insights`,
    name: 'Get Account Insights',
    params: { fields: 'impressions,clicks,spend' }
  }
];

function getRandomDelay() {
  return Math.floor(Math.random() * (DELAY_MAX - DELAY_MIN + 1)) + DELAY_MIN;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isRateLimitError(error) {
  if (!error.response) return false;
  
  const status = error.response.status;
  const errorData = error.response.data?.error;
  const message = errorData?.message?.toLowerCase() || '';
  
  return status === 429 ||
         message.includes('user request limit reached') ||
         message.includes('rate limit') ||
         message.includes('throttled') ||
         errorData?.code === 4 ||
         errorData?.code === 17;
}

function isTransientError(error) {
  if (!error.response) return true; // Network errors
  const status = error.response.status;
  return status >= 500 || status === 408;
}

async function makeApiCall(endpoint, attempt = 1) {
  totalCalls++;
  
  try {
    log(`[${totalCalls}] ${endpoint.name}${attempt > 1 ? ` (retry ${attempt})` : ''}`);
    
    const response = await axios.get(endpoint.url, {
      params: {
        access_token: ACCESS_TOKEN,
        ...endpoint.params
      },
      timeout: 30000
    });
    
    if (response.status === 200) {
      successCount++;
      const dataCount = response.data.data ? response.data.data.length : 'N/A';
      log(`✅ SUCCESS ${successCount}: ${endpoint.name} - ${dataCount} items`);
      return { success: true };
    } else {
      throw new Error(`Status ${response.status}`);
    }
    
  } catch (error) {
    if (isRateLimitError(error)) {
      failureCount++;
      const message = error.response?.data?.error?.message || 'Rate limit error';
      log(`⚠️  RATE LIMIT: ${endpoint.name} - ${message} - pausing ${RATE_LIMIT_PAUSE/1000}s`);
      return { success: false, rateLimited: true };
    }
    
    if (isTransientError(error) && attempt <= MAX_TRANSIENT_RETRIES) {
      const backoffDelay = 2000 * attempt;
      log(`🔄 Retrying ${endpoint.name} in ${backoffDelay}ms`);
      await sleep(backoffDelay);
      return makeApiCall(endpoint, attempt + 1);
    }
    
    failureCount++;
    const errorMessage = error.response?.data?.error?.message || error.message;
    const errorCode = error.response?.status || 'NETWORK';
    log(`❌ FAILED: ${endpoint.name} - ${errorCode}: ${errorMessage}`);
    return { success: false };
  }
}

async function maintainReviewActivity() {
  log('🔄 Starting Meta Review Maintenance Activity');
  log(`Ad Account: ${AD_ACCOUNT_ID}`);
  log(`Request interval: ${DELAY_MIN/1000}-${DELAY_MAX/1000} seconds`);
  log(`Stable endpoints: ${endpoints.length} (adaccounts, campaigns, insights)`);
  log('Running indefinitely - press Ctrl+C to stop\n');
  
  if (!ACCESS_TOKEN || !AD_ACCOUNT_ID) {
    log('❌ Missing environment variables');
    process.exit(1);
  }
  
  let endpointIndex = 0;
  
  while (true) {
    const endpoint = endpoints[endpointIndex % endpoints.length];
    const result = await makeApiCall(endpoint);
    
    // Handle rate limiting
    if (result.rateLimited) {
      await sleep(RATE_LIMIT_PAUSE);
      continue; // Don't advance endpoint, retry the same one
    }
    
    endpointIndex++;
    
    // Status update every 20 calls
    if (totalCalls % 20 === 0) {
      const successRate = ((successCount / totalCalls) * 100).toFixed(1);
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      const hours = Math.floor(elapsed / 3600);
      const minutes = Math.floor((elapsed % 3600) / 60);
      const timeStr = hours > 0 ? `${hours}h${minutes}m` : `${minutes}m`;
      log(`📊 Status: ${successCount} successful (${successRate}%) | ${failureCount} failed | Running ${timeStr}\n`);
    }
    
    // Regular delay between requests
    const delay = getRandomDelay();
    const delaySeconds = (delay / 1000).toFixed(1);
    log(`⏳ Next request in ${delaySeconds}s...\n`);
    await sleep(delay);
  }
}

process.on('SIGINT', () => {
  const elapsed = Math.round((Date.now() - startTime) / 1000);
  const successRate = totalCalls > 0 ? ((successCount / totalCalls) * 100).toFixed(1) : '0.0';
  const hours = Math.floor(elapsed / 3600);
  const minutes = Math.floor((elapsed % 3600) / 60);
  const timeStr = hours > 0 ? `${hours}h${minutes}m` : `${minutes}m`;
  
  log('\n' + '='.repeat(50));
  log('⏹️  MAINTENANCE ACTIVITY STOPPED');
  log('='.repeat(50));
  log(`Total successful calls: ${successCount}`);
  log(`Total failed calls: ${failureCount}`);
  log(`Success rate: ${successRate}%`);
  log(`Runtime: ${timeStr}`);
  log(`Log file: ${logFile}`);
  process.exit(0);
});

maintainReviewActivity().catch(error => {
  log(`💥 Script failed: ${error.message}`);
  process.exit(1);
});