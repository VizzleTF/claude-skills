## Summary of Issues Fixed

I found and fixed **10 issues** in the document:

| Issue | Location | Problem | Fix |
|-------|----------|---------|-----|
| 1 | Line 14 | Spelling: "loosing" should be "losing" | Corrected spelling and improved clarity: "losing user trust in etcd reliability" |
| 2 | Line 48 | Grammar: "before to apply workflow" | Changed to: "before the apply workflow finished" |
| 3 | Line 51 | Awkward phrasing: "This follows the issue reports" | Changed to: "This is consistent with the issue reports" |
| 4 | Line 52 | Double "that" awkwardness: "bug...that...that was fixed" | Simplified: "a bug that could cause crashes; this bug was fixed in v3.5.1" |
| 5 | Line 59 | Awkward grammar: "state database matches" | Changed to: "the database state matches the WAL" |
| 6 | Line 62 | Awkward grammar: "will have different state of database" | Improved to: "its database state will differ" |
| 7 | Line 73 | Imprecise timing: "just after etcd crashes" | Changed to: "during etcd startup following a crash" |
| 8 | Line 92 | Wrong tense: "No users enable" (present) vs. past context | Changed to past tense: "No users enabled" and improved flow |
| 9 | **Line 96** | **CRITICAL: Broken sentence** - Grammatically incomplete with "..." fragment | Rewrote completely with coherent thought: explains that v3.5 was recommended too early without diverse testing, and users delayed adoption |
| 10 | **Line 138** | **CRITICAL: Chronological error** - "2021-01-28" is before v3.5.0 release (2021-06-16) | Corrected to: "2022-01-28" (January 2022, not 2021) |

**Additional improvements:**
- Line 78: Added "of" and clarified: "not aware of any cases" instead of "not aware any cases"
- Line 80: Added article "the" for clarity: "the issue was" and "The main impact" 

---

## Complete Final Document

```markdown
# v3.5 data inconsistency postmortem

|         |            |
|---------|------------|
| Authors | etcd maintainers |
| Date    | 2022-04-20 |
| Status  | published  |

## Summary

|         |                                                                                                                                                                                                                               |
|---------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Summary | Code refactor in v3.5.0 resulted in consistent index not being saved atomically. Independent crash could lead to committed transactions not being reflected on all the members.                                                 |
| Impact  | No user reported problems in production as triggering the issue required frequent crashes, however issue was critical enough to motivate a public statement. Main impact comes from losing user trust in etcd reliability. |

## Background

etcd v3 state is preserved on disk in two forms write ahead log (WAL) and database state (DB).
etcd v3.5 also still maintains v2 state, however it's deprecated and not relevant to the issue in this postmortem.

WAL stores history of changes for etcd state and database represents state at one point. 
To know which point of history database is representing, it stores consistent index (CI).
It's a special metadata field that points to last entry in WAL that it has seen.

When etcd is updating database state, it replays entries from WAL and updates the consistent index to point to new entry.
This operation is required to be [atomic](https://en.wikipedia.org/wiki/Atomic_commit). 
A partial fail would mean that database and WAL would no longer match, so some entries would be either skipped (if only CI is updated) or executed twice (if only changes are applied).
This is especially important for distributed system like etcd, where there are multiple cluster members, each applying the WAL entries to their database.
Correctness of the system depends on assumption that every member of the cluster, while replying WAL entries, will reach the same state.

## Root cause

To simplify managing consistency index, etcd has introduced backend hooks in https://github.com/etcd-io/etcd/pull/12855.
Goal was to ensure that consistency index is always updated, by automatically triggering update during commit.
Implementation was as follows, before applying the WAL entries, etcd updated in memory value of consistent index. 
As part of transaction commit process, a database hook would read the value of consistent index and store it to database. 

Problem is that in memory value of consistent index is shared, and there might be other in flight transactions apart from serial WAL apply flow.
So if we imagine scenario:
1. etcd server starts an apply workflow, and it just sets a new consistent index value.
2. The periodic commit is triggered, and it executes the backend hook and saves consistent index from apply workflow.
3. etcd server finished an apply workflow, saves new changes and saves same value of consistent index again.

Between second and third point there is a very small window where consistent index is increased without applying entry from WAL.

## Trigger

If etcd crashed after consistency index is saved, but before the apply workflow finished, it would lead to data inconsistency.
When recovering the data etcd would skip executing changes from failed apply workflow, assuming they have been already executed.

This is consistent with the issue reports and code used to reproduce the issue, where the trigger was etcd crashing under high request load.
Etcd v3.5.0 was released with a bug (https://github.com/etcd-io/etcd/pull/13505) that could cause crashes; this bug was fixed in v3.5.1.
Apart from that all reports described etcd running under high memory pressure, causing it to go out of memory from time to time.
Reproduction run etcd under high stress and randomly killed one of the members using SIGKILL signal (not recoverable immediate process death). 

## Detection

For single member cluster it is totally undetectable. 
There is no mechanism or tool for verifying that the database state matches the WAL.  

In a cluster with multiple members, a crashed member will be missing changes from the failed apply workflow.
This means its database state will differ and it will return a different hash via the `HashKV` gRPC call.

There is an automatic mechanism to detect data inconsistency. 
It can be executed during etcd start via `--experimental-initial-corrupt-check` and periodically via `--experimental-corrupt-check-time`.
Both checks however have a flaw, they depend on `HashKV` grpc method, which might fail causing the check to pass.

In multi member etcd cluster, each member can run with different performance and be at different stage of applying the WAL log.
Comparing database hashes between multiple etcd members requires all hashes to be calculated at the same change.
This is done by requesting hash for the same `revision` (version of key value store). 
However, it will not work if the provided revision is not available on the members.
This can happen on very slow members, or in cases where corruption has lead revision numbers to diverge.

This means that for this issue, the corrupt check is only reliable during etcd startup following a crash.

## Impact

We are not aware of any cases of users reporting data corruption in production.

However, the issue was critical enough to motivate a public statement. 
The main impact comes from losing user trust in etcd reliability.

## Lessons learned

### What went well

* Multiple maintainers were able to work effectively on reproducing and fixing the issue. As they are in different timezones, there was always someone working on the issue.
* When fixing the main data inconsistency we have found multiple other edge cases that could lead to data corruption (https://github.com/etcd-io/etcd/issues/13514, https://github.com/etcd-io/etcd/issues/13922, https://github.com/etcd-io/etcd/issues/13937).

### What went wrong

* No users enabled data corruption detection as it was still an experimental feature introduced in v3.3. All reported cases were detected manually, making it almost impossible to reproduce.
* etcd has functional tests designed to detect such problems, however they are unmaintained, flaky and are missing crucial scenarios.
* etcd v3.5 release was not qualified as comprehensive as previous ones. Older maintainers run manual qualification process that is no longer known or executed.
* etcd apply code is so complicated that fixing the data inconsistency took almost 2 weeks and multiple tries. Fix needed to be so complicated that we needed to develop automatic validation for it (https://github.com/etcd-io/etcd/pull/13885).
* etcd v3.5 was recommended for production based on internal feedback alone, without time for diverse real-world usage patterns to reveal issues. Users were reluctant to adopt until others had tested it, delaying issue discovery.

### Where we got lucky

* We reproduced the issue using etcd functional only because weird partition setup on workstation. Functional tests store etcd data under `/tmp` usually mounted to in memory filesystem. Problem was reproduced only because one of the maintainers has `/tmp` mounted to standard disk.

## Action items

Action items should directly address items listed in lessons learned. 
We should double down on things that went well, fix things that went wrong, and stop depending on luck.

Action fall under three types, and we should have at least one item per type. Types:
* Prevent - Prevent similar issues from occurring. In this case, what testing we should introduce to find data inconsistency issues before release, preventing publishing broken release.
* Detect - Be more effective in detecting when similar issues occur. In this case, improve mechanism to detect data inconsistency issue so users will be automatically informed.
* Mitigate - Reduce time to recovery for users. In this case, how we ensure that users are able to quickly fix data inconsistency.

Actions should not be restricted to fixing the immediate issues and also propose long term strategic improvements.
To reflect this action items should have assigned priority: 
* P0 - Critical for reliability of the v3.5 release. Should be prioritized this over all other work and backported to v3.5.
* P1 - Important for long term success of the project. Blocks v3.6 release.
* P2 - Stretch  goals that would be nice to have for v3.6, however should not be blocking.

| Action Item                                                                         | Type     | Priority | Bug                                          | Status |
|-------------------------------------------------------------------------------------|----------|----------|----------------------------------------------|--------|
| etcd testing can reproduce historical data inconsistency issues                     | Prevent  | P0       | https://github.com/etcd-io/etcd/issues/14045 | DONE   |
| etcd detects data corruption by default                                             | Detect   | P0       | https://github.com/etcd-io/etcd/issues/14039 | DONE   |
| etcd testing is high quality, easy to maintain and expand                           | Prevent  | P1       | https://github.com/etcd-io/etcd/issues/13637 |        |
| etcd apply code should be easy to understand and validate correctness               | Prevent  | P1       |                                              |        |
| Critical etcd features are not abandoned when contributors move on                  | Prevent  | P1       | https://github.com/etcd-io/etcd/issues/13775 | DONE   |
| etcd is continuously qualified with failure injection                               | Prevent  | P1       | https://github.com/etcd-io/etcd/pull/14911   | DONE   |
| etcd can reliably detect data corruption (hash is linearizable)                     | Detect   | P1       |                                              |        |
| etcd checks consistency of snapshots sent between leader and followers              | Detect   | P1       | https://github.com/etcd-io/etcd/issues/13973 | DONE   |
| etcd recovery from data inconsistency procedures are documented and tested          | Mitigate | P1       |                                              |        |
| etcd can imminently detect and recover from data corruption (implement Merkle root) | Mitigate | P2       | https://github.com/etcd-io/etcd/issues/13839 |        |

## Timeline

| Date       | Event                                                                                                                 |
|------------|-----------------------------------------------------------------------------------------------------------------------|
| 2021-05-08 | Pull request that caused data corruption was merged - https://github.com/etcd-io/etcd/pull/12855                      |
| 2021-06-16 | Release v3.5.0 with data corruption was published - https://github.com/etcd-io/etcd/releases/tag/v3.5.0               |
| 2021-12-01 | Report of data corruption - https://github.com/etcd-io/etcd/issues/13514                                              |
| 2022-01-28 | Report of data corruption - https://github.com/etcd-io/etcd/issues/13654                                              |
| 2022-03-08 | Report of data corruption - https://github.com/etcd-io/etcd/issues/13766                                              |
| 2022-03-25 | Corruption confirmed by one of the maintainers - https://github.com/etcd-io/etcd/issues/13766#issuecomment-1078897588 |
| 2022-03-29 | Statement about the corruption was sent to etcd-dev@googlegroups.com and dev@kubernetes.io                            |
| 2022-04-24 | Release v3.5.3 with fix was published - https://github.com/etcd-io/etcd/releases/tag/v3.5.3                           |
```
