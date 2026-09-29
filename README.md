# claude-skills

A Claude Code plugin that writes and reviews technical documentation by document type. Types: tutorial, how-to, runbook, troubleshooting, reference, explanation, README, conventions, ADR, postmortem, changelog, docstring, CLI help. On 28 test scenarios its documents came out 20–30% shorter than with the earlier `writing-docs` skill, at the same judge score or higher.

## Install

Requires Claude Code with `/plugin` support and Python 3 for the text checker.

```
/plugin marketplace add VizzleTF/claude-skills
/plugin install technical-writing@vizzletf-skills
```

For instructions and style rules in Russian, install `technical-writing-ru@vizzletf-skills` instead. Install only one: both trigger on the same requests.

## Example

Ask Claude `Write a runbook for the alert QueueWorkerDown`. You get a runbook: impact, diagnosis, actions with a verification command each, escalation.

Check a Markdown file with the bundled checker, from the repository root:

```sh
python3 plugins/technical-writing/skills/technical-writing/scripts/check.py README.md
```

```
0 error(s), 0 warning(s) in 1 file(s)
```

## Links

- [README на русском](README.ru.md)
- [Commands, structure and conventions of this repository](CLAUDE.md)
- [A/B comparison with writing-docs](evals/README.md) and [where each writing-docs defect is fixed](docs/writing-docs-fixes.md)
- [Changelog](plugins/technical-writing/CHANGELOG.md), license [MIT](LICENSE)
