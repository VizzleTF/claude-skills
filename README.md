# claude-skills

[![ci](https://github.com/VizzleTF/claude-skills/actions/workflows/ci.yml/badge.svg)](https://github.com/VizzleTF/claude-skills/actions/workflows/ci.yml)

Five Claude Code plugins: documents that fit their reader, a status band above the prompt, short replies, small complete code changes, critic subagents that review your work.

```
/plugin marketplace add VizzleTF/claude-skills
/plugin install technical-writing@vizzletf-skills
/plugin install tidemark@vizzletf-skills
/plugin install vi-voice@vizzletf-skills
/plugin install vi-code@vizzletf-skills
/plugin install critique@vizzletf-skills
```

## technical-writing

Claude writes and reviews documentation by type.

- 13 types: README, runbook, ADR, changelog, how-to, postmortem and 7 more
- each document fits its reader: a newcomer, an engineer mid-task, someone on call
- style rules for English and Russian documents
- 20–30% shorter than the earlier `writing-docs` skill; Opus, judging blind, scored them the same or higher
- `check.py` catches long sentences, filler words, LLM tells and broken links before review

Try `Write a runbook for the alert QueueWorkerDown`.

[Full README](plugins/technical-writing/README.md)

## tidemark

A band of widgets above the prompt, in the terminal and the desktop app.

- how full the context is and when the prompt cache expires
- 5-hour and weekly quota with time to reset
- model, reasoning effort and git branch
- press a widget to switch the model or effort, or run `/compact`
- `/tidemark` shows what fills the context and when the quota runs out
- `/tidemark-config` edits the band with a live preview and presets
- works beside your `statusLine`; no telemetry

![The tidemark band: context 4% of 1M, 5-hour quota 28%, weekly quota 86%, git branch and model](plugins/tidemark/docs/images/tidemark-band.png)

Needs Claude Code 2.1.288 or later. [Full README](plugins/tidemark/README.md)

## vi-voice

Claude's chat replies get short.

- the first sentence is the answer or result
- the body fits in 5 lines; a report may run longer
- no greetings, recaps or closing offers
- code, errors and numbers quoted exactly
- the reply ends with what is unverified and what is left for you

[Full README](plugins/vi-voice/README.md)

## vi-code

Claude makes small code changes that reach every caller.

- no broken callers: it lists callers, tests and config before editing
- reuses your code before writing new code
- adds no option or abstraction nobody asked for
- never drops validation of outside input
- proves a bug's cause before the fix
- subagents follow the same rules

[Full README](plugins/vi-code/README.md)

## critique

Critic subagents and a cold reader review your work; Claude fixes what holds up.

- 2 to 5 read-only critics, each through one lens, every finding with proof
- a cold reader tries the reader's tasks using only your docs
- fixes stay inside the zone you own; style nits are rejected
- `loop` repeats rounds until nothing critical or important is left, at most 3
- runs on `/critique:run` or when you ask Claude for critics or a cold reader

[Full README](plugins/critique/README.md)

## Links

[README на русском](README.ru.md) · [Contributing](CONTRIBUTING.md) · License: [MIT](LICENSE)
