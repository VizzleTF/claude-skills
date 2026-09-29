# Пара changelog-pellmark-4-0

Язык: en. Вид: create.

Запрос:

> Write the changelog entry for Pellmark 4.0.0 (our Markdown linter), released 2026-09-22. Readers are people who use Pellmark in their CI and want to know whether upgrading breaks them.
> 
> Here is the raw commit list since 3.9.2:
> 
> ```
> feat!: remove --fix-all, --fix now applies all fixable rules
> feat!: drop Node.js 18, require Node.js 20+
> feat: add rule PM041 no-bare-urls (disabled by default)
> feat: rename default config file .pellmarkrc -> pellmark.config.json (old name still read, deprecation warning, removal in 5.0)
> fix: PM012 false positive on headings inside HTML comments (#812)
> fix(security): deeply nested YAML in front matter could hang the parser (advisory PMK-2026-01)
> chore: bump eslint
> ci: cache node_modules
> refactor: split rule loader
> ```

Факты:

- The release is Pellmark 4.0.0, released 2026-09-22; Pellmark is a Markdown linter
- Breaking: the --fix-all flag is removed; --fix now applies every fixable rule
- Breaking: Node.js 18 is no longer supported; the minimum is Node.js 20
- Added: rule PM041 no-bare-urls, off by default
- Changed: the default config file name is pellmark.config.json instead of .pellmarkrc; .pellmarkrc is still read with a deprecation warning until 5.0
- Fixed: PM012 no longer reports headings inside HTML comments (issue #812)
- Security: front-matter parsing no longer allows a denial of service through deeply nested YAML (advisory PMK-2026-01)
- The commits "chore: bump eslint", "ci: cache node_modules" and "refactor: split rule loader" do not affect users

---

## X

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

---

## Y

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
