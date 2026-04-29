# claude-auto-session

Auto-start Claude and Codex sessions on a schedule so your token quota windows are always cycling. By the time you sit down to work, you're already partway through a fresh quota window — and a second window kicks in during your active hours instead of after them.

**The problem:** Claude's 5-hour token quota window starts the moment you send your first prompt. Start at 8 AM → window runs 8 AM–1 PM. Burn the quota by 10 AM and you're blocked until 1 PM.

**The fix:** Fire a tiny one-shot prompt every few hours (default 3 h) so a fresh window is always partway through by the time you need it. The pings cost almost nothing in tokens and run even while your Mac is asleep.

---

## Install

### Option A — npm (recommended)

```bash
npm install -g claude-auto-session
claude-auto-session install
```

The wizard checks which providers (`claude`, `codex`) are on your `PATH`, asks which to enable, and asks for the ping interval (default 3 h).

Non-interactive:
```bash
claude-auto-session install --yes                                  # claude only, 3 h
claude-auto-session install --providers claude,codex --interval 10800
```

### Option B — curl | bash (no Node.js required)

```bash
curl -fsSL https://raw.githubusercontent.com/rafsuntaskin/claude-auto-session/main/install.sh | bash
```

Or clone and run locally:
```bash
git clone https://github.com/rafsuntaskin/claude-auto-session.git
cd claude-auto-session
./install.sh
```

Non-interactive:
```bash
./install.sh --providers claude,codex --interval 10800 --yes
```

---

## Requirements

- **macOS** (uses `launchd`). Linux support is stubbed; PRs welcome.
- At least one of:
  - [Claude Code CLI](https://docs.claude.com/en/docs/claude-code/quickstart) — `claude` on `PATH`
  - [OpenAI Codex CLI](https://github.com/openai/codex) — `codex` on `PATH`

The installer will warn (but not fail) if a chosen provider isn't installed — install it later and pings will start working automatically.

---

## Configure

Change the interval after install with no reinstall step:

```bash
claude-auto-session set interval 2h         # 2 hours
claude-auto-session set interval 30m        # 30 minutes
claude-auto-session set interval 7200       # raw seconds
claude-auto-session set providers claude,codex
```

Each `set` call updates the config and reloads the launchd agent atomically.

If you installed via `install.sh`, re-run `./install.sh --interval <new>` to change settings.

---

## Verify

```bash
claude-auto-session status                  # shows providers, interval, agent state
claude-auto-session ping                    # fire a test ping immediately
launchctl list | grep com.claude-auto-session
tail -f ~/.config/claude-auto-session/session.log
```

---

## Uninstall

```bash
claude-auto-session uninstall               # if installed via npm
./uninstall.sh                              # if installed via shell
```

Removes the launchd agent. Logs and config in `~/.config/claude-auto-session/` are left alone — delete them manually if you want.

---

## How it works

A `launchd` agent at `~/Library/LaunchAgents/com.claude-auto-session.plist` fires every `interval` seconds (default 10 800 s = 3 h), even while your Mac is asleep. Each fire spawns:

- `claude -p "."` for Claude
- `codex exec "." --ephemeral --full-auto` for Codex

Both are minimal one-shot calls that start a session and immediately exit, consuming negligible tokens but resetting the quota clock.

Logs:
- stdout → `~/.config/claude-auto-session/session.log`
- stderr → `~/.config/claude-auto-session/session.err`

---

## Adding a provider

Edit `lib/providers.js`:

```js
const PROVIDERS = {
  claude: { cmd: 'claude', args: ['-p', '.'] },
  codex:  { cmd: 'codex',  args: ['exec', '.', '--ephemeral', '--full-auto'] },
  // your-provider: { cmd: 'foo', args: ['ping'] },
};
```

That's the entire registry — `install`, `set`, `ping`, and `status` all read from it.

---

## License

MIT
