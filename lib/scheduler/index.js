'use strict';

const platform = process.platform;

if (platform === 'darwin') module.exports = require('./macos');
else if (platform === 'linux') module.exports = require('./linux');
else throw new Error(`Unsupported platform: ${platform}`);
