#!/usr/bin/env node

// Test single render with simplified settings

import { config } from 'dotenv';
import { renderAd, checkRenderStatus } from './lib/render.mjs';

config({ path: '.ads.env.local' });

const testScript = {
  id: 'test_01',
  hook: 'One upload showed me accounts I never opened.',
  problem: 'Credit reports can contain inaccuracies or even fraudulent accounts, affecting your financial health.',
  demo: 'With 605b.ai, upload your credit report. Our system will scan it, flagging potential issues. If anything suspicious is identified, it generates dispute documentation for you.',
  cta: 'Take control of your credit report analysis. Start with 605b.ai today.'
};

const testVariation = {
  id: 'ad_13',
  hook: testScript.hook,
  voice: 'professional_female',
  visual: { key: 'scan_flow' }
};

async function testRender() {
  console.log('🧪 Testing single render...');
  
  const apiKey = process.env.CREATOMATE_API_KEY;
  if (!apiKey) {
    throw new Error('CREATOMATE_API_KEY not found');
  }
  
  try {
    // Render without audio first
    const result = await renderAd(apiKey, testScript, testVariation, null);
    console.log('Render queued:', result.render_id);
    
    // Poll status
    let attempts = 0;
    while (attempts < 60) { // 5 minutes max
      await new Promise(r => setTimeout(r, 5000));
      
      const status = await checkRenderStatus(apiKey, result.render_id);
      console.log(`Status: ${status.status} (${attempts * 5}s)`);
      
      if (status.status === 'succeeded') {
        console.log('✅ Success!');
        console.log('URL:', status.url);
        
        // Test download
        const response = await fetch(status.url);
        const buffer = await response.arrayBuffer();
        console.log(`File size: ${Math.round(buffer.byteLength / 1024)}KB`);
        
        if (buffer.byteLength > 100000) { // > 100KB
          console.log('🎉 Full render successful!');
        } else {
          console.log('⚠️ Still getting small preview file');
        }
        break;
      } else if (status.status === 'failed') {
        console.log('❌ Render failed');
        break;
      }
      
      attempts++;
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testRender();