# 0003. Configure through an in-pane editor and JSON files

## Context

The user asked for configuration on the level of ccstatusline, which ships a separate TUI and an npm package. The hooks engine allows no npm dependencies and no build step, and it offers panes with `Select`, `Input` and live rendering.

## Decision

`/tidemark-config` opens an editor pane with a live preview on top. The editor edits a draft in state, and `Save` writes it as JSON schema v1 to a chosen target. The global file is `$XDG_CONFIG_HOME/tidemark/config.json`, falling back to `~/.config/tidemark/config.json`. An optional `<project>/.claude/tidemark.json` replaces whole top-level keys of the global file. Users can also edit either file by hand.

## Why

Rejected: a separate CLI or TUI outside Claude Code, as in ccstatusline. It needs its own package, runtime and release, and its preview would be a second renderer that drifts from the band. The pane preview calls the same `buildLines` as the band.

Rejected: JSON files only, without an editor. Discovering fifteen widgets and their options from a schema is slow, and a typo costs a broken band until the user notices.

Rejected: a deep merge of the project file into the global one. Merging `lines` arrays item by item has no obvious meaning; replacing a top-level key is predictable.

## Consequences

- Schema v1 is now a public contract. Renaming a widget, an option or a key needs a `version` bump and a migration in `validate`.
- The editor works only inside Claude Code; there is no way to configure tidemark from a shell except editing JSON.
- A hand edit shows up within 30 seconds (the mtime check runs on the tick and on `turn.start`), not instantly.
- A project file that sets `lines` hides the whole global `lines`; users who expect a per-widget override will be surprised.
- Broken JSON falls back to the default config with a dim `⚠ config` mark, and the file is never overwritten until the user saves.
