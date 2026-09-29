## [4.0.0] - 2026-09-22

- BREAKING: Removed `--fix-all`. Use `--fix`, which now applies all fixable rules. A CI job that runs `--fix` may now rewrite more files than before. A job that still passes `--fix-all` fails until you change it.
- BREAKING: Dropped Node.js 18. Pellmark now requires Node.js 20 or later.

### Added

- Added rule PM041 `no-bare-urls`. It is disabled by default, so existing runs are unaffected until you enable it.

### Deprecated

- The default config file is now `pellmark.config.json`. Pellmark still reads `.pellmarkrc` but prints a deprecation warning. Support for `.pellmarkrc` ends in 5.0.

### Fixed

- PM012 no longer reports headings inside HTML comments (#812).

### Security

- Fixed a hang when parsing deeply nested YAML in front matter (advisory PMK-2026-01). Upgrade if you lint Markdown from untrusted sources.
