I reviewed the postmortem against itself and found 18 problems. Five are factual conflicts inside the document, and one of them undercuts the headline claim that no users reported problems. I didn't check anything against GitHub, and I left the original file unchanged. I couldn't open the skill's review checklist because permission was denied, so I used the skill's main rules.

## Facts that contradict each other

| # | Where | Problem | Fix |
|---|---|---|---|
| 1 | Summary "Impact" row (line 14), Impact section (line 78) | "No user reported problems" conflicts with the timeline, which lists three "Report of data corruption" entries. It also conflicts with "All reported cases were detected manually" (line 92). A reader deciding whether to trust v3.5 can't tell which statement is true. | Say clearly that there were three reports, and state where they came from. If they weren't from production, say so. The maintainers need to confirm this (TODO left in the document). |
| 2 | Timeline, line 138 | `2021-01-28` for #13654 comes before the PR that caused the bug (2021-05-08) and before #13514 (2021-12-01), even though its issue number is higher. | Almost certainly `2022-01-28`. |
| 3 | Header date (line 6) vs. Timeline (line 142) | The document is dated 2022-04-20, but it describes v3.5.3 as already released on 2022-04-24. | Check the v3.5.3 release page and correct whichever date is wrong. |
| 4 | Header date vs. Action items | Items marked DONE link to #14039, #14045 and PR #14911. Those numbers are well above anything else in the document, so that work was done after the April 2022 date. | Add a "Last updated" field so readers know how current the Status column is. |
| 5 | "What went well" (line 88) vs. Timeline (line 137) | #13514 is called a new edge case found while fixing the bug. The timeline lists it as a user report from 2021-12-01, months before the fix. | Remove it from the edge-case list, or explain how it is both. |
| 6 | Summary (line 13) vs. Trigger section | The summary says the bug "required frequent crashes." The Trigger section shows that one crash inside the window is enough. Frequent crashes only make that more likely. | Rephrase the summary to match the Trigger section. |

## Gaps for users deciding whether to trust v3.5

| # | Where | Problem | Fix |
|---|---|---|---|
| 7 | Top of the page | The document never says which versions are affected or what to do. Readers have to work it out from the timeline. | Add a short "Who is affected" section first: v3.5.0–v3.5.2 are affected, and v3.5.3 has the fix. Tell readers to upgrade and turn on the startup corruption check. |
| 8 | Action item "detects data corruption by default" (P0, DONE) | P0 means "backport to v3.5", but the document doesn't say which v3.5.x release turns the check on by default. | Add the version (TODO left). |
| 9 | Detection section | A user whose cluster has diverged has no recovery steps. The action item for documented recovery has no issue and no status. | Link to a recovery procedure once one exists, or open the issue. |

## Gaps for contributors picking up action items

| # | Where | Problem | Fix |
|---|---|---|---|
| 10 | Action items intro (line 104) | It says every lesson gets an action item. Three lessons have none: `/tmp` on an in-memory filesystem, the production-readiness recommendation, and the release qualification process that no one runs anymore. | Add items for them, or remove the claim. |
| 11 | Action items table | Three P1 items have no tracking issue, so there's nothing to pick up. The blank Status cells don't say whether work has started. | Add "TODO: open issue" and a status of "Open". |
| 12 | "Bug" column | #14911 is a pull request, not a bug. | Rename the column to "Tracking". |
| 13 | "Where we got lucky" (line 100) | It doesn't explain why an in-memory `/tmp` hid the bug, so no one can turn it into a test fix. | Add one sentence of explanation (TODO for maintainers). |

## Wording and structure

| # | Where | Problem | Fix |
|---|---|---|---|
| 14 | Throughout | "Consistent index" and "consistency index" are both used for the same field. | Use "consistent index (CI)" everywhere. |
| 15 | Summary table vs. Impact section | The Impact text appears twice, word for word. The two-column table with an empty header is also hard to scan. | Keep it once, and turn the summary into a short paragraph. |
| 16 | Line 96 | The sentence is garbled: "Production ready recommendations based on after some internal feedback... but the user's hold on till someone else will discover issues". | I rewrote it with my best reading of the meaning. The authors should confirm it. |
| 17 | Line 52 | A link to a pull request is presented as "the bug". | Change it to "fixed in v3.5.1 by #13505". |
| 18 | Many lines | Typos and grammar: "loosing", "replying WAL entries", "will missing", "where detected", "before to apply", "imminently", "Should be prioritized this", "Stretch  goals", "run manual qualification", "using etcd functional", "lead" (should be "led"), and "totally undetectable". | Fixed in the version below. |

Things the maintainers must supply are left as `<!-- TODO -->` comments. These are items 1, 3, 8, 11 and 13 plus the #13505 wording. I didn't make up that information.

---

```markdown
# v3.5 data inconsistency postmortem

| | |
|---|---|
| Authors | etcd maintainers |
| Date | 2022-04-20 |
| Last updated | <!-- TODO: date of last action-item status update --> |
| Status | Published |

## Who is affected and what to do

- **Affected:** etcd v3.5.0, v3.5.1 and v3.5.2.
- **Fixed:** v3.5.3 and later.
- **Not affected:** v3.4 and earlier. The bug came from a refactor first shipped in v3.5.0.

If you run an affected version:

1. Upgrade to v3.5.3 or later.
2. Start etcd with `--experimental-initial-corrupt-check`. For this issue, the check at startup is the reliable one (see [Detection](#detection)). <!-- TODO: name the v3.5.x release where corruption detection became the default (action item #14039). -->

## Summary

A refactor in v3.5.0 stopped the consistent index from being saved atomically with the data it describes. If a member crashed during a narrow window, a committed transaction could be missing from that member. Clusters that crash often, for example under high load or memory pressure, are the most likely to hit it.

## Background

etcd v3 keeps its state on disk in two forms:

- **Write-ahead log (WAL):** the history of changes.
- **Database (DB):** the state at one point in that history.

etcd v3.5 still maintains v2 state. It is deprecated and not related to this issue.

To record which point in the WAL the database represents, the database stores a **consistent index (CI)**. This metadata field points to the last WAL entry the database has applied.

When etcd applies WAL entries to the database, it also moves the CI forward. The two changes must be [atomic](https://en.wikipedia.org/wiki/Atomic_commit). If only one is saved, the database and WAL no longer match:

- CI saved, changes not saved: the entry is skipped.
- Changes saved, CI not saved: the entry is applied twice.

Correctness in a multi-member cluster depends on every member reaching the same state when it replays the same WAL entries.

## Root cause

[#12855](https://github.com/etcd-io/etcd/pull/12855) added backend hooks to make sure the CI was always saved. The hook wrote the CI automatically on every commit:

1. Before applying a WAL entry, etcd updates the in-memory CI.
2. When a transaction commits, a backend hook reads the in-memory CI and writes it to the database.

The in-memory CI is shared. Other transactions, such as the periodic commit, can run alongside the apply workflow. This sequence breaks atomicity:

1. The apply workflow sets a new CI value in memory.
2. The periodic commit runs the hook and saves that CI, before the entry's changes are saved.
3. The apply workflow finishes, saves its changes, and saves the same CI again.

Between steps 2 and 3, the database records the CI as advanced even though the entry has not been applied.

## Trigger

If a member crashes between steps 2 and 3, the saved CI already points past the entry. On restart, etcd skips that entry because it assumes it was already applied.

The issue reports and the reproduction both involve etcd crashing under heavy load:

- v3.5.0 had a separate crash bug, fixed in v3.5.1 by [#13505](https://github.com/etcd-io/etcd/pull/13505). <!-- TODO: link the crash issue if one exists -->
- All reports describe etcd under high memory pressure and occasionally running out of memory.
- The reproduction ran etcd under heavy load and killed one member at random with `SIGKILL`, which ends the process immediately.

## Detection

**Single-member cluster:** the issue can't be detected. No tool checks the database against the WAL.

**Multi-member cluster:** the member that crashed is missing the skipped changes. Its database differs from the others, so it returns a different hash from the `HashKV` gRPC call.

etcd has two experimental corruption checks based on `HashKV`:

| Flag | When it runs |
|---|---|
| `--experimental-initial-corrupt-check` | At startup |
| `--experimental-corrupt-check-time` | Periodically |

Both checks have a flaw: if `HashKV` fails, the check passes. Hashes are compared at the same `revision` (the version of the key-value store), because members apply the WAL at different speeds. If a member no longer has that revision, the call fails. This happens on very slow members, or after corruption has made revision numbers diverge.

For this issue, the check is therefore reliable only at startup, right after the crash.

## Impact

<!-- TODO: state where the three reports in the Timeline came from (production, staging, tests). -->
We are not aware of this issue causing data loss in a production environment. We made a public statement because of how serious the issue is. The main impact is lost user trust in etcd's reliability.

## Lessons learned

### What went well

- Several maintainers in different time zones worked on reproducing and fixing the issue, so someone was always working on it.
- While fixing it, we found other edge cases that could corrupt data: [#13922](https://github.com/etcd-io/etcd/issues/13922), [#13937](https://github.com/etcd-io/etcd/issues/13937).

### What went wrong

- Almost no users enable corruption detection, because it is still experimental (since v3.3). All reported cases were found manually, which made them very hard to reproduce.
- The functional tests meant to catch problems like this are unmaintained, flaky, and missing key scenarios.
- v3.5 was not qualified as thoroughly as earlier releases. Earlier maintainers ran a manual qualification process that is no longer documented or run.
- The apply code is complex enough that the fix took almost two weeks and several attempts. We had to build automatic validation for the fix ([#13885](https://github.com/etcd-io/etcd/pull/13885)).
- We recommended v3.5 for production based on limited internal feedback, without data on real adoption. Many users wait for others to find issues before upgrading, so early usage was not diverse enough to surface the bug.

### Where we got lucky

- We reproduced the issue with the functional tests only because of one workstation's setup. The tests store data under `/tmp`, which is usually an in-memory filesystem. One maintainer had `/tmp` on a regular disk, and only that setup reproduced the bug. <!-- TODO: one sentence on why an in-memory /tmp hides the bug -->

## Action items

Action items address the lessons above: keep what went well, fix what went wrong, and stop relying on luck.

**Types:**

- **Prevent:** catch data inconsistency in testing before a release ships.
- **Detect:** detect data inconsistency automatically and tell users.
- **Mitigate:** help users recover quickly.

**Priorities:**

- **P0:** critical for v3.5 reliability. Takes priority over all other work and is backported to v3.5.
- **P1:** important for the project long term. Blocks v3.6.
- **P2:** stretch goal for v3.6. Does not block it.

| Action item | Type | Priority | Tracking | Status |
|---|---|---|---|---|
| etcd testing can reproduce historical data inconsistency issues | Prevent | P0 | [#14045](https://github.com/etcd-io/etcd/issues/14045) | Done |
| etcd detects data corruption by default | Detect | P0 | [#14039](https://github.com/etcd-io/etcd/issues/14039) | Done |
| etcd testing is high quality, easy to maintain and expand | Prevent | P1 | [#13637](https://github.com/etcd-io/etcd/issues/13637) | Open |
| etcd apply code is easy to understand and validate | Prevent | P1 | TODO: open issue | Open |
| Critical etcd features are not abandoned when contributors move on | Prevent | P1 | [#13775](https://github.com/etcd-io/etcd/issues/13775) | Done |
| etcd is continuously qualified with failure injection | Prevent | P1 | [#14911](https://github.com/etcd-io/etcd/pull/14911) | Done |
| etcd can reliably detect data corruption (hash is linearizable) | Detect | P1 | TODO: open issue | Open |
| etcd checks consistency of snapshots sent between leader and followers | Detect | P1 | [#13973](https://github.com/etcd-io/etcd/issues/13973) | Done |
| Procedures to recover from data inconsistency are documented and tested | Mitigate | P1 | TODO: open issue | Open |
| etcd can immediately detect and recover from data corruption (Merkle root) | Mitigate | P2 | [#13839](https://github.com/etcd-io/etcd/issues/13839) | Open |

<!-- TODO: add or explicitly decline action items for: functional tests on an in-memory /tmp; the release qualification process; criteria for recommending a release for production. -->

## Timeline

| Date | Event |
|---|---|
| 2021-05-08 | PR that introduced the bug merged: [#12855](https://github.com/etcd-io/etcd/pull/12855) |
| 2021-06-16 | v3.5.0 released with the bug: [v3.5.0](https://github.com/etcd-io/etcd/releases/tag/v3.5.0) |
| 2021-12-01 | Data corruption reported: [#13514](https://github.com/etcd-io/etcd/issues/13514) |
| 2022-01-28 | Data corruption reported: [#13654](https://github.com/etcd-io/etcd/issues/13654) |
| 2022-03-08 | Data corruption reported: [#13766](https://github.com/etcd-io/etcd/issues/13766) |
| 2022-03-25 | Maintainer confirmed the corruption: [comment](https://github.com/etcd-io/etcd/issues/13766#issuecomment-1078897588) |
| 2022-03-29 | Statement sent to etcd-dev@googlegroups.com and dev@kubernetes.io |
| 2022-04-24 <!-- TODO: verify; this is after the document date --> | v3.5.3 released with the fix: [v3.5.3](https://github.com/etcd-io/etcd/releases/tag/v3.5.3) |
```
