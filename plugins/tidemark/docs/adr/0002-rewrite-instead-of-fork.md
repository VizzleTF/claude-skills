# 0002. Rewrite from scratch instead of forking ccOverhead

## Context

ccOverhead (MIT) already shows context, growth, cache and quotas above the prompt. Its set, order, look and single line are hard-coded. tidemark needs configurable widgets, several lines, new data sources and a neutral name.

## Decision

tidemark is new code. From ccOverhead it takes ideas and formulas: the ten-tier color scale, the quota forecast formula, and the cache and growth rules. `NOTICE.md` lists each borrowed item and carries the ccOverhead copyright and MIT text. No file is copied whole.

## Why

Rejected: a fork. Its rendering is one fixed line, so configurable widgets and `fit` would touch nearly every file, and the result would still carry the original layout and name. Keeping a fork in sync with upstream would cost more than the code it saves.

The rewrite makes each widget a pure function from snapshot to a list of variants. That one shape serves the band, the narrow-window `fit`, the editor preview and tests without the engine.

## Consequences

- Upstream fixes to ccOverhead do not arrive automatically; someone has to read its changes and port the relevant rules by hand.
- Engine facts that ccOverhead had verified on 2.1.288 to 2.1.289 are re-proved in our own tests, not inherited.
- `NOTICE.md` must stay in step with the code: a newly borrowed formula needs a new line there.
- Bugs in the borrowed formulas are now ours; the attribution does not move them back upstream.
