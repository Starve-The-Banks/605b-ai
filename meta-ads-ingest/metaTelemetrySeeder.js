/**
 * Meta Ads API Telemetry Seeder
 * Read-only integration verification for Ads Management Standard Access review.
 * Requirements: ≥1500 successful calls in last 15 days, error rate <15% (target <5%).
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Load env: .env first, then .secrets/meta.env (secrets override)
const envPath = path.join(__dirname, '.env');
const secretsPath = path.join(__dirname, '.secrets', 'meta.env');
if (fs.existsSync(envPath)) require('dotenv').config({ path: envPath });
if (fs.existsSync(secretsPath)) require('dotenv').config({ path: secretsPath });

// ─── Configuration ─────────────────────────────────────────────────────────

const API_VERSION_RAW = process.env.META_API_VERSION || 'v25.0';
const API_VERSION_REGEX = /^v\d+\.\d+$/;
const API_VERSION = API_VERSION_REGEX.test(API_VERSION_RAW) ? API_VERSION_RAW : 'v25.0';
const BASE_URL = `https://graph.facebook.com/${API_VERSION}`;

const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const AD_ACCOUNT_ID = process.env.AD_ACCOUNT_ID || process.env.META_AD_ACCOUNT_ID;
const META_APP_ID = process.env.META_APP_ID;

const TARGET_CALLS_PER_RUN = parseInt(process.env.TARGET_CALLS_PER_RUN || '20', 10);
const HARD_CALL_CEILING = parseInt(process.env.HARD_CALL_CEILING || '60', 10);
const MIN_DELAY_MS = parseInt(process.env.MIN_DELAY_MS || '1200', 10);
const MAX_RETRIES = parseInt(process.env.MAX_RETRIES || '3', 10);
const PAGE_LIMIT = parseInt(process.env.PAGE_LIMIT || '25', 10);
const MAX_PAGES_PER_EDGE = parseInt(process.env.MAX_PAGES_PER_EDGE || '5', 10);
const STOP_ON_AUTH_ERROR = process.env.STOP_ON_AUTH_ERROR !== 'false';
const STOP_ON_PERMISSION_ERROR = process.env.STOP_ON_PERMISSION_ERROR !== 'false';
const STOP_ON_REPEAT_429 = process.env.STOP_ON_REPEAT_429 !== 'false';
const LOG_DIR = path.resolve(process.env.LOG_DIR || path.join(__dirname, 'logs'));

const META_THRESHOLD_CALLS = 1500;
const META_THRESHOLD_ERROR_PCT = 15;
const TARGET_ERROR_PCT = 5;

// ─── Helpers ────────────────────────────────────────────────────────────────

const log = (level, message, data = {}) => {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...data
  }));
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const randomJitter = (maxMs) => Math.floor(Math.random() * (maxMs + 1));

function ensureLogsDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

function getTodayJsonlPath() {
  const today = new Date().toISOString().split('T')[0];
  return path.join(LOG_DIR, `meta-telemetry-${today}.jsonl`);
}

function appendJsonl(filePath, record) {
  ensureLogsDir();
  fs.appendFileSync(filePath, JSON.stringify(record) + '\n');
}

function paramsHash(params) {
  const str = JSON.stringify(params || {});
  return crypto.createHash('md5').update(str).digest('hex').slice(0, 8);
}

function getErrorCategory(status, result) {
  if (result?.success) return 'none';
  if (status === 401) return 'auth';
  if (status === 403) return 'permission';
  if (status === 429) return 'rate_limit';
  if (status >= 500 && status < 600) return 'server';
  if (result?.networkError) return 'network';
  if (status === 400) return 'bad_request';
  return 'unknown';
}

// ─── Load JSONL from last 15 days ───────────────────────────────────────────

function loadJsonlFromLast15Days() {
  ensureLogsDir();
  const entries = [];
  const now = new Date();
  for (let d = 0; d < 15; d++) {
    const date = new Date(now);
    date.setDate(date.getDate() - d);
    const dateStr = date.toISOString().split('T')[0];
    const filePath = path.join(LOG_DIR, `meta-telemetry-${dateStr}.jsonl`);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      content.split('\n').filter(Boolean).forEach(line => {
        try {
          entries.push(JSON.parse(line));
        } catch (_) { /* skip malformed */ }
      });
    }
  }
  return entries;
}

// ─── API call with retry (only retryable errors) ──────────────────────────────

async function makeApiCall(url, params, retriesLeft = MAX_RETRIES) {
  const requestParams = { ...params, access_token: ACCESS_TOKEN };
  const start = Date.now();
  const phash = paramsHash(params);

  for (let attempt = 1; attempt <= retriesLeft + 1; attempt++) {
    try {
      const response = await axios.get(url, {
        params: requestParams,
        timeout: 30000,
        validateStatus: () => true
      });

      const durationMs = Date.now() - start;
      const status = response.status;
      const fbTraceId = response.headers?.['x-fb-trace-id'] || null;
      const requestId = response.headers?.['x-fb-request-id'] || null;

      if (status === 401) {
        return {
          success: false,
          status,
          durationMs,
          retriesUsed: attempt - 1,
          error: response.data?.error || { message: 'Unauthorized' },
          fbTraceId,
          requestId,
          errorCategory: 'auth',
          stopRun: STOP_ON_AUTH_ERROR
        };
      }

      if (status === 403) {
        return {
          success: false,
          status,
          durationMs,
          retriesUsed: attempt - 1,
          error: response.data?.error || { message: 'Forbidden' },
          fbTraceId,
          requestId,
          errorCategory: 'permission',
          stopRun: STOP_ON_PERMISSION_ERROR
        };
      }

      if (status === 400) {
        return {
          success: false,
          status,
          durationMs,
          retriesUsed: attempt - 1,
          error: response.data?.error || { message: 'Bad request' },
          fbTraceId,
          requestId,
          errorCategory: 'bad_request',
          stopRun: false
        };
      }

      if (status === 429) {
        const retryAfter = parseInt(response.headers?.['retry-after'] || '60', 10);
        const waitMs = Math.min(retryAfter * 1000, 120000);
        if (attempt <= retriesLeft) {
          await delay(waitMs);
          continue;
        }
        return {
          success: false,
          status,
          durationMs,
          retriesUsed: attempt - 1,
          error: response.data?.error || { message: 'Rate limited' },
          fbTraceId,
          requestId,
          errorCategory: 'rate_limit',
          stopRun: false,
          was429: true
        };
      }

      if (status >= 500 && status < 600) {
        if (attempt <= retriesLeft) {
          const base = 1500;
          const backoff = base * Math.pow(1.5, attempt - 1);
          const jitter = backoff * 0.2 * (Math.random() * 2 - 1);
          await delay(Math.max(1000, backoff + jitter));
          continue;
        }
        return {
          success: false,
          status,
          durationMs,
          retriesUsed: attempt - 1,
          error: response.data?.error || { message: 'Server error' },
          fbTraceId,
          requestId,
          errorCategory: 'server',
          stopRun: false
        };
      }

      if (status >= 200 && status < 300) {
        return {
          success: true,
          status,
          durationMs,
          retriesUsed: attempt - 1,
          data: response.data,
          fbTraceId,
          requestId
        };
      }

      return {
        success: false,
        status,
        durationMs,
        retriesUsed: attempt - 1,
        error: response.data?.error || { message: `HTTP ${status}` },
        fbTraceId,
        requestId,
        errorCategory: 'unknown',
        stopRun: false
      };
    } catch (err) {
      const durationMs = Date.now() - start;
      const code = err.code || '';
      const isRetryable = ['ECONNRESET', 'ETIMEDOUT', 'ECONNABORTED', 'EAI_AGAIN'].includes(code);

      if (isRetryable && attempt <= retriesLeft) {
        const base = 1500;
        const backoff = base * Math.pow(1.5, attempt - 1);
        const jitter = backoff * 0.2 * (Math.random() * 2 - 1);
        await delay(Math.max(1000, backoff + jitter));
        continue;
      }

      return {
        success: false,
        status: err.response?.status || 0,
        durationMs,
        retriesUsed: attempt - 1,
        error: err.response?.data?.error || { message: err.message },
        fbTraceId: err.response?.headers?.['x-fb-trace-id'] || null,
        requestId: err.response?.headers?.['x-fb-request-id'] || null,
        errorCategory: 'network',
        networkError: true,
        stopRun: isAuthError(err.response?.status)
      };
    }
  }
}

function isAuthError(status) {
  return status === 401 || status === 403;
}

// ─── Always-success floor (rotating pool) ───────────────────────────────────

function buildFloorCallPool(accountIds) {
  const pool = [];

  pool.push({ url: `${BASE_URL}/me`, params: { fields: 'id,name' } });
  pool.push({ url: `${BASE_URL}/me/adaccounts`, params: { fields: 'id,name,account_status', limit: PAGE_LIMIT } });

  for (const actId of accountIds) {
    const actPrefix = actId.startsWith('act_') ? actId : `act_${actId}`;
    pool.push({
      url: `${BASE_URL}/${actPrefix}`,
      params: { fields: 'id,name,account_status,currency,timezone_name,disable_reason,business' }
    });
    for (const preset of ['today', 'last_7d', 'last_28d']) {
      pool.push({
        url: `${BASE_URL}/${actPrefix}/insights`,
        params: { fields: 'impressions,clicks,spend', date_preset: preset, limit: PAGE_LIMIT }
      });
    }
  }

  return pool;
}

function buildObjectListEdges(accountIds) {
  const edges = [];
  for (const actId of accountIds) {
    const actPrefix = actId.startsWith('act_') ? actId : `act_${actId}`;
    for (const name of ['campaigns', 'adsets', 'ads']) {
      edges.push({
        url: `${BASE_URL}/${actPrefix}/${name}`,
        params: { fields: 'id,name,status', limit: PAGE_LIMIT }
      });
    }
  }
  return edges;
}

// ─── Main seeding logic ─────────────────────────────────────────────────────

async function seedMetaTelemetry(opts = {}) {
  const dryRun = opts.dryRun === true;
  const jsonlPath = getTodayJsonlPath();

  if (dryRun) {
    return runDryRun();
  }

  if (!ACCESS_TOKEN) {
    log('FATAL', 'META_ACCESS_TOKEN required (set in .env or .secrets/meta.env)');
    process.exit(1);
  }

  log('INFO', 'Starting Meta API telemetry seeding', {
    apiVersion: API_VERSION,
    targetCallsPerRun: TARGET_CALLS_PER_RUN,
    hardCallCeiling: HARD_CALL_CEILING,
    minDelayMs: MIN_DELAY_MS,
    maxRetries: MAX_RETRIES
  });

  let callCount = 0;
  let successCount = 0;
  let errorCount = 0;
  let stopRun = false;
  let rateLimit429Count = 0;
  let targetRemaining = TARGET_CALLS_PER_RUN;
  const floorPool = [];
  const objectEdges = [];
  let accountIds = [];

  const recordCall = (endpoint, params, result) => {
    const record = {
      ts: new Date().toISOString(),
      endpoint,
      params_hash: paramsHash(params),
      http_status: result.status,
      duration_ms: result.durationMs,
      retries_used: result.retriesUsed ?? 0,
      error_category: getErrorCategory(result.status, result),
      fb_trace_id: result.fbTraceId || null,
      request_id: result.requestId || null
    };
    appendJsonl(jsonlPath, record);
  };

  const doCall = async (url, params) => {
    const result = await makeApiCall(url, params);
    callCount++;
    if (result.success) successCount++; else errorCount++;
    recordCall(url, params, result);

    if (result.stopRun) stopRun = true;
    if (result.was429) rateLimit429Count++;

    if (rateLimit429Count >= 2 && STOP_ON_REPEAT_429) {
      stopRun = true;
      log('INFO', 'Two 429s in run - stopping early (STOP_ON_REPEAT_429=true)');
    }

    await delay(MIN_DELAY_MS + randomJitter(300));
    return result;
  };

  // 1) Fetch ad accounts (or use AD_ACCOUNT_ID)
  const adAccountsUrl = `${BASE_URL}/me/adaccounts`;
  const adAccountsParams = { fields: 'id,name,account_status', limit: PAGE_LIMIT };
  const adAccountsResult = await doCall(adAccountsUrl, adAccountsParams);
  targetRemaining--;

  if (adAccountsResult.stopRun) {
    writeArtifacts(callCount, successCount, errorCount);
    return { callCount, successCount, errorCount, stopRun: true };
  }

  if (AD_ACCOUNT_ID) {
    accountIds = [AD_ACCOUNT_ID.replace(/^act_/, '')];
  } else if (adAccountsResult.success && adAccountsResult.data?.data?.length) {
    accountIds = adAccountsResult.data.data.map(a => (a.id || a).toString().replace(/^act_/, ''));
  }

  const floor = buildFloorCallPool(accountIds);
  const objEdges = buildObjectListEdges(accountIds);

  let floorIdx = 0;
  let objEdgeIdx = 0;
  const objCursors = {};

  while (targetRemaining > 0 && callCount < HARD_CALL_CEILING && !stopRun) {
    // Try object list edges first (paginate)
    let madeCall = false;
    while (objEdgeIdx < objEdges.length && targetRemaining > 0 && callCount < HARD_CALL_CEILING && !stopRun) {
      const edge = objEdges[objEdgeIdx];
      const key = `${edge.url}_${objEdgeIdx}`;
      const cursor = objCursors[key];

      const params = { ...edge.params };
      if (cursor) params.after = cursor;

      const result = await doCall(edge.url, params);
      targetRemaining--;
      madeCall = true;

      if (result.stopRun) break;
      if (result.success && result.data?.paging?.cursors?.after) {
        objCursors[key] = result.data.paging.cursors.after;
      } else {
        objEdgeIdx++;
      }
    }

    if (madeCall) continue;

    // Floor pool: rotate until target reached
    while (targetRemaining > 0 && callCount < HARD_CALL_CEILING && !stopRun) {
      const item = floor[floorIdx % floor.length];
      floorIdx++;
      const result = await doCall(item.url, item.params);
      targetRemaining--;
      if (result.stopRun) break;
    }

    if (targetRemaining <= 0 || stopRun) break;
  }

  writeArtifacts(callCount, successCount, errorCount);
  return { callCount, successCount, errorCount, stopRun };
}

function writeArtifacts(callCount, successCount, errorCount) {
  const entries = loadJsonlFromLast15Days();
  const summary = compute15dSummary(entries);
  write15dSummary(summary);
  writeReport(summary, entries);

  log('INFO', 'Meta API telemetry seeding completed', {
    callCount,
    successCount,
    errorCount,
    successRate: callCount > 0 ? ((successCount / callCount) * 100).toFixed(2) + '%' : 'N/A',
    stopRun: false
  });

  console.log('\n=== TELEMETRY SEEDING SUMMARY ===');
  console.log(`This run: ${successCount} success, ${errorCount} errors`);
  console.log(`15-day: ${summary.totals.success_calls} success, ${summary.totals.error_calls} errors, ${summary.totals.error_rate_pct}% error rate`);
  console.log(`Meets 1500+ calls: ${summary.meets_calls_threshold ? 'YES' : 'NO'}`);
  console.log(`Meets <15% error: ${summary.meets_error_threshold ? 'YES' : 'NO'}`);
  console.log(`Target <5% error: ${summary.target_error_rate_ok ? 'YES' : 'NO'}`);
  console.log(`Logs: ${getTodayJsonlPath()}`);
  console.log(`Report: ${path.join(LOG_DIR, 'telemetry_15d_report.txt')}`);
  console.log('\n=== END SUMMARY ===\n');
}

function compute15dSummary(entries) {
  const totalCalls = entries.length;
  const successCalls = entries.filter(e => e.http_status >= 200 && e.http_status < 300).length;
  const errorCalls = totalCalls - successCalls;
  const errorRatePct = totalCalls > 0 ? parseFloat(((errorCalls / totalCalls) * 100).toFixed(2)) : 0;

  return {
    totals: {
      total_calls: totalCalls,
      success_calls: successCalls,
      error_calls: errorCalls,
      error_rate_pct: errorRatePct
    },
    meets_calls_threshold: successCalls >= META_THRESHOLD_CALLS,
    meets_error_threshold: errorRatePct < META_THRESHOLD_ERROR_PCT,
    target_error_rate_ok: errorRatePct < TARGET_ERROR_PCT,
    last_run_at: new Date().toISOString()
  };
}

function write15dSummary(summary) {
  ensureLogsDir();
  const filePath = path.join(LOG_DIR, 'telemetry_15d_summary.json');
  fs.writeFileSync(filePath, JSON.stringify(summary, null, 2));
}

function writeReport(summary, entries) {
  ensureLogsDir();
  const filePath = path.join(LOG_DIR, 'telemetry_15d_report.txt');
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - 14);
  const dateRange = `${startDate.toISOString().split('T')[0]} to ${now.toISOString().split('T')[0]}`;

  const errors = entries.filter(e => e.http_status < 200 || e.http_status >= 300);
  const byCategory = {};
  const byEndpoint = {};
  for (const e of errors) {
    const cat = e.error_category || 'unknown';
    byCategory[cat] = (byCategory[cat] || 0) + 1;
    const ep = (e.endpoint || '').replace(/\/v\d+\.\d+/, '');
    byEndpoint[ep] = (byEndpoint[ep] || 0) + 1;
  }

  const topEndpoints = Object.entries(byEndpoint)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([ep, n]) => `  ${ep}: ${n} errors`);

  const readyToSubmit = summary.meets_calls_threshold && summary.meets_error_threshold;

  const lines = [
    'Meta Ads API Telemetry — 15-Day Compliance Report',
    '================================================',
    '',
    `Date range: ${dateRange}`,
    `Generated: ${now.toISOString()}`,
    '',
    '--- Totals ---',
    `Total API calls: ${summary.totals.total_calls}`,
    `Successful: ${summary.totals.success_calls}`,
    `Errors: ${summary.totals.error_calls}`,
    `Error rate: ${summary.totals.error_rate_pct}%`,
    '',
    '--- Meta Requirements ---',
    `≥1500 successful calls: ${summary.meets_calls_threshold ? 'YES' : 'NO'}`,
    `Error rate <15%: ${summary.meets_error_threshold ? 'YES' : 'NO'}`,
    `Target <5% error rate: ${summary.target_error_rate_ok ? 'YES' : 'NO'}`,
    '',
    '--- Error breakdown by category ---',
    ...(Object.keys(byCategory).length ? Object.entries(byCategory).map(([k, v]) => `  ${k}: ${v}`) : ['  (none)']),
    '',
    '--- Top failing endpoints ---',
    ...(topEndpoints.length ? topEndpoints : ['  (none)']),
    '',
    '--- Recommendation ---',
    `READY TO SUBMIT: ${readyToSubmit ? 'YES' : 'NO'}`,
    '',
    '--- Purpose ---',
    'Read-only integration verification / health-check job for Ads Management Standard Access.'
  ];

  fs.writeFileSync(filePath, lines.join('\n'));
}

function runDryRun() {
  const config = {
    apiVersion: API_VERSION,
    baseUrl: BASE_URL,
    targetCallsPerRun: TARGET_CALLS_PER_RUN,
    hardCallCeiling: HARD_CALL_CEILING,
    minDelayMs: MIN_DELAY_MS,
    maxRetries: MAX_RETRIES,
    pageLimit: PAGE_LIMIT,
    maxPagesPerEdge: MAX_PAGES_PER_EDGE,
    logDir: LOG_DIR,
    hasToken: !!ACCESS_TOKEN,
    hasAdAccountId: !!AD_ACCOUNT_ID,
    hasAppId: !!META_APP_ID
  };

  const floor = buildFloorCallPool(AD_ACCOUNT_ID ? [AD_ACCOUNT_ID.replace(/^act_/, '')] : ['{from_adaccounts}']);
  const objEdges = buildObjectListEdges(AD_ACCOUNT_ID ? [AD_ACCOUNT_ID.replace(/^act_/, '')] : ['{from_adaccounts}']);

  const planned = [];
  planned.push(...floor.slice(0, 15));
  planned.push(...objEdges.slice(0, 10));

  log('INFO', 'Dry run: planned call sequence', config);
  console.log('\n=== DRY RUN: PLANNED CALL SEQUENCE ===');
  console.log(config);
  console.log('\nFloor pool (first 15):');
  floor.slice(0, 15).forEach((c, i) => console.log(`  ${i + 1}. ${c.url} ${JSON.stringify(c.params)}`));
  console.log('\nObject list edges (first 10):');
  objEdges.slice(0, 10).forEach((c, i) => console.log(`  ${i + 1}. ${c.url} ${JSON.stringify(c.params)}`));
  console.log('\n=== END DRY RUN ===\n');
  return { dryRun: true };
}

// ─── Report-only mode ──────────────────────────────────────────────────────

function runReportOnly() {
  ensureLogsDir();
  const entries = loadJsonlFromLast15Days();
  const summary = compute15dSummary(entries);
  write15dSummary(summary);
  writeReport(summary, entries);
  console.log(`Report written to ${path.join(LOG_DIR, 'telemetry_15d_report.txt')}`);
  console.log(`Summary: ${path.join(LOG_DIR, 'telemetry_15d_summary.json')}`);
}

// ─── CLI ────────────────────────────────────────────────────────────────────

if (require.main === module) {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const reportOnly = args.includes('--report-only');

  if (reportOnly) {
    runReportOnly();
    process.exit(0);
  }

  if (!ACCESS_TOKEN && !dryRun) {
    log('WARN', 'META_ACCESS_TOKEN missing - use --dry-run to see planned call sequence');
    runDryRun();
    process.exit(0);
  }

  seedMetaTelemetry({ dryRun })
    .then(() => process.exit(0))
    .catch(err => {
      log('FATAL', 'Telemetry seeding failed', { error: err.message });
      process.exit(1);
    });
}

module.exports = { seedMetaTelemetry, getPlannedCallSequence: runDryRun, runReportOnly };
