#!/usr/bin/env node

// Re-render top 5 ads with fixed production settings

import fs from 'fs/promises';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { config } from 'dotenv';
import { renderAd, checkRenderStatus, validateRender } from './lib/render.mjs';

config({ path: '.ads.env.local' });

const TOP_5_ADS = ['ad_13', 'ad_05', 'ad_02', 'ad_08', 'ad_20'];
const OUTPUT_DIR = '/Users/seek/Desktop/dev/creditclear-app/public/ads/meta-launch/finalists';
const ROOT = process.cwd();
const execFileAsync = promisify(execFile);
const OUTPUT_NAME_MAP = {
  ad_13: '605b_ad13_identity_theft_primary.mp4',
  ad_05: '605b_ad05_broad_cold_primary.mp4',
  ad_02: '605b_ad02_three_bureau_test.mp4',
  ad_08: '605b_ad08_scan_flow_test.mp4',
  ad_20: '605b_ad20_report_deep_backup.mp4',
};

async function loadData() {
  const scriptsPath = path.join(ROOT, 'ads_automation', 'scripts', 'scripts.json');
  const renderResultsPath = path.join(ROOT, 'ads_automation', 'output', 'render_results.json');
  
  const scripts = JSON.parse(await fs.readFile(scriptsPath, 'utf-8'));
  const renderResults = JSON.parse(await fs.readFile(renderResultsPath, 'utf-8'));
  
  return { scripts: scripts.scripts, renders: renderResults.renders };
}

async function getFileType(filepath) {
  const { stdout } = await execFileAsync('file', ['-b', filepath]);
  return stdout.trim();
}

async function getFileDuration(filepath) {
  const { stdout } = await execFileAsync('mdls', ['-raw', '-name', 'kMDItemDurationSeconds', filepath]);
  const value = Number.parseFloat(stdout.trim());
  return Number.isFinite(value) ? value : null;
}

async function downloadAndValidate(renderStatus, filepath) {
  const url = renderStatus.url;
  console.log(`  Downloading: ${path.basename(filepath)}`);

  if (!url || !url.toLowerCase().endsWith('.mp4')) {
    throw new Error(`Final render URL is not an mp4: ${url || 'missing'}`);
  }

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Download failed: ${response.status}`);

  const buffer = await response.arrayBuffer();
  await fs.writeFile(filepath, new Uint8Array(buffer));

  const stats = await fs.stat(filepath);
  const fileType = await getFileType(filepath);
  const duration = await getFileDuration(filepath);
  const validation = validateRender(renderStatus, {
    size: stats.size,
    duration,
    fileType,
    url,
  });

  if (!validation.valid) {
    console.log(`  ⚠️  Validation issues: ${validation.issues.join(', ')}`);
    return { valid: false, size: stats.size, duration, fileType, issues: validation.issues };
  }

  console.log(`  ✓ Valid: ${Math.round((stats.size / 1024 / 1024) * 10) / 10}MB, ${duration}s, ${fileType}`);
  return { valid: true, size: stats.size, duration, fileType };
}

async function reRenderTop5() {
  console.log('\n🎬 Re-rendering top 5 ads with production settings...\n');
  
  const { scripts, renders } = await loadData();
  const apiKey = process.env.CREATOMATE_API_KEY;
  
  if (!apiKey) {
    throw new Error('CREATOMATE_API_KEY not found in .ads.env.local');
  }
  
  // Ensure output directory
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  
  const results = [];
  
  for (const adId of TOP_5_ADS) {
    console.log(`\n═══ Processing ${adId} ═══`);
    
    // Find the render
    const render = renders.find(r => r.variation_id === adId);
    if (!render) {
      console.log(`  ✗ Render not found for ${adId}`);
      continue;
    }
    
    // Find the script by matching hook
    const script = scripts.find(s => s.hook === render.hook);
    if (!script) {
      console.log(`  ✗ Script not found for hook: ${render.hook}`);
      continue;
    }
    
    console.log(`  Hook: "${render.hook}"`);
    console.log(`  Voice: ${render.voice}`);
    console.log(`  Visual: ${render.visual}`);
    
    try {
      // Re-render with fixed settings
      console.log(`  🎬 Re-rendering...`);
      const variation = {
        id: adId,
        hook: render.hook,
        voice: render.voice,
        visual: { key: render.visual }
      };
      
      const newRender = await renderAd(apiKey, script, variation, null);
      
      console.log(`  ✓ Render queued: ${newRender.render_id}`);
      console.log(`  ⏳ Waiting for completion...`);
      
      // Poll for completion (max 10 minutes)
      let attempts = 0;
      let status;
      
      while (attempts < 120) { // 120 * 5s = 10 minutes
        await new Promise(r => setTimeout(r, 5000)); // Wait 5 seconds
        status = await checkRenderStatus(apiKey, newRender.render_id);
        
        if (status.status === 'succeeded') {
          console.log(`  ✅ Render complete!`);
          break;
        } else if (status.status === 'failed') {
          console.log(`  ❌ Render failed`);
          break;
        } else {
          console.log(`  ⏳ Status: ${status.status} (${attempts * 5}s elapsed)`);
        }
        
        attempts++;
      }
      
      if (!status || status.status !== 'succeeded') {
        console.log(`  ✗ Render did not complete successfully: ${status?.status || 'missing status'}`);
        results.push({
          adId,
          renderId: newRender.render_id,
          filename: OUTPUT_NAME_MAP[adId],
          url: status?.url,
          valid: false,
          issues: [status?.error_message || `Render status: ${status?.status || 'missing status'}`],
        });
        continue;
      }

      const filename = OUTPUT_NAME_MAP[adId];
      const filepath = path.join(OUTPUT_DIR, filename);
      const downloadResult = await downloadAndValidate(status, filepath);
      
      results.push({
        adId,
        renderId: newRender.render_id,
        filename,
        url: status.url,
        valid: downloadResult.valid,
        size: downloadResult.size,
        sizeMB: Math.round((downloadResult.size / 1024 / 1024) * 10) / 10,
        duration: downloadResult.duration,
        fileType: downloadResult.fileType,
        issues: downloadResult.issues || []
      });
      
      // Small delay between renders
      await new Promise(r => setTimeout(r, 2000));
      
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
      results.push({
        adId,
        error: error.message,
        valid: false
      });
    }
  }
  
  return results;
}

// Execute
async function main() {
  try {
    const results = await reRenderTop5();
    
    console.log('\n╔══════════════════════════════════════════════════════╗');
    console.log('║  RE-RENDER COMPLETE                                  ║');
    console.log('╚══════════════════════════════════════════════════════╝');
    
    const valid = results.filter(r => r.valid).length;
    const total = TOP_5_ADS.length;
    
    console.log(`\nResults:`);
    for (const r of results) {
      if (r.valid) {
        console.log(`  ✅ ${r.adId}: ${r.filename} (${r.sizeMB}MB)`);
      } else {
        console.log(`  ❌ ${r.adId}: ${r.error || r.issues?.join(', ')}`);
      }
    }
    
    console.log(`\nSummary:`);
    console.log(`  Valid renders: ${valid}/${total}`);
    console.log(`  Save location: ${OUTPUT_DIR}`);
    
    if (valid === total) {
      console.log(`\n🎉 All ads successfully re-rendered for Meta launch!`);
    } else {
      console.log(`\n⚠️  Some renders failed. Check errors above.`);
    }
    
    // Check if all are ready for Meta
    const allValid = valid === total;
    const allLargeEnough = results.filter(r => r.valid && r.sizeMB > 1).length === total;
    
    console.log(`\nMeta Ready: ${allValid && allLargeEnough ? 'YES' : 'NO'}`);
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
  }
}

main();