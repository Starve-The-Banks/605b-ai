const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configuration
const API_VERSION = 'v19.0';
const BASE_URL = `https://graph.facebook.com/${API_VERSION}`;
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const AD_ACCOUNT_ID = process.env.META_AD_ACCOUNT_ID;

const TARGET_SUCCESSFUL_CALLS = 120;
const MIN_DELAY = 2000; // 2 seconds
const MAX_DELAY = 3000; // 3 seconds
const RATE_LIMIT_PAUSE = 20000; // 20 seconds
const MAX_RETRIES = 3;

// Tracking variables
let successCount = 0;
let failureCount = 0;
let totalCalls = 0;
const startTime = Date.now();

// Log file setup
const logDir = path.join(__dirname, 'logs');
const logFile = path.join(logDir, 'meta_ads_api_calls.log');

// Ensure logs directory exists
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// API endpoints to rotate through
const endpoints = [
  {
    url: `${BASE_URL}/me/adaccounts`,
    name: 'Get Ad Accounts',
    params: {}
  },
  {
    url: `${BASE_URL}/${AD_ACCOUNT_ID}/campaigns`,
    name: 'Get Campaigns',
    params: { fields: 'id,name,status' }
  },
  {
    url: `${BASE_URL}/${AD_ACCOUNT_ID}/adsets`,
    name: 'Get Ad Sets',
    params: { fields: 'id,name,status,campaign_id' }
  },
  {
    url: `${BASE_URL}/${AD_ACCOUNT_ID}/ads`,
    name: 'Get Ads',
    params: { fields: 'id,name,status,adset_id' }
  }
];

// Logging function
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  
  console.log(logMessage);
  fs.appendFileSync(logFile, logMessage + '\n');
}

// Random delay between min and max
function getRandomDelay() {
  return Math.floor(Math.random() * (MAX_DELAY - MIN_DELAY + 1)) + MIN_DELAY;
}

// Sleep function
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Exponential backoff calculation
function getBackoffDelay(attempt) {
  return Math.min(1000 * Math.pow(2, attempt), 10000); // Cap at 10 seconds
}

// Make API call with retry logic
async function makeApiCall(endpoint, attempt = 1) {
  totalCalls++;
  
  try {
    log(`[${totalCalls}] Attempting API call: ${endpoint.name} (attempt ${attempt})`);
    
    const response = await axios.get(endpoint.url, {
      params: {
        access_token: ACCESS_TOKEN,
        ...endpoint.params
      },
      timeout: 30000 // 30 second timeout
    });
    
    if (response.status === 200) {
      successCount++;
      const dataCount = response.data.data ? response.data.data.length : 'N/A';
      log(`✅ SUCCESS ${successCount}/${TARGET_SUCCESSFUL_CALLS}: ${endpoint.name} - ${dataCount} items`);
      return { success: true, rateLimited: false };
    } else {
      throw new Error(`Unexpected status code: ${response.status}`);
    }
    
  } catch (error) {
    const isRateLimit = error.response?.status === 429 || 
                       error.response?.data?.error?.code === 4 ||
                       error.response?.data?.error?.code === 17;
    
    if (isRateLimit) {
      log(`⏸️  RATE LIMIT: ${endpoint.name} - Pausing for ${RATE_LIMIT_PAUSE/1000} seconds`);
      return { success: false, rateLimited: true };
    }
    
    // Check if we should retry
    if (attempt < MAX_RETRIES && shouldRetry(error)) {
      const backoffDelay = getBackoffDelay(attempt);
      log(`🔄 Retrying ${endpoint.name} in ${backoffDelay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
      await sleep(backoffDelay);
      return makeApiCall(endpoint, attempt + 1);
    }
    
    // Log the failure
    failureCount++;
    const errorMessage = error.response?.data?.error?.message || error.message;
    const errorCode = error.response?.status || 'NETWORK';
    log(`❌ FAILURE ${failureCount}: ${endpoint.name} - ${errorCode}: ${errorMessage}`);
    
    return { success: false, rateLimited: false };
  }
}

// Determine if an error should trigger a retry
function shouldRetry(error) {
  if (!error.response) return true; // Network errors
  
  const status = error.response.status;
  
  // Retry on server errors and some client errors
  return status >= 500 || 
         status === 408 || // Request timeout
         status === 429;   // Rate limit (though we handle this separately)
}

// Main execution function
async function generateApiTraffic() {
  log('🚀 Starting Meta Marketing API traffic generation');
  log(`Target: ${TARGET_SUCCESSFUL_CALLS} successful calls`);
  log(`Ad Account: ${AD_ACCOUNT_ID}`);
  log(`Request interval: ${MIN_DELAY/1000}-${MAX_DELAY/1000} seconds`);
  log(`Log file: ${logFile}\n`);
  
  // Validate environment
  if (!ACCESS_TOKEN) {
    log('❌ ERROR: META_ACCESS_TOKEN not found in environment variables');
    process.exit(1);
  }
  
  if (!AD_ACCOUNT_ID) {
    log('❌ ERROR: META_AD_ACCOUNT_ID not found in environment variables');
    process.exit(1);
  }
  
  if (!AD_ACCOUNT_ID.startsWith('act_')) {
    log('❌ ERROR: META_AD_ACCOUNT_ID must be in format act_XXXXXXXX');
    process.exit(1);
  }
  
  let endpointIndex = 0;
  
  while (successCount < TARGET_SUCCESSFUL_CALLS) {
    const endpoint = endpoints[endpointIndex % endpoints.length];
    
    const result = await makeApiCall(endpoint);
    
    // Handle rate limiting
    if (result.rateLimited) {
      await sleep(RATE_LIMIT_PAUSE);
      continue; // Don't advance endpoint, retry the same one
    }
    
    // Progress update every 25 calls
    if (totalCalls % 25 === 0) {
      const successRate = ((successCount / totalCalls) * 100).toFixed(1);
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      log(`📊 Progress: ${successCount}/${TARGET_SUCCESSFUL_CALLS} successful (${successRate}% success rate) - ${elapsed}s elapsed\n`);
    }
    
    endpointIndex++;
    
    // Random delay between requests (only if not rate limited)
    if (successCount < TARGET_SUCCESSFUL_CALLS) {
      const delay = getRandomDelay();
      await sleep(delay);
    }
    
    // Safety check to prevent infinite loops
    if (totalCalls > TARGET_SUCCESSFUL_CALLS * 5) {
      log('⚠️  Safety limit reached - too many failures, stopping execution');
      break;
    }
  }
  
  // Final summary
  const endTime = Date.now();
  const totalTime = Math.round((endTime - startTime) / 1000);
  const successRate = ((successCount / totalCalls) * 100).toFixed(1);
  
  log('\n' + '='.repeat(70));
  log('🎉 META MARKETING API TRAFFIC GENERATION COMPLETE');
  log('='.repeat(70));
  log(`SUCCESSFUL_CALLS: ${successCount}`);
  log(`FAILED_CALLS: ${failureCount}`);
  log(`SUCCESS_RATE: ${successRate}%`);
  log(`TOTAL_TIME: ${totalTime} seconds`);
  log(`TOTAL_REQUESTS: ${totalCalls}`);
  log(`AVERAGE_RATE: ${(totalCalls / (totalTime / 60)).toFixed(1)} requests/minute`);
  
  if (successCount >= TARGET_SUCCESSFUL_CALLS) {
    log('\n🎯 TARGET ACHIEVED! App review requirements satisfied.');
    log('✅ Ready for Ads Management Standard Access submission');
  } else {
    log('\n⚠️  Target not fully reached. Consider investigating API issues.');
  }
  
  log(`\n📄 Full logs saved to: ${logFile}`);
  
  // Final summary for script output
  console.log('\n' + '='.repeat(50));
  console.log('FINAL SUMMARY');
  console.log('='.repeat(50));
  console.log(`SUCCESSFUL_CALLS: ${successCount}`);
  console.log(`FAILED_CALLS: ${failureCount}`);
  console.log(`SUCCESS_RATE: ${successRate}%`);
  console.log(`TOTAL_TIME: ${totalTime} seconds`);
}

// Graceful shutdown handler
process.on('SIGINT', () => {
  const elapsed = Math.round((Date.now() - startTime) / 1000);
  const successRate = totalCalls > 0 ? ((successCount / totalCalls) * 100).toFixed(1) : '0.0';
  
  log('\n⏹️  Interrupted by user');
  log(`Final status: ${successCount} successful calls (${successRate}% success rate)`);
  log(`Execution time: ${elapsed} seconds`);
  log(`Logs saved to: ${logFile}`);
  process.exit(0);
});

// Handle unhandled errors
process.on('unhandledRejection', (reason, promise) => {
  log(`💥 Unhandled promise rejection: ${reason}`);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  log(`💥 Uncaught exception: ${error.message}`);
  process.exit(1);
});

// Start the traffic generation
generateApiTraffic().catch(error => {
  log(`💥 Script failed: ${error.message}`);
  process.exit(1);
});