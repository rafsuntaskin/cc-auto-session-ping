# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A CLI tool that fires a minimal one-shot prompt to Claude and/or Codex on a fixed interval (default 3 hours) so that session token quota windows are always cycling — giving users more usable quota during their active hours.

## Two installation paths

1. **npm** (`npm install -g claude-auto-session`) — full CLI with wizard, status, manual ping
2. **curl | bash** (`./install.sh`) — pure shell, no Node.js required, plist-only

Both produce the same launchd agent; the shell path skips the Node.js wrapper and has launchd call the provider binaries directly.

## How it works

A launchd agent calls the configured ping command on the interval (default 10800 s = 3 h). This is independent of whether Claude Code is open.

- Claude ping: `claude -p "."`
- Codex ping: `codex exec "." --ephemeral --full-auto`

Binary paths are resolved at install time so launchd doesn't depend on PATH.

## File layout

```
bin/cli.js              Entry point — install / uninstall / status / ping
lib/
  config.js             Read/write ~/.config/claude-auto-session/config.json (default interval: 10800)
  check.js              `which` lookups + availability table printer
  wizard.js             Interactive prompts (readline, no deps)
  install.js            Wizard + binary checks + scheduler.install()
  uninstall.js          scheduler.uninstall()
  status.js             Print config + launchctl status
  ping.js               Spawn each enabled provider's one-shot command
  providers.js          Command definitions for claude and codex
  scheduler/
    index.js            Platform detection
    macos.js            launchd plist generation + launchctl load/unload
    linux.js            Systemd stub (not yet implemented)
install.sh              Standalone macOS installer (no Node.js)
uninstall.sh            Standalone macOS uninstaller
```

## CLI usage (npm path)

```bash
claude-auto-session install                              # interactive wizard
claude-auto-session install --yes                        # claude only, 3 h, no prompts
claude-auto-session install --providers claude,codex --interval 10800
claude-auto-session ping                                 # manual test fire
claude-auto-session status
claude-auto-session uninstall
```

## Wizard behavior

`install` runs the wizard when:
- no `--providers` and no `--interval` flag was passed, AND
- `--yes` / `-y` was NOT passed, AND
- stdin is a TTY

Otherwise it goes non-interactive and uses CLI flags or defaults. Missing binaries trigger a warning but never abort — the user may install them later.

## Config file

`~/.config/claude-auto-session/config.json`:
```json
{
  "providers": ["claude", "codex"],
  "interval": 18000,
  "providerPaths": {
    "claude": "/usr/local/bin/claude",
    "codex": "/usr/local/bin/codex"
  }
}
```

## Adding a new provider

1. Add an entry to `lib/providers.js` with `cmd` and `args`
2. That's it — `install`, `ping`, and `status` all read from that registry

## Logs

`~/.config/claude-auto-session/session.log` — stdout from each ping run
`~/.config/claude-auto-session/session.err` — stderr
