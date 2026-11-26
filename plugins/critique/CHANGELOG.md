# Changelog

All notable changes to the `critique` plugin. The format follows [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/), versions follow [Semantic Versioning](https://semver.org/).

## [0.2.0] - 2026-11-26

### Changed

- Claude can start the skill itself when the user asks for critics, a critique loop or a cold reader; `/critique:run` still works.

## [0.1.0] - 2026-11-19

### Added

- `/critique:run`: parallel read-only critics, each through one lens, and an optional cold reader. Claude checks every finding, fixes the confirmed ones inside the owned zone, rejects style nits and findings against project rules, and lists findings outside the zone. `loop` repeats rounds on the new diff, at most 3.
- `critique:critic` and `critique:cold-reader` subagents on Sonnet; the cold reader can only read.
