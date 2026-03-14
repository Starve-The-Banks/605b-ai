#!/usr/bin/env bash
# Install LaunchAgent for Meta telemetry seeder (runs every 3 hours)
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PLIST_SRC="$REPO_DIR/launchd/com.ninthwave.meta-telemetry.plist"
PLIST_DEST="$HOME/Library/LaunchAgents/com.ninthwave.meta-telemetry.plist"
SECRETS_DIR="$REPO_DIR/.secrets"
SECRETS_FILE="$SECRETS_DIR/meta.env"
NODE_PATH="$(which node 2>/dev/null || echo '/usr/local/bin/node')"

# Ensure .secrets exists
mkdir -p "$SECRETS_DIR"
if [[ ! -f "$SECRETS_FILE" ]]; then
  echo "Creating $SECRETS_FILE from template..."
  cat > "$SECRETS_FILE" << 'EOF'
# Meta Ads API credentials (DO NOT COMMIT)
# Paste your long-lived access token below:
META_ACCESS_TOKEN=

# Optional: specific ad account (otherwise discovered from /me/adaccounts)
# AD_ACCOUNT_ID=act_123456789

# Optional: API version (default v25.0)
# META_API_VERSION=v25.0
EOF
  echo ""
  echo "  EDIT $SECRETS_FILE and add your META_ACCESS_TOKEN"
  echo "  Then run this script again."
  echo ""
  exit 1
fi

# Check token is set
if ! grep -q 'META_ACCESS_TOKEN=.\+' "$SECRETS_FILE" 2>/dev/null; then
  echo "ERROR: META_ACCESS_TOKEN is empty in $SECRETS_FILE"
  echo "Edit the file and add your token, then run again."
  exit 1
fi

# Create plist with templated paths
mkdir -p "$(dirname "$PLIST_DEST")"
cat "$PLIST_SRC" | sed "s|__REPO_DIR__|$REPO_DIR|g" | sed "s|__HOME__|$HOME|g" | sed "s|__NODE_PATH__|$NODE_PATH|g" > "$PLIST_DEST"

# Load the agent
launchctl unload "$PLIST_DEST" 2>/dev/null || true
launchctl load "$PLIST_DEST"

echo "Installed: $PLIST_DEST"
echo "Runs every 3 hours (StartInterval=10800)"
echo "Logs: $HOME/Library/Logs/meta-telemetry.out.log"
echo ""
echo "Verify: launchctl list | grep meta-telemetry"
echo "Unload:  launchctl unload $PLIST_DEST"
