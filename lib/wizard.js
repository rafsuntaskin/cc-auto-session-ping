'use strict';

const readline = require('readline');
const PROVIDERS = require('./providers');

function prompt(question, defaultValue) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const suffix = defaultValue !== undefined && defaultValue !== '' ? ` [${defaultValue}]` : '';
    rl.question(`${question}${suffix}: `, (answer) => {
      rl.close();
      const trimmed = answer.trim();
      resolve(trimmed === '' ? String(defaultValue ?? '') : trimmed);
    });
  });
}

// availability: { claude: path|null, codex: path|null }
async function run(availability) {
  const available = Object.keys(availability).filter(n => availability[n]);
  const defaultProviders = available.length ? available.join(',') : 'claude';

  console.log('');
  const providersInput = await prompt(
    `Which providers should ping? (comma-separated from: ${Object.keys(PROVIDERS).join(', ')})`,
    defaultProviders,
  );
  const providers = providersInput.split(',').map(p => p.trim()).filter(Boolean);

  const hoursInput = await prompt('Ping interval in hours?', '3');
  const hours = parseFloat(hoursInput);
  if (!Number.isFinite(hours) || hours <= 0) {
    throw new Error(`Invalid interval: ${hoursInput}`);
  }
  const interval = Math.round(hours * 3600);

  return { providers, interval };
}

module.exports = { run, prompt };
