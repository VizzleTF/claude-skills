# vi-code

Claude Code makes small code changes that reach every caller.

- no broken callers: it lists callers, tests and config before editing
- reuses the codebase, then the stdlib, then installed dependencies; new code last
- adds no option, wrapper or abstraction nobody asked for
- keeps validation where outside input enters, lets errors inside trusted code surface
- adds a small test for new logic and a failing-first test for a bug fix
- runs the project's tests and linter, never weakens a test to pass
- proves a bug's cause before the fix

```
/plugin marketplace add VizzleTF/claude-skills
/plugin install vi-code@vizzletf-skills
```

## More

- The rules are [rules.md](rules.md), about 440 words, in English; replies can be in any language.
- A `SessionStart` hook adds them on startup, `resume`, `clear` and `compact`; a `SubagentStart` hook adds them to every subagent.
- The chat reply style is the [vi-voice](../vi-voice/README.md) plugin.
- Uninstall: `/plugin uninstall vi-code@vizzletf-skills`

[README на русском](README.ru.md) · [All plugins](../../README.md) · [Changelog](CHANGELOG.md)
