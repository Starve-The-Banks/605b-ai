#!/usr/bin/env node

// 605b.ai Ad Generation Pipeline v2
// Generates Meta-compliant short-form video ads end-to-end

import fs from 'fs/promises';
import path from 'path';
import { config } from 'dotenv';

import { getHooks, generateHooksWithAI } from './lib/hooks.mjs';
import { generateScript, generateScriptsForHooks } from './lib/scripts.mjs';
import { synthesize, VOICE_PROFILES } from './lib/voice.mjs';
import { buildVariationMatrix } from './lib/variations.mjs';
import { qualityCheck } from './lib/quality.mjs';
import { renderAd, checkRenderStatus } from './lib/render.mjs';

config({ path: '.ads.env.local' });

// ---------------------------------------------------------------------------
// CLI argument helpers
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const param = (name, fallback) => {
  const f = args.find(a => a.startsWith(`--${name}=`));
  return f ? f.split('=')[1] : fallback;
};

// ---------------------------------------------------------------------------
// Directories
// ---------------------------------------------------------------------------
const ROOT = process.cwd();
const DIRS = {
  scripts:  path.join(ROOT, 'ads_automation', 'scripts'),
  voice:    path.join(ROOT, 'ads_automation', 'voice'),
  output:   path.join(ROOT, 'ads_automation', 'output'),
  ads:      path.join(ROOT, 'ads_automation', 'ads'),
};

async function ensureDirs() {
  for (const d of Object.values(DIRS)) await fs.mkdir(d, { recursive: true });
}

// ---------------------------------------------------------------------------
// STEP 1 — Hook Collection
// ---------------------------------------------------------------------------
async function step1_hooks() {
  console.log('\n━━━ STEP 1: HOOK GENERATION ━━━');

  const seedHooks = getHooks();
  console.log(`  Seed hooks (static):  ${seedHooks.length}`);

  let aiHooks = [];
  try {
    aiHooks = await generateHooksWithAI(process.env.OPENAI_API_KEY, 15);
    console.log(`  AI-generated hooks:   ${aiHooks.length}`);
  } catch (e) {
    console.log(`  AI hook gen failed (${e.message}), using seed only`);
  }

  const all = [...new Set([...seedHooks, ...aiHooks])];
  console.log(`  Total unique hooks:   ${all.length}`);

  await fs.writeFile(
    path.join(DIRS.scripts, 'hooks.json'),
    JSON.stringify({ generated_at: new Date().toISOString(), total: all.length, hooks: all }, null, 2)
  );

  return all;
}

// ---------------------------------------------------------------------------
// STEP 2 — Script Generation (pick N hooks, generate full scripts)
// ---------------------------------------------------------------------------
async function step2_scripts(hooks, count) {
  console.log(`\n━━━ STEP 2: SCRIPT GENERATION (${count} scripts) ━━━`);

  const selected = hooks.slice(0, count);
  const { results, errors } = await generateScriptsForHooks(
    process.env.OPENAI_API_KEY,
    selected,
    { concurrency: 2 }
  );

  for (const s of results) console.log(`  ✓ ${s.id}: "${s.hook.slice(0, 50)}…"`);
  for (const e of errors)  console.log(`  ✗ FAIL: "${e.hook.slice(0, 40)}…" — ${e.error}`);

  await fs.writeFile(
    path.join(DIRS.scripts, 'scripts.json'),
    JSON.stringify({ generated_at: new Date().toISOString(), total: results.length, scripts: results }, null, 2)
  );

  return results;
}

// ---------------------------------------------------------------------------
// STEP 3 — Variation Matrix
// ---------------------------------------------------------------------------
function step3_variations(hooks, maxAds) {
  console.log(`\n━━━ STEP 3: VARIATION MATRIX ━━━`);
  const matrix = buildVariationMatrix(hooks, { maxAds });
  console.log(`  Variations built: ${matrix.length}`);
  for (const v of matrix) {
    console.log(`    ${v.id}  hook="${v.hook.slice(0, 35)}…"  visual=${v.visual.key}  voice=${v.voice}`);
  }
  return matrix;
}

// ---------------------------------------------------------------------------
// STEP 4 — Voice Generation (only for unique script + voice combos)
// ---------------------------------------------------------------------------
async function step4_voice(scripts, variations) {
  console.log(`\n━━━ STEP 4: VOICE GENERATION ━━━`);

  // Build unique (script_id, voice) pairs
  const pairs = new Map();
  for (const v of variations) {
    const script = scripts.find(s => s.hook === v.hook);
    if (!script) continue;
    const key = `${script.id}_${v.voice}`;
    if (!pairs.has(key)) pairs.set(key, { script, voice: v.voice });
  }

  console.log(`  Unique voice files needed: ${pairs.size}`);
  const voiceMap = {};

  for (const [key, { script, voice }] of pairs) {
    try {
      const info = await synthesize(process.env.ELEVENLABS_API_KEY, script, voice, DIRS.voice);
      voiceMap[key] = info;
      console.log(`  ✓ ${info.filename} (${Math.round(info.bytes / 1024)}KB)`);
      await new Promise(r => setTimeout(r, 1500));
    } catch (e) {
      console.log(`  ✗ ${key}: ${e.message}`);
    }
  }

  return voiceMap;
}

// ---------------------------------------------------------------------------
// STEP 5 — Quality Gate + Render
// ---------------------------------------------------------------------------
async function step5_render(scripts, variations, voiceMap) {
  console.log(`\n━━━ STEP 5: QUALITY CHECK + RENDER ━━━`);

  const renderResults = [];

  for (const v of variations) {
    const script = scripts.find(s => s.hook === v.hook);
    if (!script) { console.log(`  ⊘ ${v.id}: no matching script`); continue; }

    const voiceKey = `${script.id}_${v.voice}`;
    const voiceFile = voiceMap[voiceKey];

    // Quality gate
    const qc = qualityCheck(v, script, voiceFile);
    if (!qc.pass) {
      console.log(`  ✗ ${v.id} BLOCKED: ${qc.issues.join(' | ')}`);
      continue;
    }

    // Render
    try {
      console.log(`  ▸ Rendering ${v.id}…`);
      const result = await renderAd(process.env.CREATOMATE_API_KEY, script, v, null);
      renderResults.push({
        variation_id: v.id,
        hook: v.hook,
        voice: v.voice,
        visual: v.visual.key,
        render_id: result.render_id,
        status: result.status,
        url: result.url,
      });
      console.log(`  ✓ ${v.id} → ${result.render_id}  ${result.url || '(rendering…)'}`);
      await new Promise(r => setTimeout(r, 2500));
    } catch (e) {
      console.log(`  ✗ ${v.id} render failed: ${e.message}`);
    }
  }

  await fs.writeFile(
    path.join(DIRS.output, 'render_results.json'),
    JSON.stringify({
      generated_at: new Date().toISOString(),
      total: renderResults.length,
      renders: renderResults,
    }, null, 2)
  );

  return renderResults;
}

// ---------------------------------------------------------------------------
// CHECK command — poll render status
// ---------------------------------------------------------------------------
async function checkRenders() {
  console.log('\n━━━ RENDER STATUS CHECK ━━━');
  const data = JSON.parse(await fs.readFile(path.join(DIRS.output, 'render_results.json'), 'utf-8'));

  let completed = 0, rendering = 0, failed = 0;

  for (const r of data.renders) {
    try {
      const status = await checkRenderStatus(process.env.CREATOMATE_API_KEY, r.render_id);
      r.status = status.status;
      r.url = status.url || r.url;
      if (status.status === 'succeeded') { completed++; console.log(`  ✓ ${r.variation_id}: ${r.url}`); }
      else if (status.status === 'failed') { failed++; console.log(`  ✗ ${r.variation_id}: FAILED`); }
      else { rendering++; console.log(`  … ${r.variation_id}: ${status.status}`); }
    } catch (e) {
      console.log(`  ? ${r.variation_id}: ${e.message}`);
    }
  }

  data.last_checked = new Date().toISOString();
  await fs.writeFile(path.join(DIRS.output, 'render_results.json'), JSON.stringify(data, null, 2));
  console.log(`\n  Completed: ${completed}  Rendering: ${rendering}  Failed: ${failed}`);
}

// ---------------------------------------------------------------------------
// MAIN
// ---------------------------------------------------------------------------
async function main() {
  const count = parseInt(param('count', '10'));
  const maxAds = parseInt(param('ads', '20'));

  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║  605b.ai — Meta Ad Generation Pipeline v2           ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log(`  Scripts: ${count}   Max Ads: ${maxAds}`);

  await ensureDirs();

  if (flag('check')) {
    await checkRenders();
    return;
  }

  if (flag('help')) {
    console.log(`
  Usage:
    node ads_automation/pipeline.mjs                    Full pipeline (10 scripts, 20 ads)
    node ads_automation/pipeline.mjs --count=5 --ads=10 Custom counts
    node ads_automation/pipeline.mjs --check            Poll render status
    node ads_automation/pipeline.mjs --hooks-only       Generate hooks only
    node ads_automation/pipeline.mjs --scripts-only     Generate hooks + scripts only
    node ads_automation/pipeline.mjs --no-render        Skip rendering step
`);
    return;
  }

  const startTime = Date.now();

  // Step 1 — Hooks
  const hooks = await step1_hooks();

  if (flag('hooks-only')) return;

  // Step 2 — Scripts
  const scripts = await step2_scripts(hooks, count);

  if (flag('scripts-only')) return;

  // Step 3 — Variation matrix
  const scriptHooks = scripts.map(s => s.hook);
  const variations = step3_variations(scriptHooks, maxAds);

  // Step 4 — Voice
  const voiceMap = await step4_voice(scripts, variations);

  if (flag('no-render')) {
    console.log('\n  --no-render flag set. Skipping video rendering.');
    return;
  }

  // Step 5 — Quality check + Render
  const renderResults = await step5_render(scripts, variations, voiceMap);

  // Summary
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n╔══════════════════════════════════════════════════════╗`);
  console.log(`║  PIPELINE COMPLETE                                  ║`);
  console.log(`╚══════════════════════════════════════════════════════╝`);
  console.log(`  Hooks generated:     ${hooks.length}`);
  console.log(`  Scripts written:     ${scripts.length}`);
  console.log(`  Variations built:    ${variations.length}`);
  console.log(`  Voices synthesized:  ${Object.keys(voiceMap).length}`);
  console.log(`  Renders queued:      ${renderResults.length}`);
  console.log(`  Elapsed:             ${elapsed}s`);
  console.log(`\n  Check render progress:  node ads_automation/pipeline.mjs --check`);
}

main().catch(err => {
  console.error('\n  FATAL:', err.message || err);
  process.exit(1);
});