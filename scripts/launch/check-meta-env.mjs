#!/usr/bin/env node

/**
 * Check local environment for Meta Pixel configuration.
 * Read-only — does not modify anything.
 * Does not print secret values.
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const ROOT = resolve(import.meta.dirname, '..', '..');

const ENV_FILES = ['.env.example', '.env', '.env.local', '.env.production', '.env.production.local'];

const EXPECTED_VARS = {
  'NEXT_PUBLIC_META_PIXEL_ID': { required: true, public: true, description: 'Meta Pixel ID' },
  'NEXT_PUBLIC_PIXEL_DEBUG': { required: false, public: true, description: 'Pixel debug logging' },
  'NEXT_PUBLIC_META_PIXEL_PREVIEW': { required: false, public: true, description: 'Enable pixel in preview deploys' },
  'NEXT_PUBLIC_GOOGLE_ADS_ID': { required: false, public: true, description: 'Google Ads conversion ID' },
};

function mask(val) {
  if (!val || val.length < 4) return '***';
  return val.slice(0, 3) + '*'.repeat(Math.max(val.length - 6, 3)) + val.slice(-3);
}

function parseEnvFile(filepath) {
  if (!existsSync(filepath)) return null;
  const content = readFileSync(filepath, 'utf-8');
  const vars = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    vars[key] = val;
  }
  return vars;
}

console.log('\n=== Meta Pixel Environment Check ===\n');

const allVars = {};
const fileSources = {};

for (const envFile of ENV_FILES) {
  const filepath = resolve(ROOT, envFile);
  const vars = parseEnvFile(filepath);
  if (vars === null) {
    console.log(`  ${envFile}: not found`);
    continue;
  }
  const relevant = Object.keys(vars).filter(k => k in EXPECTED_VARS);
  if (relevant.length === 0) {
    console.log(`  ${envFile}: exists (no pixel vars)`);
  } else {
    console.log(`  ${envFile}: exists (${relevant.length} pixel var(s))`);
    for (const k of relevant) {
      if (vars[k] || !allVars[k]) {
        allVars[k] = vars[k];
        fileSources[k] = envFile;
      }
    }
  }
}

console.log('\n--- Variable Status ---\n');

let allGood = true;

for (const [varName, config] of Object.entries(EXPECTED_VARS)) {
  const val = allVars[varName] || process.env[varName] || '';
  const source = fileSources[varName] || (process.env[varName] ? 'process.env' : '');
  const isSet = val.length > 0;

  if (config.required && !isSet) {
    console.log(`  WARN  ${varName}: NOT SET`);
    console.log(`         → ${config.description}`);
    console.log(`         → Must be set in Vercel production env vars`);
    allGood = false;
  } else if (isSet) {
    console.log(`  OK    ${varName}: ${mask(val)} (from ${source})`);
  } else {
    console.log(`  SKIP  ${varName}: not set (optional — ${config.description})`);
  }
}

console.log('\n--- NEXT_PUBLIC_* Vars Found ---\n');

const allPublicVars = new Set();
for (const envFile of ENV_FILES) {
  const filepath = resolve(ROOT, envFile);
  const vars = parseEnvFile(filepath);
  if (!vars) continue;
  for (const k of Object.keys(vars)) {
    if (k.startsWith('NEXT_PUBLIC_') && vars[k]) allPublicVars.add(k);
  }
}

if (allPublicVars.size === 0) {
  console.log('  No NEXT_PUBLIC_* vars with values found in local .env files.');
  console.log('  This is normal if you rely on Vercel env vars for production.');
} else {
  for (const v of [...allPublicVars].sort()) {
    console.log(`  • ${v}`);
  }
}

console.log('\n--- Notes ---\n');
console.log('  • The Meta Pixel only fires when NODE_ENV=production');
console.log('  • Local dev (next dev) will NOT fire the pixel');
console.log('  • Set NEXT_PUBLIC_META_PIXEL_ID in Vercel → Production env vars');
console.log('  • After adding/changing env vars in Vercel, you MUST redeploy');

console.log(`\n${allGood ? 'PASS' : 'WARN: Check items above'}\n`);
process.exit(allGood ? 0 : 0); // Don't fail CI — this is advisory
