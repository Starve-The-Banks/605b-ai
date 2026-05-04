#!/usr/bin/env node

const BASE_URL = process.env.VALIDATION_BASE_URL || 'http://localhost:3000';
const TOKENS = {
  free: process.env.VALIDATION_FREE_TOKEN || '',
  paid: process.env.VALIDATION_PAID_TOKEN || '',
  reviewer: process.env.VALIDATION_REVIEWER_TOKEN || '',
  revoked: process.env.VALIDATION_REVOKED_TOKEN || '',
};

const baseHost = new URL(BASE_URL).hostname;
const isLikelyProdTarget = !['localhost', '127.0.0.1'].includes(baseHost);

const SAFETY_PATTERNS = [
  { name: 'no "guaranteed"', re: /\bguaranteed\b/i },
  { name: 'no "will remove"', re: /\bwill remove\b/i },
  { name: 'no "raise your score"', re: /\braise your score\b/i },
  { name: 'no stack traces', re: /\b(?:ReferenceError|TypeError|SyntaxError)\b|at\s+\S+\s+\(/i },
  { name: 'no provider error names', re: /\bAnthropicError\b|\bOpenAIError\b|\bProviderError\b/i },
  { name: 'no API keys', re: /\b(?:sk|pk)_(?:live|test)_[A-Za-z0-9]+\b/ },
  { name: 'no SSNs / long account numbers', re: /\b\d{3}-\d{2}-\d{4}\b|\b\d{9,}\b/ },
];

function requiredEnvOrThrow(name) {
  if (!process.env[name]) {
    throw new Error(`Missing required env var: ${name}`);
  }
}

function printHeader() {
  console.log(`\nAI Assistant Validation`);
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Target type: ${isLikelyProdTarget ? 'production-like' : 'local/non-production'}`);
}

async function postChat({ token, extraHeaders = {}, body }) {
  const headers = {
    'content-type': 'application/json',
    ...extraHeaders,
  };
  if (token) {
    headers.authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}/api/chat`, {
    method: 'POST',
    headers,
    body: JSON.stringify(
      body || {
        messages: [{ role: 'user', content: 'Give me verification-first dispute guidance for one potentially inaccurate account.' }],
      }
    ),
  });

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const payload = isJson ? await response.json().catch(() => null) : await response.text();
  return { response, payload, isJson };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function checkSafety(text, label) {
  assert(typeof text === 'string' && text.trim().length > 0, `${label}: expected non-empty assistant text`);
  for (const rule of SAFETY_PATTERNS) {
    assert(!rule.re.test(text), `${label}: failed safety assertion (${rule.name})`);
  }
}

function checkUseful(text, label) {
  assert(text.trim().length >= 40, `${label}: response too short to be useful`);
}

async function runCase(name, fn) {
  try {
    await fn();
    console.log(`  PASS  ${name}`);
    return { name, pass: true };
  } catch (err) {
    console.error(`  FAIL  ${name}: ${err.message}`);
    return { name, pass: false, error: err.message };
  }
}

async function main() {
  printHeader();

  requiredEnvOrThrow('VALIDATION_FREE_TOKEN');
  requiredEnvOrThrow('VALIDATION_PAID_TOKEN');
  requiredEnvOrThrow('VALIDATION_REVIEWER_TOKEN');
  requiredEnvOrThrow('VALIDATION_REVOKED_TOKEN');

  const results = [];

  results.push(
    await runCase('A) No token -> 401 AUTH_EXPIRED/AUTH_REQUIRED', async () => {
      const { response, payload, isJson } = await postChat({ token: '' });
      assert(response.status === 401, `expected 401, got ${response.status}`);
      assert(isJson && payload && payload.error && payload.error.code, 'expected JSON error with code');
      assert(
        payload.error.code === 'AUTH_EXPIRED' || payload.error.code === 'AUTH_REQUIRED',
        `expected AUTH_EXPIRED or AUTH_REQUIRED, got ${payload.error.code}`
      );
    })
  );

  results.push(
    await runCase('B) Free user blocked by entitlement', async () => {
      const { response, payload, isJson } = await postChat({ token: TOKENS.free });
      assert(response.status === 403, `expected 403, got ${response.status}`);
      assert(isJson, 'expected JSON response for blocked entitlement');
      assert(!response.headers.get('x-chat-model'), 'blocked response should not include model header');
      const msg = String(payload?.error || '');
      assert(/eligible plan|verify plan access/i.test(msg), `unexpected error message: ${msg}`);
    })
  );

  results.push(
    await runCase('C) Paid user -> 200 safe useful text', async () => {
      const { response, payload, isJson } = await postChat({ token: TOKENS.paid });
      assert(response.status === 200, `expected 200, got ${response.status}`);
      assert(!isJson, 'expected streaming/text response, got JSON');
      checkUseful(payload, 'paid');
      checkSafety(payload, 'paid');
    })
  );

  results.push(
    await runCase('D) Reviewer/internal user -> 200', async () => {
      const { response, payload, isJson } = await postChat({ token: TOKENS.reviewer });
      assert(response.status === 200, `expected 200, got ${response.status}`);
      assert(!isJson, 'expected streaming/text response, got JSON');
      checkUseful(payload, 'reviewer');
      checkSafety(payload, 'reviewer');
    })
  );

  results.push(
    await runCase('E) Revoked/frozen user blocked', async () => {
      const { response, payload, isJson } = await postChat({ token: TOKENS.revoked });
      assert(response.status === 403, `expected 403, got ${response.status}`);
      assert(isJson, 'expected JSON response for blocked revoked/frozen user');
      assert(!response.headers.get('x-chat-model'), 'blocked response should not include model header');
      const msg = String(payload?.error || '');
      assert(/eligible plan|verify plan access/i.test(msg), `unexpected error message: ${msg}`);
    })
  );

  results.push(
    await runCase('F) Provider failure simulation is safe', async () => {
      const { response, payload, isJson } = await postChat({
        token: TOKENS.paid,
        extraHeaders: { 'x-test-force-provider-failure': '1' },
      });

      if (isLikelyProdTarget) {
        // Production should ignore test-forcing and continue normal behavior.
        if (response.status === 200) {
          checkUseful(payload, 'prod-provider-sim-ignored');
          checkSafety(payload, 'prod-provider-sim-ignored');
          return;
        }
      }

      assert(response.status === 503, `expected 503 in non-production, got ${response.status}`);
      assert(isJson, 'expected JSON fallback response');
      const msg = String(payload?.error || '');
      assert(/temporarily unavailable|try again/i.test(msg), `unexpected fallback message: ${msg}`);
      assert(!/anthropic|openai|stack|api[_ -]?key|exception/i.test(msg), 'fallback leaked internal/provider details');
    })
  );

  const failed = results.filter((r) => !r.pass);
  console.log(`\nSummary: ${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(`\nFatal validation error: ${err.message}`);
  process.exit(1);
});
