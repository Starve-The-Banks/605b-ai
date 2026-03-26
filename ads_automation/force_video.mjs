#!/usr/bin/env node

// Force video output with moving elements

import { config } from 'dotenv';
config({ path: '.ads.env.local' });

async function forceVideoRender() {
  const apiKey = process.env.CREATOMATE_API_KEY;
  
  // Create a source with constantly moving elements to force video
  const videoSource = {
    output_format: 'mp4',
    width: 1080,
    height: 1920,
    duration: 10,
    frame_rate: 30,
    elements: [
      // Animated background
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
      // Continuously moving element
      {
        type: 'shape',
        fill_color: '#ff6b35',
        width: '100',
        height: '100',
        x: '0',
        y: '50%',
        time: 0,
        duration: 10,
        animations: [
          { 
            type: 'move',
            x_to: '980',
            duration: 10,
            easing: 'linear'
          }
        ]
      },
      // Text that appears and disappears multiple times
      {
        type: 'text',
        text: 'One upload showed me accounts I never opened.',
        font_size: 48,
        fill_color: '#ffffff',
        x: '50%',
        y: '30%',
        text_align: 'center',
        width: '900',
        line_height: '130%',
        time: 0,
        duration: 3,
        animations: [
          { type: 'fade', fade_in: true, duration: 0.5 },
          { type: 'fade', fade_out: true, start_time: 2.5, duration: 0.5 }
        ]
      },
      {
        type: 'text',
        text: 'Credit reports can contain fraudulent accounts.',
        font_size: 40,
        fill_color: '#e2e8f0',
        x: '50%',
        y: '50%',
        text_align: 'center',
        width: '900',
        line_height: '140%',
        time: 3,
        duration: 4,
        animations: [
          { type: 'slide', direction: 'up', distance: '30px', duration: 0.6 },
          { type: 'fade', fade_out: true, start_time: 3, duration: 1 }
        ]
      },
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
          { type: 'scale', start_scale: '50%', duration: 1 }
        ]
      },
      // Add a shape that rotates to force motion
      {
        type: 'shape',
        shape: 'circle',
        fill_color: 'rgba(255,107,53,0.3)',
        width: '50',
        height: '50',
        x: '50%',
        y: '80%',
        time: 0,
        duration: 10,
        animations: [
          { 
            type: 'rotate',
            angle: '360',
            duration: 2,
            repeat: 5
          }
        ]
      }
    ]
  };
  
  console.log('📤 Forcing video with continuous motion...');
  
  const response = await fetch('https://api.creatomate.com/v2/renders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ source: videoSource }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    console.error('❌ API Error:', response.status, error);
    return;
  }
  
  const result = await response.json();
  console.log('📥 API Response:');
  console.log(`  Output format: ${result.output_format}`);
  console.log(`  URL: ${result.url}`);
  
  const renderId = result.id;
  
  console.log('\n⏳ Polling status...');
  
  // Poll status
  let attempts = 0;
  while (attempts < 60) {
    await new Promise(r => setTimeout(r, 5000));
    
    const statusResponse = await fetch(`https://api.creatomate.com/v2/renders/${renderId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    
    const status = await statusResponse.json();
    console.log(`Status: ${status.status} (${attempts * 5}s)`);
    
    if (status.status === 'succeeded') {
      console.log('\n✅ Success!');
      console.log('Final URL:', status.url);
      
      // Check file
      const fileResponse = await fetch(status.url);
      const buffer = await fileResponse.arrayBuffer();
      const sizeMB = Math.round(buffer.byteLength / 1024 / 1024 * 100) / 100;
      
      console.log(`File size: ${sizeMB}MB`);
      console.log(`Content-Type: ${fileResponse.headers.get('content-type')}`);
      
      if (sizeMB > 0.5 && fileResponse.headers.get('content-type')?.includes('video')) {
        console.log('\n🎉 Full video render achieved!');
        return true;
      } else {
        console.log('\n⚠️ Still not a proper video file');
        return false;
      }
    } else if (status.status === 'failed') {
      console.log('\n❌ Render failed');
      console.log(JSON.stringify(status, null, 2));
      return false;
    }
    
    attempts++;
  }
  
  return false;
}

forceVideoRender().catch(console.error);