# tidemark

[![ci](https://github.com/VizzleTF/claude-skills/actions/workflows/ci.yml/badge.svg)](https://github.com/VizzleTF/claude-skills/actions/workflows/ci.yml)

A Claude Code mod that draws a band of configurable widgets above the prompt: context fill, prompt cache, 5-hour and weekly quota, model, git. It leaves your `statusLine` and settings alone.

Requires Claude Code 2.1.288 or later. The band shows in the terminal and in the desktop app's Code tab.

![The tidemark band: context 4% of 1M, 5-hour quota 28%, weekly quota 86%, git branch and model](docs/images/tidemark-band.png)

## Contents

- [Install](#install)
- [Commands](#commands)
- [Widgets](#widgets)
- [Configure](#configure)
- [Uninstall](#uninstall)
- [What it runs, reads and writes](#what-it-runs-reads-and-writes)
- [Links](#links)

## Install

Run in Claude Code:

```
/plugin marketplace add VizzleTF/claude-skills
/plugin install tidemark@vizzletf-skills
```

The band appears above the prompt right after the install. If it does not, run `/reload-plugins`.

## Commands

| Command | Opens |
|---|---|
| `/tidemark` | Details pane: context by source, cache and quota with a forecast to reset, the session and its subagents |
| `/tidemark-config` | Config editor with a live preview |
| `/tidemark-goal [text]` | Sets the session goal the `goal` widget shows |
| `/tidemark-project [text]` | Sets the project name the `project` widget shows |

<img src="docs/images/tidemark-pane.png" width="420" alt="The /tidemark pane: context split by source, 5-hour and weekly quota with a forecast to reset">

## Widgets

The **Default** column marks the widgets of the band you get without a config file.

| Widget | Shows | Default |
|---|---|---|
| `context` | `ctx` bar, percent, `used/window`, growth sparkline | ✓ |
| `cache` | `warm 38m`, `cold`, `rewrote 45k` | ✓ |
| `quota5h` | `5h 42% ↻ 2h34m` | ✓ |
| `quota7d` | `7d 63% ↻ 2d7h` | ✓ |
| `model` | `opus 5.5 · high`; a press switches the model or the effort | ✓ |
| `git` | branch, `*` for uncommitted changes, sync with the upstream, `+12 −3` | ✓ |
| `goal` | text from `/tidemark-goal`; hidden until set | ✓ |
| `project` | text from `/tidemark-project`; hidden until set | ✓ |
| `compact` | a `/compact` button | ✓ |
| `actions` | a `⚙` button that opens `/tidemark-config` | ✓ |
| `flex` | nothing; pushes the widgets after it to the right edge | ✓ |
| `cost` | `≈$1.84 (+$0.12)`: the session and the current turn | |
| `agents` | a spinner per running subagent | |
| `cwd` | project name, directory name or path | |
| `sessionTime` | `⏱ 1h12m` since the conversation started | |
| `compactions` | `⇣2` | |
| `tokenSpeed` | `42 t/s` for the last turn | |
| `command` | the first line of your command's output | |
| `claudeStatus` | `● ok` … `● critical` from status.claude.com | |
| `gitPr` | `#123 ✓` for the branch's PR or MR; needs `gh` or `glab` | |

Figures are coloured from blue to red by the used share. Options of each widget: [Reference](docs/reference.md#widgets).

## Configure

No config file is needed. To change the widgets, run `/tidemark-config`, edit the band in the preview, pick a file in the `save to` field and press `Save`:

| `save to` | File |
|---|---|
| `global` | `~/.config/tidemark/config.json` |
| `project` | `.claude/tidemark.json` in the session's directory; overrides `global` |

The editor also offers presets: `minimal`, `classic`, `default`, `full` (two rows) and `powerline`. Once the context reaches 70% of the window, the `/compact` button appears under the band; `compact.at` sets the threshold.

## Uninstall

```
/plugin uninstall tidemark@vizzletf-skills
```

The config files and project notes stay. To remove them, delete `~/.config/tidemark/`, `.claude/tidemark.json` and `.claude/tidemark-project.txt`.

## What it runs, reads and writes

tidemark has no telemetry and sends nothing to its author. It never changes Claude Code settings or the permission mode.

### Hooks

| Hook | What it does |
|---|---|
| Session events: start, each turn and model request, usage measurements, compaction, subagent starts, model switches, prompt submission | Reads what happened to keep the band current and passes the event on unchanged |
| `/config` changes of `theme` and `autoCompact` | Same |
| Built-in commands `/clear`, `/resume`, `/branch`, `/model`, `/autocompact`, `/theme`, `/effort` | Same |
| `command.describe` on `/effort` | Reads the command's argument hint |
| `command.run` on `/tidemark`, `/tidemark-config`, `/tidemark-goal`, `/tidemark-project` | Answers the four commands the mod adds |
| `ui.render` | Draws the band and the four panes |

Only when you press a widget on the band, tidemark runs the built-in command the widget names: `/context`, `/usage`, `/model`, `/effort` or `/compact`.

### Programs

Each runs in the session's directory.

| Program | Why | When |
|---|---|---|
| `git status`, `git diff --numstat HEAD` | branch, changes and diff size for the `git` widget | after each turn, at most every 5 seconds |
| `git fetch --quiet --no-tags` | ahead and behind counts; contacts your remote | every 5 minutes; `git.fetch: 0` turns it off |
| `git rev-parse --show-toplevel` | the project name for `cwd` with `style: "project"` | at most once a minute |
| `git remote get-url origin`, then `gh pr view` or `glab mr view` | the pull request of the branch for `gitPr`; contacts GitHub or GitLab with those tools' own login | once its `ttl` has passed |
| `sh -c <command>` | the `command` widget runs the command you configure, nothing else | once its `ttl` has passed |

### Network

Besides the programs above, tidemark makes one request itself: an HTTPS GET of `https://status.claude.com/api/v2/summary.json` for the `claudeStatus` widget, off by default.

### Files and settings

| What | Holds | Read | Written |
|---|---|---|---|
| `~/.config/tidemark/config.json`, under `$XDG_CONFIG_HOME` when set | global config | ✓ | on `Save` in `/tidemark-config` |
| `.claude/tidemark.json` | project config | ✓ | on `Save` in `/tidemark-config` |
| `.claude/tidemark-project.txt` | project name | ✓ | by `/tidemark-project` |
| Plugin store | last quota, effort levels each model accepted, goals of recent sessions | ✓ | as the session goes |
| `HOME`, `XDG_CONFIG_HOME` | where the global config lives | ✓ | |
| `CLAUDE_CODE_PROMPT_CACHE_TTL`, `ENABLE_PROMPT_CACHING_1H`, `FORCE_PROMPT_CACHING_5M`, setting `promptCacheTtl` | the prompt cache's lifetime | ✓ | |

The files in `.claude` are tidemark's own, not Claude Code settings or instructions. [Privacy](PRIVACY.md) and [External runs](docs/reference.md#external-runs) give the details.

## Links

- [Privacy](PRIVACY.md): what it reads, writes and sends
- [Reference](docs/reference.md): widget options, config keys, presets, alerts, the compact button, troubleshooting
- [Decisions](docs/adr/), [Changelog](CHANGELOG.md), [README на русском](README.ru.md)
- Inspired by [ccOverhead](https://github.com/shengyy/ccoverhead) and [ccstatusline](https://github.com/sirmalloc/ccstatusline); [NOTICE.md](NOTICE.md) lists what was borrowed
