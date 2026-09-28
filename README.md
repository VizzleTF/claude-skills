# claude-skills

A Claude Code plugin marketplace with a skill that writes and reviews technical documentation by document type.

The skill picks the type of document the reader needs and loads that type's skeleton and style rules. It checks the draft with a script before handing it over. Types: tutorial, how-to, runbook, troubleshooting, reference, explanation, README, conventions, ADR, postmortem, changelog, docstring, CLI help and error messages.

## Choose a version

| Plugin | Language of the skill's instructions | Style rules for documents in |
|---|---|---|
| `technical-writing` | English | English |
| `technical-writing-ru` | Russian | Russian |

The two versions carry the same types and the same rules. Install one of them: both trigger on the same requests, and with two installed you cannot tell which one answers.

## Install

In Claude Code, add the marketplace and install one plugin:

```
/plugin marketplace add VizzleTF/claude-skills
/plugin install technical-writing@vizzletf-skills
```

For the Russian version, install `technical-writing-ru@vizzletf-skills` instead.

From a shell, the same steps are:

```sh
claude plugin marketplace add VizzleTF/claude-skills
claude plugin install technical-writing@vizzletf-skills
```

Then ask Claude for a document, for example "Write a runbook for restarting the queue worker" or "Review this README". The skill loads by itself.

## Check a document

The skill ships `scripts/check.py`, a checker that needs only Python 3. It reports broken links and anchors, long sentences, stop words, LLM markers, dated phrases and, for Russian text, typography. From the repository root:

```sh
python3 plugins/technical-writing/skills/technical-writing/scripts/check.py README.md docs/
```

```
0 error(s), 0 warning(s) in 2 file(s)
```

Run it with `--help` for options such as `--lang` and `--format json`.

## Run the repository checks

From the repository root, with Python 3:

```sh
python3 -m unittest discover -s tests
python3 tools/parity.py
```

The tests are offline. `tools/parity.py` checks that both versions have the same files, sections and checklist items, and that the repository holds no private paths or secrets. It prints `parity: ok` when everything matches.

## Compare with writing-docs

`evals/run.py` runs every scenario in `evals/scenarios/` through four participants: `technical-writing`, `technical-writing-ru`, the earlier `writing-docs` skill and no skill. An Opus judge scores the outputs blind. You need Claude Code on `PATH` and a login.

See the size of the run first; this calls nothing:

```sh
python3 evals/run.py --dry-run
```

Run generation, judging and the report:

```sh
python3 evals/run.py
```

Results land in `evals/results/<date>/`: the documents in `outputs/`, the judge's scores in `judgments/`, blind pairs in `pairs/`, the report in `report.md` and your verdict form in `verdict.md`.

To give your own blind verdict on the pairs:

1. Fill `verdict.md` from `pairs/` before you open `report.md`, `outputs/`, `judgments/` or `pairs/key.json`. They name the participants.
2. Reveal who was who:

   ```sh
   python3 evals/run.py --reveal --date <date>
   ```

Flags, isolation and the verdict format are in [evals/README.md](evals/README.md).

## Links

- [Where each writing-docs defect is fixed](docs/writing-docs-fixes.md)
- [English skill](plugins/technical-writing/skills/technical-writing/SKILL.md) and [Russian skill](plugins/technical-writing-ru/skills/technical-writing-ru/SKILL.md)
- [The brief the skills were built from](briefs/technical-writing.md)
- License: [MIT](LICENSE)
