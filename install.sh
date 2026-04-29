#!/usr/bin/env bash
# claude-auto-session standalone installer (no Node.js required).
# Installs a launchd agent that pings claude/codex on a fixed interval.
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/<you>/claude-auto-session/main/install.sh | bash
#   ./install.sh                                  # interactive
#   ./install.sh --providers claude,codex --interval 10800 --yes
set -euo pipefail

LABEL="com.claude-auto-session"
PLIST_PATH="$HOME/Library/LaunchAgents/$LABEL.plist"
LOG_DIR="$HOME/.config/claude-auto-session"
LOG_FILE="$LOG_DIR/session.log"
ERR_FILE="$LOG_DIR/session.err"

DEFAULT_INTERVAL=10800   # 3 hours
PROVIDERS=""
INTERVAL=""
YES=0

# --- platform check ---
if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "ERROR: this installer is macOS-only (uses launchd). For Linux, see README." >&2
  exit 1
fi

# --- parse args ---
while [[ $# -gt 0 ]]; do
  case "$1" in
    --providers) PROVIDERS="$2"; shift 2 ;;
    --interval)  INTERVAL="$2";  shift 2 ;;
    --yes|-y)    YES=1;          shift ;;
    -h|--help)
      sed -n '2,7p' "$0"; exit 0 ;;
    *) echo "Unknown flag: $1" >&2; exit 1 ;;
  esac
done

# --- check provider availability ---
echo "=== claude-auto-session installer ==="
echo
echo "Provider availability:"
CLAUDE_PATH="$(command -v claude 2>/dev/null || true)"
CODEX_PATH="$(command -v codex   2>/dev/null || true)"
[[ -n "$CLAUDE_PATH" ]] && echo "  [OK]   claude   $CLAUDE_PATH" || echo "  [MISS] claude   not found in PATH"
[[ -n "$CODEX_PATH"  ]] && echo "  [OK]   codex    $CODEX_PATH"  || echo "  [MISS] codex    not found in PATH"
echo

# --- wizard (only if neither flag passed and stdin is a TTY) ---
if [[ -z "$PROVIDERS" && -z "$INTERVAL" && $YES -eq 0 && -t 0 ]]; then
  default_providers=""
  [[ -n "$CLAUDE_PATH" ]] && default_providers="claude"
  [[ -n "$CODEX_PATH"  ]] && default_providers="${default_providers:+$default_providers,}codex"
  [[ -z "$default_providers" ]] && default_providers="claude"

  read -r -p "Which providers should ping? (comma-separated from: claude, codex) [$default_providers]: " ans
  PROVIDERS="${ans:-$default_providers}"

  read -r -p "Ping interval in hours? [3]: " ans
  hours="${ans:-3}"
  INTERVAL=$(awk -v h="$hours" 'BEGIN{printf "%d", h*3600}')
fi

PROVIDERS="${PROVIDERS:-claude}"
INTERVAL="${INTERVAL:-$DEFAULT_INTERVAL}"

# --- warn on missing binaries ---
IFS=',' read -ra PROV_LIST <<< "$PROVIDERS"
MISSING=()
for p in "${PROV_LIST[@]}"; do
  case "$p" in
    claude) [[ -z "$CLAUDE_PATH" ]] && MISSING+=("claude") ;;
    codex)  [[ -z "$CODEX_PATH"  ]] && MISSING+=("codex")  ;;
    *) echo "ERROR: unknown provider: $p" >&2; exit 1 ;;
  esac
done

if (( ${#MISSING[@]} > 0 )); then
  echo
  echo "WARNING: missing binaries: ${MISSING[*]}"
  echo "  Pings for these providers will fail until installed."
  echo "  claude → https://docs.claude.com/en/docs/claude-code/quickstart"
  echo "  codex  → https://github.com/openai/codex"
fi

# --- build the per-provider command lines ---
mkdir -p "$LOG_DIR" "$(dirname "$PLIST_PATH")"

CMDS=()
for p in "${PROV_LIST[@]}"; do
  case "$p" in
    claude) [[ -n "$CLAUDE_PATH" ]] && CMDS+=("$CLAUDE_PATH -p .") ;;
    codex)  [[ -n "$CODEX_PATH"  ]] && CMDS+=("$CODEX_PATH exec . --ephemeral --full-auto") ;;
  esac
done

if (( ${#CMDS[@]} == 0 )); then
  echo "ERROR: no provider binaries available — nothing to schedule." >&2
  exit 1
fi

# launchd needs a single command; chain them with `;` via sh -c
JOINED=$(IFS=';'; echo "${CMDS[*]}")

# --- write plist ---
cat > "$PLIST_PATH" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>$LABEL</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/sh</string>
    <string>-c</string>
    <string>$JOINED</string>
  </array>
  <key>StartInterval</key>
  <integer>$INTERVAL</integer>
  <key>RunAtLoad</key>
  <false/>
  <key>StandardOutPath</key>
  <string>$LOG_FILE</string>
  <key>StandardErrorPath</key>
  <string>$ERR_FILE</string>
</dict>
</plist>
PLIST

# --- (re)load launchd agent ---
launchctl unload "$PLIST_PATH" 2>/dev/null || true
launchctl load   "$PLIST_PATH"

HOURS=$(awk -v s="$INTERVAL" 'BEGIN{printf "%g", s/3600}')
echo
echo "[OK] Installed. Pinging [$PROVIDERS] every ${HOURS}h."
echo "     Plist  : $PLIST_PATH"
echo "     Logs   : $LOG_FILE"
echo "     Verify : launchctl list | grep $LABEL"
echo "     Remove : ./uninstall.sh"
