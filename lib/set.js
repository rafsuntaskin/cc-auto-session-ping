'use strict';

const path = require('path');
const config = require('./config');
const scheduler = require('./scheduler');
const PROVIDERS = require('./providers');
const { checkAll } = require('./check');

// Accepts "2h", "30m", "45s", "7200" (defaults to seconds).
function parseInterval(input) {
  const m = String(input).trim().match(/^(\d+(?:\.\d+)?)\s*([hms])?$/);
  if (!m) throw new Error(`Invalid interval: "${input}". Use e.g. 3h, 30m, 7200`);
  const num = parseFloat(m[1]);
  const unit = m[2] || 's';
  if (unit === 'h') return Math.round(num * 3600);
  if (unit === 'm') return Math.round(num * 60);
  return Math.round(num);
}

function run(args) {
  const [key, ...rest] = args;
  const value = rest.join(' ').trim();

  if (!key || !value) {
    console.error('Usage: claude-auto-session set <key> <value>');
    console.error('Keys:  interval (e.g. 3h, 30m, 7200)');
    console.error('       providers (e.g. claude,codex)');
    process.exit(1);
  }

  const cfg = config.read();

  switch (key) {
    case 'interval':
      cfg.interval = parseInterval(value);
      break;

    case 'providers': {
      const providers = value.split(',').map(p => p.trim()).filter(Boolean);
      const unknown = providers.filter(p => !PROVIDERS[p]);
      if (unknown.length) {
        throw new Error(`Unknown providers: ${unknown.join(', ')}. Available: ${Object.keys(PROVIDERS).join(', ')}`);
      }
      cfg.providers = providers;

      // Re-resolve binary paths for the new set
      const availability = checkAll();
      const newPaths = {};
      for (const p of providers) {
        if (availability[p]) newPaths[p] = availability[p];
      }
      cfg.providerPaths = newPaths;

      const missing = providers.filter(p => !availability[p]);
      if (missing.length) {
        console.warn(`Warning: missing binaries: ${missing.join(', ')} — pings will fail until installed.`);
      }
      break;
    }

    default:
      throw new Error(`Unknown key: ${key}. Available: interval, providers`);
  }

  config.write(cfg);

  // Reload the launchd agent with the new interval
  const nodeBin = process.execPath;
  const cliBin = path.resolve(__dirname, '../bin/cli.js');
  scheduler.install(nodeBin, cliBin, cfg.interval);

  const display = key === 'interval' ? `${(cfg.interval / 3600).toFixed(2)}h (${cfg.interval}s)` : value;
  console.log(`[OK] ${key} = ${display}`);
  console.log(`     Agent reloaded — next ping fires ${(cfg.interval / 3600).toFixed(2)}h from now.`);
}

module.exports = { run, parseInterval };
