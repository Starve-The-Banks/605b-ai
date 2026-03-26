#!/usr/bin/env node

// Check Creatomate account status

import { config } from 'dotenv';
config({ path: '.ads.env.local' });

async function checkAccount() {
  const apiKey = process.env.CREATOMATE_API_KEY;
  
  console.log('🔍 Checking Creatomate account...');
  
  // Try different endpoints to get account info
  const endpoints = [
    '/v2/usage',
    '/v2/account', 
    '/v2/me',
    '/usage',
    '/account'
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\nTrying: ${endpoint}`);
      const response = await fetch(`https://api.creatomate.com${endpoint}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Success:', JSON.stringify(data, null, 2));
        break;
      } else {
        console.log(`❌ ${response.status}: ${await response.text()}`);
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }
  
  // Also check recent renders
  try {
    console.log('\n🔍 Checking recent renders...');
    const response = await fetch('https://api.creatomate.com/v2/renders', {
      method: 'GET',
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    
    if (response.ok) {
      const renders = await response.json();
      console.log('Recent renders:', JSON.stringify(renders.slice(0, 3), null, 2));
    } else {
      console.log(`❌ ${response.status}: ${await response.text()}`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

checkAccount().catch(console.error);