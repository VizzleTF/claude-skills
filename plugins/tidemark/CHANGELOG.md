# Changelog

All notable changes to the `tidemark` plugin. The format follows [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/), versions follow [Semantic Versioning](https://semver.org/).

## [0.1.13] - 2026-10-08

### Changed

- The README lists the commands, the widgets and what the mod runs, reads and writes in tables, with screenshots of the band and the `/tidemark` pane.

## [0.1.12] - 2026-10-08

### Changed

- The README says in full what the mod runs, reads and writes: what each hook does, which programs run and why, the one HTTPS request, the files and environment variables it reads and the files it writes.
- The status page address is written at the one `$.http.fetch` call, and the band's `context` and `usage` presses name their command directly.
- The `/tidemark-goal` and `/tidemark-project` panes are registered one per line, so `claude plugin validate` names each pane.

## [0.1.11] - 2026-10-08

### Fixed

- On the mobile app, which draws no input fields, `/tidemark-config`, `/tidemark-goal` and `/tidemark-project` without text show a note instead of a pane that failed to draw.

### Changed

- The mod type-checks clean under `tsc`, and CI runs the check. `claude plugin validate` reports the `command.run` hooks for `/tidemark`, `/tidemark-config`, `/tidemark-goal` and `/tidemark-project` as answering the mod's own commands.
- `PRIVACY.md` and the fields Anthropic's plugin directory reads (`icon`, `documentationUrl`, `supportUrl`, `privacyPolicyUrl`).
- The README lists what the mod runs and how to remove its files; the reference says which files it writes and what it keeps in the plugin store.

## [0.1.10] - 2026-10-08

### Fixed

- After `/reload-plugins` the config check no longer writes state while the band is drawn; the engine refused that write, so a hand edit waited for the next prompt.

## [0.1.9] - 2026-10-07

### Changed

- `/tidemark-goal` and `/tidemark-project` without text open a field with the current value: Enter sets it, an empty field clears it.
- The goal is kept per session id in the plugin store, so a restart and `--resume` keep it.
- `project` and `goal` are in the default line; each stays hidden until set.

## [0.1.8] - 2026-10-07

### Added

- `goal` and `project` widgets with the commands `/tidemark-goal <text>` and `/tidemark-project <text>`. The goal lasts the session, the project note is kept in `.claude/tidemark-project.txt`. Both are in the `full` preset and hidden until set.

### Changed

- The config's pure part (schema tables, presets, validation, merging) moved to `hooks/config-model.ts`; `hooks/config.ts` keeps the loading hooks. Snapshot updates are pure functions in `hooks/snapshot-reducers.ts`, each applied in one state write.

## [0.1.7] - 2026-10-07

### Changed

- The compact button is its own widget `compact`, drawn as `/compact`, so it can sit anywhere in the band. `actions` keeps only `⚙`, and its `compact` option is gone. The default line ends with `flex`, `compact`, `actions`.

### Fixed

- After `/reload-plugins` a hand edit of the config waited for the next prompt; the band's first draw now checks the files.
- `Save` in the editor wrote the config the session had loaded and dropped a hand edit made since. It now builds on the files as they are; with unsaved changes over a file edited by hand it asks for a second `Save`.

## [0.1.6] - 2026-10-07

### Added

- `actions` widget: small buttons `⇲` to compact the conversation and `⚙` to open `/tidemark-config`, each switchable by its option. The default line ends with `flex` and `actions`, so the buttons sit at the right edge.

## [0.1.5] - 2026-10-07

### Added

- The labels of `context`, `quota5h`, `quota7d` and `cache` are buttons: `ctx` runs `/context`, `5h` and `7d` run `/usage`, `cache` opens the `/tidemark` pane. The figures keep their colours.
- The `gitPr` number opens the PR in the browser, the `claudeStatus` word opens status.claude.com.
- `style.buttons: false` draws every press and link as plain text; the editor has a `buttons` switch.

## [0.1.4] - 2026-10-07

### Changed

- A model switch from the band no longer runs `/effort auto`: in an interactive session Claude Code keeps the effort last set for each model, and `auto` overwrote it. The widget hides the effort until the new model's first request.
- The effort levels come from the hint Claude Code describes `/effort` with, so the first press no longer prints an error line in the transcript.

### Fixed

- A level set from the band now counts for the effort cycle; before, only a typed `/effort` did.
- A press runs `/model` or `/effort` as if typed. In an interactive session both save the choice as the default for new sessions; 0.1.1 said "this session only", which holds only in `claude -p`.

## [0.1.3] - 2026-10-07

### Added

- A model switch from the band resets effort to `auto`, the new model's own default; the widget shows `auto` until a request shows the level.
- The effort cycle skips a level a model's requests were sent lower than asked. What requests showed is kept per Claude Code version.

## [0.1.1] - 2026-10-07

### Added

- The model name and the effort in the `model` widget are buttons; both change this session only, as `/model` and `/effort` do.
- A press on the effort steps to the next level `/effort` lists: `low → medium → high → xhigh → max` today.
- A press on the name switches to the next model of the `cycle` option. By default it takes the models Claude Code offers in `/config`, so a new model joins without a config change.
- `config.schema.json`: a JSON Schema for code editors, written as `$schema` on `Save`.
- Failures the band survives go to the debug log (`claude --debug`).

### Fixed

- A change of 999,950 tokens or more read `1000k` instead of `1M`.

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

[0.1.10]: https://github.com/VizzleTF/claude-skills/releases/tag/tidemark--v0.1.10
[0.1.9]: https://github.com/VizzleTF/claude-skills/releases/tag/tidemark--v0.1.9
[0.1.8]: https://github.com/VizzleTF/claude-skills/releases/tag/tidemark--v0.1.8
[0.1.7]: https://github.com/VizzleTF/claude-skills/releases/tag/tidemark--v0.1.7
[0.1.6]: https://github.com/VizzleTF/claude-skills/releases/tag/tidemark--v0.1.6
[0.1.5]: https://github.com/VizzleTF/claude-skills/releases/tag/tidemark--v0.1.5
[0.1.4]: https://github.com/VizzleTF/claude-skills/releases/tag/tidemark--v0.1.4
[0.1.3]: https://github.com/VizzleTF/claude-skills/releases/tag/tidemark--v0.1.3
[0.1.1]: https://github.com/VizzleTF/claude-skills/releases/tag/tidemark--v0.1.1
[0.1.0]: https://github.com/VizzleTF/claude-skills/releases/tag/tidemark--v0.1.0
