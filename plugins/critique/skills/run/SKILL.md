---
description: Reviews work with parallel read-only critic subagents and an optional cold reader, fixes the findings that hold up inside the owned zone, and repeats until no critical or important finding is left.
disable-model-invocation: true
argument-hint: "[target] [N critics] [loop] [cold] [report only]"
---

# Critique

Request: $ARGUMENTS

Read the request in any language:

- target: paths, a component or "this session's work" (the default);
- critics: a number the user gives wins; otherwise 3, or 2 for a target under about 300 lines; at most 5;
- `loop` («по кругу», "until clean"): rounds until clean, at most 3; without it, one round;
- `cold` («холодный читатель»): a cold reader after the critics; with `cold only`, skip steps 2, 3 and 5;
- `report only`: triage and report, edit nothing.

## 1. Zone

The **zone** is the set of paths you may edit: the target plus what this session changed, cut down by any ownership the user stated (`only CI is ours`, `not the app code`). When the target mixes owned and foreign code and nothing says which is which, ask once. Done when the zone is a path list you can paste into a brief.

## 2. Lenses

A **lens** is one way the target can fail its users. Pick one lens per critic from [lenses.md](lenses.md), matched to the target's kind; no two lenses share a question. Done when each lens names its files, its questions and the commands that prove a finding.

## 3. Critic round

Launch every critic in one message, `subagent_type: "critique:critic"`, `run_in_background: true`, and triage only after the last report arrives. Each brief carries:

```
Target: <paths>
Zone (findings here are [zone]; you edit nothing): <paths>; anything else is outside.
Lens: <name>: <questions>
Prove with: <commands, e.g. helm template ..., pytest -k ..., a curl>
Project rules a fix must keep: <CLAUDE.md and user decisions that bind fixes, quoted>
Already rejected, do not raise again: <finding: reason>
Scratch dir: <session scratchpad>/critique/<n>
Round <k>: <round 1: whole target | round 2+: review only this diff and its regressions: the command or file list with hunks>
```

Leave out your own reasoning and why the work looks as it does: the critic's value is a fresh pair of eyes.

## 4. Triage

Check each finding once yourself (read the cited line, rerun its command) and give it one verdict:

- **fix**: confirmed, critical or important, inside the zone;
- **fix** for a minor one only when it is a one-line change inside the zone;
- **reject**: not reproduced, style or taste, or an option, wrapper or abstraction nobody asked for. Reject too what goes against a project rule or a user decision, such as a request for comments the coding rules forbid. Keep the reason;
- **outside**: the defect, or a change its fix needs (a caller, a test), lives outside the zone; never edit it, it goes to the leftover list;
- **decision**: only the user can settle it (ownership, platform, product choice).

Note which checks already fail, apply the fixes, then run the project's tests and linters without auto-fix flags. A fix that breaks a check is reverted and becomes a decision. Done when every finding has a verdict and no check fails that passed before.

## 5. Loop

With `loop`, start the next round when the last one fixed a critical or important finding. Stop when it fixed none, after round 3, or when a fixed finding comes back (it becomes a decision). Rounds 2 and 3 keep the lenses; record the base (`git stash create` or the changed paths) before each round's fixes and pass that diff in the brief.

## 6. Cold reader

With `cold`, give each human-facing artifact (README, docs, help text, UI, dashboard, messages) to `subagent_type: "critique:cold-reader"`. The brief names:

- the reader: who arrives, from where, what they already know;
- a time budget: 20 seconds to decide, 2 minutes to use;
- the only files they may read;
- 4 to 7 tasks the reader came to do, as they would phrase them.

Leave out the author's intent and the project history. Triage the findings as in step 4. When a task stalled, re-read once after the fixes with a new reader.

## 7. Report

One line with the outcome; when round 3 still fixed a critical or important finding, it says the work is not clean. Then a table of the fixes: finding, lens, where. Then the rejected ones, one short line each: finding, reason. Outside findings and decisions go to the leftover and waiting lists of the reply, one line each.
