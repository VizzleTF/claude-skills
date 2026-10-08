# tidemark

[![ci](https://github.com/VizzleTF/claude-skills/actions/workflows/ci.yml/badge.svg)](https://github.com/VizzleTF/claude-skills/actions/workflows/ci.yml)

A Claude Code mod that draws a band of configurable widgets above the prompt: context fill, prompt cache, 5-hour and weekly quota, model, git. It leaves your `statusLine` and settings alone.

Requires Claude Code 2.1.288 or later. The band shows in the terminal and in the desktop app's Code tab.

## Install

Run in Claude Code:

```
/plugin marketplace add VizzleTF/claude-skills
/plugin install tidemark@vizzletf-skills
```

The band appears above the prompt right after the install; if it does not, run `/reload-plugins`:

```
ctx ■■■□□□□□□□ 27% 271k/1M ▁▁▃█▁▇▁ ↑3.4k │ cache warm 38m │ 5h 42% ↻ 2h34m │ 7d 63% ↻ 2d7h │ opus 5.5 · high │ main* +12 −3   /compact ⚙
```

No config file is needed: until one exists, the band above applies. To change the widgets, run `/tidemark-config`. The editor shows a preview; in the `save to` field pick `global` (`~/.config/tidemark/config.json`) or `project` (`.claude/tidemark.json` in the session's directory) and press `Save`. `/tidemark` opens a details pane for context, cache, quota and subagents. Once the context reaches 70% of the window, a `/compact` button appears under the band; `compact.at` sets the threshold.

## Uninstall

```
/plugin uninstall tidemark@vizzletf-skills
```

The config files and project notes stay; delete `~/.config/tidemark/`, `.claude/tidemark.json` and `.claude/tidemark-project.txt` by hand if you want them gone.

## What it runs, reads and writes

tidemark has no telemetry and sends nothing to its author. It never changes Claude Code settings or the permission mode.

Hooks. tidemark watches session events to keep the band current: the session start, each turn and model request, usage measurements, compaction, subagent starts, model switches and prompt submission. It also watches `/config` changes of `theme` and `autoCompact` and the built-in commands `/clear`, `/resume`, `/branch`, `/model`, `/autocompact`, `/theme` and `/effort`. Each of these hooks passes the event on unchanged; it only reads what happened. A `command.describe` hook on `/effort` reads the command's argument hint. The `ui.render` hooks draw the band above the prompt and the panes `/tidemark`, `/tidemark-config`, `/tidemark-goal` and `/tidemark-project`, which are the four commands the mod adds.

Claude Code commands. Only when you press a widget on the band, tidemark runs the built-in command the widget names: `/context`, `/usage`, `/model`, `/effort` or `/compact`.

Programs, each in the session's directory:

| Program | Why | When |
|---|---|---|
| `git status`, `git diff --numstat HEAD` | branch, changes and diff size for the `git` widget | after each turn, at most every 5 seconds |
| `git fetch --quiet --no-tags` | ahead and behind counts; contacts your remote | every 5 minutes; `git.fetch: 0` turns it off |
| `git rev-parse --show-toplevel` | the project name for `cwd` with `style: "project"` | at most once a minute |
| `git remote get-url origin`, then `gh pr view` or `glab mr view` | the pull request of the branch for `gitPr`; contacts GitHub or GitLab with those tools' own login | once its `ttl` has passed |
| `sh -c <command>` | the `command` widget runs the command you configure, nothing else | once its `ttl` has passed |

Network. Besides the programs above, tidemark makes one request itself: an HTTPS GET of `https://status.claude.com/api/v2/summary.json` for the `claudeStatus` widget, off by default.

Files it reads: its config files `~/.config/tidemark/config.json` (under `$XDG_CONFIG_HOME` when set) and `.claude/tidemark.json`, and `.claude/tidemark-project.txt`. It also reads the environment variables `HOME`, `XDG_CONFIG_HOME`, `CLAUDE_CODE_PROMPT_CACHE_TTL`, `ENABLE_PROMPT_CACHING_1H` and `FORCE_PROMPT_CACHING_5M`, and the `promptCacheTtl` setting, to know the prompt cache's lifetime.

Files it writes: a config file, only when you press `Save` in `/tidemark-config`, and `.claude/tidemark-project.txt`, only when you run `/tidemark-project`. Both are tidemark's own files in the project's `.claude` directory, not Claude Code settings or instructions. The plugin store keeps the last quota, the effort levels each model accepted and the goals of recent sessions.

[Privacy](PRIVACY.md) and [External runs](docs/reference.md#external-runs) give the details.

## Links

- [Privacy](PRIVACY.md): what it reads, writes and sends
- [Reference](docs/reference.md): widgets and their options, config, presets, alerts, the compact button, what the mod runs, troubleshooting
- [Decisions](docs/adr/), [Changelog](CHANGELOG.md), [README на русском](README.ru.md)
- Inspired by [ccOverhead](https://github.com/shengyy/ccoverhead) and [ccstatusline](https://github.com/sirmalloc/ccstatusline); [NOTICE.md](NOTICE.md) lists what was borrowed
