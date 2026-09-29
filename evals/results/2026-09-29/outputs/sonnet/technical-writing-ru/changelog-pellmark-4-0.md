# Changelog

## 4.0.0 – 2026-09-22

Upgrading can break your CI in two cases: your CI runs Node.js 18, or it calls `pellmark --fix-all`. Both are covered below. This release also fixes a parser hang (advisory PMK-2026-01).

### Breaking changes

- **Node.js 18 is no longer supported.** Pellmark now requires Node.js 20 or later. Update the Node version in your CI image or setup step before you upgrade.
- **`--fix-all` is removed.** `--fix` now applies fixes for all fixable rules, which is what `--fix-all` did. To migrate, replace `--fix-all` with `--fix`. If you already use `--fix`, it will now change more than it did in 3.x, so review the first run's diff.

### Deprecations

- **The default config file is now `pellmark.config.json`.** The old name, `.pellmarkrc`, is still read, but Pellmark prints a deprecation warning. Support for `.pellmarkrc` will be removed in 5.0. To migrate, rename the file to `pellmark.config.json`.

### Security

- **Fixed a parser hang on deeply nested YAML in front matter** (advisory PMK-2026-01). A crafted file could make Pellmark hang. If your CI lints Markdown from untrusted sources, such as pull requests from forks, upgrade.

### Added

- **Rule PM041 `no-bare-urls`.** It is disabled by default, so it does not affect existing setups. To use it, enable it in your config.

### Fixed

- **PM012 no longer reports headings inside HTML comments** (#812). If you added ignores or disabled PM012 to work around this, you can remove them.
