#!/usr/bin/env node

// Debug with forced video elements

import { config } from 'dotenv';
config({ path: '.ads.env.local' });

async function debugVideoRender() {
  const apiKey = process.env.CREATOMATE_API_KEY;
  
  // Force video with animations and time-based elements
  const videoSource = {
    output_format: 'mp4',
    width: 1080,
    height: 1920,
    duration: 10,
    frame_rate: 30,
    elements: [
      // Background
      {
        type: 'shape',
        fill_color: '#000000',
        x: '0',
        y: '0', 
        width: '1080',
        height: '1920',
        time: 0,
        duration: 10
      },
      // Animated text 1
      {
        type: 'text',
        text: 'First Text',
        font_size: 64,
        fill_color: '#ffffff',
        x: '50%',
        y: '30%',
        text_align: 'center',
        time: 0,
        duration: 3,
        animations: [
          { type: 'fade', fade_in: true, duration: 0.5 }
        ]
      },
      // Animated text 2
      {
        type: 'text',
        text: 'Second Text',
        font_size: 64,
        fill_color: '#ff6b35',
        x: '50%',
        y: '50%',
        text_align: 'center',
        time: 3,
        duration: 4,
        animations: [
          { type: 'slide', direction: 'up', distance: '50px', duration: 0.6 }
        ]
      },
      // Final text
      {
        type: 'text',
        text: '605b.ai',
        font_size: 72,
        fill_color: '#ff6b35',
        x: '50%',
        y: '70%',
        text_align: 'center',
        time: 7,
        duration: 3,
        animations: [
          { type: 'scale', start_scale: '80%', duration: 0.5 }
        ]
      }
    ]
  };
  
  console.log('📤 Sending video render request...');
  
  const response = await fetch('https://api.creatomate.com/v2/renders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ 
      source: videoSource,
      render_scale: 1.0
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    console.error('❌ API Error:', response.status, error);
    return;
  }
  
  const result = await response.json();
  console.log('📥 API Response:');
  console.log(`  ID: ${result.id}`);
  console.log(`  Status: ${result.status}`);
  console.log(`  Output format: ${result.output_format}`);
  console.log(`  URL: ${result.url}`);
  
  const renderId = result.id;
  
  console.log('\n⏳ Polling status...');
  
  // Poll status
  let attempts = 0;
  while (attempts < 60) {
    await new Promise(r => setTimeout(r, 3000));
    
    const statusResponse = await fetch(`https://api.creatomate.com/v2/renders/${renderId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    
    const status = await statusResponse.json();
    console.log(`Status: ${status.status} (${attempts * 3}s)`);
    
    if (status.status === 'succeeded') {
      console.log('\n✅ Success!');
      console.log('Final URL:', status.url);
      
      // Check file
      const fileResponse = await fetch(status.url);
      const buffer = await fileResponse.arrayBuffer();
      const sizeMB = Math.round(buffer.byteLength / 1024 / 1024 * 100) / 100;
      
      console.log(`File size: ${sizeMB}MB`);
      console.log(`Content-Type: ${fileResponse.headers.get('content-type')}`);
      
      if (sizeMB > 0.5) {
        console.log('\n🎉 Full video render achieved!');
      } else {
        console.log('\n⚠️ Still getting small file');
      }
      break;
    } else if (status.status === 'failed') {
      console.log('\n❌ Render failed');
      console.log(JSON.stringify(status, null, 2));
      break;
    }
    
    attempts++;
  }
}

debugVideoRender().catch(console.error);