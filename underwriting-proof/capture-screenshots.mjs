import { chromium } from "playwright";
import { mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const screenshotsDir = join(__dirname, "screenshots");
mkdirSync(screenshotsDir, { recursive: true });

const PAGES = [
  { name: "homepage", url: "https://605b.ai", description: "Homepage" },
  {
    name: "features",
    url: "https://605b.ai/#features",
    description: "Features section",
  },
  {
    name: "pricing",
    url: "https://605b.ai/#pricing",
    description: "Pricing section",
  },
  {
    name: "privacy-policy",
    url: "https://605b.ai/privacy",
    description: "Privacy Policy",
  },
  {
    name: "terms-of-service",
    url: "https://605b.ai/terms",
    description: "Terms of Service",
  },
];

const FALLBACK_URLS = {
  "privacy-policy": ["https://605b.ai/privacy-policy", "https://605b.ai/legal/privacy"],
  "terms-of-service": ["https://605b.ai/terms-of-service", "https://605b.ai/legal/terms", "https://605b.ai/tos"],
};

async function captureScreenshot(page, name, url, description) {
  const outPath = join(screenshotsDir, `${name}.png`);
  try {
    const response = await page.goto(url, {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    if (response && response.status() >= 400) {
      const fallbacks = FALLBACK_URLS[name] || [];
      for (const fallbackUrl of fallbacks) {
        console.log(`  Trying fallback: ${fallbackUrl}`);
        const fbResponse = await page.goto(fallbackUrl, {
          waitUntil: "networkidle",
          timeout: 15000,
        });
        if (fbResponse && fbResponse.status() < 400) {
          await page.waitForTimeout(2000);
          await page.screenshot({ path: outPath, fullPage: true });
          console.log(`  OK (fallback): ${outPath}`);
          return { name, url: fallbackUrl, path: outPath, success: true, description };
        }
      }
      console.log(`  FAILED (HTTP ${response.status()}): ${url}`);
      return { name, url, path: null, success: false, description };
    }

    await page.waitForTimeout(2000);
    await page.screenshot({ path: outPath, fullPage: true });
    console.log(`  OK: ${outPath}`);
    return { name, url, path: outPath, success: true, description };
  } catch (err) {
    console.log(`  ERROR: ${err.message}`);
    const fallbacks = FALLBACK_URLS[name] || [];
    for (const fallbackUrl of fallbacks) {
      try {
        console.log(`  Trying fallback: ${fallbackUrl}`);
        const fbResponse = await page.goto(fallbackUrl, {
          waitUntil: "networkidle",
          timeout: 15000,
        });
        if (fbResponse && fbResponse.status() < 400) {
          await page.waitForTimeout(2000);
          await page.screenshot({ path: outPath, fullPage: true });
          console.log(`  OK (fallback): ${outPath}`);
          return { name, url: fallbackUrl, path: outPath, success: true, description };
        }
      } catch {}
    }
    return { name, url, path: null, success: false, description };
  }
}

async function main() {
  console.log("Launching browser...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  const results = [];
  for (const { name, url, description } of PAGES) {
    console.log(`Capturing: ${description} (${url})`);
    const result = await captureScreenshot(page, name, url, description);
    results.push(result);
  }

  await browser.close();

  const resultPath = join(__dirname, "screenshot-results.json");
  const { writeFileSync } = await import("fs");
  writeFileSync(resultPath, JSON.stringify(results, null, 2));
  console.log(`\nResults saved to: ${resultPath}`);

  const succeeded = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;
  console.log(`\nDone: ${succeeded} captured, ${failed} failed`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
