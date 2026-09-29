# claude-skills

A Claude Code plugin marketplace with a skill that writes and reviews technical documentation by document type.

The skill picks the type of document the reader needs and loads that type's skeleton and style rules. It checks the draft with a script before handing it over. Types: tutorial, how-to, runbook, troubleshooting, reference, explanation, README, conventions, ADR, postmortem, changelog, docstring, CLI help and error messages.

## Choose a version

| Plugin | Language of the skill's instructions | Style rules for documents in |
|---|---|---|
| `technical-writing` | English | English |
| `technical-writing-ru` | Russian | Russian |

The two versions carry the same types and the same rules. Install one of them: both trigger on the same requests, and with two installed you cannot tell which one answers.

## Install

You need Claude Code with plugin marketplace support (`/plugin`). The checker `check.py` needs Python 3.

In Claude Code, add the marketplace and install one plugin:

```
/plugin marketplace add VizzleTF/claude-skills
/plugin install technical-writing@vizzletf-skills
```

For the Russian version, install `technical-writing-ru@vizzletf-skills` instead. From a shell, run the same steps as `claude plugin marketplace add VizzleTF/claude-skills` and `claude plugin install technical-writing@vizzletf-skills`.

Ask Claude "Write a runbook for restarting the queue worker". You get a runbook in chat: the alert name as the title, impact, diagnosis commands with their expected output, then actions.

## Check a document

From the repository root:

```sh
python3 plugins/technical-writing/skills/technical-writing/scripts/check.py README.md docs/
```

```
0 error(s), 0 warning(s) in 8 file(s)
```

## Tests and comparison

Run the tests and the parity check of the two versions: `python3 -m unittest discover -s tests` and `python3 tools/parity.py`.

To compare the skills with the earlier `writing-docs` skill and give your own blind verdict, follow [evals/README.md](evals/README.md).

## Links

- [Where each writing-docs defect is fixed](docs/writing-docs-fixes.md)
- [English skill](plugins/technical-writing/skills/technical-writing/SKILL.md) and [Russian skill](plugins/technical-writing-ru/skills/technical-writing-ru/SKILL.md)
- [The brief the skills were built from](briefs/technical-writing.md)
- Comparison results: [2026-09-29 verdict](evals/results/2026-09-29/verdict.md) (fill before opening the [report](evals/results/2026-09-29/report.md))
- License: [MIT](LICENSE)
