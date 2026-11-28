# vi-work

Claude Code finishes the work it owes before ending a turn and asks you only what blocks it.

- no turn ends on "shall I continue?" or a summary that announces the next step
- it stops only for a risky step, a step only you can run, a blocking decision or a denial
- other choices take the recommended option, and the reply says which
- a subagent's "not found" or "unchanged" gets one check before Claude relies on it
- a denied step is never retried in another form
- your decisions and approvals survive compaction word for word

```
/plugin marketplace add VizzleTF/claude-skills
/plugin install vi-work@vizzletf-skills
```

## More

- The rules are [work.md](work.md), about 410 words, in English; your own instructions and CLAUDE.md win over them. A `SessionStart` hook adds them on startup, `resume`, `clear` and `compact`; subagents are left alone.
- On claude.ai: add `VizzleTF/claude-skills` as a plugin marketplace in Plugins and turn on vi-work. Claude Code and cloud sessions signed in to that account load it as `vi-work@synced`.
- Reply style is the [vi-voice](../vi-voice/README.md) plugin, coding rules are [vi-code](../vi-code/README.md).
- Uninstall: `/plugin uninstall vi-work@vizzletf-skills`

[README на русском](README.ru.md) · [All plugins](../../README.md) · [Changelog](CHANGELOG.md)
