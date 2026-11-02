# Changelog

All notable changes to the `vi-voice` plugin, named `voice-ru` before 0.2.0. The format follows [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/), versions follow [Semantic Versioning](https://semver.org/).

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
