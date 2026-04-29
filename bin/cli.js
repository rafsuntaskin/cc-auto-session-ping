#!/usr/bin/env node
'use strict';

const [,, command, ...args] = process.argv;

const USAGE = `
Usage: claude-auto-session <command> [options]

Commands:
  install     Install the scheduler agent (interactive wizard if no flags given)
  uninstall   Remove the scheduler agent
  set         Update a setting and reload the agent (interval | providers)
  status      Show current configuration and agent status
  ping        Manually fire a session ping (useful for testing)

Options (install):
  --providers <list>   Comma-separated providers: claude, codex  (default: claude)
  --interval  <secs>   Ping interval in seconds                  (default: 10800 = 3h)
  --yes, -y            Skip the wizard, use defaults / passed flags

Examples:
  claude-auto-session install                              # interactive wizard
  claude-auto-session install --yes                        # claude, 3h, no prompts
  claude-auto-session install --providers claude,codex --interval 10800
  claude-auto-session set interval 2h                      # change interval, auto-reload
  claude-auto-session set interval 30m
  claude-auto-session set providers claude,codex
  claude-auto-session ping                                 # manual test
  claude-auto-session status
  claude-auto-session uninstall
`.trim();

async function main() {
  switch (command) {
    case 'install':   await require('../lib/install').run(args);   break;
    case 'uninstall': require('../lib/uninstall').run(args);       break;
    case 'set':       require('../lib/set').run(args);             break;
    case 'status':    require('../lib/status').run();              break;
    case 'ping':      require('../lib/ping').run();                break;
    default:
      console.log(USAGE);
      if (command) process.exit(1);
  }
}

main().catch((err) => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});
