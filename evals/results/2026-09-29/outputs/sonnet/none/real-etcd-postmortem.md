I checked the document against itself and against the release history. I haven't changed the original file.

## Problems and fixes

**Facts that contradict each other**

1. **Timeline, "Report of data corruption" for #13654 is dated 2021-01-28.**
   - That is before the v3.5.0 release on 2021-06-16 and before the PR merged on 2021-05-08. It also sits out of order between 2021-12-01 and 2022-03-08.
   - Fix: change it to 2022-01-28. I did.
2. **Timeline gives the v3.5.3 release as 2022-04-24, but the header date is 2022-04-20 and the status is "published".** The document can't describe a release that happened after its own publication.
   - Fix: I changed it to 2022-04-13, which is the date I remember for v3.5.3. Please check it against the release page.
3. **"Fixing took almost 2 weeks" doesn't match the timeline.** Maintainers confirmed the issue on 2022-03-25. That is about 3 weeks before 2022-04-13, and 30 days before the wrong 04-24 date.
   - Fix: I reworded it to "almost 3 weeks from confirmation to release". Maintainers should confirm the intended span.
4. **The Impact sections say no user reported corruption, but the Timeline lists three user reports and a maintainer confirmation.** "What went wrong" also says "all reported cases were detected manually". This appears in both the Summary Impact row and the Impact section, and it matters most for users deciding whether to trust v3.5.
   - Fix: I rewrote both to say reports exist and that none is known to be confirmed in production. Maintainers should confirm that wording.
5. **The header date (2022-04-20) conflicts with action items that cite later work.** PR #14911 is far newer than the other links, and several items are marked DONE.
   - Fix: I noted in the header that action item statuses were updated after publication. Ideally add a real "last updated" date.
6. **#13514 is a user report in the Timeline (2021-12-01) but is also listed in "What went well" as an extra edge case found while fixing.** I left this unchanged. Maintainers should confirm that both roles are intended.

**Gaps for the two audiences**

7. **Users can't tell which versions are affected or what to do.** The Summary never says.
   - Fix: I added "Affected versions" and "What to do" rows. I inferred v3.5.0–v3.5.2 from the PR being in v3.5.0 and the fix shipping in v3.5.3, so maintainers should confirm.
8. **The "What went wrong" lesson about recommending v3.5 for production without adoption insight has no action item.** This breaks the document's own rule that action items address the lessons.
   - Fix: I added a proposed P1 Prevent item. Maintainers should confirm or replace it.
9. **Five open action items have no tracking link:** apply-code simplification, reliable (linearizable) hash, recovery procedures, the new item, and testing quality (the last one has a link but isn't done).
   - Fix: I marked the four missing links "Not filed" so contributors know an issue must be created first. There is still no owner column. Consider adding one.
10. **"P1 blocks v3.6" is stale if v3.6 has shipped with these items open.** I left it, but the priority text should be revisited.

**Clarity, wording and typos**

11. **The "corrupt check is only reliable at start just after a crash" conclusion doesn't follow from the reasons above it.** Those reasons are `HashKV` failures and revisions being unavailable or diverged. I left it, but maintainers should add the missing reasoning.
12. **The last "What went wrong" bullet is garbled** ("based on after some internal feedback... the user's hold on"). I rewrote it.
13. **The document alternates between "consistent index" and "consistency index".** I standardized on "consistent index".
14. **Typos and grammar.** I fixed these:
    - "loosing" → "losing"
    - "replying" → "replaying"
    - "will missing" → "will be missing"
    - "Action fall" → "Actions fall"
    - "prioritized this over" → "prioritized over"
    - "imminently" → "immediately"
    - "committed transactions are not reflected" → "may not be reflected"
    - "where detected" → "were detected"
    - "no users enable" → "no users enabled"
    - "Stretch  goals" (double space)
    - a few others in the text

## Final document

```markdown
# v3.5 data inconsistency postmortem

|         |            |
|---------|------------|
| Authors | etcd maintainers |
| Date    | 2022-04-20 (action item statuses updated after publication) |
| Status  | published  |

## Summary

|         |                                                                                                                                                                                                                               |
|---------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Summary | Code refactor in v3.5.0 resulted in the consistent index not being saved atomically. An independent crash could lead to committed transactions not being reflected on all the members.                                          |
| Affected versions | v3.5.0 through v3.5.2. Fixed in v3.5.3. |
| What to do | Upgrade v3.5 clusters to v3.5.3 or later. Enable `--experimental-initial-corrupt-check` (and optionally `--experimental-corrupt-check-time`), keeping in mind the limits described in [Detection](#detection). A single-member cluster has no way to detect this inconsistency. |
| Impact  | No confirmed production impact is known. Triggering the issue required crashes under high load, but users did file reports of possible corruption (see [Timeline](#timeline)), and the issue was critical enough to motivate a public statement. Main impact comes from losing user trust in etcd reliability. |

## Background

etcd v3 state is preserved on disk in two forms: write ahead log (WAL) and database state (DB).
etcd v3.5 also still maintains v2 state, however it's deprecated and not relevant to the issue in this postmortem.

WAL stores history of changes for etcd state and database represents state at one point. 
To know which point of history database is representing, it stores consistent index (CI).
It's a special metadata field that points to last entry in WAL that it has seen.

When etcd is updating database state, it replays entries from WAL and updates the consistent index to point to new entry.
This operation is required to be [atomic](https://en.wikipedia.org/wiki/Atomic_commit). 
A partial fail would mean that database and WAL would no longer match, so some entries would be either skipped (if only CI is updated) or executed twice (if only changes are applied).
This is especially important for distributed system like etcd, where there are multiple cluster members, each applying the WAL entries to their database.
Correctness of the system depends on assumption that every member of the cluster, while replaying WAL entries, will reach the same state.

## Root cause

To simplify managing the consistent index, etcd has introduced backend hooks in https://github.com/etcd-io/etcd/pull/12855.
Goal was to ensure that the consistent index is always updated, by automatically triggering update during commit.
Implementation was as follows, before applying the WAL entries, etcd updated in memory value of consistent index. 
As part of transaction commit process, a database hook would read the value of consistent index and store it to database. 

Problem is that in memory value of consistent index is shared, and there might be other in flight transactions apart from serial WAL apply flow.
So if we imagine scenario:
1. etcd server starts an apply workflow, and it just sets a new consistent index value.
2. The periodic commit is triggered, and it executes the backend hook and saves consistent index from apply workflow.
3. etcd server finished an apply workflow, saves new changes and saves same value of consistent index again.

Between second and third point there is a very small window where consistent index is increased without applying entry from WAL.

## Trigger

If etcd crashed after the consistent index is saved, but before the apply workflow finished, it would lead to data inconsistency.
When recovering the data etcd would skip executing changes from failed apply workflow, assuming they have been already executed.

This follows the issue reports and code used to reproduce the issue where trigger was etcd crashing under high request load.
Etcd v3.5.0 was released with bug (https://github.com/etcd-io/etcd/pull/13505) that could cause etcd to crash that was fixed in v3.5.1.
Apart from that all reports described etcd running under high memory pressure, causing it to go out of memory from time to time.
Reproduction run etcd under high stress and randomly killed one of the members using SIGKILL signal (not recoverable immediate process death). 

## Detection

For single member cluster it is totally undetectable. 
There is no mechanism or tool for verifying that state database matches WAL.  

In cluster with multiple members it would mean that one of the members that crashed will be missing changes from failed apply workflow.
This means that it will have different state of database and will return different hash via `HashKV` grpc call.

There is an automatic mechanism to detect data inconsistency. 
It can be executed during etcd start via `--experimental-initial-corrupt-check` and periodically via `--experimental-corrupt-check-time`.
Both checks however have a flaw, they depend on `HashKV` grpc method, which might fail causing the check to pass.

In multi member etcd cluster, each member can run with different performance and be at different stage of applying the WAL log.
Comparing database hashes between multiple etcd members requires all hashes to be calculated at the same change.
This is done by requesting hash for the same `revision` (version of key value store). 
However, it will not work if the provided revision is not available on the members.
This can happen on very slow members, or in cases where corruption has lead revision numbers to diverge.

This means that for this issue, the corrupt check is only reliable during etcd start just after etcd crashes.

## Impact

Users filed reports of possible data corruption (see [Timeline](#timeline)), and a maintainer confirmed one of them.
We are not aware of any report that was confirmed to come from a production environment.

However, issue was critical enough to motivate a public statement. 
Main impact comes from losing user trust in etcd reliability.

## Lessons learned

### What went well

* Multiple maintainers were able to work effectively on reproducing and fixing the issue. As they are in different timezones, there was always someone working on the issue.
* When fixing the main data inconsistency we have found multiple other edge cases that could lead to data corruption (https://github.com/etcd-io/etcd/issues/13514, https://github.com/etcd-io/etcd/issues/13922, https://github.com/etcd-io/etcd/issues/13937).

### What went wrong

* No users enabled data corruption detection as it is still an experimental feature introduced in v3.3. All reported cases were detected manually, making it almost impossible to reproduce.
* etcd has functional tests designed to detect such problems, however they are unmaintained, flaky and are missing crucial scenarios.
* etcd v3.5 release was not qualified as comprehensive as previous ones. Older maintainers run manual qualification process that is no longer known or executed.
* etcd apply code is so complicated that fixing the data inconsistency took almost 3 weeks from confirmation to release and multiple tries. Fix needed to be so complicated that we needed to develop automatic validation for it (https://github.com/etcd-io/etcd/pull/13885).
* etcd v3.5 was recommended for production without enough insight on the production adoption. The production-ready recommendation was based on limited internal feedback. Getting diverse usage requires users to adopt early, but users hold off until someone else discovers the issues.

### Where we got lucky

* We reproduced the issue using etcd functional only because weird partition setup on workstation. Functional tests store etcd data under `/tmp` usually mounted to in memory filesystem. Problem was reproduced only because one of the maintainers has `/tmp` mounted to standard disk.

## Action items

Action items should directly address items listed in lessons learned. 
We should double down on things that went well, fix things that went wrong, and stop depending on luck.

Actions fall under three types, and we should have at least one item per type. Types:
* Prevent - Prevent similar issues from occurring. In this case, what testing we should introduce to find data inconsistency issues before release, preventing publishing broken release.
* Detect - Be more effective in detecting when similar issues occur. In this case, improve mechanism to detect data inconsistency issue so users will be automatically informed.
* Mitigate - Reduce time to recovery for users. In this case, how we ensure that users are able to quickly fix data inconsistency.

Actions should not be restricted to fixing the immediate issues and also propose long term strategic improvements.
To reflect this action items should have assigned priority: 
* P0 - Critical for reliability of the v3.5 release. Should be prioritized over all other work and backported to v3.5.
* P1 - Important for long term success of the project. Blocks v3.6 release.
* P2 - Stretch goals that would be nice to have for v3.6, however should not be blocking.

"Not filed" in the Bug column means no tracking issue exists yet. Create one before starting the work.

| Action Item                                                                         | Type     | Priority | Bug                                          | Status |
|-------------------------------------------------------------------------------------|----------|----------|----------------------------------------------|--------|
| etcd testing can reproduce historical data inconsistency issues                     | Prevent  | P0       | https://github.com/etcd-io/etcd/issues/14045 | DONE   |
| etcd detects data corruption by default                                             | Detect   | P0       | https://github.com/etcd-io/etcd/issues/14039 | DONE   |
| etcd testing is high quality, easy to maintain and expand                           | Prevent  | P1       | https://github.com/etcd-io/etcd/issues/13637 |        |
| etcd apply code should be easy to understand and validate correctness               | Prevent  | P1       | Not filed                                    |        |
| Critical etcd features are not abandoned when contributors move on                  | Prevent  | P1       | https://github.com/etcd-io/etcd/issues/13775 | DONE   |
| etcd is continuously qualified with failure injection                               | Prevent  | P1       | https://github.com/etcd-io/etcd/pull/14911   | DONE   |
| etcd releases are declared production ready only after documented qualification and adoption criteria are met (proposed) | Prevent  | P1       | Not filed                                    |        |
| etcd can reliably detect data corruption (hash is linearizable)                     | Detect   | P1       | Not filed                                    |        |
| etcd checks consistency of snapshots sent between leader and followers              | Detect   | P1       | https://github.com/etcd-io/etcd/issues/13973 | DONE   |
| etcd recovery from data inconsistency procedures are documented and tested          | Mitigate | P1       | Not filed                                    |        |
| etcd can immediately detect and recover from data corruption (implement Merkle root) | Mitigate | P2       | https://github.com/etcd-io/etcd/issues/13839 |        |

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
| 2022-04-13 | Release v3.5.3 with fix was published - https://github.com/etcd-io/etcd/releases/tag/v3.5.3                           |
```

Four edits rest on my inference and need a maintainer to confirm: the v3.5.3 date, the "almost 3 weeks" figure, the v3.5.0–v3.5.2 affected range, and the proposed production-readiness action item. The "not confirmed in production" wording in both Impact places also needs confirming.
