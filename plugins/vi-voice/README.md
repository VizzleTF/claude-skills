# vi-voice

The plugin makes Claude Code's chat replies shorter: the first sentence gives the answer or result, and the body fits in 5 lines. A report on several results may run longer, with headings. Greetings, restating the question and closing offers go. Caveats, numbers, negations, code and errors stay, quoted exactly. A reply ends with one line on what was not checked and the blocks **Not done**, **Left to do** and **Waiting on you** when they have items.

A reply with the plugin:

```
The test fails on the time zone: `parse_date` reads local time, and the fixture is in UTC.
Changed `parse_date` to read UTC; 42 tests pass.

Not checked: a CI run with another TZ; risk: the same failure there.
```

## Install

Before 0.2.0 the plugin was named `voice-ru`. If you have it under the old name, remove it first: `/plugin uninstall voice-ru@vizzletf-skills`.

```
/plugin marketplace add VizzleTF/claude-skills
/plugin install vi-voice@vizzletf-skills
```

The plugin does not set the reply language: the `language` key in `settings.json` does, for example `"language": "russian"`. The rules are in English and work with a reply in any language.

## How it works

A `SessionStart` hook adds [style.md](style.md) to the context on startup, `resume`, `clear` and `compact`: about 350 words per session. Subagents and documents are left alone. The coding rules live in the [vi-code](../vi-code/README.md) plugin.

## Measurement

The variants were compared with two other reply-style plugins, caveman and i-have-adhd. The questions come from the caveman benchmark and the i-have-adhd cases: 20 questions that all three variants answered. Model Opus 5.5, one run each through `claude -p` without tools. Each variant's rules were added with `--append-system-prompt`. Sonnet scored the answers blind twice on a 1–5 scale: factual accuracy, completeness and a clear next step.

| Variant | Output tokens | Words, median | Accuracy | Completeness | Next step | Rules, words |
|---|---|---|---|---|---|---|
| draft 0.4.0 | 20,988 | 187 | 4.45 | 3.92 | 3.77 | 286 |
| caveman 4.0.1 | 27,551 | 268 | 4.45 | 4.53 | 4.38 | 707 |
| i-have-adhd 0.4.1 | 23,120 | 221 | 4.25 | 4.10 | 4.60 | 1187 |

The draft had no rules on completeness, code assumptions or the next step. With them, on the 9 questions the draft lost, completeness rose from 3.6 to 4.3. The next-step score also rose from 3.6 to 4.3, and output did not change. The final version was not measured again on all 20 questions.

Output tokens include thinking. The rules are read on every turn, so their length affects the cost of an agent session. In the ponytail agent benchmark, vi-code with vi-voice 0.3.0 cost 6% more than vi-code alone at the same output.

## Uninstall

```
/plugin uninstall vi-voice@vizzletf-skills
```

## Links

- [README на русском](README.ru.md)
- [All plugins of the marketplace](../../README.md)
- [Changelog](CHANGELOG.md)
