'use strict';

const { spawnSync } = require('child_process');
const config = require('./config');
const PROVIDERS = require('./providers');

function run() {
  const cfg = config.read();
  const timestamp = new Date().toISOString();

  for (const name of cfg.providers) {
    const provider = PROVIDERS[name];
    if (!provider) {
      console.error(`[${timestamp}] Unknown provider: ${name}`);
      continue;
    }

    // Prefer resolved path from install time, fall back to PATH lookup
    const cmd = cfg.providerPaths[name] || provider.cmd;

    console.log(`[${timestamp}] Pinging ${name} (${cmd} ${provider.args.join(' ')})`);

    const result = spawnSync(cmd, provider.args, {
      stdio: 'pipe',
      timeout: 30_000,
    });

    if (result.error) {
      console.error(`[${timestamp}] ${name} failed: ${result.error.message}`);
    } else if (result.status !== 0) {
      console.error(`[${timestamp}] ${name} exited ${result.status}: ${result.stderr?.toString().trim()}`);
    } else {
      console.log(`[${timestamp}] ${name} OK`);
    }
  }
}

module.exports = { run };
