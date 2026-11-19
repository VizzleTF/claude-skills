# Changelog

All notable changes to the `vi-voice` plugin, named `voice-ru` before 0.2.0. The format follows [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/), versions follow [Semantic Versioning](https://semver.org/).

## [0.7.0] - 2026-11-19

### Changed

- The rules say that the user's own instructions and CLAUDE.md win over them. 384 words.

## [0.6.1] - 2026-11-19

### Fixed

- The README gives the rules as about 370 words; the marketplace entry is in English and gives the same 500-token cost as the manifest.

## [0.6.0] - 2026-11-18

### Changed

- The rules open with one line on the reader: someone who scans, ADHD included. 417 words down to 362.
- No plan line before tools; a line between tools only for a finding or a changed plan.
- Two closing blocks, **Left to do** and **Waiting on you**, that never repeat the reply.
- Safety caveats always stay; real uncertainty is stated once. `! <command>` is only for a command Claude cannot run itself; commands the user asked for go in a plain code block.

### Fixed

- The `SessionStart` hook stays silent when `style.md` is missing, instead of reporting a hook error at every start.

## [0.5.0] - 2026-11-18

### Changed

- Review findings, check results and errors are listed in full, not cut to the top 5.
- One line on the plan before the first tool call, then a line only for a finding or a changed plan.
- Status blocks cover work from this task only and skip items a task list or question card already shows.
- A reply names the file, task or decision at first mention, and mentions anything destructive or surprising unasked.
- Text that leaves the chat follows the destination's format; `! <command>` is only for a command the user must run in the Claude Code terminal.

### Added

- `tests/test_vi_voice_hook.py` checks that the hook prints `style.md` verbatim.

## [0.4.3] - 2026-11-17

### Changed

- The README opens with one line, a short list of what the plugin does and the install command; details follow under one heading. The English and Russian READMEs match.

## [0.4.2] - 2026-11-17

### Changed

- The README is in English, with a sample reply; the Russian README moves to `README.ru.md`.

## [0.4.1] - 2026-11-17

### Changed

- The manifest sets `displayName`, an icon, a documentation link and a support link for plugin listings.

## [0.4.0] - 2026-11-02

### Changed

- `style.md`: a reply answers only what was asked and keeps every caveat, warning, failure mode, recovery step and follow-up change the reader needs. Completeness beats the line limit. Background nobody asked for, repetition and closers go. A better alternative gets one line.
- `style.md`: code in a reply comes with its assumptions and how to run it, one line each.
- `style.md`: the line on what was not verified appears only when something was not verified. The status blocks take titles in the reply language, and the last line names the next concrete action.
- `style.md`: an explanation or a report may run past 5 lines only as far as it needs. Other rules got shorter wording with the same meaning.

Measured on 20 questions from the caveman and i-have-adhd evals (Opus 5.5, one run each, two blind Sonnet judgings). A draft without the completeness, code and next-action rules gave the shortest replies: 20 988 output tokens against 27 551 for caveman. It scored 3.9 for completeness against 4.5 for caveman. With those rules, on the 9 questions it lost, completeness rose from 3.6 to 4.3 and actionability from 3.6 to 4.3 at the same output.

## [0.3.0] - 2026-11-02

### Added

- `style.md`: numbers, units, limits, exceptions and negations from the input stay explicit; the "not X but Y" ban does not apply to them.
- `style.md`: text that leaves the chat (a PR description, a commit, a ticket) uses full sentences with no `→` arrows, and the chat length limit does not apply to it.

### Changed

- `style.md` is written in English and no longer sets the reply language. Set it with `"language": "russian"` in `settings.json`, otherwise replies follow Claude Code's default.

## [0.2.0] - 2026-10-31

### Added

- `style.md`: a five-line limit on the reply body, `! <command>` lines for terminal steps, grouping of long lists, ranked options, closing blocks **Не сделано**, **Осталось**, **Ждёт решения**.

### Changed

- Renamed from `voice-ru` to `vi-voice`. Reinstall: `/plugin uninstall voice-ru@vizzletf-skills`, then `/plugin install vi-voice@vizzletf-skills`.

### Removed

- The rule about fixing every caller of a shared function: it moved to the `vi-code` plugin.

## [0.1.1] - 2026-10-23

### Changed

- README: dropped the advice to turn off caveman and ponytail and the caveman row in the measurement table.

## [0.1.0] - 2026-10-23

### Added

- `style.md`: nine rules for the chat reply, added to the context by a `SessionStart` hook on startup, resume, clear and compact.
