# critique

Parallel critic subagents and a cold reader review your work; Claude checks each finding and fixes what holds up.

- 2 to 5 read-only critics, each through one lens: correctness, security, docs vs behaviour and more
- on new work one critic asks whether the approach itself is wrong for the goal and names the plain alternative
- every finding comes with proof: a command and its output
- a cold reader tries the reader's tasks using only your docs and reports where they stall
- fixes stay inside the zone you own; findings outside it come back as a list
- findings against your project rules and style nits are rejected
- `loop` repeats rounds on the new diff until nothing critical or important is left, at most 3
- runs when you type it or ask Claude for critics or a cold reader

```
/plugin marketplace add VizzleTF/claude-skills
/plugin install critique@vizzletf-skills
```

Try `/critique:run charts/app 3 critics loop cold`.

## More

- Arguments in any language: a target, a number of critics, `loop`, `cold`, `report only`. Without a target it reviews this session's work.
- The critic and cold-reader subagents run on Sonnet. A critic gets `Read`, `Grep`, `Glob` and `Bash`; a cold reader gets only `Read`, and its brief names the files it may read. Each critic is one Sonnet run per round.
- Lenses by target kind: [lenses.md](skills/run/lenses.md).
- Uninstall: `/plugin uninstall critique@vizzletf-skills`

[README на русском](README.ru.md) · [All plugins](../../README.md) · [Changelog](CHANGELOG.md)
