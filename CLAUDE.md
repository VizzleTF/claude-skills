# claude-skills

Claude Code plugin marketplace `vizzletf-skills`: one documentation-writing skill shipped twice, `technical-writing` (English instructions) and `technical-writing-ru` (Russian), plus the `tidemark` mod.

## Commands

Run from the repo root. Python 3, stdlib only. CI (`.github/workflows/ci.yml`) runs all of these plus `claude plugin validate plugins/tidemark` and `claude plugin test plugins/tidemark` on every push to `main` and every pull request.

```sh
python3 -m unittest discover -s tests          # all tests, offline
python3 tools/parity.py                         # structure + EN/RU parity; prints "parity: ok"
claude plugin validate .                        # marketplace + plugin manifests
python3 tools/version_check.py origin/main      # each plugin changed since the base bumps its version + CHANGELOG entry
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
tools/version_check.py              version bump + CHANGELOG entry per changed plugin
tools/live_smoke.py                 tidemark in a real Claude Code under tmux
tests/                              one test_<tool>.py per tool, test_tidemark_schema.py
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
- Versioning: any change to a plugin's files bumps its `version` in `plugin.json` only, never in `marketplace.json` (semver: patch for wording fixes, minor for new rules or types, major for changes that alter what documents the skill produces) and adds a `CHANGELOG.md` entry; release tag `<plugin>--v<version>`. Run `tools/version_check.py origin/main` before a commit.
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
- Before deleting tracked files, show the list and wait for the user's yes.

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
The tidemark mod rules live in `.claude/rules/tidemark.md` and load with any file under `plugins/tidemark/`.
<!-- autopilot:end -->
