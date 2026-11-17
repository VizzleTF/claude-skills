# Contributing

Bug reports and feature requests go to [issues](https://github.com/VizzleTF/claude-skills/issues/new/choose). For a pull request, open an issue first unless the change is a typo.

## Checks

CI runs these on every pull request; run them from the repo root before you push. You need Python 3 and Claude Code.

```sh
python3 -m unittest discover -s tests
python3 tools/parity.py
claude plugin validate --strict .
claude plugin test plugins/tidemark
python3 plugins/technical-writing/skills/write/scripts/check.py plugins/technical-writing/skills/write/
```

A change to `technical-writing` skill texts also runs its eval suite. It calls Claude and costs about $1.5 per run, so CI does not run it:

```sh
claude plugin eval plugins/technical-writing --runs 1 --ablation none --allow-tools Bash
```

## Rules

- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/) with the plugin as the scope: `fix(tidemark): ...`.
- A change to a plugin bumps its `version` in its `plugin.json` and adds a `CHANGELOG.md` entry in the plugin folder.
- `technical-writing` keeps its instructions in English. Style rules for a document language live in `skills/write/style/<language>.md`; a new language adds one file there and a link in the Routing section of `skills/write/SKILL.md`.
- No home or user directory paths in any file: `tools/parity.py` fails on them. Tests use paths like `/u/dev/proj`.
