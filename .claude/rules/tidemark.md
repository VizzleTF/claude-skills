---
paths:
  - "plugins/tidemark/**"
---

# tidemark mod (`plugins/tidemark/`)

Second plugin kind: a Claude Code mod (TypeScript hooks module, engine 2.1.x) drawing a band above the prompt, a details pane `/tidemark` and a config editor `/tidemark-config`. No npm deps, no build, no Node API: everything external goes through `$` (`$.fs`, `$.process`, `$.http`, `$.env`, `$.clock`, `$.ui`, `$.session`). Engine API: load the `plugin-authoring` skill and grep its `claude-code.d.ts`.

## Commands (repo root)

```sh
claude plugin test plugins/tidemark        # all mod tests (pure + engine)
claude plugin validate --strict plugins/tidemark   # mod manifest + hooks
(cd plugins/tidemark && npx -y -p typescript@5.6.3 tsc -p .)   # type check; needs .claude-plugin/types, laid by the engine on load
claude plugin validate .                   # marketplace
python3 tools/parity.py                    # private paths / tokens in every tracked file, mod included
python3 tools/live_smoke.py --reload       # real Claude Code in tmux: band drawn, no hook errors, survives /reload-plugins
python3 tools/live_smoke.py --installed    # same on the installed plugin, after checking its cache holds HEAD
```

A mod change is done when `live_smoke.py --reload` prints `live-smoke: ok`; after `claude plugin update`, also `--installed`. `claude plugin test` starts from empty state and never draws in a real terminal, so it misses state left by an older version and render-time errors.

## Structure

```
plugins/tidemark/
  .claude-plugin/plugin.json   name, version, "types": "./types/index.d.ts"
  hooks/hooks.json             {"modules": ["./register.tsx"]}
  hooks/register.tsx           entry: calls register* of each module, owns command.run for /tidemark, /tidemark-config
  hooks/snapshot.ts            session events -> atoms snapshot, track, probes, alerts; runs probes and alert toasts; registers the 4 commands
  hooks/snapshot-reducers.ts   pure: snapshot patches per event (reduceContext, reduceStep, reduceCompact...)
  hooks/model-utils.ts         pure helpers shared by snapshot.ts and widgets: baseModel, validCost
  hooks/config-model.ts        pure: schema tables, DEFAULT_CONFIG, PRESETS, validate, file paths, merge, saveContent
  hooks/config.ts              load hooks: atom config, mtime checks on classic.SessionStart, prompt.submit, a tick
  hooks/probes.ts              pure: planProbes, applyProbeResult, commandKey; timeouts as constants
  hooks/alerts.ts              pure: evaluateAlerts (hysteresis T-5, cache once per window)
  hooks/widgets/               one file per widget; index.ts = WIDGETS registry, kit.ts = shared helpers
  hooks/layout.ts              pure: buildLines(config, snap, probes, width, now, env) -> Line[] (fit, separators)
  hooks/draw.tsx               Line[] / PaneRow[] -> elements; terminal vs desktop, palettes, TIERS
  hooks/draw-activity.ts       terminal spinner Client; frames in draw-spinner.ts
  hooks/band.tsx               ui.render AbovePrompt
  hooks/pane.tsx, pane-rows.ts /tidemark pane (Pane 'tidemark') + hidden 'tidemark-raw'; paneRows, quotaForecast pure
  hooks/editor.tsx             /tidemark-config pane, draft in atom editor, writes config via $.fs.write
  hooks/editor-model.ts        pure draft edits -> {config, selected?} | {error}
  hooks/notes.tsx              /tidemark-goal, /tidemark-project: command.run + field panes; goal per session id in $.store, note in .claude/tidemark-project.txt
  types/index.d.ts             state contract: augments PluginState['tidemark'] and all Tidemark* types
  config.schema.json           JSON Schema of a config file, `$schema` in files Save writes
  tests/*.test.ts              claude-code/testing suites, one per module
```

## Architecture

- Data flow: engine events -> `snapshot.ts` (sole owner of session events) -> atoms in `$.state` -> `band.tsx` / `pane.tsx` / `editor.tsx` render via `layout.ts` + `widgets/` + `draw.tsx`.
- Atoms (`plugin: 'tidemark'`): `snapshot`, `track`, `config`, `probes`, `alerts`, `editor`; types in `types/index.d.ts`.
- `probes.ts` and `alerts.ts` are pure planners; `snapshot.ts` executes the planned `ProbeRequest`s on `turn.complete` and a 30 s tick, stores results in atom `probes`, and shows the toasts `evaluateAlerts` returns after each `session.measure` and on the tick.
- `config.ts` owns `classic.SessionStart {source: startup}` and `prompt.submit`; config files are `$XDG_CONFIG_HOME/tidemark/config.json` (else `$HOME/.config/...`) and `<cwd>/.claude/tidemark.json`, project over global; mtime re-read on the tick and `prompt.submit`.
- Widget contract: `WidgetDef.render(WidgetInput) -> Variant[]` (`[]` = hidden), `Variant = Span[]`; `layout.ts` picks variants to fit width, `draw.tsx` colours spans by `role` / `tier`.
- Failed probe keeps its previous result beside `error`; one key never runs twice at once.

## Code conventions

- Every function that touches `$` lives in the hook's own file; other files export only pure functions.
- Each module declares its own `atom({plugin: 'tidemark', key}, EMPTY_*)` locally and shares values only through atoms.
- New widget: file in `hooks/widgets/`, built with `kit.ts` helpers (`widget`, `opt`, `labelled`, `bar`, `dur`, `ktok`...), registered in `widgets/index.ts`, options in `WIDGET_OPTIONS` (`config-model.ts`), id in `TidemarkWidgetId`, the widget and its options in `config.schema.json` (`tests/test_tidemark_schema.py` fails until they match).
- Code, comments, UI labels in English; deliberate shortcuts marked `ponytail:`.

## Tests

- `claude plugin test plugins/tidemark`; suites in `plugins/tidemark/tests/`, one per module.
- Pure seams: `validate`, `reduce*` (`snapshot-reducers.ts`), `buildLines`, `WIDGETS[id].render`, `planProbes`, `evaluateAlerts`, `paneRows` on `Snapshot`/`Probes` fixtures.
- Engine seams: `$.ui.mount` of `AbovePrompt`, `Pane tidemark`, `Pane tidemark-config`, `Pane tidemark-goal` on `terminal` and `desktop`, with `mock.env`, `mock.clock` and stub hooks (`on('fs.read')`, `on('process.run')`, `on('http.fetch')`, `on('session.cwd')`...); assert via `ui.find({type, text})` or `ui.find({key})`.
- Snapshot state seam: hidden pane `tidemark-raw` (`RAW_PANE`) renders `field: JSON` rows; no command opens it.
- Editor element keys: `w-<line>-<idx>`, `left/right/up/down/toggle/remove/label-none`, `sec-<id>`, `sec-<id>-up`, `save`, `revert`; selects `add`, `opt-<name>`, `separator`, `icons`, `buttons`, `alerts-enabled`, `preset`, `target`; fields `priority`, `label`, `opt-<name>`, `custom`, `alerts-<k>`; field error `err-<key>`.
- Fake paths in tests look like `/u/dev/proj`.

## Gotchas

- D01, the engine's four static rules: (1) one matcher-less hook per event per plugin, so session events belong to `snapshot.ts` and `classic.SessionStart {startup}` + `prompt.submit` to `config.ts`; matcher hooks (`command.run {command}`, `ui.render {component, requestId}`) are free; (2) `$` cannot be passed into an imported function; (3) an atom is readable/writable only in the file that declares it; (4) hence external work (probes, alerts, config writes) runs inside the hook file and imports only pure planners.
- No `package.json`, no build: `tsc` only type-checks, against the API types the engine lays in `.claude-plugin/types/` (git-ignored). CI lays them with a headless `claude -p --plugin-dir` run under a dummy key, then runs `tsc`.
- Command names stay literal in both `$.command.register` (in `snapshot.ts`, `session.start`) and the `command.run` matchers; with a constant, `claude plugin validate` lists the hook as a gate instead of "answers its own command".
- The mobile surface has no `Input` or `Select`: a pane that needs them returns `noFields` (`draw.tsx`) on `e.surface === 'mobile'`.
- The literal `/ho`+`me/` (and Windows user-dir prefixes) in any tracked file fails parity; keep it split or use `/u/dev`.
- `claude plugin test` gives tests no `$.state`: drive engine events and read state through `tidemark-raw` or mounted panes; JSX `key` is matchable by `ui.find({key})` but absent from `props`.
- Terminal width counts one cell per code point; wide glyphs undercount (`layout.ts`).
- `$.state` outlives `/reload-plugins`: atoms written by an older version lack new keys, so fill defaults when reading an atom.
- A `ui.render` hook may not write state (`state.set: denied`); schedule the write with `$.clock.after(0, ...)`.
- `claude plugin update` keeps an existing `~/.claude/plugins/cache/vizzletf-skills/tidemark/<version>/` directory as is, so every update needs a new version. `live_smoke.py --installed` reports a stale directory.
