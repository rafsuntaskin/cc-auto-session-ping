'use strict';

const scheduler = require('./scheduler');

function run() {
  scheduler.uninstall();
  console.log('Uninstalled.');
}

module.exports = { run };
