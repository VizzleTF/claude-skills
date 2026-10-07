# Changelog

All notable changes to the `tidemark` plugin. The format follows [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/), versions follow [Semantic Versioning](https://semver.org/).

## [0.1.0] - 2026-10-07

### Added

- A band of widgets above the prompt, in 1 to 3 lines, for the terminal and the desktop Code tab.
- 15 widgets: `context`, `cache`, `quota5h`, `quota7d`, `cost`, `agents`, `model`, `git`, `cwd`, `sessionTime`, `compactions`, `tokenSpeed`, `command`, `claudeStatus`, `gitPr`, each with its own options, label and priority.
- `flex` in a row: one sends the widgets after it to the right edge, two put the widgets between them in the middle.
- The `cache` widget counts down from the lifetime Claude Code asks for and learns it from pauses between requests; the `ttl` option pins `5m` or `1h`.
- The `git` widget shows the sync with the upstream after a periodic `git fetch`: `⇣3` red when the remote is ahead, `⇡2` when the local branch is, `gone` when the upstream was deleted.
- A JSON config: a global file with a project file over it, picked up without a restart.
- Presets `minimal`, `classic`, `default`, `full`, `powerline`; separators `pipe`, `space`, `dot`, `powerline`, `custom`; text or Nerd Font icons.
- `/tidemark`, a details pane with context, cache and quota with a forecast, session and subagents.
- `/tidemark-config`, an editor with a live preview that saves to the global or the project file.
- A `/compact` button under the band once the context fills `compact.at` percent of the window (70 by default).
- Threshold toasts for context, quota and the prompt cache, off by default.

[0.1.0]: https://github.com/VizzleTF/claude-skills/releases/tag/tidemark--v0.1.0
