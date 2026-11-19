# vi-voice

Claude Code's chat replies get short and lead with the answer, for readers who scan, ADHD included.

- the first sentence is the answer or result
- the body fits in 5 lines; a report on several results may run longer
- no greetings, restated questions or closing offers
- caveats, numbers, code and errors stay, quoted exactly
- the reply ends with what was not checked and **Left to do** and **Waiting on you**

```
/plugin marketplace add VizzleTF/claude-skills
/plugin install vi-voice@vizzletf-skills
```

A reply with the plugin:

```
The test fails on the time zone: `parse_date` reads local time, and the fixture is in UTC.
Changed `parse_date` to read UTC; 42 tests pass.

Not checked: a CI run with another TZ; risk: the same failure there.
```

## More

- The reply language comes from `"language"` in `settings.json`, for example `"language": "russian"`.
- The rules are [style.md](style.md), about 380 words, in English; your own instructions and CLAUDE.md win over them. A `SessionStart` hook adds them on startup, `resume`, `clear` and `compact`; subagents and documents are left alone.
- The coding rules are the [vi-code](../vi-code/README.md) plugin.
- Named `voice-ru` before 0.2.0: run `/plugin uninstall voice-ru@vizzletf-skills` before the install.
- Uninstall: `/plugin uninstall vi-voice@vizzletf-skills`

### Measurement

The variants were compared with two other reply-style plugins, caveman and i-have-adhd. The questions come from the caveman benchmark and the i-have-adhd cases: 20 questions that all three variants answered. Model Opus 5.5, one run each through `claude -p` without tools. Each variant's rules were added with `--append-system-prompt`. Sonnet scored the answers blind twice on a 1–5 scale: factual accuracy, completeness and a clear next step.

| Variant | Output tokens | Words, median | Accuracy | Completeness | Next step | Rules, words |
|---|---|---|---|---|---|---|
| draft 0.4.0 | 20,988 | 187 | 4.45 | 3.92 | 3.77 | 286 |
| caveman 4.0.1 | 27,551 | 268 | 4.45 | 4.53 | 4.38 | 707 |
| i-have-adhd 0.4.1 | 23,120 | 221 | 4.25 | 4.10 | 4.60 | 1187 |

The draft had no rules on completeness, code assumptions or the next step. With them, on the 9 questions the draft lost, completeness rose from 3.6 to 4.3. The next-step score also rose from 3.6 to 4.3, and output did not change. The final version was not measured again on all 20 questions.

Output tokens include thinking. The rules are read on every turn, so their length affects the cost of an agent session. In the ponytail agent benchmark, vi-code with vi-voice 0.3.0 cost 6% more than vi-code alone at the same output.

[README на русском](README.ru.md) · [All plugins](../../README.md) · [Changelog](CHANGELOG.md)
