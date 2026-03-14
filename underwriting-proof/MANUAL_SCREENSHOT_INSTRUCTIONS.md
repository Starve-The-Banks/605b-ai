# Manual Screenshot Instructions

If automated screenshot capture fails (e.g., the site requires login or blocks headless browsers), follow these steps to capture screenshots manually and rebuild the PDF.

## Steps

1. Open **Google Chrome** on your Mac.
2. Navigate to each URL below and take a full-page screenshot.
3. Save each screenshot as a PNG with the exact filename shown, into the `screenshots/` folder.

## Screenshots to Capture

| Filename | URL | What to Capture |
|----------|-----|-----------------|
| `homepage.png` | https://605b.ai | Full homepage |
| `features.png` | https://605b.ai/#features | Features/product description section |
| `pricing.png` | https://605b.ai/#pricing | Pricing or checkout section |
| `privacy-policy.png` | https://605b.ai/privacy | Privacy Policy page |
| `terms-of-service.png` | https://605b.ai/terms | Terms of Service page |

## How to Take a Full-Page Screenshot in Chrome

1. Open the page in Chrome.
2. Press **Cmd + Option + I** to open DevTools.
3. Press **Cmd + Shift + P** to open the Command Palette.
4. Type **"Capture full size screenshot"** and select it.
5. Chrome will download a PNG. Rename it to the filename above.
6. Move it into the `screenshots/` folder.

## Rebuild the PDF

After placing all screenshots in `screenshots/`, run:

```bash
cd underwriting-proof
node compose-pdf.mjs
```

The PDF will be regenerated at `proof-of-operating-activity_605b.ai.pdf`.
