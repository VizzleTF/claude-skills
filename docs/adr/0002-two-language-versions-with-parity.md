# ADR-0002: Two language versions with checked structural parity

Status: Accepted, 2026-09-28

## Context

The brief asks for two equal versions: `technical-writing` with English instructions and `technical-writing-ru` with Russian ones. The Russian text must read as Russian prose rather than a literal translation, so a text diff cannot prove the two are equal. The brief assumed both versions would carry style rules for both languages. The owner answered that open question with «Каждая только свой язык»: each version carries only its own language's style rules.

## Decision

We will keep two plugins with the same file paths and English file names, and `tools/parity.py` will check their structure. For each pair of files it compares the count of headings per level, checklist items and table rows. The one allowed difference is the style file: the English version has `style/english.md`, the Russian version has `style/russian.md`, and the parity check skips that pair. Review checks meaning; the script checks shape.

## Consequences

A rule added to one version and missing from the other breaks the parity check, so drift shows up at once. Each version stays monolingual. A visitor installs one plugin and gets one language.

Every change is made twice, by hand, in two languages. The script sees shape and misses meaning: a rule reworded into something different in one version passes. A document in the other language gets only the core and type rules, with no style guidance; the skill says so once. Style points from Williams and Pinker have to be restated in the Russian style file, since the versions cannot share it.

## Alternatives considered

- One skill with both languages inside. Rejected: the brief asks for two versions, and a bilingual `SKILL.md` would not fit the line budget.
- Both style files in each version, as the brief first assumed. The owner rejected this.
- Machine translation or machine comparison of meaning. Out of scope; it would reward literal translation, which the brief forbids.
