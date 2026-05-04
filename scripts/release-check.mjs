#!/usr/bin/env node

import { spawnSync } from 'node:child_process';

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1']);

function parseHost(rawUrl) {
  if (!rawUrl) return null;
  try {
    return new URL(rawUrl).hostname;
  } catch {
    return null;
  }
}

function fail(step, message) {
  console.error(`\n[release-check] Step failed: ${step}`);
  console.error(message);
  process.exit(1);
}

function runStep(step, command, options = {}) {
  console.log(`\n[release-check] ${step}`);
  console.log(`[release-check] $ ${command}`);
  const childEnv = { ...process.env };
  // Keep the script default as development, but avoid forcing child tools
  // (especially Next build) to run under NODE_ENV=development.
  if (childEnv.NODE_ENV === 'development') {
    delete childEnv.NODE_ENV;
  }
  const result = spawnSync(command, {
    stdio: 'inherit',
    shell: true,
    env: childEnv,
    ...options,
  });

  if (typeof result.status === 'number' && result.status !== 0) {
    fail(step, `Command exited with status ${result.status}`);
  }

  if (result.error) {
    fail(step, result.error.message || 'Unknown command error');
  }
}

function runEnvironmentSanity() {
  const step = 'Step 1: Environment sanity';
  console.log(`\n[release-check] ${step}`);
  const nodeEnv = process.env.NODE_ENV || 'development';

  if (!process.env.NODE_ENV) {
    console.log('[release-check] NODE_ENV not set, defaulting to development');
  }

  console.log(`[release-check] Running in NODE_ENV=${nodeEnv}`);

  const validationHost = parseHost(process.env.VALIDATION_BASE_URL);
  const targetingProduction =
    nodeEnv === 'production' ||
    (validationHost && !LOCAL_HOSTS.has(validationHost));

  if (targetingProduction && process.env.ENABLE_DEV_TOKEN_ENDPOINT === 'true') {
    fail(step, 'ENABLE_DEV_TOKEN_ENDPOINT must not be "true" when targeting production');
  }
}

function runStrictChecks() {
  if (process.env.RELEASE_STRICT !== 'true') return;

  const step = 'Optional strict mode token checks';
  console.log(`\n[release-check] ${step}`);

  const required = [
    'VALIDATION_FREE_TOKEN',
    'VALIDATION_PAID_TOKEN',
    'VALIDATION_REVIEWER_TOKEN',
    'VALIDATION_REVOKED_TOKEN',
  ];

  const missing = required.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    fail(step, `Missing required env vars in strict mode: ${missing.join(', ')}`);
  }
}

function main() {
  runEnvironmentSanity();
  runStrictChecks();

  runStep('Step 2: Lint', 'npm run lint');
  runStep('Step 3: Sentry config check', 'npm run check:sentry');
  runStep('Step 4: Build', 'npm run build');
  runStep('Step 5: Tests', 'npm run test');

  if (process.env.VALIDATION_BASE_URL) {
    const requiredValidationTokens = [
      'VALIDATION_FREE_TOKEN',
      'VALIDATION_PAID_TOKEN',
      'VALIDATION_REVIEWER_TOKEN',
    ];
    const missingValidationTokens = requiredValidationTokens.filter((name) => !process.env[name]);

    if (missingValidationTokens.length > 0) {
      console.log('\n[release-check] Step 6: AI assistant validation (production-safe mode)');
      console.log(
        `Skipping AI validation (missing env vars: ${missingValidationTokens.join(', ')})`
      );
    } else {
      runStep('Step 6: AI assistant validation (production-safe mode)', 'node scripts/validate-ai-assistant.mjs');
    }
  } else {
    console.log('\n[release-check] Step 6: AI assistant validation (production-safe mode)');
    console.log('Skipping AI validation (no VALIDATION_BASE_URL provided)');
  }

  runStep('Step 7: Analyzer verification', 'pnpm test -- tests/analyzer');

  console.log('\n✅ RELEASE CHECK PASSED — SAFE TO DEPLOY');
}

main();
