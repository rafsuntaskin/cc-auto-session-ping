#!/usr/bin/env bash
# claude-auto-session standalone uninstaller.
set -euo pipefail

LABEL="com.claude-auto-session"
PLIST_PATH="$HOME/Library/LaunchAgents/$LABEL.plist"

if [[ ! -f "$PLIST_PATH" ]]; then
  echo "Nothing to remove — $PLIST_PATH does not exist."
  exit 0
fi

launchctl unload "$PLIST_PATH" 2>/dev/null || true
rm -f "$PLIST_PATH"
echo "[OK] Removed launchd agent: $LABEL"
echo "     Logs left at ~/.config/claude-auto-session/ — delete manually if you want."
