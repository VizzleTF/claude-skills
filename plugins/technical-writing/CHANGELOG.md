# Changelog

All notable changes to the `technical-writing` plugin. The format follows [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/), versions follow [Semantic Versioning](https://semver.org/).

## [3.3.0] - 2026-11-19

### Changed

- A docstring goes on public API where the project's code has them or where a caller needs facts the signature does not show, not on every public item. This matches the comment rule in `vi-code`.

## [3.2.0] - 2026-11-18

### Changed

- Facts come from the user, the files they point to and the repository. A required part without a fact gets one placeholder; an optional part or detail without one is left out. The cold reader does not count a placeholder as a stall.
- A docstring, a comment or a changelog entry is inserted into its file by an edit; only a standalone page replaces the named file.
- A short section of a second type inside a page is allowed. The rewrite branch adds no parts, shortens only when asked and never rewrites a record.
- The four-axes table and the checklist ticking are gone; step 7 sends a draft back once. The reply never reports checks and never repeats a document written to a file.
- ADR status `rejected`; runbooks for an event without an alert; postmortem action status lives in the tracker.
- The doc-set friction log reads the source and runs only read-only commands. Past ten findings, a review says how many more.
- The checker no longer flags `not only … but`, `не только … но и`, `rather`, `highly` or `fairly`, or numbers from 2040 up as years. It treats a short Russian block full of Latin names as Russian, decodes percent-encoded anchors, accepts `id` and `name` anchors, and skips a byte order mark.

## [3.1.0] - 2026-11-18

### Added

- A rewrite branch: a request to rewrite, shorten or fix a text keeps its type, headings and facts and writes the result over the named file.
- Missing facts in a postmortem, a tutorial's time and similar required fields become `<UPPER_CASE>` placeholders that satisfy the type checklist.
- Design docs add goals, non-goals, rollout, risks and open questions to the ADR parts.
- Reference entries get an optional Notes field; troubleshooting entries with an uncertain cause list ordered checks.

### Changed

- A default type is named in one line at the top of the response; questions go after the document. A review report goes to the chat and never over the reviewed file.
- The cold reader subagent is skipped for docstrings, comments, CLI help, error messages and changelog entries.
- Runbook, postmortem, changelog, docstring and conventions budgets fit their required parts.
- In Python, docstrings follow the project's existing form before PEP 257.
- The review process runs the checker with `--lang auto` and runs only read-only commands from the document.
- The checker picks the language per paragraph, treats Russian prose with many Latin names as Russian, allows twice the dash density in Russian, and reads link targets with parentheses.
- The checker no longer flags a bare `as of`; it flags more English and Russian stop words, and `является` as a stop word.
- `when_to_use` says the skill is not for commit messages, PR descriptions or chat explanations of code.

### Removed

- Stephen King's 10% formula from step 5.

## [3.0.0] - 2026-11-17

### Removed

- The 13 type commands `/technical-writing:<type>`. They were user-only shortcuts that Claude never saw; in a test on 13 requests that did not name the type, `write` picked the right type every time. To fix the type by hand, run `/technical-writing:write type=<type> <request>`.

## [2.0.2] - 2026-11-17

### Changed

- The README opens with one line, a short list of what the plugin does and the install command; details follow under one heading. The English and Russian READMEs match.

## [2.0.1] - 2026-11-17

### Changed

- The README opens with what the skill does that a plain request does not and with the blind-judged result; a Russian README, `README.ru.md`, links to the English one and back.

## [2.0.0] - 2026-11-17

### Changed

- One plugin for English and Russian documents. The skill reads the style file for the language of the document: `style/english.md` or `style/russian.md`. A language with no style file gets the core rules, the type file and the pattern catalog.
- The checker runs with `--lang auto` and picks English or Russian rules from the text.
- A document given in the chat is plain Markdown, never wrapped in a code block.
- The manifest names the author link, homepage, repository, documentation and support links, so plugin listings show the developer.

### Added

- `style/russian.md` from the former `technical-writing-ru` plugin, with a section on the Russian form of each type's voice rule: how-to titles, reference verbs, ADR decisions, docstrings, CLI help and errors.
- `README.md`, `LICENSE` and `icon.png` in the plugin directory.
- Eval suite in `evals/` for `claude plugin eval`.

### Removed

- The `technical-writing-ru` plugin. The marketplace maps it to `technical-writing` with `renames`: after `/plugin marketplace update vizzletf-skills`, run `/plugin install technical-writing@vizzletf-skills` once. Its commands `/technical-writing-ru:<type>` become `/technical-writing:<type>`.

## [1.0.2] - 2026-09-29

### Changed

- Descriptions fit one menu line: `write` names what it does, each type command names its reader and document.

## [1.0.1] - 2026-09-29

### Changed

- The main command is now `/technical-writing:write`; `/technical-writing:technical-writing` no longer exists.

### Added

- One command per document type, such as `/technical-writing:runbook` or `/technical-writing:adr`, for all 13 types. Each runs `write` with the type already chosen; Claude does not call these commands on its own.

## [1.0.0] - 2026-09-29

### Added

- A type router that picks one of 13 document types, from tutorial and how-to to ADR, postmortem and changelog, each with its own skeleton, voice, length and checklist.
- Style rules for English and a catalog of LLM writing patterns to remove.
- Doc-set planning for projects that need several pages, and a review process that reports findings as where, what and how to fix.
- `scripts/check.py`, a text checker for broken links, long sentences, stop words and LLM markers; it reads files, directories or stdin.
- Compact output by default, with a word budget for each type.

[2.0.0]: https://github.com/VizzleTF/claude-skills/releases/tag/technical-writing--v2.0.0
[1.0.2]: https://github.com/VizzleTF/claude-skills/releases/tag/technical-writing--v1.0.2
[1.0.1]: https://github.com/VizzleTF/claude-skills/releases/tag/technical-writing--v1.0.1
[1.0.0]: https://github.com/VizzleTF/claude-skills/releases/tag/technical-writing--v1.0.0
