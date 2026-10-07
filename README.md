# claude-skills

[![ci](https://github.com/VizzleTF/claude-skills/actions/workflows/ci.yml/badge.svg)](https://github.com/VizzleTF/claude-skills/actions/workflows/ci.yml)

A Claude Code plugin that writes and reviews technical documentation by document type. On 28 test scenarios its documents came out 20–30% shorter than with the earlier `writing-docs` skill, at the same judge score or higher.

## Install

Requires Claude Code with `/plugin` support and Python 3 for the text checker.

```
/plugin marketplace add VizzleTF/claude-skills
/plugin install technical-writing@vizzletf-skills
```

For instructions and style rules in Russian, install `technical-writing-ru@vizzletf-skills` instead. Install only one: both trigger on the same requests.

## Commands

`/technical-writing:write` picks the type from the request. Each type also has its own command:

| Command | Document |
|---|---|
| `/technical-writing:adr` | Record of a decision and its trade-offs |
| `/technical-writing:changelog` | What changed between versions |
| `/technical-writing:cli-help-errors` | --help text and error messages |
| `/technical-writing:conventions` | Rules the team follows |
| `/technical-writing:docstring` | Docstring or code comment |
| `/technical-writing:explanation` | Why the system is built this way |
| `/technical-writing:how-to` | Steps to one goal for someone mid-task |
| `/technical-writing:postmortem` | Record of an incident and its follow-ups |
| `/technical-writing:readme` | First page of a project |
| `/technical-writing:reference` | Facts to look up: options, fields, limits |
| `/technical-writing:runbook` | Steps for on-call when an alert fires |
| `/technical-writing:troubleshooting` | Symptom or error, its cause and fix |
| `/technical-writing:tutorial` | Lesson for a newcomer, one guided path |

## Example

Ask Claude `Write a runbook for the alert QueueWorkerDown`, or run `/technical-writing:runbook alert QueueWorkerDown`. You get a runbook: impact, diagnosis, actions with a verification command each, escalation.

Check a Markdown file with the bundled checker, from the repository root:

```sh
python3 plugins/technical-writing/skills/write/scripts/check.py README.md
```

```
0 error(s), 0 warning(s) in 1 file(s)
```

## tidemark

The marketplace also has `tidemark`, a mod that draws a configurable band above the Claude Code prompt: context, prompt cache, quota, model, git and more. It needs Claude Code 2.1.288 or later.

```
/plugin install tidemark@vizzletf-skills
```

Widgets, config and privacy: [tidemark README](plugins/tidemark/README.md).

## Links

- [README на русском](README.ru.md)
- [Changelog](plugins/technical-writing/CHANGELOG.md), license [MIT](LICENSE)
