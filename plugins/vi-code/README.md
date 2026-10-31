# vi-code

The plugin adds coding rules to every Claude Code session. It asks to reuse what exists, validate at trust boundaries, fix every caller of a shared function, leave a test for new logic and find the cause before the fix. A `SessionStart` hook adds [rules.md](rules.md) to the context on startup, `resume`, `clear` and `compact`. The rules are in English and work with a reply in any language.

## Install

```
/plugin marketplace add VizzleTF/claude-skills
/plugin install vi-code@vizzletf-skills
```

## Uninstall

```
/plugin uninstall vi-code@vizzletf-skills
```
