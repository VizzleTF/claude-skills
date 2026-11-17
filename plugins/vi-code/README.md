# vi-code

The plugin gives Claude Code and every subagent one set of coding rules. With them Claude:

- reads the code before editing and lists the callers, tests and config the change must reach;
- reuses a helper from the codebase, then the stdlib, then an installed dependency, and writes new code last;
- adds no option, wrapper or abstraction nobody asked for, so the diff stays small;
- keeps validation where outside input enters (trust boundaries) and lets errors inside trusted code surface;
- adds one small test for new logic;
- finds the cause of a bug, with proof, before changing code.

The rules are about 350 words of context: [rules.md](rules.md). They are in English and work with a reply in any language.

## Install

```
/plugin marketplace add VizzleTF/claude-skills
/plugin install vi-code@vizzletf-skills
```

## How it works

A `SessionStart` hook adds [rules.md](rules.md) to the context on startup, `resume`, `clear` and `compact`; a `SubagentStart` hook adds it to every subagent. The chat reply style lives in the [vi-voice](../vi-voice/README.md) plugin.

## Uninstall

```
/plugin uninstall vi-code@vizzletf-skills
```

## Links

- [README на русском](README.ru.md)
- [All plugins of the marketplace](../../README.md)
- [Changelog](CHANGELOG.md)
