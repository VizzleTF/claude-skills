# Changelog

All notable changes to the `vi-code` plugin. The format follows [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/), versions follow [Semantic Versioning](https://semver.org/).

## [0.4.0] - 2026-11-18

### Changed

- The rules say they apply when editing code, so read-only subagents can ignore them. 439 words down to 368.
- The smallest diff that fixes the root cause wins, so a shared fix beats a one-site patch.
- A question goes first only when someone can answer it; otherwise Claude states the assumption.
- A bug-fix test is required where the project has tests; Claude runs the relevant tests, not the whole suite.

### Fixed

- The `SessionStart` hook stays silent when `rules.md` is missing.

## [0.3.0] - 2026-11-18

### Changed

- The project's conventions and CLAUDE.md win over the rules; "least" applies to code, not to tests or the reply.
- A bug fix gets a test that failed before it; after editing, Claude runs the project's tests and linter and never weakens a test to pass.
- Trust boundaries are listed, and an unsure case counts as one.
- A vague request gets one question first when the answer changes the design.
- A flawed helper is named instead of silently reused. Generated, vendored and lock files change only through their source.
- Debugging starts by reproducing the bug.

### Fixed

- The `SubagentStart` hook printed invalid JSON when `rules.md` was missing or had CRLF line endings or control characters. It now prints nothing for a missing file and strips those characters.

## [0.2.3] - 2026-11-17

### Changed

- The README opens with one line, a short list of what the plugin does and the install command; details follow under one heading. The English and Russian READMEs match.

## [0.2.2] - 2026-11-17

### Changed

- The README lists what Claude does with the rules and their size in context; a Russian README, `README.ru.md`, links to the English one and back.

## [0.2.1] - 2026-11-17

### Changed

- The manifest sets `displayName`, an icon, a documentation link and a support link for plugin listings.

## [0.2.0] - 2026-11-02

Measured with the agentic benchmark of ponytail 5.3.3 (22 tasks, Opus 5.5): 0.1.0 wrote 38% less code than no rules, ponytail 65% less.

### Added

- `hooks/subagent-context.sh`: a `SubagentStart` hook adds `rules.md` to every subagent's context, so code written by subagents follows the same rules.
- `rules.md`: an opening line asks for the least the task needs in the code, the tests and the reply. It carries no role, since a role prompt steers Opus poorly.
- `rules.md`: a numbered ladder of options, from dropping the feature to the minimum new code, with one readable line before new code.
- `rules.md`: rules on the smallest version of a vague request, the shortest working diff and code nobody asked for (wrappers, type conversions, boilerplate, extra status codes, headers, limits).

### Changed

- `rules.md`: the scope check before editing covers every change, lists callers, tests, fixtures, config and exports, and names one user's data shown to another. In the benchmark, 0.1.0 put all digest subscribers in `To:` once in two runs.
- `rules.md`: the change stays complete while the solution stays small. A house component goes before a native widget. The never-cut list names data-loss handling and accessibility. A whole new script or app needs a test.

## [0.1.0] - 2026-10-31

### Added

- `rules.md`: eight coding and debugging rules, added to the context by a `SessionStart` hook on startup, resume, clear and compact. The rule about fixing every caller moved here from `vi-voice`.
