'use strict';

// Minimal one-shot commands that start a session and immediately exit.
// Codex: --ephemeral avoids persisting session files, --full-auto skips approval prompts.
const PROVIDERS = {
  claude: {
    cmd: 'claude',
    args: ['-p', '.'],
  },
  codex: {
    cmd: 'codex',
    args: ['exec', '.', '--ephemeral', '--full-auto'],
  },
};

module.exports = PROVIDERS;
