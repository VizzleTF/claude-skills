# Changelog

All notable changes to the `vi-voice` plugin, named `voice-ru` before 0.2.0. The format follows [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/), versions follow [Semantic Versioning](https://semver.org/).

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
