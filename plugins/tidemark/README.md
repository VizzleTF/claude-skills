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
ctx ■■■□□□□□□□ 27% 271k/1M ▁▁▃█▁▇▁ ↑3.4k │ cache warm 38m │ 5h 42% ↻ 2h34m │ 7d 63% ↻ 2d7h │ opus 5.5 · high │ main* +12 −3
```

No config file is needed: until one exists, the band above applies. To change the widgets, run `/tidemark-config`. The editor shows a preview; in the `save to` field pick `global` (`~/.config/tidemark/config.json`) or `project` (`.claude/tidemark.json` in the session's directory) and press `Save`. `/tidemark` opens a details pane for context, cache, quota and subagents. Once the context reaches 70% of the window, a `/compact` button appears under the band; `compact.at` sets the threshold.

## Uninstall

```
/plugin uninstall tidemark@vizzletf-skills
```

The config files stay; delete `~/.config/tidemark/` and `.claude/tidemark.json` by hand if you want them gone.

## Links

- [Reference](docs/reference.md): widgets and their options, config, presets, alerts, the compact button, what the mod runs, troubleshooting
- [Decisions](docs/adr/), [Changelog](CHANGELOG.md), [README на русском](README.ru.md)
- Inspired by [ccOverhead](https://github.com/shengyy/ccoverhead) and [ccstatusline](https://github.com/sirmalloc/ccstatusline); [NOTICE.md](NOTICE.md) lists what was borrowed
