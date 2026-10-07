# claude-skills

Claude Code plugin marketplace `vizzletf-skills`: one documentation-writing skill shipped twice, `technical-writing` (English instructions) and `technical-writing-ru` (Russian).

## Commands

Run from the repo root. Python 3, stdlib only. CI (`.github/workflows/ci.yml`) runs all of these plus the tidemark commands below on every push to `main` and every pull request.

```sh
python3 -m unittest discover -s tests          # all tests, offline
python3 tools/parity.py                         # structure + EN/RU parity; prints "parity: ok"
claude plugin validate .                        # marketplace + plugin manifests
python3 plugins/technical-writing/skills/write/scripts/check.py plugins/technical-writing/skills/write/   # text checks (dir or files)
```

## Structure

```
.claude-plugin/marketplace.json     lists both plugins
plugins/technical-writing/          EN plugin (.claude-plugin/plugin.json + skills/)
plugins/technical-writing-ru/       RU plugin, same layout
  skills/write/SKILL.md             main skill /<plugin>:write: glossary, type choice, routing, core rules, workflow
  skills/<type>/SKILL.md            13 user-only commands /<plugin>:<type>; run write with `type=<type> $ARGUMENTS`
  skills/write/types/               13 document types, one file each
  skills/write/style/               english.md | russian.md, llm-patterns.md
  skills/write/process/             doc-set.md, review.md
  skills/write/scripts/check.py     text checker (byte-identical in both plugins)
  skills/write/sources.md           where each rule comes from
tools/parity.py                     repo-wide structure/parity/secret checks
tests/                              test_check.py, test_parity.py
.github/                            ci.yml (all checks), ISSUE_TEMPLATE/ (bug, feature)
```

## Key files

- `plugins/technical-writing/skills/write/scripts/check.py` — CLI `check.py [--lang en|ru|auto] [--max-words N] [--format text|json] [--check-urls] [--strict] [--verbose] PATH...`, exit 0/1/2; API `check_text(text, lang, path="<text>", *, max_words=None, check_urls=False) -> list[Finding]`, `Finding = (line, level, rule, message)`.
- check.py rules: errors `broken-link`, `ru-quotes`, `ru-dash`; warnings `sentence-length`, `stop-word`, `llm-marker`, `dash-density`, `dated-phrase`, `ru-yo`, `ru-nbsp`; `vale` if Vale is on PATH. Text output `path:line: level rule: message` + summary `N error(s), M warning(s) in K file(s)`.
- `tools/parity.py` — no args, exit 0/1, lines `path: message`, last line `parity: ok` or `parity: N problem(s)`; API `check_repo(root) -> list[str]`. Limits live as constants at the top (`SKILL_MD_MAX_LINES`, `FRONTMATTER_MAX_CHARS`, `LONG_FILE_LINES`, `SECTIONS`).

## Architecture

- Two skill editions with identical file paths; only the style file differs (`style/english.md` ↔ `style/russian.md`). Language comes from the text, not file names.
- `SKILL.md` routes to exactly one `types/<type>.md` plus the style file and `style/llm-patterns.md`; rule files never point to each other, only SKILL.md routes.
- `scripts/check.py` exists in both plugins and must stay byte-identical; `parity.py` imports the EN copy to share fence parsing.
- `parity.py` checks: required layout, file-set parity, byte-identical `.py`, per-file counts of h1–h6 / `- [ ]` items / table rows (EN vs RU), type H2 order, `## Contents` on long files, `write/SKILL.md` limits and frontmatter, the 13 type commands (`disable-model-invocation: true`, no other skill dirs), no skill-file links in `types/` `style/` `process/`, and secrets/private paths in every tracked file.

## Conventions

- EN/RU parity: same paths except the style file; same H2, checklist-item and table-row counts per file. Edit both editions in the same change.
- Versioning: any change to a plugin's files bumps its `version` in `plugin.json` only, never in `marketplace.json` (semver: patch for wording fixes, minor for new rules or types, major for changes that alter what documents the skill produces) and adds a `CHANGELOG.md` entry; release tag `<plugin>--v<version>`.
- Every `types/*.md` has seven H2 in this order — EN: When to use it and when not, Skeleton, Voice and verbs, Length, Differences from the core rules, Forbidden, Type checklist; RU: Когда это он и когда нет, Каркас, Голос и глаголы, Объём, Отличия от общих правил, Запрещено, Чек-лист типа.
- Files in `types/`, `style/`, `process/` must not link to or name other skill files.
- Any skill `.md` over 100 lines starts with `## Contents` (RU: `## Содержание`).
- `write/SKILL.md` ≤ 170 lines (kept at ~150); frontmatter `description` + `when_to_use` ≤ 1536 chars; triggers go only in `when_to_use` (needs Cyrillic and Latin), never in `description`.
- Record rule: in a record (ADR, postmortem, released changelog entry) only typos, broken links, the status mark (`[YANKED]`, `superseded by`) and the link to its replacement change; new facts go in a new record.
- RU texts: type names in Latin as file names; English quotes stay in original inside «ёлочки», nested „лапки“; «запись» means record only.
- Skill texts obey their own rules: no aphorisms, no "not X but Y", no rule of three, sparse dashes, one term per concept. Word examples go in inline code so check.py skips them.
- Code, comments, script messages in English. Commits: Conventional Commits in English, no AI attribution or co-author trailers.

## Environment

- Never install into or modify the user's `~/.claude/skills` or `~/.claude/plugins`.

## Tests

- `python3 -m unittest discover -s tests` — all offline; single module: `python3 -m unittest tests.test_check` (or `tests.test_parity`).
- Skill texts are "tested" by `python3 tools/parity.py` and check.py over both skill dirs; run both after any text change.

## Gotchas

- Plugin skills are always `/<plugin>:<skill>`, the skill name is the directory name; `${CLAUDE_SKILL_DIR}` is substituted only in the invoked skill's SKILL.md, not in files read with Read.
- parity treats a bare skill file name (e.g. `review.md`) in `types/` `style/` `process/` as a link; rephrase instead of naming the file.
- parity fails on private paths (home or Windows user dirs) and token-shaped strings in any tracked file, this CLAUDE.md included.
- check.py over both skills must print `0 error(s), 0 warning(s)`; capitalised italics (`*Easy to use*`) count as quoted names, lower-case italics still warn.
- Skill texts must pass their own check.py; a new stop word or dash in a rule file shows up as a warning.


<!-- autopilot:start -->
## Autopilot

The mod build is run by the `/autopilot` skill. Requirements, spec and tickets live in `.autopilot/` (local only, excluded via `.git/info/exclude`). Progress: `.autopilot/dashboard.html`. Only the user may drop a requirement from `manifest.md`. To continue an interrupted build, say «продолжи автопилот».
## tidemark mod (`plugins/tidemark/`)

Second plugin kind: a Claude Code mod (TypeScript hooks module, engine 2.1.x) drawing a band above the prompt, a details pane `/tidemark` and a config editor `/tidemark-config`. No npm deps, no build, no Node API: everything external goes through `$` (`$.fs`, `$.process`, `$.http`, `$.env`, `$.clock`, `$.ui`, `$.session`). Engine API: load the `plugin-authoring` skill and grep its `claude-code.d.ts`.

### Commands (repo root)

```sh
claude plugin test plugins/tidemark        # all mod tests (pure + engine)
claude plugin validate plugins/tidemark    # mod manifest + hooks
claude plugin validate .                   # marketplace
python3 tools/parity.py                    # private paths / tokens in every tracked file, mod included
```

### Structure

```
plugins/tidemark/
  .claude-plugin/plugin.json   name, version, "types": "./types/index.d.ts"
  hooks/hooks.json             {"modules": ["./register.tsx"]}
  hooks/register.tsx           entry: calls register* of each module, owns command.run for /tidemark, /tidemark-config
  hooks/snapshot.ts            session events -> atoms snapshot, track, probes, alerts; runs probes and alert toasts
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

### Architecture

- Data flow: engine events -> `snapshot.ts` (sole owner of session events) -> atoms in `$.state` -> `band.tsx` / `pane.tsx` / `editor.tsx` render via `layout.ts` + `widgets/` + `draw.tsx`.
- Atoms (`plugin: 'tidemark'`): `snapshot`, `track`, `config`, `probes`, `alerts`, `editor`; types in `types/index.d.ts`.
- `probes.ts` and `alerts.ts` are pure planners; `snapshot.ts` executes the planned `ProbeRequest`s on `turn.complete` and a 30 s tick, stores results in atom `probes`, and shows the toasts `evaluateAlerts` returns after each `session.measure` and on the tick.
- `config.ts` owns `classic.SessionStart {source: startup}` and `prompt.submit`; config files are `$XDG_CONFIG_HOME/tidemark/config.json` (else `$HOME/.config/...`) and `<cwd>/.claude/tidemark.json`, project over global; mtime re-read on the tick and `prompt.submit`.
- Widget contract: `WidgetDef.render(WidgetInput) -> Variant[]` (`[]` = hidden), `Variant = Span[]`; `layout.ts` picks variants to fit width, `draw.tsx` colours spans by `role` / `tier`.
- Failed probe keeps its previous result beside `error`; one key never runs twice at once.

### Code conventions

- Every function that touches `$` lives in the hook's own file; other files export only pure functions.
- Each module declares its own `atom({plugin: 'tidemark', key}, EMPTY_*)` locally and shares values only through atoms.
- New widget: file in `hooks/widgets/`, built with `kit.ts` helpers (`widget`, `opt`, `labelled`, `bar`, `dur`, `ktok`...), registered in `widgets/index.ts`, options in `WIDGET_OPTIONS` (`config-model.ts`), id in `TidemarkWidgetId`, the widget and its options in `config.schema.json` (`tests/test_tidemark_schema.py` fails until they match).
- Code, comments, UI labels in English; deliberate shortcuts marked `ponytail:`.

### Tests

- `claude plugin test plugins/tidemark`; suites in `plugins/tidemark/tests/`, one per module.
- Pure seams: `validate`, `reduce*` (`snapshot-reducers.ts`), `buildLines`, `WIDGETS[id].render`, `planProbes`, `evaluateAlerts`, `paneRows` on `Snapshot`/`Probes` fixtures.
- Engine seams: `$.ui.mount` of `AbovePrompt`, `Pane tidemark`, `Pane tidemark-config`, `Pane tidemark-goal` on `terminal` and `desktop`, with `mock.env`, `mock.clock` and stub hooks (`on('fs.read')`, `on('process.run')`, `on('http.fetch')`, `on('session.cwd')`...); assert via `ui.find({type, text})` or `ui.find({key})`.
- Snapshot state seam: hidden pane `tidemark-raw` (`RAW_PANE`) renders `field: JSON` rows; no command opens it.
- Editor element keys: `w-<line>-<idx>`, `left/right/up/down/toggle/remove/label-none`, `sec-<id>`, `sec-<id>-up`, `save`, `revert`; selects `add`, `opt-<name>`, `separator`, `icons`, `buttons`, `alerts-enabled`, `preset`, `target`; fields `priority`, `label`, `opt-<name>`, `custom`, `alerts-<k>`; field error `err-<key>`.
- Fake paths in tests look like `/u/dev/proj`.

### Gotchas

- D01, the engine's four static rules: (1) one matcher-less hook per event per plugin, so session events belong to `snapshot.ts` and `classic.SessionStart {startup}` + `prompt.submit` to `config.ts`; matcher hooks (`command.run {command}`, `ui.render {component, requestId}`) are free; (2) `$` cannot be passed into an imported function; (3) an atom is readable/writable only in the file that declares it; (4) hence external work (probes, alerts, config writes) runs inside the hook file and imports only pure planners.
- No `tsc`, no `package.json`, no type-check step: `claude plugin test` and `claude plugin validate` are the only gates.
- The literal `/ho`+`me/` (and Windows user-dir prefixes) in any tracked file fails parity; keep it split or use `/u/dev`.
- `claude plugin test` gives tests no `$.state`: drive engine events and read state through `tidemark-raw` or mounted panes; JSX `key` is matchable by `ui.find({key})` but absent from `props`.
- Terminal width counts one cell per code point; wide glyphs undercount (`layout.ts`).
<!-- autopilot:end -->
