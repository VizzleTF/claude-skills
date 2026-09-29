## Findings

1. **Summary/Impact and the "Impact" section** say no user reported a problem, and the Timeline lists three user reports of data corruption (issues 13514, 13654, 13766). Both statements can't be true. Also, "required frequent crashes" contradicts Trigger, which says crashes were "from time to time". Fix: replace the claim with the count of reports, say what is known about production, and describe the trigger as a crash between two commits. I don't know whether any report came from production, so I left a placeholder. Impact was also written twice, with no numbers. I merged it into one section with derived numbers: affected versions v3.5.0–v3.5.2, about 10 months of exposure, and 3 reports.
2. **Header `Date` (2022-04-20) and the last Timeline row (v3.5.3 published 2022-04-24):** the postmortem is dated before its own last event. The Action items also cite issues and a PR (14911) that are newer than 2022-04-20. The document was edited after publication without saying so. Fix: I set the release date to 2022-04-13 and marked the document date as `<DATE>`. I took the 04-13 date from memory of the v3.5.3 release page, so check it. Then add a `Last updated` line.
3. **Timeline, 2021-01-28 (issue 13654):** this date is before the v3.5.0 release (2021-06-16) and out of order. Issue numbers place it between 13514 (Dec 2021) and 13766 (Mar 2022). Fix: 2022-01-28.
4. **"What went well", the list of "other edge cases":** it includes issue 13514, which the Timeline names as the first corruption report, not a side finding. Fix: remove 13514 from that list.
5. **"What went wrong", apply-code bullet:** "almost 2 weeks" matches neither the confirmation-to-release interval (2022-03-25 to 2022-04-13, 19 days) nor the interval with the current release date (30 days). Fix: state the dates instead.
6. **"What went wrong", last bullet:** the sentence about production recommendations is garbled ("based on after some internal feedback… the user's hold on"). I rewrote it from the likely meaning, so the author should confirm it. It also has no matching action item; the table has none for release-recommendation criteria.
7. **Detection:**
   - It says both corruption checks can pass when `HashKV` fails.
   - It then concludes the check is "only reliable during etcd start just after etcd crashes" without saying why the start-up check escapes the flaw.
   - Fix: add the reason, or narrow the claim.
   - Read as written, the `--experimental-corrupt-check-time` periodic check should not be described as reliable at all.
8. **Action items table:**
   - Rows have no owner or due date.
   - Three rows have no link.
   - Open rows have an empty Status.
   - The "Bug" column holds a PR.
   - "Merkle root" is typed Mitigate but is a detection feature.
   - "imminently" should be "immediately".
   - Fix: add Owner and Due columns, use `<ISSUE_LINK>` and `<OWNER>` placeholders, put `OPEN` in Status, rename the column to "Link", and cut the template boilerplate above the table.
9. **Missing for the stated readers:** the document doesn't say which versions are affected, which version fixes the problem, or what a v3.5 user should do. It also doesn't say what the causes and contributing factors are. I added an "Affected versions and what to do" block and a "Contributing factors" list. I took the contributing factors from "What went wrong".
10. **Terms and typos:**
    - "consistent index" and "consistency index" both appear. I used "consistent index".
    - "loosing" should be "losing".
    - "replying WAL" should be "replaying WAL".
    - "where detected" should be "were detected".
    - "Action fall" should be "Actions fall".
    - "etcd functional" should be "etcd functional tests".
    - The Summary sentence "could lead to committed transactions are not reflected" is ungrammatical.
    - The Timeline has no time zone. Events are dates only, and I noted that.

Verdict: ready after the listed fixes. Items 1, 2 and 8 need input from the authors.

## Final document

```markdown
# v3.5 data inconsistency postmortem

|              |                  |
|--------------|------------------|
| Authors      | etcd maintainers |
| Date         | <DATE>           |
| Last updated | <DATE>           |
| Status       | published        |

## Summary

A code refactor in v3.5.0 caused the consistent index to be saved non-atomically with the changes it describes. If a member crashed at the wrong moment, committed transactions were not reflected on that member. The bug was fixed in v3.5.3.

## Affected versions and what to do

* Affected: v3.5.0, v3.5.1 and v3.5.2.
* Fixed: v3.5.3. Upgrade if you run an affected version.
* Detection: enable `--experimental-initial-corrupt-check`. Restart a member after any crash and let the check run at start (see [Detection](#detection) for its limits).
* A single-member cluster cannot detect this problem.

## Impact

* Three users reported data corruption (see Timeline): issues 13514, 13654 and 13766.
* <PRODUCTION_IMPACT: how many of the three reports came from production environments, and whether data was lost>
* The bug shipped on 2021-06-16 and was fixed on 2022-04-13, about 10 months.
* Triggering it required a crash at a specific moment, and all reports described etcd running under high load or memory pressure.
* The issue was serious enough to motivate a public statement. The main damage was loss of user trust in etcd reliability.

## Background

etcd v3 state is preserved on disk in two forms: the write ahead log (WAL) and the database state (DB).
etcd v3.5 also still maintains v2 state. It is deprecated and not relevant to this postmortem.

The WAL stores the history of changes to etcd state. The database represents state at one point in that history.
To know which point the database represents, it stores the consistent index (CI), a metadata field that points to the last WAL entry the database has seen.

When etcd updates the database, it replays entries from the WAL and updates the consistent index to point to the new entry.
This operation must be [atomic](https://en.wikipedia.org/wiki/Atomic_commit).
A partial failure would mean the database and the WAL no longer match. Some entries would be either skipped (if only the CI is updated) or executed twice (if only the changes are applied).
This matters for a distributed system like etcd, where every cluster member applies WAL entries to its own database.
Correctness depends on every member reaching the same state while replaying WAL entries.

## Root cause

To simplify managing the consistent index, etcd introduced backend hooks in https://github.com/etcd-io/etcd/pull/12855.
The goal was to guarantee that the consistent index is always updated, by triggering the update automatically during commit.
Before applying WAL entries, etcd updated the in-memory value of the consistent index.
During a transaction commit, a database hook read that value and stored it in the database.

The in-memory value is shared, and other in-flight transactions can commit besides the serial WAL apply flow. For example:
1. The etcd server starts an apply workflow and sets a new consistent index value.
2. The periodic commit is triggered. It runs the backend hook and saves the consistent index set by the apply workflow.
3. The apply workflow finishes, saves the new changes and saves the same consistent index value again.

Between steps 2 and 3 there is a small window where the saved consistent index is ahead of the applied WAL entries.

### Contributing factors

See "What went wrong" below: no maintained tests able to catch the problem, corruption detection disabled by default, a less thorough release qualification, and apply code that was hard to reason about.

## Trigger

If etcd crashed after the consistent index was saved but before the apply workflow finished, the member became inconsistent with the rest of the cluster.
On recovery, etcd skipped the changes from the failed apply workflow, assuming they had already been executed.

The issue reports and the reproduction code point to etcd crashing under high request load.
v3.5.0 also shipped with a bug that could crash etcd (https://github.com/etcd-io/etcd/pull/13505), fixed in v3.5.1.
Other reports described etcd running under high memory pressure and going out of memory from time to time.
The reproduction ran etcd under high stress and randomly killed one member with SIGKILL (immediate process death that the process cannot handle).

## Detection

A single-member cluster cannot detect this problem.
No mechanism or tool verifies that the database matches the WAL.

In a multi-member cluster, a member that crashed is missing the changes from the failed apply workflow.
Its database state differs, so it returns a different hash from the `HashKV` gRPC call.

etcd has an automatic mechanism for detecting data inconsistency.
It can run at etcd start with `--experimental-initial-corrupt-check` and periodically with `--experimental-corrupt-check-time`.
Both checks have a flaw: they depend on the `HashKV` gRPC method, and when it fails the check passes.

Members of a multi-member cluster run at different speeds and can be at different points in the WAL.
Comparing database hashes requires all hashes to be calculated at the same change, so etcd requests the hash for the same `revision` (a version of the key-value store).
This does not work if a member doesn't have the requested revision.
That can happen on very slow members, or when corruption has made revision numbers diverge.

For this issue, the corruption check is therefore reliable only at etcd start, right after a crash. <REASON: why the start-up check is not affected by the HashKV failure mode>

## Lessons learned

### What went well

* Maintainers in different time zones worked on reproducing and fixing the issue, so someone was always working on it.
* While fixing the main data inconsistency, we found other edge cases that could lead to data corruption (https://github.com/etcd-io/etcd/issues/13922, https://github.com/etcd-io/etcd/issues/13937).

### What went wrong

* No users enabled data corruption detection, because it is still an experimental feature introduced in v3.3. All reported cases were detected manually, which made them almost impossible to reproduce.
* etcd has functional tests designed to detect such problems. They are unmaintained, flaky and miss crucial scenarios.
* The v3.5 release was qualified less thoroughly than previous ones. Earlier maintainers ran a manual qualification process that is no longer known or executed.
* The apply code is complicated. Fixing the inconsistency took multiple attempts, from confirmation on 2022-03-25 to the v3.5.3 release on 2022-04-13. The fix was complicated enough that we developed automatic validation for it (https://github.com/etcd-io/etcd/pull/13885).
* v3.5 was recommended for production with little insight into production adoption. The recommendation rested on limited internal feedback. We hoped to get diverse usage, but users held off until someone else discovered issues.

### Where we got lucky

* We reproduced the issue with the etcd functional tests only because of an unusual partition setup on a maintainer's workstation. The functional tests store etcd data under `/tmp`, which is usually mounted on an in-memory filesystem. The problem reproduced only because one maintainer had `/tmp` on a standard disk.

## Action items

Each action item addresses an entry in the lessons learned. There are three types:
* Prevent: testing that finds data inconsistency before release.
* Detect: mechanisms that inform users automatically when data inconsistency occurs.
* Mitigate: shorter recovery time for users.

Priorities:
* P0: critical for the reliability of v3.5. Takes precedence over other work and is backported to v3.5.
* P1: important for the long-term success of the project. Blocks the v3.6 release.
* P2: stretch goal for v3.6. Does not block it.

| Action item                                                                    | Type     | Priority | Link                                         | Owner     | Due          | Status |
|--------------------------------------------------------------------------------|----------|----------|----------------------------------------------|-----------|--------------|--------|
| etcd testing can reproduce historical data inconsistency issues                | Prevent  | P0       | https://github.com/etcd-io/etcd/issues/14045 | n/a       | n/a          | DONE   |
| etcd detects data corruption by default                                        | Detect   | P0       | https://github.com/etcd-io/etcd/issues/14039 | n/a       | n/a          | DONE   |
| etcd testing is high quality, easy to maintain and expand                      | Prevent  | P1       | https://github.com/etcd-io/etcd/issues/13637 | <OWNER>   | <DUE_DATE>   | OPEN   |
| etcd apply code should be easy to understand and validate correctness          | Prevent  | P1       | <ISSUE_LINK>                                 | <OWNER>   | <DUE_DATE>   | OPEN   |
| Critical etcd features are not abandoned when contributors move on             | Prevent  | P1       | https://github.com/etcd-io/etcd/issues/13775 | n/a       | n/a          | DONE   |
| etcd is continuously qualified with failure injection                          | Prevent  | P1       | https://github.com/etcd-io/etcd/pull/14911   | n/a       | n/a          | DONE   |
| etcd can reliably detect data corruption (hash is linearizable)                | Detect   | P1       | <ISSUE_LINK>                                 | <OWNER>   | <DUE_DATE>   | OPEN   |
| etcd checks consistency of snapshots sent between leader and followers         | Detect   | P1       | https://github.com/etcd-io/etcd/issues/13973 | n/a       | n/a          | DONE   |
| etcd recovery from data inconsistency procedures are documented and tested     | Mitigate | P1       | <ISSUE_LINK>                                 | <OWNER>   | <DUE_DATE>   | OPEN   |
| etcd can immediately detect and recover from data corruption (Merkle root)     | Detect   | P2       | https://github.com/etcd-io/etcd/issues/13839 | <OWNER>   | <DUE_DATE>   | OPEN   |
| Release recommendations for production require evidence of production adoption | Prevent  | P1       | <ISSUE_LINK>                                 | <OWNER>   | <DUE_DATE>   | OPEN   |

## Timeline

Dates are given without a time of day.

| Date       | Event                                                                                                                 |
|------------|-----------------------------------------------------------------------------------------------------------------------|
| 2021-05-08 | Pull request that caused data corruption was merged - https://github.com/etcd-io/etcd/pull/12855                      |
| 2021-06-16 | Release v3.5.0 with data corruption was published - https://github.com/etcd-io/etcd/releases/tag/v3.5.0               |
| 2021-12-01 | Report of data corruption - https://github.com/etcd-io/etcd/issues/13514                                              |
| 2022-01-28 | Report of data corruption - https://github.com/etcd-io/etcd/issues/13654                                              |
| 2022-03-08 | Report of data corruption - https://github.com/etcd-io/etcd/issues/13766                                              |
| 2022-03-25 | Corruption confirmed by one of the maintainers - https://github.com/etcd-io/etcd/issues/13766#issuecomment-1078897588 |
| 2022-03-29 | Statement about the corruption was sent to etcd-dev@googlegroups.com and dev@kubernetes.io                            |
| 2022-04-13 | Release v3.5.3 with fix was published - https://github.com/etcd-io/etcd/releases/tag/v3.5.3                           |
```

Questions for the authors:
1. Did any of the three reports come from a production environment (`<PRODUCTION_IMPACT>`)?
2. Is 2022-04-13 the correct v3.5.3 release date, and what should the `Date` and `Last updated` fields say?
3. Why is the start-up corruption check unaffected by the `HashKV` failure mode (`<REASON>`)? Who owns the open action items, and when are they due?
