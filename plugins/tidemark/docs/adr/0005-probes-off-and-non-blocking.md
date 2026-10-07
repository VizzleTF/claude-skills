# 0005. External probes are opt-in and never block rendering

## Context

The git, PR/CI, custom command and Claude status widgets run `git`, `gh`, `glab`, a shell command or an HTTP request. The user allowed files, processes and network, on condition that each such feature can be turned off.

## Decision

A probe runs only when its widget is enabled in the loaded config. Each probe has its own timeout, cache and TTL, set as options of its widget. Widgets read only the last stored probe result; the band and the pane never wait for a process or the network. `gitPr`, `command` and `claudeStatus` are off by default; `git` is in the default line.

## Why

Rejected: running the probe during render. A slow `gh` or a hung command would freeze the band above the prompt, and the engine re-renders often.

Rejected: probes that always run and widgets that only hide the result. That spends processes and network calls the user turned off, which breaks the condition the user set.

Rejected: one global switch for all external calls. The user wants git without network, or a custom command without `gh`; the widget switch is already the natural unit.

## Consequences

- A freshly enabled widget is hidden or shows a dim `?` until its first result arrives.
- Shown data lags by up to the TTL: git 5 s (plus a refresh on `turn.complete`), command 10 s, PR 2 min, Claude status 5 min.
- A failing or timed-out probe shows a dim `?`, keeping the last known value where there is one; the band does not report why.
- The custom command runs through `sh -c` with session data on stdin; whatever the user puts there runs on every TTL expiry.
