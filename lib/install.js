'use strict';

const path = require('path');
const config = require('./config');
const scheduler = require('./scheduler');
const PROVIDERS = require('./providers');
const { checkAll, printAvailability } = require('./check');
const wizard = require('./wizard');

function parseArgs(args) {
  const opts = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--providers' && args[i + 1]) {
      opts.providers = args[++i].split(',').map(p => p.trim()).filter(Boolean);
    } else if (args[i] === '--interval' && args[i + 1]) {
      opts.interval = parseInt(args[++i], 10);
    } else if (args[i] === '--yes' || args[i] === '-y') {
      opts.yes = true;
    }
  }
  return opts;
}

async function run(args) {
  const cli = parseArgs(args);
  const availability = checkAll();

  console.log('=== claude-auto-session installer ===\n');
  printAvailability(availability);

  // Decide whether to run the wizard
  const interactive = !cli.yes
    && cli.providers === undefined
    && cli.interval === undefined
    && process.stdin.isTTY;

  let providers, interval;
  if (interactive) {
    ({ providers, interval } = await wizard.run(availability));
  } else {
    providers = cli.providers || ['claude'];
    interval = cli.interval || 10800; // 3h default
  }

  // Validate providers
  const unknown = providers.filter(p => !PROVIDERS[p]);
  if (unknown.length) {
    console.error(`\nError: unknown providers: ${unknown.join(', ')}`);
    console.error(`Available: ${Object.keys(PROVIDERS).join(', ')}`);
    process.exit(1);
  }

  // Warn on missing binaries (don't abort — user may install them later)
  const missing = providers.filter(p => !availability[p]);
  if (missing.length) {
    console.log('');
    console.warn(`WARNING: the following provider binaries are not in PATH: ${missing.join(', ')}`);
    console.warn('Pings for these providers will fail until the binary is installed.');
    console.warn(`Install:  claude → https://docs.claude.com/en/docs/claude-code/quickstart`);
    console.warn(`          codex  → https://github.com/openai/codex`);
  }

  // Build resolved paths (only for those that exist)
  const providerPaths = {};
  for (const name of providers) {
    if (availability[name]) providerPaths[name] = availability[name];
  }

  config.write({ providers, interval, providerPaths });

  const nodeBin = process.execPath;
  const cliBin = path.resolve(__dirname, '../bin/cli.js');

  scheduler.install(nodeBin, cliBin, interval);

  const hours = (interval / 3600).toFixed(interval % 3600 === 0 ? 0 : 2);
  console.log(`\n[OK] Installed. Pinging [${providers.join(', ')}] every ${hours}h.`);
  console.log(`     First ping fires ${hours}h from now.`);
  console.log(`     Run 'claude-auto-session status' to verify.`);
}

module.exports = { run };
