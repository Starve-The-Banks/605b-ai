#!/usr/bin/env node

// Debug Creatomate API with minimal example

import { config } from 'dotenv';
config({ path: '.ads.env.local' });

async function debugRender() {
  const apiKey = process.env.CREATOMATE_API_KEY;
  
  // Minimal video source based on docs
  const minimalSource = {
    output_format: 'mp4',
    width: 1280,
    height: 720,
    duration: 5,
    elements: [
      {
        type: 'text',
        text: 'Hello World',
        font_size: 48,
        fill_color: '#ffffff',
        x: '50%',
        y: '50%'
      }
    ]
  };
  
  console.log('📤 Sending minimal render request...');
  console.log(JSON.stringify(minimalSource, null, 2));
  
  const response = await fetch('https://api.creatomate.com/v2/renders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ 
      source: minimalSource,
      render_scale: 1.0
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    console.error('❌ API Error:', response.status, error);
    return;
  }
  
  const result = await response.json();
  console.log('📥 API Response:', JSON.stringify(result, null, 2));
  
  const renderId = Array.isArray(result) ? result[0]?.id : result.id;
  if (!renderId) {
    console.error('❌ No render ID in response');
    return;
  }
  
  console.log('⏳ Polling status...');
  
  // Poll status
  let attempts = 0;
  while (attempts < 30) {
    await new Promise(r => setTimeout(r, 2000));
    
    const statusResponse = await fetch(`https://api.creatomate.com/v2/renders/${renderId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    
    const status = await statusResponse.json();
    console.log(`Status: ${status.status} (${attempts * 2}s)`);
    
    if (status.status === 'succeeded') {
      console.log('✅ Success!');
      console.log('URL:', status.url);
      
      // Check file
      const fileResponse = await fetch(status.url);
      const buffer = await fileResponse.arrayBuffer();
      const sizeKB = Math.round(buffer.byteLength / 1024);
      
      console.log(`File size: ${sizeKB}KB`);
      console.log(`Content-Type: ${fileResponse.headers.get('content-type')}`);
      
      if (sizeKB > 100) {
        console.log('🎉 Full render achieved!');
      } else {
        console.log('⚠️ Still getting tiny file');
      }
      break;
    } else if (status.status === 'failed') {
      console.log('❌ Render failed');
      console.log(JSON.stringify(status, null, 2));
      break;
    }
    
    attempts++;
  }
}

debugRender().catch(console.error);