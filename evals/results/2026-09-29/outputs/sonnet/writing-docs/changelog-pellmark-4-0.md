## 4.0.0 - 2026-09-22

**Upgrading can break your CI if you call `--fix-all` or run Node.js 18. Changes to `--fix` can also alter your results.** The other changes need no action.

### Breaking changes

- **`--fix-all` is removed.** Use `--fix` instead. `--fix` now applies all fixable rules, so it can rewrite more than it did in 3.x. Review the diff the first time you run it.
- **Node.js 18 is no longer supported.** Pellmark 4.0.0 requires Node.js 20 or later. Update the Node version in your CI images before upgrading.

### Deprecations

- **The default config file is now `pellmark.config.json`.** Pellmark still reads `.pellmarkrc` and prints a deprecation warning when it does. Support for `.pellmarkrc` will be removed in 5.0. Rename the file before then to silence the warning.

### Security

- **Fixed a parser hang on deeply nested YAML in front matter** (advisory PMK-2026-01). A crafted or malformed file could hang the parser, and with it your CI job.

### Fixes

- PM012 no longer reports headings inside HTML comments (#812). If you suppressed these false positives, you can remove the suppressions.

### New

- Rule PM041 `no-bare-urls` is added. It is disabled by default, so it does not affect existing runs. To use it, enable it in your config.
