## Pellmark 4.0.0 (2026-09-22)

### ⚠️ Breaking Changes

- **`--fix-all` has been removed; `--fix` now applies all fixable rules.** If your CI invocation calls `pellmark --fix-all`, update it to `pellmark --fix` — the old flag will now fail with an unrecognized-option error. `--fix` previously only fixed a subset of rules; it now behaves the way `--fix-all` used to.
- **Node.js 18 is no longer supported; Node.js 20+ is required.** CI runners still pinned to Node 18 will fail to install or run Pellmark. Update your CI image/`node-version` before upgrading.

### Added

- New rule **PM041 `no-bare-urls`**, flagging bare URLs not wrapped in `<...>` or link syntax. **Disabled by default**, so existing configs are unaffected unless you extend a preset that enables all rules (e.g. `"extends": "all"`), in which case this rule will start firing.
- Default config file renamed from `.pellmarkrc` to `pellmark.config.json`. The old filename is still read and works today, but using it now emits a deprecation warning; support will be removed in 5.0. Rename your config file when convenient to avoid a future break.

### Fixed

- **PM012**: fixed a false positive on headings found inside HTML comments (#812). Files that were previously (incorrectly) failing lint on commented-out headings will now pass — this may reduce the number of reported violations in existing CI runs.

### Security

- **[PMK-2026-01]** Fixed a denial-of-service issue where deeply nested YAML in a document's front matter could hang the parser indefinitely. All users processing untrusted or externally-sourced Markdown in CI should upgrade.

---

**Upgrade checklist for CI users:**
1. Bump your CI runner to Node.js 20+.
2. Replace any `--fix-all` usage with `--fix`.
3. If you extend an "all rules" preset, review whether the new `PM041 no-bare-urls` rule should be disabled for your project.
4. Optionally rename `.pellmarkrc` to `pellmark.config.json` to silence the new deprecation warning.
