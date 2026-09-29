# Пара real-etcd-postmortem

Язык: en. Вид: review.

Запрос:

> Review the attached etcd document, `v3.5-data-inconsistency.md`, about the data inconsistency found in v3.5. The readers are etcd users deciding whether to trust v3.5 and contributors picking up the action items. List the problems with where each one is and how to fix it. Check the facts inside the document against each other.

Факты:

- The document is the etcd v3.5 data inconsistency postmortem
- Root cause: a code refactor in v3.5.0 stopped saving the consistent index atomically, so an independent crash could leave committed transactions missing on some members
- The fix shipped in v3.5.3, published 2022-04-24 according to the timeline
- The header says the document date is 2022-04-20, which is earlier than the v3.5.3 release in the timeline
- The timeline row dated 2021-01-28 is out of chronological order between 2021-12-01 and 2022-03-08; it is probably 2022-01-28
- The timeline has dates only, with no times and no time zone
- Action items have a type (Prevent, Detect, Mitigate), priority, bug link and status, but no owner and no due date
- The impact section says no user reported problems in production; the main impact was loss of user trust
- The document does not blame individuals

Ожидания к ответу:

- The review does not ask the document to name or blame individuals

---

## X

1. **Whole document (Summary, Impact, Detection):** A user deciding whether to trust v3.5 can't tell which versions are affected, which release fixes the bug, or what to do now. The fix is named only in the last Timeline row (v3.5.3). Add a "Who is affected" line to Summary: "v3.5.0 to v3.5.2, fixed in v3.5.3". Add the action for v3.5 users: upgrade, and enable `--experimental-initial-corrupt-check`, which Detection says is reliable only at start after a crash. Whether v3.5.3 covers the extra edge cases (#13922, #13937) is not verified. State which release fixes each, or say they are open.

2. **Summary and Impact, "No user reported problems in production" and "We are not aware any cases of users reporting":** This contradicts the Timeline, which lists three "Report of data corruption" rows (#13514, #13654, #13766). It also contradicts Trigger, which says "all reports described etcd running under high memory pressure". Reword to what the sources support, for example: "Three users reported data corruption; none confirmed it in production." Then say what "production" excluded.

3. **Timeline, row "2021-01-28":** The date is before the v3.5.0 release (2021-06-16) and out of order, since it sits between 2021-12-01 and 2022-03-08. It is probably 2022-01-28. Correct it against issue #13654.

4. **Header "Date 2022-04-20", "Status published", Action items table:** The header date is earlier than the Timeline's last row (v3.5.3 on 2022-04-24). The table has `DONE` items that link PR #14911, whose number is much higher than the other links (#14045, #14039). So the record was edited after publication, and it presents no update date. A published postmortem may change only its status mark. Put the true publication date in the header. Move later progress (`DONE` statuses, #14911) into a new record or a linked tracking issue. Check that the 2022-04-24 release date is correct.

5. **Lessons learned, "fixing the data inconsistency took almost 2 weeks":** The Timeline runs from confirmation (2022-03-25) to the v3.5.3 release (2022-04-24), which is about 30 days. Give the interval you mean ("2 weeks from <DATE> to <DATE>"), or change the figure to match the Timeline.

6. **Lessons learned, "What went well", second bullet:** It lists #13514 as an edge case found "when fixing the main data inconsistency". The Timeline lists #13514 as a corruption report from 2021-12-01, months before fix work began. Remove #13514 from this list, or explain how it is both.

7. **Action items table:** The rows have no owner and no due date, and the linked-lesson mapping is incomplete:
   - Three rows (apply code, linearizable hash, recovery procedures) have no tracking link.
   - Unfinished rows have an empty Status. Use `TODO` or `IN PROGRESS`.
   - Two lessons have no action: "recommended for production without enough insight" and "Where we got lucky" (`/tmp` on disk).
   - The Merkle-root row is typed Mitigate, but it is a detection change. Its wording "imminently detect" should be "immediately", or better, "in real time".
   - The P0 and P1 definitions say "backported to v3.5" and "blocks v3.6". No row records whether either has happened.

8. **Impact section and skeleton order:** Impact repeats the Summary's Impact row nearly word for word and gives no numbers. Replace it with affected versions, the exposure window (2021-06-16 to 2022-04-24, from the Timeline), and the report count. Move Impact and Timeline to just after Summary, ahead of Background. The Timeline is currently last.

9. **Terms (Background, Root cause, Trigger):** The document says "consistent index" and "consistency index" for one concept. It defines "(CI)" and "(DB)" and never uses them again. It calls the data store "database state", "database" and "DB". Pick "consistent index" and "database" (or DB), and drop the unused abbreviation. Also, "Action items" section: delete the template instructions ("Action items should…", "We should double down…", "Action fall under three types"). These belong in a template. Keep only the type and priority definitions, in the past or present tense.

10. **Wording and grammar, several places:**
    - What went wrong, last bullet: "Production ready recommendations based on after some internal feedback... but the user's hold on till someone else will discover issues" is unreadable. Suggested rewrite: "v3.5 was recommended for production after limited internal feedback, so users waited for others to find problems first."
    - Summary: "could lead to committed transactions are not reflected" should be "could leave committed transactions missing on some members".
    - Typos: "loosing" (losing), "replying WAL entries" (replaying), "will missing" (will miss), "lead revision numbers" (led), "Stretch  goals" (double space), "Etcd" mid-sentence (etcd).
    - Bare URLs in prose should be link text.

**Verdict:** ready after the listed fixes. Items 1 to 6 change what readers conclude, so they come first. Item 4 also needs a decision on whether to keep updating this record or start a new one.

---

## Y

I read the document and checked it against itself. Below are the findings, most serious first, then the corrected document.

## Findings

Lines refer to the original file. Items 1–8 are fixed in the document below. Items 9–15 need input from the maintainers, so I left them as they were.

| # | Line | Type | Problem | Fix |
|---|------|------|---------|-----|
| 1 | 142, 6 | fact | The fix release v3.5.3 is dated 2022-04-24, after the document's own date (2022-04-20). It also conflicts with "almost 2 weeks" to fix (l.95), since confirmation on 03-25 to 04-24 is about 4 weeks. | Set it to 2022-04-13, the v3.5.3 release date as I recall it. Confirm against the release page. |
| 2 | 138 | fact | The report of #13654 is dated 2021-01-28, which is before the causing PR was merged (2021-05-08) and before v3.5.0. Its issue number sits between #13514 (2021-12) and #13766 (2022-03), so the year is 2022. | Change to 2022-01-28. |
| 3 | 13–14, 78–81 | fact | "No user reported problems in production" conflicts with the three user reports in the Timeline and with l.92 ("all reported cases"). "Required frequent crashes" conflicts with l.53 (OOM "from time to time"). The Impact text is also duplicated word for word. | State it once, as "no confirmed production data corruption". Say a crash during apply is enough. |
| 4 | 88 | fact | #13514 is listed as an edge case found while fixing the bug, but the Timeline lists it as the first user report (2021-12-01), months before the fix work. | Remove #13514 from that list. It is already in the Timeline. |
| 5 | 33, 48 vs 22–25 | fact | "Consistency index" and "consistent index" name the same thing. | Use "consistent index" throughout. |
| 6 | 9–14 | structure | The Summary never says which versions are affected or which is fixed. A user deciding whether to trust v3.5 must dig through the Timeline for it. | Put first: v3.5.0–v3.5.2 affected, fixed in v3.5.3. This follows from the merge before v3.5.0 and the fix in v3.5.3. |
| 7 | 104–116 | structure | Author-facing template text ("we should have at least one item per type…") sits in front of the table. Blank Status and Bug cells look like missing data. | Reduce it to a Type/Priority legend. Use "Open" and "None yet" for blanks. |
| 8 | 96, 92, 100, 61, 48, 29, 80, 129 | words | Garbled or wrong wording: l.96 is unreadable, and l.92 does not explain how manual detection blocked reproduction. Typos: "loosing", "replying", "will missing", "before to apply", "imminently", "etcd functional". | Rewritten. |
| 9 | 74 vs 64–72 | fact | The conclusion says the check is reliable at startup. The text explains only why the periodic check fails, and the `HashKV`-failure flaw (l.66) applies to both checks. | Author to explain why the startup check is reliable, or soften the claim. |
| 10 | 96 vs table | fact | The lesson "v3.5 recommended for production without enough insight" has no action item. | Add an item, or state that none is planned. |
| 11 | 121, 116 | fact | "Detects data corruption by default" is P0, defined as backported to v3.5, but the document never says which release ships it. This is the question users have. | Add the release version to each DONE item. |
| 12 | 123, 126, 128 | structure | Three P1 items have no tracking issue, so contributors cannot pick them up. | Open issues and link them. |
| 13 | 125, 6 | fact | #14911 is far above the other issue numbers (about #14045 in April 2022), so the table was edited after the stated date of 2022-04-20. | Add a "last updated" date for the action items. |
| 14 | 33–44 | structure | The document does not say what the fix in v3.5.3 changed. | Add one or two sentences and a PR link. |
| 15 | 92 | fact | "No users enable" corruption detection is an absolute claim with no source. | Say "few" unless it is known. |

## Corrected document

```markdown
# v3.5 data inconsistency postmortem

|         |                  |
|---------|------------------|
| Authors | etcd maintainers |
| Date    | 2022-04-20       |
| Status  | published        |

## Summary

**Affected versions:** v3.5.0 to v3.5.2. **Fixed in:** v3.5.3.

A code refactor in v3.5.0 stopped saving the consistent index atomically. A crash during the WAL apply workflow could then leave committed transactions missing on some members.

We are not aware of confirmed data corruption in production. Triggering the issue required a crash at a specific moment, but the issue was serious enough to warrant a public statement. The main damage was to user trust in etcd reliability. See [Impact](#impact).

## Background

etcd v3 state is stored on disk in two forms: write ahead log (WAL) and database state (DB).
etcd v3.5 also still maintains v2 state. It is deprecated and not relevant to this postmortem.

The WAL stores the history of changes to etcd state. The database represents state at one point in that history.
To know which point, the database stores the consistent index. It is a metadata field that points to the last WAL entry the database has seen.

When etcd updates the database, it replays entries from the WAL and moves the consistent index to the new entry.
This operation must be [atomic](https://en.wikipedia.org/wiki/Atomic_commit).
A partial failure would leave the database and WAL out of step. Entries would be skipped (if only the consistent index is updated) or executed twice (if only the changes are applied).
This matters especially in a distributed system like etcd, where every member applies the WAL entries to its own database.
Correctness depends on every member reaching the same state while replaying WAL entries.

## Root cause

To simplify managing the consistent index, etcd introduced backend hooks in https://github.com/etcd-io/etcd/pull/12855.
The goal was to always update the consistent index by triggering the update automatically during commit.
The implementation worked as follows. Before applying WAL entries, etcd updated the in-memory value of the consistent index.
During transaction commit, a database hook read that value and stored it in the database.

The problem is that the in-memory value is shared, and other in-flight transactions can commit besides the serial WAL apply flow.
Consider this scenario:
1. The etcd server starts an apply workflow and sets a new consistent index value.
2. A periodic commit is triggered. It runs the backend hook and saves the consistent index from the apply workflow.
3. The etcd server finishes the apply workflow, saves the new changes, and saves the same consistent index value again.

Between steps 2 and 3 there is a small window where the consistent index has increased without the WAL entry being applied.

## Trigger

If etcd crashed after the consistent index was saved but before the apply workflow finished, the data became inconsistent.
On recovery, etcd skipped the changes from the failed apply workflow, assuming they had already been executed.

Issue reports and the reproduction code show the trigger was etcd crashing under high request load.
etcd v3.5.0 shipped with a [bug that could crash etcd](https://github.com/etcd-io/etcd/pull/13505), fixed in v3.5.1.
Apart from that, all reports described etcd running under high memory pressure and going out of memory from time to time.
The reproduction ran etcd under high stress and randomly killed one member with SIGKILL (immediate process death, not recoverable).

## Detection

A single-member cluster cannot detect this issue.
No mechanism or tool verifies that the database matches the WAL.

In a cluster with multiple members, a member that crashed is missing changes from the failed apply workflow.
Its database state differs, so it returns a different hash from the `HashKV` gRPC call.

etcd has an automatic mechanism to detect data inconsistency.
It runs at startup with `--experimental-initial-corrupt-check` and periodically with `--experimental-corrupt-check-time`.
Both checks have a flaw: they depend on the `HashKV` gRPC method, which can fail and cause the check to pass.

Members of a multi-member cluster run at different speeds and can be at different stages of applying the WAL.
Comparing hashes requires all of them to be calculated at the same change.
This is done by requesting the hash for the same `revision` (the version of the key-value store).
It does not work if the requested revision is not available on the members.
That can happen on very slow members, or when corruption has made revision numbers diverge.

This means that for this issue, the corrupt check is only reliable at etcd start, just after a crash.

## Impact

We are not aware of confirmed data corruption in production environments.

The issue was serious enough to warrant a public statement.
The main impact was loss of user trust in etcd reliability.

## Lessons learned

### What went well

* Multiple maintainers worked effectively on reproducing and fixing the issue. They are in different timezones, so someone was always working on it.
* While fixing the main data inconsistency, we found other edge cases that could lead to data corruption (https://github.com/etcd-io/etcd/issues/13922, https://github.com/etcd-io/etcd/issues/13937).

### What went wrong

* Few users enable data corruption detection, because it is still an experimental feature introduced in v3.3. All reported cases were detected manually, which made them hard to reproduce.
* etcd has functional tests designed to detect such problems, but they are unmaintained, flaky, and miss crucial scenarios.
* The v3.5 release was not qualified as comprehensively as previous ones. Earlier maintainers ran a manual qualification process that is no longer known or executed.
* The apply code is so complicated that fixing the data inconsistency took almost 2 weeks and multiple attempts. The fix was complex enough that we developed automatic validation for it (https://github.com/etcd-io/etcd/pull/13885).
* etcd v3.5 was recommended for production without enough insight into production adoption. The recommendation followed some internal feedback and was meant to get diverse usage, but users held off until someone else discovered issues.

### Where we got lucky

* We reproduced the issue with the etcd functional tests only because of an unusual partition setup on a maintainer's workstation. The functional tests store etcd data under `/tmp`, which is usually mounted on an in-memory filesystem. The issue reproduced only because one maintainer has `/tmp` on a standard disk.

## Action items

Each item addresses a lesson above, and every type has at least one item.

| Type     | Meaning                                                                                        |
|----------|------------------------------------------------------------------------------------------------|
| Prevent  | Stop similar issues from occurring, for example by testing that catches them before a release. |
| Detect   | Detect similar issues automatically and inform users.                                          |
| Mitigate | Reduce time to recovery for users.                                                             |

| Priority | Meaning                                                                          |
|----------|----------------------------------------------------------------------------------|
| P0       | Critical for the reliability of v3.5. Prioritize over all other work and backport to v3.5. |
| P1       | Important for long-term success. Blocks the v3.6 release.                        |
| P2       | Stretch goal for v3.6. Does not block it.                                        |

| Action Item                                                                         | Type     | Priority | Bug                                          | Status |
|-------------------------------------------------------------------------------------|----------|----------|----------------------------------------------|--------|
| etcd testing can reproduce historical data inconsistency issues                     | Prevent  | P0       | https://github.com/etcd-io/etcd/issues/14045 | DONE   |
| etcd detects data corruption by default                                             | Detect   | P0       | https://github.com/etcd-io/etcd/issues/14039 | DONE   |
| etcd testing is high quality, easy to maintain and expand                           | Prevent  | P1       | https://github.com/etcd-io/etcd/issues/13637 | Open   |
| etcd apply code should be easy to understand and validate correctness               | Prevent  | P1       | None yet                                     | Open   |
| Critical etcd features are not abandoned when contributors move on                  | Prevent  | P1       | https://github.com/etcd-io/etcd/issues/13775 | DONE   |
| etcd is continuously qualified with failure injection                               | Prevent  | P1       | https://github.com/etcd-io/etcd/pull/14911   | DONE   |
| etcd can reliably detect data corruption (hash is linearizable)                     | Detect   | P1       | None yet                                     | Open   |
| etcd checks consistency of snapshots sent between leader and followers              | Detect   | P1       | https://github.com/etcd-io/etcd/issues/13973 | DONE   |
| etcd recovery from data inconsistency procedures are documented and tested          | Mitigate | P1       | None yet                                     | Open   |
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

Items 9–15 above still need maintainer input. The two date fixes (items 1 and 2) rest on the document's internal contradictions, plus my recollection that v3.5.3 shipped on 2022-04-13.
