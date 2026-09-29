# Changelog

All notable changes to the `technical-writing` plugin. The format follows [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/), versions follow [Semantic Versioning](https://semver.org/).

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

[1.0.2]: https://github.com/VizzleTF/claude-skills/releases/tag/technical-writing--v1.0.2
[1.0.1]: https://github.com/VizzleTF/claude-skills/releases/tag/technical-writing--v1.0.1
[1.0.0]: https://github.com/VizzleTF/claude-skills/releases/tag/technical-writing--v1.0.0
