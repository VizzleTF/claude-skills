id: changelog-pellmark-4-0
lang: en
kind: create
expect: changelog
core: false
facts:
- The release is Pellmark 4.0.0, released 2026-09-22; Pellmark is a Markdown linter
- Breaking: the --fix-all flag is removed; --fix now applies every fixable rule
- Breaking: Node.js 18 is no longer supported; the minimum is Node.js 20
- Added: rule PM041 no-bare-urls, off by default
- Changed: the default config file name is pellmark.config.json instead of .pellmarkrc; .pellmarkrc is still read with a deprecation warning until 5.0
- Fixed: PM012 no longer reports headings inside HTML comments (issue #812)
- Security: front-matter parsing no longer allows a denial of service through deeply nested YAML (advisory PMK-2026-01)
- The commits "chore: bump eslint", "ci: cache node_modules" and "refactor: split rule loader" do not affect users

Write the changelog entry for Pellmark 4.0.0 (our Markdown linter), released 2026-09-22. Readers are people who use Pellmark in their CI and want to know whether upgrading breaks them.

Here is the raw commit list since 3.9.2:

```
feat!: remove --fix-all, --fix now applies all fixable rules
feat!: drop Node.js 18, require Node.js 20+
feat: add rule PM041 no-bare-urls (disabled by default)
feat: rename default config file .pellmarkrc -> pellmark.config.json (old name still read, deprecation warning, removal in 5.0)
fix: PM012 false positive on headings inside HTML comments (#812)
fix(security): deeply nested YAML in front matter could hang the parser (advisory PMK-2026-01)
chore: bump eslint
ci: cache node_modules
refactor: split rule loader
```
