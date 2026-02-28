#!/usr/bin/env node

/**
 * Lightweight production smoke test for Meta Pixel.
 * Fetches production HTML and checks for pixel initialization patterns.
 * No browser required — uses native fetch.
 * Read-only — does not modify anything.
 */

const BASE_URL = 'https://www.605b.ai';

const ROUTES = [
  { path: '/', name: 'Homepage' },
  { path: '/pricing', name: 'Pricing' },
  { path: '/privacy', name: 'Privacy' },
  { path: '/terms', name: 'Terms' },
  { path: '/contact', name: 'Contact' },
  { path: '/about', name: 'About' },
];

const PIXEL_PATTERNS = [
  { name: 'fbevents.js script', pattern: /connect\.facebook\.net\/[a-z_]+\/fbevents\.js/ },
  { name: 'fbq init call', pattern: /fbq\s*\(\s*['"]init['"]/ },
  { name: 'fbq PageView', pattern: /fbq\s*\(\s*['"]track['"]\s*,\s*['"]PageView['"]/ },
  { name: 'pixel ID format', pattern: /fbq\s*\(\s*['"]init['"]\s*,\s*['"]\d{10,20}['"]/ },
  { name: 'next/script meta-pixel tag', pattern: /id=["']meta-pixel["']|__NEXT_DATA__.*meta-pixel/ },
];

async function checkRoute(route) {
  const url = `${BASE_URL}${route.path}`;
  const result = {
    name: route.name,
    path: route.path,
    status: null,
    pixelPatterns: {},
    error: null,
  };

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) 605b-launch-check/1.0',
        'Accept': 'text/html',
      },
      redirect: 'follow',
    });

    result.status = res.status;

    if (res.status !== 200) {
      result.error = `HTTP ${res.status}`;
      return result;
    }

    const html = await res.text();

    for (const p of PIXEL_PATTERNS) {
      const match = p.pattern.test(html);
      result.pixelPatterns[p.name] = match;

      if (match && p.name === 'pixel ID format') {
        const idMatch = html.match(/fbq\s*\(\s*['"]init['"]\s*,\s*['"](\d{10,20})['"]/);
        if (idMatch) {
          result.pixelId = idMatch[1].slice(0, 3) + '***' + idMatch[1].slice(-3);
        }
      }
    }
  } catch (err) {
    result.error = err.message;
  }

  return result;
}

async function main() {
  console.log('\n=== Meta Pixel Production Smoke Test ===');
  console.log(`Base URL: ${BASE_URL}\n`);

  const results = [];
  let allPass = true;

  for (const route of ROUTES) {
    const result = await checkRoute(route);
    results.push(result);

    const statusOk = result.status === 200;
    const hasInlinePixel = result.pixelPatterns['fbevents.js script'] && result.pixelPatterns['fbq init call'];
    const hasNextScriptPixel = result.pixelPatterns['next/script meta-pixel tag'];
    const hasPixel = hasInlinePixel || hasNextScriptPixel;
    const routePass = statusOk && hasPixel;

    if (!routePass) allPass = false;

    const icon = routePass ? 'PASS' : 'FAIL';
    console.log(`  ${icon}  ${result.name} (${result.path})`);
    console.log(`         HTTP: ${result.status || 'ERROR'}${result.error ? ' — ' + result.error : ''}`);

    if (statusOk) {
      for (const [name, found] of Object.entries(result.pixelPatterns)) {
        console.log(`         ${found ? '✓' : '✗'} ${name}`);
      }
      if (result.pixelId) {
        console.log(`         Pixel ID: ${result.pixelId}`);
      }
    }
    console.log('');
  }

  console.log('--- Summary ---\n');

  if (allPass) {
    console.log('  ALL ROUTES PASS — pixel patterns detected on all pages.\n');
  } else {
    const failing = results.filter(r => r.status !== 200 || !r.pixelPatterns['fbevents.js script']);

    if (failing.some(r => r.status !== 200)) {
      console.log('  ISSUE: Some routes returned non-200 status codes.');
      console.log('  FIX: Check that the site is deployed and routes exist.\n');
    }

    const noPixel = failing.filter(r => r.status === 200 &&
      !r.pixelPatterns['fbevents.js script'] && !r.pixelPatterns['next/script meta-pixel tag']);
    if (noPixel.length > 0) {
      console.log('  ISSUE: Pixel not detected on pages that returned 200.');
      console.log('  NOTE: Next.js strategy="afterInteractive" renders pixel via client JS,');
      console.log('        not in the initial HTML. The inline patterns may not appear in a');
      console.log('        simple HTTP fetch. Use Meta Pixel Helper in a real browser for');
      console.log('        definitive verification.');
      console.log('');
      console.log('  Most likely cause: NEXT_PUBLIC_META_PIXEL_ID is not set in Vercel production.');
      console.log('');
      console.log('  To fix:');
      console.log('    1. Go to Vercel → Project → Settings → Environment Variables');
      console.log('    2. Add NEXT_PUBLIC_META_PIXEL_ID = your_pixel_id');
      console.log('    3. Scope: Production');
      console.log('    4. Redeploy the production branch');
      console.log('');
      console.log('  For definitive browser-based test: node scripts/verify-meta-pixel.mjs');
      console.log('');
    }
  }

  console.log(`${allPass ? 'PASS' : 'FAIL'}\n`);
  process.exit(allPass ? 0 : 1);
}

main();
