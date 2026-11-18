# 0006. Programs and hosts come from the global config only

Status: accepted, 2026-11-18. Supersedes part of [0003](0003-config-editor-in-pane-and-json.md).

## Context

ADR 0003 lets `<project>/.claude/tidemark.json` replace any top-level key of the global config. A repository can ship that file. The `command` widget runs its `command` option as `sh -c`, and `gitPr` sends the host's credentials through `gh` or `glab` to every host in `githubHosts` and `gitlabHosts`. A cloned repository could therefore run a program or collect a token as soon as a session opens in it.

## Decision

We will read `command.command`, `gitPr.githubHosts` and `gitPr.gitlabHosts` from the global file only. The project file still replaces top-level keys, but these options are dropped from it with a warning in the editor. `gitPr` calls `gh` only for `github.com` and `githubHosts`, `glab` only for `gitlab.com` and `gitlabHosts`, and neither for any other host.

## Why

Rejected: a trust prompt per project file. A prompt the user clicks through once on every new repository protects little.

Rejected: ignoring the project file entirely. Per-project layouts are the reason it exists, and its other keys draw text, not run programs.

## Consequences

- A project that needs its own `command` cannot set it; the user adds it to the global file.
- A GitLab instance other than `gitlab.com` shows no PR until its host is listed in `gitlabHosts`.
- 0003 has three facts that changed since. The mod has 20 widgets, not fifteen. The config check runs on the tick and on `prompt.submit`, not on `turn.start`. A file that does not parse is skipped while the other file still applies.
