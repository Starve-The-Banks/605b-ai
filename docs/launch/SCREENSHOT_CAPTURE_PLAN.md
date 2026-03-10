# Screenshot Capture Plan — Store Assets

**Brand:** 605b.ai
**Entity:** Ninth Wave Analytics LLC
**Date:** 2026-03-09

---

## Android — Google Play Store

### Required Screenshots (16:9 or 9:16)

| # | Screen            | Description                                       | Phone (1080×1920) | Tablet (1200×1920) |
|---|-------------------|---------------------------------------------------|--------------------|--------------------|
| 1 | Onboarding        | Sign-in/sign-up screen with branding              | Required           | Required           |
| 2 | Dashboard         | Main dashboard with sample analysis loaded        | Required           | Required           |
| 3 | Analyzer          | Report analysis results with flagged discrepancies | Required           | Required           |
| 4 | Dispute Templates | Template library showing statute categories       | Required           | Required           |
| 5 | Tracker           | Dispute tracker with timeline and deadlines       | Required           | Required           |
| 6 | Upgrade Screen    | Pricing/tier selection screen                     | Required           | Required           |

### Play Store Requirements

- **Phone:** min 2, max 8 screenshots — 1080×1920 px (portrait) or 1920×1080 px (landscape)
- **7-inch tablet:** min 1 — 1200×1920 px recommended
- **10-inch tablet:** min 1 — 1600×2560 px recommended
- **Format:** JPEG or 24-bit PNG, no alpha
- **Max file size:** 8 MB per image

### Feature Graphic

- 1024×500 px (required for Play Store listing)
- Should show 605b.ai logo + tagline: "Statute-Driven Credit Reinvestigation"

---

## Apple — App Store

### Required Screenshots (per device class)

| # | Screen            | Description                                       | iPhone 6.7" | iPhone 6.5" | iPad 12.9" |
|---|-------------------|---------------------------------------------------|-------------|-------------|------------|
| 1 | Onboarding        | Sign-in/sign-up screen with branding              | Required    | Required    | Required   |
| 2 | Dashboard         | Main dashboard with sample analysis loaded        | Required    | Required    | Required   |
| 3 | Analyzer          | Report analysis results with flagged discrepancies | Required    | Required    | Required   |
| 4 | Dispute Templates | Template library showing statute categories       | Required    | Required    | Required   |
| 5 | Tracker           | Dispute tracker with timeline and deadlines       | Required    | Required    | Required   |
| 6 | Upgrade Screen    | Pricing/tier selection screen                     | Required    | Required    | Required   |

### App Store Requirements

- **iPhone 6.7" (15 Pro Max):** 1290×2796 px — required
- **iPhone 6.5" (11 Pro Max):** 1284×2778 px — required if supporting older sizes
- **iPad Pro 12.9" (6th gen):** 2048×2732 px — required for iPad builds
- **Format:** JPEG or PNG, sRGB color space, no rounded corners (Apple adds them)
- **Min:** 3 screenshots per device class
- **Max:** 10 screenshots per device class

### App Preview Video (Optional but Recommended)

- 15-30 second screen recording
- Show: upload → analysis → dispute letter → tracker
- No audio narration required (add captions)

---

## Capture Instructions

### Setup

1. Use a **demo/test account** with realistic but fictional data
2. Ensure **dark theme** is active (matches brand)
3. Remove or hide any real PII from sample data
4. Set device to **airplane mode** (removes carrier info from status bar)
5. Set time to **9:41** (Apple convention) or clean status bar

### Phone Capture

```
Android: adb shell screencap -p /sdcard/screen.png && adb pull /sdcard/screen.png
iOS:     Side button + Volume Up (or Xcode > Devices > Take Screenshot)
```

### Tablet Capture

- Use actual device or high-fidelity emulator
- Same screens as phone, but ensure layout fills tablet viewport
- Verify no stretched/compressed elements

### Post-Processing

1. No device frames unless App Store/Play Store tools add them
2. Verify text is legible at thumbnail size
3. Confirm brand colors render correctly (#FF6B35 orange, #0C0C0C background)
4. Export at exact required dimensions — no upscaling

---

## Screen Content Checklist

### Screen 1 — Onboarding
- [ ] 605b.ai logo visible
- [ ] "Statute-Driven Credit Reinvestigation Platform" tagline
- [ ] Sign up / Sign in buttons visible
- [ ] Clean, dark-themed background

### Screen 2 — Dashboard
- [ ] Sample analysis loaded with 3+ tradelines
- [ ] Severity indicators visible (high/medium/low)
- [ ] Navigation tabs visible
- [ ] No real PII shown

### Screen 3 — Analyzer
- [ ] Flagged discrepancies with statute references
- [ ] At least 2-3 items shown
- [ ] FCRA section references visible
- [ ] Export option visible if applicable

### Screen 4 — Dispute Templates
- [ ] Template categories visible (Bureau, Creditor, Escalation)
- [ ] At least 3-4 template names shown
- [ ] Statute citations visible (FCRA §611, FDCPA §809, etc.)
- [ ] Template count visible (62 templates)

### Screen 5 — Tracker
- [ ] Active disputes with timeline bars
- [ ] Deadline dates visible
- [ ] Status indicators (Sent, Pending, Response)
- [ ] At least 2-3 tracked items

### Screen 6 — Upgrade Screen
- [ ] All 4 tiers visible (Free, $39, $89, $179)
- [ ] One-time purchase labels clear
- [ ] Feature comparison visible
- [ ] "Most Popular" badge on Advanced tier

---

## Delivery

- Save originals to `assets/store-screenshots/android/` and `assets/store-screenshots/ios/`
- Name format: `{platform}-{device}-{screen_number}-{screen_name}.png`
- Example: `android-phone-01-onboarding.png`, `ios-iphone67-03-analyzer.png`
