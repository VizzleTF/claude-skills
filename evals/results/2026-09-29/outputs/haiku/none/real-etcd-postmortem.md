Now I'll review the document systematically for problems and factual inconsistencies.

## Issues Found

### **Structural & Clarity Issues**

1. **Line 96-97: Incomplete/garbled sentence**
   - Text: "etcd v3.5 was recommended for production without enough insight on the production adoption. Production ready recommendations based on after some internal feedback... to get diverse usage, but the user's hold on till someone else will discover issues."
   - Problems: Grammatically broken ("based on after"), unclear meaning, incomplete thought marked by "..."
   - Fix: Rewrite clearly, e.g., "v3.5 was recommended for production prematurely without sufficient production adoption data or testing. This created a situation where early adopters bore the risk of discovery."

2. **Line 29: Typo**
   - Text: "while replying WAL entries"
   - Fix: "while **replaying** WAL entries"

3. **Line 48: Grammar error**
   - Text: "before to apply workflow finished"
   - Fix: "before the apply workflow finished"

4. **Line 52: Awkward phrasing**
   - Text: "This follows the issue reports and code used to reproduce the issue where trigger was etcd crashing"
   - Fix: "This is consistent with issue reports and reproduction code, where the trigger was etcd crashing"

---

### **Factual Inconsistencies**

1. **Line 138: Chronological error in timeline**
   - Text shows: "2021-01-28 | Report of data corruption"
   - Problem: This date (January 28) appears AFTER 2021-12-01 (December 1) in the timeline, which is impossible
   - Fix: Change to **2021-12-28** or **2022-01-28** (most likely 2021-12-28 to fit the sequence)

2. **Lines 59 vs. 64-66: Contradictory statements about detection mechanisms**
   - Line 59: "There is no mechanism or tool for verifying that state database matches WAL."
   - Lines 64-66: Describes automatic detection via `HashKV` and corrupt check flags
   - Problem: These contradict each other
   - Fix: Line 59 should say "There is no **reliable** mechanism" or specify "for single-member clusters"

3. **Lines 65-66: Logic error**
   - Text: "Both checks however have a flaw, they depend on `HashKV` grpc method, **which might fail causing the check to pass**."
   - Problem: If a check fails, it shouldn't "pass"—this is logically contradictory
   - Fix: "which might fail or timeout, **causing false negatives** (the check passes even though corruption exists)"

---

### **Content Clarity Issues**

1. **Lines 40-44: Confusing transaction model**
   - The description of the race condition mixes "periodic commit" with "apply workflow" in a way that's unclear about when atomicity is supposed to be guaranteed
   - Fix: Clarify that the apply workflow updates CI in-memory, but the periodic commit (separate from the apply transaction) writes CI to disk—creating a window where CI on disk diverges from CI in memory

---

## Summary Table

| Line(s) | Problem | Type | Fix |
|---------|---------|------|-----|
| 96-97 | Garbled sentence, incomplete thought | Clarity | Rewrite completely |
| 29 | "replying" → "replaying" | Typo | Replace word |
| 48 | "before to apply" → "before the apply" | Grammar | Replace phrase |
| 52 | Awkward phrasing | Clarity | Rephrase |
| 138 | 2021-01-28 out of chronological order | Factual Error | Change to 2021-12-28 |
| 59 | Contradicts later claim of detection mechanism | Logical Inconsistency | Add "reliable" or clarify scope |
| 65-66 | "fail causing the check to pass" is contradictory | Logic Error | Change to "false negatives" |
| 40-44 | Unclear when atomicity applies in transaction flow | Clarity | Add more detail on transaction vs. periodic commit separation |

---

## Corrected Document

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
| Impact  | No user reported problems in production as triggering the issue required frequent crashes; however the issue was critical enough to motivate a public statement. Main impact comes from losing user trust in etcd reliability. |

## Background

etcd v3 state is preserved on disk in two forms: write ahead log (WAL) and database state (DB).
etcd v3.5 also still maintains v2 state, however it's deprecated and not relevant to the issue in this postmortem.

WAL stores history of changes for etcd state and the database represents state at one point. 
To know which point of history the database is representing, it stores a consistent index (CI).
It's a special metadata field that points to the last entry in WAL that it has seen.

When etcd is updating database state, it replays entries from WAL and updates the consistent index to point to the new entry.
This operation is required to be [atomic](https://en.wikipedia.org/wiki/Atomic_commit). 
A partial failure would mean that database and WAL would no longer match, so some entries would be either skipped (if only CI is updated) or executed twice (if only changes are applied).
This is especially important for distributed systems like etcd, where there are multiple cluster members, each applying the WAL entries to their database.
Correctness of the system depends on the assumption that every member of the cluster, while replaying WAL entries, will reach the same state.

## Root cause

To simplify managing consistency index, etcd introduced backend hooks in https://github.com/etcd-io/etcd/pull/12855.
The goal was to ensure that consistency index is always updated by automatically triggering an update during commit.
The implementation was as follows: before applying the WAL entries, etcd updated the in-memory value of consistent index. 
As part of the transaction commit process, a database hook would read the value of consistent index and store it to the database. 

The problem is that the in-memory value of consistent index is shared, and there might be other in-flight transactions apart from the serial WAL apply flow.
So imagine this scenario:
1. etcd server starts an apply workflow and sets a new consistent index value.
2. The periodic commit is triggered, and it executes the backend hook and saves the consistent index from the apply workflow.
3. etcd server finishes the apply workflow, saves new changes, and saves the same value of consistent index again.

Between the second and third points there is a very small window where consistent index is increased without applying the entry from WAL.

## Trigger

If etcd crashed after the consistency index is saved but before the apply workflow finished, it would lead to data inconsistency.
When recovering the data, etcd would skip executing changes from the failed apply workflow, assuming they have already been executed.

This is consistent with issue reports and reproduction code, where the trigger was etcd crashing under high request load.
Etcd v3.5.0 was released with a bug (https://github.com/etcd-io/etcd/pull/13505) that could cause etcd to crash, which was fixed in v3.5.1.
Apart from that, all reports described etcd running under high memory pressure, causing it to run out of memory from time to time. 
Reproduction involved running etcd under high stress and randomly killing one of the members using the SIGKILL signal (unrecoverable immediate process death). 

## Detection

For a single-member cluster, this issue is totally undetectable. 
There is no reliable mechanism or tool for verifying that the state database matches WAL.  

In a cluster with multiple members, it would mean that one of the members that crashed will be missing changes from the failed apply workflow.
This means that it will have different database state and will return a different hash via the `HashKV` gRPC call.

There is an automatic mechanism to detect data inconsistency. 
It can be executed during etcd startup via `--experimental-initial-corrupt-check` and periodically via `--experimental-corrupt-check-time`.
Both checks, however, have a flaw: they depend on the `HashKV` gRPC method, which might fail or timeout, causing false negatives (the check passes even though corruption exists).

In a multi-member etcd cluster, each member can run with different performance and be at a different stage of applying the WAL log.
Comparing database hashes between multiple etcd members requires all hashes to be calculated at the same change.
This is done by requesting hash for the same `revision` (version of the key-value store). 
However, it will not work if the provided revision is not available on the members.
This can happen on very slow members, or in cases where corruption has led revision numbers to diverge.

This means that for this issue, the corrupt check is only reliable during etcd startup just after etcd crashes.

## Impact

We are not aware of any cases of users reporting data corruption in production environments.

However, the issue was critical enough to motivate a public statement. 
The main impact comes from losing user trust in etcd reliability.

## Lessons learned

### What went well

* Multiple maintainers were able to work effectively on reproducing and fixing the issue. As they are in different timezones, there was always someone working on the issue.
* When fixing the main data inconsistency, we found multiple other edge cases that could lead to data corruption (https://github.com/etcd-io/etcd/issues/13514, https://github.com/etcd-io/etcd/issues/13922, https://github.com/etcd-io/etcd/issues/13937).

### What went wrong

* No users enabled data corruption detection as it is still an experimental feature introduced in v3.3. All reported cases were detected manually, making it almost impossible to reproduce.
* etcd has functional tests designed to detect such problems, however they are unmaintained, flaky, and missing crucial scenarios.
* etcd v3.5 release was not qualified as comprehensively as previous ones. Older maintainers ran a manual qualification process that is no longer known or executed.
* The etcd apply code is so complicated that fixing the data inconsistency took almost 2 weeks and multiple attempts. The fix was so complex that we needed to develop automatic validation for it (https://github.com/etcd-io/etcd/pull/13885).
* etcd v3.5 was recommended for production prematurely without sufficient insight into production adoption or adequate testing. This created a situation where early adopters bore the risk of discovering issues that should have been caught in qualification.

### Where we got lucky

* We reproduced the issue in etcd functional tests only because of a weird partition setup on a workstation. Functional tests typically store etcd data under `/tmp`, which is usually mounted as an in-memory filesystem. The problem was reproduced only because one of the maintainers had `/tmp` mounted to a standard disk.

## Action items

Action items should directly address items listed in lessons learned. 
We should double down on things that went well, fix things that went wrong, and stop depending on luck.

Actions fall under three types, and we should have at least one item per type. Types:
* Prevent - Prevent similar issues from occurring. In this case, what testing we should introduce to find data inconsistency issues before release, preventing the publication of a broken release.
* Detect - Be more effective in detecting when similar issues occur. In this case, improve the mechanism to detect data inconsistency issues so users will be automatically informed.
* Mitigate - Reduce recovery time for users. In this case, how we ensure that users are able to quickly fix data inconsistency.

Actions should not be restricted to fixing immediate issues and should also propose long-term strategic improvements.
To reflect this, action items should have assigned priority: 
* P0 - Critical for reliability of the v3.5 release. Should be prioritized over all other work and backported to v3.5.
* P1 - Important for long-term success of the project. Blocks v3.6 release.
* P2 - Stretch goals that would be nice to have for v3.6, however should not be blocking.

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
| 2021-12-28 | Report of data corruption - https://github.com/etcd-io/etcd/issues/13654                                              |
| 2022-03-08 | Report of data corruption - https://github.com/etcd-io/etcd/issues/13766                                              |
| 2022-03-25 | Corruption confirmed by one of the maintainers - https://github.com/etcd-io/etcd/issues/13766#issuecomment-1078897588 |
| 2022-03-29 | Statement about the corruption was sent to etcd-dev@googlegroups.com and dev@kubernetes.io                            |
| 2022-04-24 | Release v3.5.3 with fix was published - https://github.com/etcd-io/etcd/releases/tag/v3.5.3                           |
```
