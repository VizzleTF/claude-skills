# A/B comparison of the documentation skills

`evals/run.py` runs every scenario through four participants, has a model judge score the outputs blind, and writes a report. It also prepares blind pairs "writing-docs vs the new skill" for the owner's own verdict.

Participants:

| Participant | How it is loaded |
|---|---|
| `technical-writing` | `--plugin-dir plugins/technical-writing` |
| `technical-writing-ru` | `--plugin-dir plugins/technical-writing-ru` |
| `writing-docs` | symlink `skills/writing-docs` to `--baseline-path` (default `~/.claude/skills/writing-docs`); the skill is not copied into this repository |
| `none` | no skill |

## Run it

You need Claude Code (`claude` in `PATH`), a login (`~/.claude/.credentials.json`) or `ANTHROPIC_API_KEY`, and Python 3.

Check the size of the run first. `--dry-run` prints the number of generations and judge calls per model and calls nothing:

```
python3 evals/run.py --dry-run
```

Run generation, judging and the report:

```
python3 evals/run.py
```

Defaults: all scenarios on `sonnet`, `core: true` scenarios also on `haiku` and `opus`, judge `opus`, four participants, 3 parallel calls, results under today's date. Flags:

```
python3 evals/run.py [--models sonnet] [--core-models haiku,opus] [--judge-model opus]
                     [--participants writing-docs,technical-writing,technical-writing-ru,none]
                     [--scenarios GLOB] [--jobs 3] [--date YYYY-MM-DD] [--baseline-path PATH]
                     [--dry-run] [--skip-judge] [--report-only] [--reveal]
```

If `writing-docs` is not found at `--baseline-path`, the runner prints a warning and runs without it. No blind pairs are made in that case.

An interrupted run continues where it stopped: run the same command with the same `--date`. Finished outputs and judgments are not recomputed. A failed `claude` call is retried twice, then marked failed and listed in the report; the next run tries it again. On a rate limit the runner pauses 1, 3 and 10 minutes, then stops and prints the command to continue.

## Isolation

Every call gets its own temporary `CLAUDE_CONFIG_DIR`. It contains a symlink to `~/.claude/.credentials.json` and, for `writing-docs`, a symlink `skills/writing-docs`. User hooks, `CLAUDE.md`, other skills and plugins are therefore absent; built-in Claude Code skills stay. The runner never opens the credentials file and never writes to `~/.claude`. Temporary directories are removed when the call ends, even after an error.

The judge runs in the same kind of empty config, without plugins, with `--json-schema`. It receives the request, the facts, the scenario's `expect_notes` (the generating model never sees them), the fixture files with their names, `evals/rubric.md` and the outputs under labels A–D. Traces of a skill run are removed from the outputs first: lines naming a participant skill, `check.py` calls and the "Documentation progress" checklist. Other lines stay as written. Each scenario is judged twice with the order reversed; the score is the mean, and a gap of more than 1 point between the passes is flagged in the report.

## What lands where

```
evals/results/<date>/
├── outputs/<model>/<participant>/<scenario>.md    final document
├── outputs/<model>/<participant>/<scenario>.json  status, Skill calls, cost, duration, words
├── judgments/<model>/<scenario>.json              both passes, mean scores, position gaps
├── pairs/<scenario>.md                            blind pair X / Y for the owner
├── pairs/key.json                                 which label is which participant
├── report.md                                      tables for the model judge
└── verdict.md                                     the owner's verdict form
```

The results directory holds no temporary directories or secrets; the home path is written as `~`. It is meant to be committed.

## Give your verdict

Fill `verdict.md` before you open `report.md`, `outputs/` or `judgments/`: they name the participants, and the texts there are the same as in the pairs.

For every scenario on the main model there is a pair in `pairs/`: an English scenario compares `technical-writing` with `writing-docs`, a Russian one compares `technical-writing-ru` with `writing-docs`. Which document is X is decided by a seed from the scenario id. Do not open `pairs/key.json` before you finish.

1. Open `verdict.md`. Pairs go from the largest gap in the model judge's scores to the smallest; every run recomputes the order and keeps your answers.
2. For each pair you judge, read `pairs/<scenario>.md` and fill both fields:

   ```
   Лучше: X
   Почему: X gives the command before the explanation; Y invents a flag.
   ```

   `Лучше` takes `X`, `Y` or `равно`. `Почему` may span several lines. A pair you skip stays empty.
3. Reveal:

   ```
   python3 evals/run.py --reveal --date <date>
   ```

   The runner refuses while any pair has `Лучше` filled and `Почему` empty, and names those pairs. Otherwise it appends to `verdict.md` who was who, wins, losses and ties of the new skill, and whether you agree with the model judge on each pair. The model judge's pick counts as `равно` when the two totals differ by less than 0.25.
