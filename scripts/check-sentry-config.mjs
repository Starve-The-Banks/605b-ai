#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { statSync } from 'node:fs';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const FORBIDDEN_PUBLIC_TOKENS = [
  'NEXT_PUBLIC_SENTRY_AUTH_TOKEN',
  'EXPO_PUBLIC_SENTRY_AUTH_TOKEN',
];

const PLACEHOLDER_VALUE_PATTERNS = [
  /^$/,
  /^sntrys_x+$/i,
  /^your[-_a-z0-9]*$/i,
  /^example[-_a-z0-9]*$/i,
  /^replace[-_a-z0-9]*$/i,
  /^changeme$/i,
  /^placeholder$/i,
  /^xxx+$/i,
  /^<.*>$/,
];

function fail(message) {
  console.error(`❌ ${message}`);
  process.exitCode = 1;
}

function warn(message) {
  console.warn(`⚠️  ${message}`);
}

function ok(message) {
  console.log(`✅ ${message}`);
}

function getTrackedFiles() {
  const result = spawnSync('git ls-files -z', {
    shell: true,
    cwd: process.cwd(),
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    throw new Error('Unable to list tracked files with git ls-files');
  }

  return result.stdout.split('\0').filter(Boolean);
}

function looksLikeText(content) {
  return !content.includes('\u0000');
}

function sanitizeValue(raw) {
  const beforeInlineComment = raw.split('#')[0];
  return beforeInlineComment.trim().replace(/^['"]|['"]$/g, '').trim();
}

function looksLikeRealToken(value) {
  if (PLACEHOLDER_VALUE_PATTERNS.some((pattern) => pattern.test(value))) {
    return false;
  }

  if (value.startsWith('sntrys_') && value.length >= 16) {
    return true;
  }

  return value.length >= 20;
}

function findNextConfigFile() {
  const candidates = [
    'next.config.mjs',
    'next.config.js',
    'next.config.cjs',
    'next.config.ts',
  ];

  return candidates.find((candidate) => existsSync(join(process.cwd(), candidate))) || null;
}

function main() {
  let nextConfigContent = '';
  const nextConfigFile = findNextConfigFile();

  if (!nextConfigFile) {
    fail('Missing next.config.* file');
  } else {
    nextConfigContent = readFileSync(join(process.cwd(), nextConfigFile), 'utf8');
  }

  const trackedFiles = getTrackedFiles();
  let forbiddenVarDetected = false;
  let realTokenDetected = false;

  for (const relativePath of trackedFiles) {
    const absolutePath = join(process.cwd(), relativePath);
    const stats = statSync(absolutePath);
    if (!stats.isFile() || stats.size > 1_000_000) {
      continue;
    }

    let content = '';
    try {
      content = readFileSync(absolutePath, 'utf8');
    } catch {
      continue;
    }

    if (!looksLikeText(content)) {
      continue;
    }

    for (const forbiddenVar of FORBIDDEN_PUBLIC_TOKENS) {
      if (content.includes(forbiddenVar)) {
        fail(`${forbiddenVar} found in tracked file: ${relativePath}`);
        forbiddenVarDetected = true;
      }
    }

    const lines = content.split('\n');
    for (const line of lines) {
      if (!line.includes('SENTRY_AUTH_TOKEN')) continue;

      const match = line.match(/SENTRY_AUTH_TOKEN\s*=\s*(.*)$/);
      if (!match) continue;

      const value = sanitizeValue(match[1]);
      if (looksLikeRealToken(value)) {
        fail(`Possible real SENTRY_AUTH_TOKEN value found in tracked file: ${relativePath}`);
        realTokenDetected = true;
      }
    }
  }

  if (!forbiddenVarDetected && !realTokenDetected) {
    ok('No forbidden public Sentry auth token variables found in tracked files');
    ok('No real-looking SENTRY_AUTH_TOKEN values detected in tracked files');
  }

  if (!nextConfigContent.includes('process.env.SENTRY_AUTH_TOKEN')) {
    fail('next.config.* must reference process.env.SENTRY_AUTH_TOKEN in withSentryConfig');
  } else {
    ok('next.config.* references process.env.SENTRY_AUTH_TOKEN');
  }

  const orgConfigured =
    nextConfigContent.includes('process.env.SENTRY_ORG') || nextConfigContent.includes('605bai');
  const projectConfigured =
    nextConfigContent.includes('process.env.SENTRY_PROJECT') ||
    nextConfigContent.includes('605b-web');

  if (!orgConfigured) {
    fail('Sentry org is not configured in next.config.*');
  } else {
    ok('Sentry org is configured in next.config.*');
  }

  if (!projectConfigured) {
    fail('Sentry project is not configured in next.config.*');
  } else {
    ok('Sentry project is configured in next.config.*');
  }

  if (!process.env.SENTRY_AUTH_TOKEN) {
    warn('SENTRY_AUTH_TOKEN is not set in the current shell (local warning only)');
  } else {
    ok('SENTRY_AUTH_TOKEN is present in the current shell');
  }

  if (process.exitCode && process.exitCode !== 0) {
    console.error('\nSentry configuration validation failed.');
    process.exit(process.exitCode);
  }

  console.log('\nSentry configuration validation passed.');
}

main();
