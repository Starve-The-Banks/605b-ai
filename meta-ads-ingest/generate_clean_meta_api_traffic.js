const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const API_VERSION = 'v19.0';
const BASE_URL = `https://graph.facebook.com/${API_VERSION}`;
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const AD_ACCOUNT_ID = process.env.META_AD_ACCOUNT_ID;

const TARGET_SUCCESSFUL_CALLS = 120;
const MAX_TRANSIENT_RETRIES = 2;

let successCount = 0;
let failureCount = 0;
let totalCalls = 0;
const startTime = Date.now();
const disabledEndpoints = [];
let baseDelayMin = 4000;
let baseDelayMax = 6000;

// Log setup
const logDir = path.join(__dirname, 'logs');
const logFile = path.join(logDir, 'meta_clean_api_calls.log');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage);
  fs.appendFileSync(logFile, logMessage + '\n');
}

// Endpoint pool
const endpoints = [
  {
    id: 'adaccounts',
    url: `${BASE_URL}/me/adaccounts`,
    name: 'Get Ad Accounts',
    params: {},
    enabled: true
  },
  {
    id: 'campaigns',
    url: `${BASE_URL}/${AD_ACCOUNT_ID}/campaigns`,
    name: 'Get Campaigns',
    params: { fields: 'id,name,status' },
    enabled: true
  },
  {
    id: 'adsets',
    url: `${BASE_URL}/${AD_ACCOUNT_ID}/adsets`,
    name: 'Get Ad Sets',
    params: { fields: 'id,name,status,campaign_id' },
    enabled: true
  },
  {
    id: 'ads',
    url: `${BASE_URL}/${AD_ACCOUNT_ID}/ads`,
    name: 'Get Ads',
    params: { fields: 'id,name,status,adset_id' },
    enabled: true
  },
  {
    id: 'insights',
    url: `${BASE_URL}/${AD_ACCOUNT_ID}/insights`,
    name: 'Get Account Insights',
    params: { fields: 'impressions,clicks,spend' },
    enabled: true
  }
];

function getRandomDelay() {
  return Math.floor(Math.random() * (baseDelayMax - baseDelayMin + 1)) + baseDelayMin;
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

function disableEndpoint(endpoint) {
  endpoint.enabled = false;
  disabledEndpoints.push(endpoint.name);
  
  // Increase global delay
  baseDelayMin = 8000;
  baseDelayMax = 12000;
  
  log(`🚫 DISABLED: ${endpoint.name} - switching to slower rate (8-12s delays)`);
}

function getEnabledEndpoints() {
  return endpoints.filter(ep => ep.enabled);
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
      log(`✅ SUCCESS ${successCount}/${TARGET_SUCCESSFUL_CALLS}: ${endpoint.name} - ${dataCount} items`);
      return { success: true };
    } else {
      throw new Error(`Status ${response.status}`);
    }
    
  } catch (error) {
    if (isRateLimitError(error)) {
      disableEndpoint(endpoint);
      failureCount++;
      const message = error.response?.data?.error?.message || 'Rate limit error';
      log(`⚠️  RATE LIMIT: ${endpoint.name} - ${message}`);
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

async function generateCleanApiTraffic() {
  log('🚀 Starting Clean Meta Marketing API Traffic Generation');
  log(`Target: ${TARGET_SUCCESSFUL_CALLS} successful calls`);
  log(`Ad Account: ${AD_ACCOUNT_ID}`);
  log(`Initial delay: ${baseDelayMin/1000}-${baseDelayMax/1000} seconds\n`);
  
  if (!ACCESS_TOKEN || !AD_ACCOUNT_ID) {
    log('❌ Missing environment variables');
    process.exit(1);
  }
  
  let endpointIndex = 0;
  
  while (successCount < TARGET_SUCCESSFUL_CALLS) {
    const enabledEndpoints = getEnabledEndpoints();
    
    if (enabledEndpoints.length === 0) {
      log('❌ All endpoints disabled - cannot continue');
      break;
    }
    
    const endpoint = enabledEndpoints[endpointIndex % enabledEndpoints.length];
    await makeApiCall(endpoint);
    
    // Progress update every 30 calls
    if (totalCalls % 30 === 0) {
      const successRate = ((successCount / totalCalls) * 100).toFixed(1);
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      const remaining = TARGET_SUCCESSFUL_CALLS - successCount;
      log(`📊 Progress: ${successCount}/${TARGET_SUCCESSFUL_CALLS} (${successRate}%) | ${remaining} remaining | ${elapsed}s elapsed\n`);
    }
    
    endpointIndex++;
    
    if (successCount < TARGET_SUCCESSFUL_CALLS) {
      const delay = getRandomDelay();
      await sleep(delay);
    }
    
    // Safety exit
    if (totalCalls > TARGET_SUCCESSFUL_CALLS * 3) {
      log('⚠️  Safety limit reached');
      break;
    }
  }
  
  // Final summary
  const endTime = Date.now();
  const totalTime = Math.round((endTime - startTime) / 1000);
  const successRate = ((successCount / totalCalls) * 100).toFixed(1);
  
  log('\n' + '='.repeat(60));
  log('🎉 CLEAN META API TRAFFIC GENERATION COMPLETE');
  log('='.repeat(60));
  log(`SUCCESSFUL_CALLS: ${successCount}`);
  log(`FAILED_CALLS: ${failureCount}`);
  log(`SUCCESS_RATE: ${successRate}%`);
  log(`DISABLED_ENDPOINTS: [${disabledEndpoints.join(', ')}]`);
  log(`TOTAL_TIME: ${totalTime} seconds`);
  
  if (successCount >= TARGET_SUCCESSFUL_CALLS && parseFloat(successRate) >= 98.0) {
    log('\n🎯 TARGET ACHIEVED! Meta app review ready.');
  } else if (successCount >= TARGET_SUCCESSFUL_CALLS) {
    log('\n✅ Call target reached but success rate below 98%');
  } else {
    log('\n⚠️  Target not reached');
  }
  
  // Console summary
  console.log('\n' + '='.repeat(50));
  console.log('FINAL SUMMARY');
  console.log('='.repeat(50));
  console.log(`SUCCESSFUL_CALLS: ${successCount}`);
  console.log(`FAILED_CALLS: ${failureCount}`);
  console.log(`SUCCESS_RATE: ${successRate}%`);
  console.log(`DISABLED_ENDPOINTS: [${disabledEndpoints.join(', ')}]`);
  console.log(`TOTAL_TIME: ${totalTime} seconds`);
}

process.on('SIGINT', () => {
  const elapsed = Math.round((Date.now() - startTime) / 1000);
  const successRate = totalCalls > 0 ? ((successCount / totalCalls) * 100).toFixed(1) : '0.0';
  log(`\n⏹️  Interrupted: ${successCount} successful (${successRate}%) - ${elapsed}s`);
  process.exit(0);
});

generateCleanApiTraffic().catch(error => {
  log(`💥 Script failed: ${error.message}`);
  process.exit(1);
});