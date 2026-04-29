'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const LABEL = 'com.claude-auto-session';
const PLIST_PATH = path.join(os.homedir(), 'Library', 'LaunchAgents', `${LABEL}.plist`);

function plist(nodeBin, cliBin, intervalSeconds) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${LABEL}</string>
  <key>ProgramArguments</key>
  <array>
    <string>${nodeBin}</string>
    <string>${cliBin}</string>
    <string>ping</string>
  </array>
  <key>StartInterval</key>
  <integer>${intervalSeconds}</integer>
  <key>RunAtLoad</key>
  <false/>
  <key>StandardOutPath</key>
  <string>${os.homedir()}/.config/claude-auto-session/session.log</string>
  <key>StandardErrorPath</key>
  <string>${os.homedir()}/.config/claude-auto-session/session.err</string>
</dict>
</plist>`;
}

function install(nodeBin, cliBin, intervalSeconds) {
  fs.mkdirSync(path.dirname(PLIST_PATH), { recursive: true });
  fs.writeFileSync(PLIST_PATH, plist(nodeBin, cliBin, intervalSeconds));

  // Unload first in case it was previously installed
  try { execSync(`launchctl unload "${PLIST_PATH}" 2>/dev/null`); } catch (_) {}
  execSync(`launchctl load "${PLIST_PATH}"`);
}

function uninstall() {
  if (!fs.existsSync(PLIST_PATH)) {
    console.log('No launchd agent found — nothing to remove.');
    return;
  }
  try { execSync(`launchctl unload "${PLIST_PATH}"`); } catch (_) {}
  fs.unlinkSync(PLIST_PATH);
}

function status() {
  try {
    const out = execSync(`launchctl list ${LABEL} 2>&1`).toString();
    return { installed: true, detail: out.trim() };
  } catch (_) {
    return { installed: false };
  }
}

module.exports = { install, uninstall, status, PLIST_PATH };
