# Changelog

All notable changes to the `vi-work` plugin. The format follows [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/), versions follow [Semantic Versioning](https://semver.org/).

## [0.2.1] - 2026-11-28

### Fixed

- The obsidian skill gives hidden file sync patterns that work: the scan applies them to folders too, so the `.obsidian` folder needs its own pattern next to `bookmarks.json`.

## [0.2.0] - 2026-11-28

### Added

- Always-on rule: everything worth keeping goes to the user's Obsidian vault, and Claude looks there before asking about past work. It names where the vault path lives and says cloud sessions reach the vault through the MacBook.
- Always-on rule: vault content stays out of public repositories, artifacts, web searches and external services. Subagents get this rule in their prompt. 536 words in total.
- Skill `vi-work:obsidian`, loaded on demand: finding the vault and the `Claude` bookmark group as memory, with its file format. It also keeps Self-hosted LiveSync the only sync, the core Sync plugin off and obsidian-git a backup with read-only git commands.

## [0.1.0] - 2026-11-28

### Added

- Work rules injected by a `SessionStart` hook: English for repository text, owed work finished before the turn ends, when to stop and what to ask, no retry of a denied step in another form, one tool call per destructive step. Also side issues, subagent checks, pages on request and what to keep when compacting. 412 words.
