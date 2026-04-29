'use strict';

const scheduler = require('./scheduler');
const config = require('./config');

function run() {
  const cfg = config.read();
  const sched = scheduler.status();

  console.log('=== claude-auto-session ===');
  console.log(`Providers : ${cfg.providers.join(', ')}`);
  console.log(`Interval  : ${cfg.interval / 3600}h (${cfg.interval}s)`);
  console.log(`Agent     : ${sched.installed ? 'running' : 'not installed'}`);

  if (sched.detail) console.log(`\n${sched.detail}`);

  if (cfg.providerPaths && Object.keys(cfg.providerPaths).length) {
    console.log('\nResolved paths:');
    for (const [name, p] of Object.entries(cfg.providerPaths)) {
      console.log(`  ${name}: ${p}`);
    }
  }
}

module.exports = { run };
