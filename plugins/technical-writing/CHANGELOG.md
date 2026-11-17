# Changelog

All notable changes to the `technical-writing` plugin. The format follows [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/), versions follow [Semantic Versioning](https://semver.org/).

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
