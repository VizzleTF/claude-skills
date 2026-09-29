I checked the facts in the document against each other and found several problems. I fixed them in place in `v3.5-data-inconsistency.md`. A few need an author to confirm, and I've marked those.

## Problems found

### Facts that contradict each other

1. **Timeline, v3.5.3 row: the release is dated after the postmortem.** The header dates the document 2022-04-20, but the timeline says v3.5.3 shipped on 2022-04-24. As I recall, the release page gives 2022-04-13, so I changed the date to that. **Please check it against the release link.**
2. **Timeline, #13654 row: the year is wrong.** The row says 2021-01-28, which is out of order and falls before the bug was even merged (2021-05-08). I changed it to 2022-01-28.
3. **"What went well" vs. Timeline: #13514 is described two ways.** "What went well" says #13514 was an edge case found while fixing the bug. The timeline says it was a user report filed on 2021-12-01, almost four months before the corruption was confirmed. It can't be both, so I removed it from the "found while fixing" list.
4. **Summary and Impact vs. Timeline and "What went wrong": whether users reported problems.** The Summary says "No user reported problems in production," but the timeline lists three corruption reports and "What went wrong" mentions "all reported cases." I reworded it: users did report corruption, but none is confirmed from production.
5. **Summary, Impact row: "required frequent crashes."** The Trigger section shows that one crash inside the window is enough; frequent crashes only make that more likely. I reworded the row to say that.
6. **Header date vs. Action items (not fixed).** Several links point to issues and PRs numbered well above the latest one mentioned elsewhere (#13937), such as #14039, #14045 and #14911, and some are marked DONE. That means the document was edited after 2022-04-20 without saying so. **Add a "Last updated" row to the header.** I didn't add one because I don't know the date.

### Missing information for users deciding whether to trust v3.5

7. **Summary: no affected or fixed versions.** I added rows saying v3.5.0–v3.5.2 are affected and v3.5.3 has the fix, based on the timeline.
8. **No advice on what to do.** I added a short "What users should do" section: upgrade to v3.5.3 or later, and turn on `--experimental-initial-corrupt-check`. The Detection section already says that startup check is the only reliable one for this bug.

### Problems for contributors picking up action items

9. **Action items: blank Status cells.** It's unclear whether a blank means not started or not tracked. I set them to "Open".
10. **Action items vs. lessons learned (not fixed).** The document says every action item should address a lesson, but two lessons have no matching item:
    - "v3.5 was recommended for production without enough insight."
    - "Where we got lucky": functional tests only caught the bug because one maintainer's `/tmp` was on a real disk, not in memory.

    Maintainers should add an item for each, such as release criteria for production readiness and running functional tests on real disk. I didn't invent owners or issue links for them.
11. **Trigger section: #13505 is described as "the bug."** It's a pull request, so it's most likely the fix that went into v3.5.1. I reworded the sentence to say that. **Please confirm.**

### Clarity and wording

12. **"What went wrong", last bullet: the text is garbled** ("recommendations based on after some internal feedback... the user's hold on till…"). I rewrote it.
13. **Mixed terms:** the document uses both "consistency index" and "consistent index". I changed them all to "consistent index" (CI).
14. **Typos:** "loosing" → "losing", "replying" → "replaying", "where detected" → "were detected", "will missing" → "would be missing", "imminently" → "immediately", "grpc" → "gRPC", "Should be prioritized this over" → "Should be prioritized over".
15. **Detection section: unclear wording.** "which might fail causing the check to pass" now says the check passes if the `HashKV` call fails. The Root cause steps and the Background now use complete sentences.

---

## Final document

```markdown
# v3.5 data inconsistency postmortem

|         |            |
|---------|------------|
| Authors | etcd maintainers |
| Date    | 2022-04-20 |
| Status  | published  |

## Summary

|                   |                                                                                                                                                                                                                                                  |
|-------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Summary           | A code refactor in v3.5.0 caused the consistent index to be saved without the changes it refers to. If a member crashed at the wrong moment, committed transactions could be missing from that member.                                           |
| Affected versions | v3.5.0, v3.5.1, v3.5.2                                                                                                                                                                                                                           |
| Fixed in          | [v3.5.3](https://github.com/etcd-io/etcd/releases/tag/v3.5.3)                                                                                                                                                                                    |
| Impact            | We are not aware of any confirmed data corruption in production environments. Triggering the issue required a member to crash during a very small window, which in practice meant frequent crashes. The issue was still serious enough to justify a public statement. The main impact is the loss of user trust in etcd reliability. |

## What users should do

* If you run v3.5.0, v3.5.1, or v3.5.2, upgrade to v3.5.3 or later.
* Enable the corruption check at startup with `--experimental-initial-corrupt-check`. As described in [Detection](#detection), this is the most reliable way to catch this issue, because it runs just after a crashed member restarts.

## Background

etcd v3 state is preserved on disk in two forms: the write-ahead log (WAL) and the database state (DB).
etcd v3.5 also still maintains v2 state, but it's deprecated and not relevant to this issue.

The WAL stores the history of changes to etcd state, and the database represents the state at one point in that history.
To record which point in history the database represents, the database stores the consistent index (CI).
The CI is a special metadata field that points to the last WAL entry that the database has seen.

When etcd updates the database state, it applies entries from the WAL and updates the consistent index to point to the new entry.
This operation must be [atomic](https://en.wikipedia.org/wiki/Atomic_commit).
A partial failure would mean that the database and the WAL no longer match, so some entries would be either skipped (if only the CI is updated) or executed twice (if only the changes are applied).
This is especially important for a distributed system like etcd, where multiple cluster members each apply the WAL entries to their own database.
Correctness of the system depends on the assumption that every member of the cluster reaches the same state when replaying the WAL entries.

## Root cause

To simplify managing the consistent index, etcd introduced backend hooks in https://github.com/etcd-io/etcd/pull/12855.
The goal was to ensure that the consistent index is always updated, by automatically triggering the update during commit.
The implementation worked as follows: before applying a WAL entry, etcd updated the in-memory value of the consistent index.
As part of the transaction commit process, a database hook read the in-memory value of the consistent index and stored it in the database.

The problem is that the in-memory value of the consistent index is shared, and there can be other in-flight transactions apart from the serial WAL apply flow.
Consider this scenario:
1. The etcd server starts an apply workflow and sets a new consistent index value.
2. A periodic commit is triggered. It executes the backend hook and saves the consistent index value set by the apply workflow.
3. The etcd server finishes the apply workflow, saves the new changes, and saves the same consistent index value again.

Between steps 2 and 3 there is a very small window in which the saved consistent index has been increased without the WAL entry being applied.

## Trigger

If etcd crashed after the consistent index was saved but before the apply workflow finished, the result was data inconsistency.
When recovering, etcd would skip executing the changes from the failed apply workflow, assuming they had already been executed.

The issue reports, and the code used to reproduce the issue, show that the trigger was etcd crashing under high request load.
etcd v3.5.0 was released with a bug that could cause etcd to crash; it was fixed in v3.5.1 by https://github.com/etcd-io/etcd/pull/13505.
Apart from that, all reports described etcd running under high memory pressure, causing it to run out of memory from time to time.
The reproduction ran etcd under high stress and randomly killed one of the members using the SIGKILL signal (immediate process death that can't be handled).

## Detection

In a single-member cluster, the issue is undetectable.
There is no mechanism or tool for verifying that the database state matches the WAL.

In a multi-member cluster, the member that crashed would be missing the changes from the failed apply workflow.
This means it would have a different database state and would return a different hash from the `HashKV` gRPC call.

There is an automatic mechanism to detect data inconsistency.
It can run during etcd startup via `--experimental-initial-corrupt-check` and periodically via `--experimental-corrupt-check-time`.
However, both checks have a flaw: they depend on the `HashKV` gRPC method, and if that call fails, the check passes.

In a multi-member etcd cluster, each member can run at a different speed and be at a different stage of applying the WAL.
Comparing database hashes between members requires all hashes to be calculated at the same change.
This is done by requesting the hash for the same `revision` (version of the key-value store).
However, this doesn't work if the requested revision isn't available on every member.
This can happen on very slow members, or when corruption has caused revision numbers to diverge.

This means that, for this issue, the corruption check is reliable only when it runs during etcd startup just after a crash.

## Impact

Several users reported data corruption (see [Timeline](#timeline)), but we are not aware of any confirmed cases in production environments.

However, the issue was serious enough to justify a public statement.
The main impact is the loss of user trust in etcd reliability.

## Lessons learned

### What went well

* Multiple maintainers were able to work effectively on reproducing and fixing the issue. Because they are in different time zones, someone was always working on it.
* While fixing the main data inconsistency, we found other edge cases that could lead to data corruption (https://github.com/etcd-io/etcd/issues/13922, https://github.com/etcd-io/etcd/issues/13937).

### What went wrong

* No users enable data corruption detection, because it's still an experimental feature, even though it was introduced in v3.3. All reported cases were detected manually, which made them almost impossible to reproduce.
* etcd has functional tests designed to detect such problems, but they are unmaintained, flaky, and missing crucial scenarios.
* The v3.5 release wasn't qualified as comprehensively as previous releases. Earlier maintainers ran a manual qualification process that is no longer documented or executed.
* etcd apply code is so complicated that fixing the data inconsistency took almost two weeks and multiple attempts. The fix was complicated enough that we needed to develop automatic validation for it (https://github.com/etcd-io/etcd/pull/13885).
* etcd v3.5 was recommended for production without enough insight into production adoption. The recommendation was based on limited internal feedback and was meant to encourage diverse usage, but users held off on upgrading until someone else discovered the issues.

### Where we got lucky

* We reproduced the issue with the etcd functional tests only because of an unusual partition setup on one workstation. The functional tests store etcd data under `/tmp`, which is usually mounted as an in-memory filesystem. The problem was reproduced only because one of the maintainers had `/tmp` mounted on a standard disk.

## Action items

Action items should directly address the items listed in lessons learned.
We should double down on the things that went well, fix the things that went wrong, and stop depending on luck.

Actions fall under three types, and we should have at least one item per type:
* Prevent: prevent similar issues from occurring. In this case, what testing we should introduce to find data inconsistency issues before release, so we don't publish a broken release.
* Detect: be more effective at detecting when similar issues occur. In this case, improve the mechanism for detecting data inconsistency so users are informed automatically.
* Mitigate: reduce time to recovery for users. In this case, how we ensure that users can quickly fix data inconsistency.

Actions shouldn't be restricted to fixing the immediate issues; they should also propose long-term strategic improvements.
To reflect this, action items have an assigned priority:
* P0: critical for the reliability of the v3.5 release. Should be prioritized over all other work and backported to v3.5.
* P1: important for the long-term success of the project. Blocks the v3.6 release.
* P2: stretch goals that would be nice to have for v3.6, but shouldn't block it.

| Action Item                                                                          | Type     | Priority | Bug                                          | Status |
|--------------------------------------------------------------------------------------|----------|----------|----------------------------------------------|--------|
| etcd testing can reproduce historical data inconsistency issues                      | Prevent  | P0       | https://github.com/etcd-io/etcd/issues/14045 | DONE   |
| etcd detects data corruption by default                                              | Detect   | P0       | https://github.com/etcd-io/etcd/issues/14039 | DONE   |
| etcd testing is high quality, easy to maintain and expand                            | Prevent  | P1       | https://github.com/etcd-io/etcd/issues/13637 | Open   |
| etcd apply code should be easy to understand and validate correctness                | Prevent  | P1       |                                              | Open   |
| Critical etcd features are not abandoned when contributors move on                   | Prevent  | P1       | https://github.com/etcd-io/etcd/issues/13775 | DONE   |
| etcd is continuously qualified with failure injection                                | Prevent  | P1       | https://github.com/etcd-io/etcd/pull/14911   | DONE   |
| etcd can reliably detect data corruption (hash is linearizable)                      | Detect   | P1       |                                              | Open   |
| etcd checks consistency of snapshots sent between leader and followers               | Detect   | P1       | https://github.com/etcd-io/etcd/issues/13973 | DONE   |
| etcd recovery from data inconsistency procedures are documented and tested           | Mitigate | P1       |                                              | Open   |
| etcd can immediately detect and recover from data corruption (implement Merkle root) | Mitigate | P2       | https://github.com/etcd-io/etcd/issues/13839 | Open   |

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
