<!-- autopilot:start -->
# claude-skills

Claude Code plugin marketplace `vizzletf-skills`: one documentation-writing skill shipped twice, `technical-writing` (English instructions) and `technical-writing-ru` (Russian).

## Commands

Run from the repo root. Python 3, stdlib only.

```sh
python3 -m unittest discover -s tests          # all tests, offline
python3 tools/parity.py                         # structure + EN/RU parity; prints "parity: ok"
claude plugin validate .                        # marketplace + plugin manifests
python3 plugins/technical-writing/skills/write/scripts/check.py plugins/technical-writing/skills/write/   # text checks (dir or files)
python3 evals/run.py --dry-run                  # size of an eval run, calls nothing
python3 evals/run.py                            # full A/B run: generation, judge, report (costs money/quota)
python3 evals/run.py --reveal --date YYYY-MM-DD # after the owner fills verdict.md
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
evals/                              run.py, rubric.md, scenarios/, fixtures/, results/<date>/
tests/                              test_check.py, test_parity.py, test_run.py
briefs/technical-writing.md         original brief; docs/writing-docs-fixes.md maps old-skill defects to fixes
```

## Key files

- `plugins/technical-writing/skills/write/scripts/check.py` — CLI `check.py [--lang en|ru|auto] [--max-words N] [--format text|json] [--check-urls] [--strict] [--verbose] PATH...`, exit 0/1/2; API `check_text(text, lang, path="<text>", *, max_words=None, check_urls=False) -> list[Finding]`, `Finding = (line, level, rule, message)`.
- check.py rules: errors `broken-link`, `ru-quotes`, `ru-dash`; warnings `sentence-length`, `stop-word`, `llm-marker`, `dash-density`, `dated-phrase`, `ru-yo`, `ru-nbsp`; `vale` if Vale is on PATH. Text output `path:line: level rule: message` + summary `N error(s), M warning(s) in K file(s)`.
- `tools/parity.py` — no args, exit 0/1, lines `path: message`, last line `parity: ok` or `parity: N problem(s)`; API `check_repo(root) -> list[str]`. Limits live as constants at the top (`SKILL_MD_MAX_LINES`, `FRONTMATTER_MAX_CHARS`, `LONG_FILE_LINES`, `SECTIONS`).
- `evals/run.py` — API `load_scenarios(dir, pattern="*") -> list[Scenario]` (raises `ValueError` if `id` ≠ file name) and `call_claude(argv, cwd, env, input=None) -> CallResult`, the only place that spawns `claude`; tests patch it plus `EVALS_DIR`, `CREDENTIALS`, `sleep`, `RATE_PAUSES`, `CRIT_KEYS`.
- `evals/scenarios/<id>.md` — header fields in order: `id`, `lang`, `kind` (create/review/update/ambiguous), `expect` (comma list, no spaces), `core`, optional `fixtures` (`<dir>/` under `evals/fixtures/`), optional `expect_notes:` list, `facts:` list, blank line, prompt.
- `evals/rubric.md` — judge criteria (`CRIT_KEYS`: type, skeleton, accuracy, answer_first, scannable, voice, no_llm_patterns, concise, actionable), 1–5, no n/a.
- `evals/README.md` — how to run evals and give the blind verdict; `evals/fixtures/SOURCES.md` — origin of `real-*` fixtures.

## Architecture

- Two skill editions with identical file paths; only the style file differs (`style/english.md` ↔ `style/russian.md`). Language comes from the text, not file names.
- `SKILL.md` routes to exactly one `types/<type>.md` plus the style file and `style/llm-patterns.md`; rule files never point to each other, only SKILL.md routes.
- `scripts/check.py` exists in both plugins and must stay byte-identical; `parity.py` imports the EN copy to share fence parsing.
- `parity.py` checks: required layout, file-set parity, byte-identical `.py`, per-file counts of h1–h6 / `- [ ]` items / table rows (EN vs RU), type H2 order, `## Contents` on long files, `write/SKILL.md` limits and frontmatter, the 13 type commands (`disable-model-invocation: true`, no other skill dirs), no skill-file links in `types/` `style/` `process/`, and secrets/private paths in every tracked file outside `.autopilot/`.
- `evals/run.py` flow: load scenarios → generate each scenario × model × participant (`technical-writing`, `technical-writing-ru`, `writing-docs` baseline, `none`) → scrub skill traces → opus judge scores labels A–D twice with order reversed → `report.md` + blind pairs + `verdict.md`.
- Isolation: every `claude -p` call gets a fresh temp `CLAUDE_CONFIG_DIR` holding only symlinks (credentials, and `skills/writing-docs` for the baseline) and a temp workdir with the fixtures; both removed afterwards. Plugins load via `--plugin-dir`.
- Results: `evals/results/<date>/{outputs/<model>/<participant>/<id>.{md,json}, judgments/<model>/<id>.json, pairs/<id>.md, pairs/key.json, report.md, verdict.md}`; reruns with the same `--date` resume. Meant to be committed; home path written as `~`.
- Owner verdict: fill `verdict.md` (`Лучше: X|Y|равно`, `Почему:`) before opening anything else; `--reveal` refuses (exit 1) if a pair has `Лучше` without `Почему`, else appends/replaces `# Раскрытие`. run.py exits: 0 ok, 1 reveal refused, 2 launch error, 3 rate limit (resume command on stderr).

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

- Evals need `claude` in PATH and either a login (`~/.claude/.credentials.json`, symlinked, never read) or `ANTHROPIC_API_KEY` as the alternative. Never write key values anywhere.
- Evals symlink the baseline from `--baseline-path` (default `~/.claude/skills/writing-docs`); if missing, it runs without it and makes no blind pairs.
- Never install into or modify the user's `~/.claude/skills` or `~/.claude/plugins`.

## Tests

- `python3 -m unittest discover -s tests` — all offline; `claude` is never spawned (tests patch `call_claude`).
- Single module: `python3 -m unittest tests.test_run` (also `tests.test_check`, `tests.test_parity`).
- Skill texts are "tested" by `python3 tools/parity.py` and check.py over both skill dirs; run both after any text change.

## Gotchas

- Plugin skills are always `/<plugin>:<skill>`, the skill name is the directory name; `${CLAUDE_SKILL_DIR}` is substituted only in the invoked skill's SKILL.md, not in files read with Read.
- Prompts go to `claude` via stdin: a single argv element is capped at 128 KiB on Linux; fixture-heavy prompts hit it.
- `claude --bare` needs an API key (login is not used), so isolation uses a temp `CLAUDE_CONFIG_DIR` instead.
- parity treats a bare skill file name (e.g. `review.md`) in `types/` `style/` `process/` as a link; rephrase instead of naming the file.
- parity fails on private paths (home or Windows user dirs) and token-shaped strings in any tracked file, this CLAUDE.md included.
- check.py over both skills must print `0 error(s), 0 warning(s)`; capitalised italics (`*Easy to use*`) count as quoted names, lower-case italics still warn.
- Under `claude -p`, Read of a plugin's files outside cwd is denied; the runner passes `--add-dir <skill dir>` per participant and records `files_read` / `read_denied`.
- Session/usage-limit messages stop the runner with exit 3; rerun the printed command (same `--date`) and failed items are retried.
- Output compactness is a product requirement: each type file's Length sets a budget, and report.md has a «Компактность» section comparing medians with writing-docs.
- Skill texts must pass their own check.py; a new stop word or dash in a rule file shows up as a warning.

## Как здесь работает Autopilot

Сборка ведётся навыком `/autopilot`. Требования, спецификация и таски — в `.autopilot/`.
Прогресс — `.autopilot/dashboard.html`. Правило: требование из `manifest.md`
может снять только пользователь.

Если работа продолжается — скажи «продолжи автопилот»: состояние поднимется
из `.autopilot/state.js`, переспрашивать ничего не нужно.
<!-- autopilot:end -->
