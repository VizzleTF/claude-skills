# Contributing

Bug reports and feature requests go to [issues](https://github.com/VizzleTF/claude-skills/issues/new/choose). For a pull request, open an issue first unless the change is a typo.

## Checks

CI runs these on every pull request; run them from the repo root before you push. You need Python 3 and Claude Code.

```sh
python3 -m unittest discover -s tests
python3 tools/parity.py
claude plugin validate .
claude plugin test plugins/tidemark
python3 plugins/technical-writing/skills/write/scripts/check.py plugins/technical-writing/skills/write/
python3 plugins/technical-writing/skills/write/scripts/check.py plugins/technical-writing-ru/skills/write/
```

## Rules

- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/) with the plugin as the scope: `fix(tidemark): ...`.
- A change to a plugin bumps its `version` in its `plugin.json` and adds a `CHANGELOG.md` entry in the plugin folder.
- `technical-writing` and `technical-writing-ru` change together: same files, same headings and checklist items.
- No home or user directory paths in any file: `tools/parity.py` fails on them. Tests use paths like `/u/dev/proj`.
