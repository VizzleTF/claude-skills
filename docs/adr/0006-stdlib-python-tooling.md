# ADR-0006: Standard-library Python tooling with a byte-identical check.py

Status: Accepted, 2026-09-28

## Context

The skill ships a checking script, and the repository has a parity script and an eval runner. A visitor installs the skill with two `/plugin` commands, and nothing installs Python packages. Python is present almost everywhere Claude Code runs. Both language versions need the script, and each version is a separate plugin that cannot reach files of the other.

## Decision

We will write `check.py`, `parity.py` and `evals/run.py` in Python 3 with the standard library only, and test them with `unittest`. `check.py` holds word lists for both languages and exists as two copies, one per plugin. `parity.py` fails if the two copies differ by a single byte.

## Consequences

The script runs right after install, and the tests run with one command and no setup. One behaviour ships in both plugins, and the parity check keeps it that way.

Markdown parsing, link checking and sentence splitting are hand-written and cover only what the rules need; a Markdown edge case may give a false finding. Every change to `check.py` has to be copied to the second plugin. The English version carries Russian word lists and the other way round. This does not break the owner's answer «Каждая только свой язык»: that answer covers style rules in the skill text, and the script is a tool. Vale is used when present, but is not required.

## Alternatives considered

- Third-party packages such as a Markdown parser or a linter. Rejected: the visitor would need a separate install step before the skill works.
- One shared `check.py` outside the plugins. Rejected: a plugin can only use files inside its own directory.
- A version of the script per language. Rejected: two diverging tools to maintain, with no gain for the user.
