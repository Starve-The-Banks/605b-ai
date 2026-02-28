#!/usr/bin/env bash
set -euo pipefail

# ============================================
# 605b.ai — Launch Readiness Checks
# ============================================
# Run all pre-launch verification steps.
# Read-only checks — nothing is modified.
# ============================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

cd "$PROJECT_DIR"

PASS=0
FAIL=0

run_check() {
  local label="$1"
  shift
  echo ""
  echo "━━━ $label ━━━"
  if "$@"; then
    echo "→ PASS"
    PASS=$((PASS + 1))
  else
    echo "→ FAIL"
    FAIL=$((FAIL + 1))
  fi
}

echo ""
echo "╔══════════════════════════════════════╗"
echo "║   605b.ai Launch Readiness Checks   ║"
echo "╚══════════════════════════════════════╝"

# Check 1: Meta env vars
run_check "1. Meta Pixel Environment Vars" node scripts/launch/check-meta-env.mjs

# Check 2: Lint
run_check "2. ESLint" npx next lint

# Check 3: Build
run_check "3. Next.js Build" npx next build

# Check 4: Prod pixel smoke test (may fail if pixel not deployed yet)
echo ""
echo "━━━ 4. Production Pixel Smoke Test ━━━"
if node scripts/launch/smoke-prod-meta-pixel.mjs; then
  echo "→ PASS"
  PASS=$((PASS + 1))
else
  echo "→ FAIL (this is expected if NEXT_PUBLIC_META_PIXEL_ID is not set in Vercel yet)"
  FAIL=$((FAIL + 1))
fi

# Summary
echo ""
echo "╔══════════════════════════════════════╗"
echo "║            SUMMARY                   ║"
echo "╠══════════════════════════════════════╣"
echo "║  Passed: $PASS                            ║"
echo "║  Failed: $FAIL                            ║"
echo "╚══════════════════════════════════════╝"
echo ""

if [ "$FAIL" -eq 0 ]; then
  echo "✓ ALL CHECKS PASSED — READY FOR LAUNCH"
  echo ""
  exit 0
else
  echo "✗ $FAIL CHECK(S) FAILED — SEE ABOVE"
  echo ""
  echo "If only the pixel smoke test failed, that's expected until you:"
  echo "  1. Set NEXT_PUBLIC_META_PIXEL_ID in Vercel production"
  echo "  2. Redeploy"
  echo ""
  exit 1
fi
