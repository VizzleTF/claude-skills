# technical-writing

Claude Code writes and reviews documentation by type, for the person who will read it.

- 13 types: README, runbook, ADR, changelog, how-to, postmortem and 7 more
- picks the type by the reader: a newcomer learning, an engineer mid-task, someone on call
- writes the type's required sections within its word budget
- style rules for English and Russian; other languages get the core rules
- 20–30% shorter than the earlier `writing-docs` skill on 28 scenarios, Opus, judging blind, scored them the same or higher
- `check.py` flags long sentences, stop words, LLM markers and broken links

```
/plugin marketplace add VizzleTF/claude-skills
/plugin install technical-writing@vizzletf-skills
```

Ask `Write a runbook for the alert QueueWorkerDown`: you get impact, diagnosis, an action with a verification command per step, and escalation.

## More

- Needs Python 3 for the checker: `python3 skills/write/scripts/check.py --lang auto deploy.md`
- Claude runs the skill on its own when you ask for a document; `/technical-writing:write` runs it by hand. To fix the type, start the arguments with it: `/technical-writing:write type=runbook alert QueueWorkerDown`. Types: `adr`, `changelog`, `cli-help-errors`, `conventions`, `docstring`, `explanation`, `how-to`, `postmortem`, `readme`, `reference`, `runbook`, `troubleshooting`, `tutorial`.
- Had `technical-writing-ru`? Run `/plugin marketplace update vizzletf-skills`, then the install above; `/technical-writing-ru:<type>` becomes `/technical-writing:write type=<type>`.
- Uninstall: `/plugin uninstall technical-writing@vizzletf-skills`

[README на русском](README.ru.md) · [All plugins](../../README.md) · [Changelog](CHANGELOG.md) · [Rule sources](skills/write/sources.md) · [Issues](https://github.com/VizzleTF/claude-skills/issues) · License: [MIT](LICENSE)
