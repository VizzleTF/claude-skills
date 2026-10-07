# 0001. snapshot.ts owns every engine event

## Context

The plan gave each module its own hooks: `registerProbes(on, getConfig)`, `registerAlerts(on)`, and a reader `readSnapshot($)` shared across files. Task 01 ran this against the hooks engine of Claude Code 2.1.292.

## Decision

`snapshot.ts` registers the only matcherless hook per event for the whole plugin. Probes and alerts are pure functions that `snapshot.ts` calls with plain data and whose results it writes to state. A module that needs an atom declares the same key in its own file. No module passes `$` to an imported function or keeps the value returned by `on`.

## Why

The engine rejects the planned layout statically, before any code runs. It allows one matcherless hook per event per plugin, so two modules cannot both listen to `turn.complete`. It forbids passing `$` into an imported function, which kills `readSnapshot($)` and `registerProbes(on, ...)`. It forbids `read` or `update` on an atom declared in another file. It forbids storing the result of an `on` call.

Rejected: one big `register.tsx` with all logic inline. It satisfies the engine but loses the pure functions that the tests call without the engine.

## Consequences

- Any new feature that reacts to an event is a change in `snapshot.ts`; that file is the hub and grows with every such feature.
- Probes and alerts stay testable on fixtures without the engine, since they take data and return data.
- An atom key declared in two files must stay identical by hand; the engine does not check that two declarations agree.
- The module seams in the spec that take `on` or `$` no longer describe the code; read the code, not the spec, for those signatures.
- If a later engine version lifts these limits, the layout still works; moving hooks back into modules is optional.
