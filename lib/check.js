'use strict';

const { execSync } = require('child_process');
const PROVIDERS = require('./providers');

function which(cmd) {
  try {
    return execSync(`which ${cmd}`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim() || null;
  } catch (_) {
    return null;
  }
}

// Returns { claude: '/path/to/claude' | null, codex: '/path/to/codex' | null }
function checkAll() {
  const result = {};
  for (const name of Object.keys(PROVIDERS)) {
    result[name] = which(PROVIDERS[name].cmd);
  }
  return result;
}

function printAvailability(availability) {
  console.log('Provider availability:');
  for (const [name, p] of Object.entries(availability)) {
    if (p) {
      console.log(`  [OK]    ${name.padEnd(8)} ${p}`);
    } else {
      console.log(`  [MISS]  ${name.padEnd(8)} not found in PATH`);
    }
  }
}

module.exports = { which, checkAll, printAvailability };
