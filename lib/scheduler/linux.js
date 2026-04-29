'use strict';

// Systemd user service — stub for Linux support.
// Run: systemctl --user enable/start/stop claude-auto-session

function install() {
  throw new Error('Linux (systemd) support is not yet implemented.');
}

function uninstall() {
  throw new Error('Linux (systemd) support is not yet implemented.');
}

function status() {
  return { installed: false, detail: 'Linux support not yet implemented.' };
}

module.exports = { install, uninstall, status };
