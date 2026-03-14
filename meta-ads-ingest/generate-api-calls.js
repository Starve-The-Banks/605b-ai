const axios = require('axios');
require('dotenv').config();

const API_VERSION = 'v19.0';
const BASE_URL = `https://graph.facebook.com/${API_VERSION}`;
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const AD_ACCOUNT_ID = process.env.META_AD_ACCOUNT_ID;

// Target: 100 successful API calls
const TARGET_SUCCESSFUL_CALLS = 100;
const DELAY_BETWEEN_CALLS = 1000; // 1 second delay
const MAX_RETRIES = 3;

let successCount = 0;
let failureCount = 0;
let totalCalls = 0;

// List of endpoints to cycle through for variety
const endpoints = [
  {
    url: `${BASE_URL}/me/adaccounts`,
    name: 'Get Ad Accounts',
    params: { fields: 'id,name,account_status,currency,timezone_name' }
  },
  {
    url: `${BASE_URL}/${AD_ACCOUNT_ID}/campaigns`,
    name: 'Get Campaigns',
    params: { fields: 'id,name,status,objective,created_time' }
  },
  {
    url: `${BASE_URL}/${AD_ACCOUNT_ID}/adsets`,
    name: 'Get Ad Sets',
    params: { fields: 'id,name,status,daily_budget,created_time', limit: 25 }
  },
  {
    url: `${BASE_URL}/${AD_ACCOUNT_ID}/ads`,
    name: 'Get Ads',
    params: { fields: 'id,name,status,created_time', limit: 25 }
  },
  {
    url: `${BASE_URL}/${AD_ACCOUNT_ID}/insights`,
    name: 'Get Account Insights',
    params: { fields: 'impressions,clicks,spend', date_preset: 'yesterday' }
  }
];

async function makeApiCall(endpoint, retryCount = 0) {
  totalCalls++;
  
  try {
    console.log(`[${totalCalls}] Making API call: ${endpoint.name}`);
    
    const response = await axios.get(endpoint.url, {
      params: {
        access_token: ACCESS_TOKEN,
        ...endpoint.params
      }
    });
    
    if (response.status === 200) {
      successCount++;
      console.log(`✅ SUCCESS ${successCount}/${TARGET_SUCCESSFUL_CALLS}: ${endpoint.name}`);
      
      // Log some response details for verification
      const dataCount = response.data.data ? response.data.data.length : 'N/A';
      console.log(`   Response: ${dataCount} items returned`);
      
      return true;
    }
    
  } catch (error) {
    failureCount++;
    console.log(`❌ FAILURE ${failureCount}: ${endpoint.name}`);
    
    if (error.response) {
      console.log(`   Error ${error.response.status}: ${error.response.data?.error?.message || 'Unknown error'}`);
      
      // Retry on certain errors
      if (retryCount < MAX_RETRIES && (error.response.status >= 500 || error.response.status === 429)) {
        console.log(`   Retrying in 2 seconds... (attempt ${retryCount + 1}/${MAX_RETRIES})`);
        await sleep(2000);
        return makeApiCall(endpoint, retryCount + 1);
      }
    } else {
      console.log(`   Network error: ${error.message}`);
    }
    
    return false;
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function generateApiCalls() {
  console.log('🚀 Starting Meta Marketing API call generation');
  console.log(`Target: ${TARGET_SUCCESSFUL_CALLS} successful calls`);
  console.log(`Ad Account: ${AD_ACCOUNT_ID}`);
  console.log(`Delay between calls: ${DELAY_BETWEEN_CALLS}ms\n`);
  
  if (!ACCESS_TOKEN) {
    console.error('❌ META_ACCESS_TOKEN not found in environment variables');
    process.exit(1);
  }
  
  if (!AD_ACCOUNT_ID) {
    console.error('❌ META_AD_ACCOUNT_ID not found in environment variables');
    process.exit(1);
  }
  
  const startTime = Date.now();
  let endpointIndex = 0;
  
  while (successCount < TARGET_SUCCESSFUL_CALLS) {
    const endpoint = endpoints[endpointIndex % endpoints.length];
    
    await makeApiCall(endpoint);
    
    // Progress update every 10 calls
    if (totalCalls % 10 === 0) {
      const successRate = ((successCount / totalCalls) * 100).toFixed(1);
      console.log(`\n📊 Progress: ${successCount}/${TARGET_SUCCESSFUL_CALLS} successful (${successRate}% success rate)\n`);
    }
    
    endpointIndex++;
    
    // Small delay between calls to be respectful to the API
    if (successCount < TARGET_SUCCESSFUL_CALLS) {
      await sleep(DELAY_BETWEEN_CALLS);
    }
    
    // Safety check to prevent infinite loops
    if (totalCalls > TARGET_SUCCESSFUL_CALLS * 3) {
      console.log('\n⚠️  Too many failures, stopping to prevent infinite loop');
      break;
    }
  }
  
  const endTime = Date.now();
  const duration = Math.round((endTime - startTime) / 1000);
  
  console.log('\n' + '='.repeat(60));
  console.log('🎉 API CALL GENERATION COMPLETE');
  console.log('='.repeat(60));
  console.log(`✅ Successful calls: ${successCount}`);
  console.log(`❌ Failed calls: ${failureCount}`);
  console.log(`📊 Total calls made: ${totalCalls}`);
  console.log(`⏱️  Total duration: ${duration} seconds`);
  console.log(`📈 Success rate: ${((successCount / totalCalls) * 100).toFixed(1)}%`);
  
  if (successCount >= TARGET_SUCCESSFUL_CALLS) {
    console.log('\n🎯 TARGET ACHIEVED! Meta App Review requirements should be satisfied.');
  } else {
    console.log('\n⚠️  Target not reached. Consider investigating API issues or token permissions.');
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n⏹️  Interrupted by user');
  console.log(`Final count: ${successCount} successful calls`);
  process.exit(0);
});

// Run the script
generateApiCalls().catch(error => {
  console.error('💥 Script failed:', error.message);
  process.exit(1);
});