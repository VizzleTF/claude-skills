# technical-writing

A Claude Code plugin that writes and reviews documentation by type. It finds the reader, picks one of 13 types (README, runbook, ADR, changelog and others) and writes to that type's skeleton and length budget. Style rules follow the language of the document: English and Russian have their own, other languages get the core rules only.

## Install

Needs Python 3 for the text checker.

```
/plugin marketplace add VizzleTF/claude-skills
/plugin install technical-writing@vizzletf-skills
```

If you had `technical-writing-ru`, run `/plugin marketplace update vizzletf-skills`, then the `install` command above. The update renames the plugin, and `install` fetches it under the new name. Its commands `/technical-writing-ru:<type>` become `/technical-writing:<type>`.

## Example

Ask Claude `Write a runbook for the alert QueueWorkerDown`, or run:

```
/technical-writing:runbook alert QueueWorkerDown
```

You get a runbook: impact, diagnosis, actions with a verification command each, escalation. A request in Russian for a Russian document gets the Russian style rules.

The bundled checker reports long sentences, stop words, LLM markers and broken links in a Markdown file:

```sh
python3 skills/write/scripts/check.py --lang auto deploy.md
```

## Commands

`/technical-writing:write` picks the type from the request. Each type also has a command that Claude never calls on its own: `adr`, `changelog`, `cli-help-errors`, `conventions`, `docstring`, `explanation`, `how-to`, `postmortem`, `readme`, `reference`, `runbook`, `troubleshooting`, `tutorial`. Run it as `/technical-writing:<type>`.

## Uninstall

```
/plugin uninstall technical-writing@vizzletf-skills
```

## Links

- [Changelog](CHANGELOG.md)
- [Rule sources](skills/write/sources.md)
- [Issues](https://github.com/VizzleTF/claude-skills/issues)
- License: [MIT](LICENSE)
