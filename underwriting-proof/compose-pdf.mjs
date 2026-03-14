import {
  PDFDocument,
  rgb,
  StandardFonts,
  PageSizes,
} from "pdf-lib";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const BRAND = "605b.ai";
const COMPANY = "Ninth Wave Analytics LLC";
const FOOTER = `${COMPANY} — ${BRAND}`;
const OUTPUT = join(__dirname, "proof-of-operating-activity_605b.ai.pdf");
const RESULTS_FILE = join(__dirname, "screenshot-results.json");

const BLACK = rgb(0, 0, 0);
const DARK_GRAY = rgb(0.25, 0.25, 0.25);
const MID_GRAY = rgb(0.45, 0.45, 0.45);
const LIGHT_GRAY = rgb(0.85, 0.85, 0.85);
const WHITE = rgb(1, 1, 1);
const ACCENT = rgb(0.15, 0.15, 0.15);

const PAGE_W = PageSizes.Letter[0]; // 612
const PAGE_H = PageSizes.Letter[1]; // 792
const MARGIN = 60;
const CONTENT_W = PAGE_W - 2 * MARGIN;

let pageCount = 0;

function addFooter(page, fontRegular, pageNum) {
  const footerY = 30;
  page.drawText(FOOTER, {
    x: MARGIN,
    y: footerY,
    size: 8,
    font: fontRegular,
    color: MID_GRAY,
  });
  page.drawText(`Page ${pageNum}`, {
    x: PAGE_W - MARGIN - 40,
    y: footerY,
    size: 8,
    font: fontRegular,
    color: MID_GRAY,
  });
  page.drawLine({
    start: { x: MARGIN, y: footerY + 12 },
    end: { x: PAGE_W - MARGIN, y: footerY + 12 },
    thickness: 0.5,
    color: LIGHT_GRAY,
  });
}

function addHeader(page, fontRegular) {
  const headerY = PAGE_H - 30;
  page.drawText(BRAND, {
    x: MARGIN,
    y: headerY,
    size: 8,
    font: fontRegular,
    color: MID_GRAY,
  });
  page.drawLine({
    start: { x: MARGIN, y: headerY - 6 },
    end: { x: PAGE_W - MARGIN, y: headerY - 6 },
    thickness: 0.5,
    color: LIGHT_GRAY,
  });
}

function newPage(doc, fontRegular) {
  const page = doc.addPage(PageSizes.Letter);
  pageCount++;
  addHeader(page, fontRegular);
  addFooter(page, fontRegular, pageCount);
  return page;
}

function drawWrappedText(page, text, x, y, maxWidth, font, size, color, lineHeight) {
  const words = text.split(" ");
  let line = "";
  let currentY = y;

  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    const testWidth = font.widthOfTextAtSize(testLine, size);
    if (testWidth > maxWidth && line) {
      page.drawText(line, { x, y: currentY, size, font, color });
      currentY -= lineHeight;
      line = word;
    } else {
      line = testLine;
    }
  }
  if (line) {
    page.drawText(line, { x, y: currentY, size, font, color });
    currentY -= lineHeight;
  }
  return currentY;
}

function drawBullet(page, text, x, y, maxWidth, font, size, color, lineHeight) {
  page.drawText("•", { x, y, size, font, color });
  return drawWrappedText(page, text, x + 14, y, maxWidth - 14, font, size, color, lineHeight);
}

async function main() {
  const doc = await PDFDocument.create();
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);

  const generatedDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // ────────────────── PAGE 1: COVER ──────────────────
  {
    const page = newPage(doc, fontRegular);

    let y = PAGE_H - 200;

    page.drawRectangle({
      x: MARGIN,
      y: y - 10,
      width: CONTENT_W,
      height: 4,
      color: ACCENT,
    });

    y -= 50;
    page.drawText("Proof of Operating Activity", {
      x: MARGIN,
      y,
      size: 28,
      font: fontBold,
      color: BLACK,
    });

    y -= 50;
    const coverLines = [
      ["Company", COMPANY],
      ["Product / Brand", BRAND],
      ["Website", "https://605b.ai"],
      ["Contact", "admin@605b.ai  |  support@605b.ai"],
      ["Date Generated", generatedDate],
      ["Document Type", "Marketing Materials"],
    ];
    for (const [label, value] of coverLines) {
      page.drawText(`${label}:`, {
        x: MARGIN,
        y,
        size: 11,
        font: fontBold,
        color: DARK_GRAY,
      });
      page.drawText(value, {
        x: MARGIN + 140,
        y,
        size: 11,
        font: fontRegular,
        color: BLACK,
      });
      y -= 22;
    }

    y -= 30;
    page.drawRectangle({
      x: MARGIN,
      y: y - 5,
      width: CONTENT_W,
      height: 1,
      color: LIGHT_GRAY,
    });

    y -= 30;
    y = drawWrappedText(
      page,
      "This document provides evidence of legitimate operating activity for Ninth Wave Analytics LLC, " +
        "operating as 605b.ai. It is prepared for payment processor underwriting review.",
      MARGIN,
      y,
      CONTENT_W,
      fontRegular,
      10,
      MID_GRAY,
      15
    );
  }

  // ────────────────── PAGE 2: BUSINESS OVERVIEW ──────────────────
  {
    const page = newPage(doc, fontRegular);
    let y = PAGE_H - 70;

    page.drawText("Business Overview", {
      x: MARGIN,
      y,
      size: 20,
      font: fontBold,
      color: BLACK,
    });
    y -= 8;
    page.drawRectangle({ x: MARGIN, y, width: 180, height: 2.5, color: ACCENT });
    y -= 28;

    // Section: What We Do
    page.drawText("What We Do", { x: MARGIN, y, size: 13, font: fontBold, color: DARK_GRAY });
    y -= 20;
    y = drawWrappedText(
      page,
      "605b.ai is a web-based software tool that generates documentation templates and guides workflows " +
        "for organizing and preparing consumer dispute documentation. The product helps US consumers " +
        "understand their rights under applicable federal regulations (such as the Fair Credit Reporting Act) " +
        "and creates structured documentation packets they can use when filing disputes with credit bureaus " +
        "and furnishers.",
      MARGIN,
      y,
      CONTENT_W,
      fontRegular,
      10.5,
      BLACK,
      16
    );
    y -= 14;
    y = drawWrappedText(
      page,
      "605b.ai is an educational and documentation-assistance tool. It does not provide legal advice, " +
        "does not act on behalf of users, and is not a credit repair organization.",
      MARGIN,
      y,
      CONTENT_W,
      fontRegular,
      10.5,
      BLACK,
      16
    );

    y -= 28;
    page.drawText("Business Details", { x: MARGIN, y, size: 13, font: fontBold, color: DARK_GRAY });
    y -= 22;

    const details = [
      ["Business Type", "Consumer-facing software (B2C SaaS — single-purchase model)"],
      ["Revenue Model", "ONE-TIME PURCHASE ONLY — no subscriptions, no recurring billing"],
      ["Delivery Method", "Digital delivery, online — no physical goods"],
      ["Target Customers", "United States consumers (individuals)"],
      ["Payment Flow", "Online card payments processed via payment processor; funds deposited to US business bank account"],
    ];

    for (const [label, value] of details) {
      page.drawText(`${label}:`, {
        x: MARGIN,
        y,
        size: 10,
        font: fontBold,
        color: DARK_GRAY,
      });
      y -= 16;
      y = drawWrappedText(page, value, MARGIN + 10, y, CONTENT_W - 10, fontRegular, 10, BLACK, 15);
      y -= 10;
    }

    y -= 18;
    page.drawText("Explicit Exclusions", { x: MARGIN, y, size: 13, font: fontBold, color: DARK_GRAY });
    y -= 22;

    y = drawWrappedText(
      page,
      "Ninth Wave Analytics LLC (605b.ai) does NOT engage in any of the following activities:",
      MARGIN,
      y,
      CONTENT_W,
      fontRegular,
      10.5,
      BLACK,
      16
    );
    y -= 8;

    const exclusions = [
      "Lending or credit extension of any kind",
      "Money transmission or money services",
      "Escrow, custody, or holding of consumer funds",
      "Debt settlement, debt consolidation, or debt negotiation",
      "Subscription billing or recurring charges — all purchases are one-time",
      "Credit repair services — the product is an educational documentation tool only",
      "Legal advice or legal representation",
    ];

    for (const item of exclusions) {
      y = drawBullet(page, item, MARGIN + 10, y, CONTENT_W - 10, fontRegular, 10, BLACK, 15);
      y -= 4;
    }

    y -= 20;
    page.drawRectangle({
      x: MARGIN,
      y: y + 8,
      width: CONTENT_W,
      height: 30,
      color: rgb(0.95, 0.95, 0.95),
    });
    page.drawText("ONE-TIME PURCHASE ONLY — NO SUBSCRIPTIONS — NO RECURRING BILLING", {
      x: MARGIN + 20,
      y: y + 18,
      size: 10,
      font: fontBold,
      color: BLACK,
    });
  }

  // ────────────────── PAGES 3+: WEBSITE EVIDENCE ──────────────────
  let screenshotResults = [];
  if (existsSync(RESULTS_FILE)) {
    screenshotResults = JSON.parse(readFileSync(RESULTS_FILE, "utf-8"));
  }

  const websiteScreenshots = screenshotResults.filter(
    (r) => !["privacy-policy", "terms-of-service"].includes(r.name)
  );
  const policyScreenshots = screenshotResults.filter((r) =>
    ["privacy-policy", "terms-of-service"].includes(r.name)
  );

  // Website evidence pages
  if (websiteScreenshots.length > 0) {
    for (const shot of websiteScreenshots) {
      const page = newPage(doc, fontRegular);
      let y = PAGE_H - 70;

      page.drawText("Website Evidence", {
        x: MARGIN,
        y,
        size: 20,
        font: fontBold,
        color: BLACK,
      });
      y -= 8;
      page.drawRectangle({ x: MARGIN, y, width: 160, height: 2.5, color: ACCENT });
      y -= 24;

      page.drawText(`${shot.description}`, {
        x: MARGIN,
        y,
        size: 12,
        font: fontBold,
        color: DARK_GRAY,
      });
      y -= 16;
      page.drawText(`URL: ${shot.url}`, {
        x: MARGIN,
        y,
        size: 9,
        font: fontRegular,
        color: MID_GRAY,
      });
      y -= 20;

      if (shot.success && shot.path && existsSync(shot.path)) {
        try {
          const imgBytes = readFileSync(shot.path);
          const img = await doc.embedPng(imgBytes);
          const imgDims = img.scale(1);
          const maxW = CONTENT_W;
          const maxH = y - 60;
          const scale = Math.min(maxW / imgDims.width, maxH / imgDims.height, 1);
          const drawW = imgDims.width * scale;
          const drawH = imgDims.height * scale;

          page.drawRectangle({
            x: MARGIN - 1,
            y: y - drawH - 1,
            width: drawW + 2,
            height: drawH + 2,
            borderColor: LIGHT_GRAY,
            borderWidth: 0.5,
            color: WHITE,
          });

          page.drawImage(img, {
            x: MARGIN,
            y: y - drawH,
            width: drawW,
            height: drawH,
          });
        } catch (err) {
          y -= 20;
          page.drawText(`[Screenshot could not be embedded: ${err.message}]`, {
            x: MARGIN,
            y,
            size: 10,
            font: fontRegular,
            color: MID_GRAY,
          });
        }
      } else {
        y -= 10;
        page.drawRectangle({
          x: MARGIN,
          y: y - 80,
          width: CONTENT_W,
          height: 80,
          color: rgb(0.96, 0.96, 0.96),
          borderColor: LIGHT_GRAY,
          borderWidth: 0.5,
        });
        y -= 30;
        page.drawText("Screenshot not available — see MANUAL_SCREENSHOT_INSTRUCTIONS.md", {
          x: MARGIN + 20,
          y,
          size: 10,
          font: fontRegular,
          color: MID_GRAY,
        });
        y -= 16;
        page.drawText(`Expected file: screenshots/${shot.name}.png`, {
          x: MARGIN + 20,
          y,
          size: 9,
          font: fontRegular,
          color: MID_GRAY,
        });
      }
    }
  } else {
    const page = newPage(doc, fontRegular);
    let y = PAGE_H - 70;
    page.drawText("Website Evidence", { x: MARGIN, y, size: 20, font: fontBold, color: BLACK });
    y -= 8;
    page.drawRectangle({ x: MARGIN, y, width: 160, height: 2.5, color: ACCENT });
    y -= 30;
    y = drawWrappedText(
      page,
      "Screenshots were not captured automatically. Please see MANUAL_SCREENSHOT_INSTRUCTIONS.md " +
        "for steps to capture these manually and re-run the PDF composition.",
      MARGIN,
      y,
      CONTENT_W,
      fontRegular,
      11,
      BLACK,
      17
    );
    y -= 20;
    const urls = [
      "https://605b.ai (homepage)",
      "https://605b.ai/#features (product features)",
      "https://605b.ai/#pricing (pricing information)",
    ];
    for (const u of urls) {
      y = drawBullet(page, u, MARGIN + 10, y, CONTENT_W - 10, fontRegular, 10, BLACK, 15);
      y -= 6;
    }
  }

  // ────────────────── POLICY EVIDENCE ──────────────────
  {
    const page = newPage(doc, fontRegular);
    let y = PAGE_H - 70;

    page.drawText("Policies Evidence", {
      x: MARGIN,
      y,
      size: 20,
      font: fontBold,
      color: BLACK,
    });
    y -= 8;
    page.drawRectangle({ x: MARGIN, y, width: 155, height: 2.5, color: ACCENT });
    y -= 28;

    const policySections = [
      {
        title: "Privacy Policy",
        shot: policyScreenshots.find((s) => s.name === "privacy-policy"),
      },
      {
        title: "Terms of Service",
        shot: policyScreenshots.find((s) => s.name === "terms-of-service"),
      },
    ];

    for (const { title, shot } of policySections) {
      page.drawText(title, { x: MARGIN, y, size: 13, font: fontBold, color: DARK_GRAY });
      y -= 16;

      if (shot && shot.success && shot.path && existsSync(shot.path)) {
        page.drawText(`URL: ${shot.url}`, {
          x: MARGIN,
          y,
          size: 9,
          font: fontRegular,
          color: MID_GRAY,
        });
        y -= 16;
        try {
          const imgBytes = readFileSync(shot.path);
          const img = await doc.embedPng(imgBytes);
          const imgDims = img.scale(1);
          const maxW = CONTENT_W;
          const maxH = Math.min(280, y - 80);
          const scale = Math.min(maxW / imgDims.width, maxH / imgDims.height, 1);
          const drawW = imgDims.width * scale;
          const drawH = imgDims.height * scale;

          page.drawRectangle({
            x: MARGIN - 1,
            y: y - drawH - 1,
            width: drawW + 2,
            height: drawH + 2,
            borderColor: LIGHT_GRAY,
            borderWidth: 0.5,
            color: WHITE,
          });
          page.drawImage(img, { x: MARGIN, y: y - drawH, width: drawW, height: drawH });
          y -= drawH + 20;
        } catch {
          y = drawWrappedText(
            page,
            `[Screenshot could not be embedded for ${title}]`,
            MARGIN,
            y,
            CONTENT_W,
            fontRegular,
            10,
            MID_GRAY,
            15
          );
          y -= 16;
        }
      } else {
        page.drawRectangle({
          x: MARGIN,
          y: y - 45,
          width: CONTENT_W,
          height: 45,
          color: rgb(0.96, 0.96, 0.96),
          borderColor: LIGHT_GRAY,
          borderWidth: 0.5,
        });
        y -= 15;
        y = drawWrappedText(
          page,
          `The ${title} is published on the 605b.ai website. If a direct link or copy is needed for ` +
            "underwriting review, it can be provided immediately upon request.",
          MARGIN + 15,
          y,
          CONTENT_W - 30,
          fontRegular,
          9.5,
          MID_GRAY,
          14
        );
        y -= 30;
      }
    }
  }

  // ────────────────── SAVE ──────────────────
  const pdfBytes = await doc.save();
  writeFileSync(OUTPUT, pdfBytes);
  console.log(`PDF saved: ${OUTPUT}`);
  console.log(`Total pages: ${pageCount}`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
