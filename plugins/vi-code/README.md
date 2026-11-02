# vi-code

The plugin adds coding rules to every Claude Code session and its subagents. It asks for the smallest complete change and reuse of what exists. It also asks for validation at trust boundaries, a change that reaches every caller, a test for new logic and the cause before the fix. A `SessionStart` hook adds [rules.md](rules.md) to the context on startup, `resume`, `clear` and `compact`; a `SubagentStart` hook adds it to every subagent. The rules are in English and work with a reply in any language.

## Install

```
/plugin marketplace add VizzleTF/claude-skills
/plugin install vi-code@vizzletf-skills
```

## Uninstall

```
/plugin uninstall vi-code@vizzletf-skills
```
