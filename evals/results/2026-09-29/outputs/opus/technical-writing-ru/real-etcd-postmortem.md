I've read the postmortem and checked its facts against each other. The report is below. The document is in English, so I skipped the Russian-style rules.

# Review: `v3.5-data-inconsistency.md`

1. **Summary and Impact: the affected versions and the fix are never stated.** The Summary names only v3.5.0, and v3.5.3 appears only in the last row of the Timeline. A user deciding whether to trust v3.5 can't tell whether v3.5.1 and v3.5.2 are safe or what to do next. The Summary table also repeats the Impact section word for word. **Fix:** Rewrite the Summary as: "A refactor in v3.5.0 stopped the consistent index from being saved atomically with the applied changes. A member that crashes mid-apply can skip committed transactions after restart. Affects v3.5.0–v3.5.2. Fixed in v3.5.3 (2022-04-24). Upgrade to v3.5.3 or later and enable `--experimental-initial-corrupt-check`." Then cut the repeated Impact text from the table. "v3.5.1 and v3.5.2 affected" is inferred from the fix landing in v3.5.3; I couldn't check it against a source.

2. **Impact contradicts the Timeline and "What went wrong."** Impact says "We are not aware any cases of users reporting a data corruption in production environment," and the Summary says "No user reported problems in production." But the Timeline lists three "Report of data corruption" rows (#13514, #13654, #13766), and "What went wrong" says "All reported cases where detected manually." **Fix:** State how many reports there were and where they came from. For example: "Three users reported data corruption (#13514, #13654, #13766); none of them in production." If any of those clusters was in production, say so instead.

3. **Timeline, row "2021-01-28 … #13654": the year is wrong.** The date places the report before v3.5.0 was released (2021-06-16) and before the bug was merged (2021-05-08). It also breaks the table's order, and issue #13654 is numbered after #13514 (2021-12-01). **Fix:** Change the date to `2022-01-28`.

4. **Header "Date 2022-04-20" is earlier than facts inside the document.** The Timeline dates the v3.5.3 release to 2022-04-24. Action items marked DONE link to #14039, #14045 and #14911, which are numbered well after the fix. So the document was changed after its stated date, and nothing records that. **Fix:** Add a `Last updated | <DATE>` row to the header and note that action item statuses are tracked there. If the v3.5.3 date is the error, correct it instead. I couldn't check which of the two dates is wrong.

5. **Issue #13514 is described two incompatible ways.** In the Timeline it is the first user report (2021-12-01). In "What went well" it is one of the "other edge cases" found "when fixing the main data inconsistency," and that work started after the 2022-03-25 confirmation. **Fix:** Decide which role #13514 had and remove it from the other list.

6. **Action items, P0 "etcd detects data corruption by default" is marked DONE, but the Detection section contradicts it.** Detection says both checks depend on `HashKV`, "which might fail causing the check to pass." It also says the check is reliable only at startup right after a crash. The item that would fix that ("hash is linearizable", P1) has no status. P0 items are meant to be backported to v3.5, yet no release or flag is named, so users can't act on it. The table also has no owner or due-date column. **Fix:**
   - Name the release and flag, e.g. "v3.5.<N>: initial corrupt check enabled by default."
   - Narrow the wording to what was actually shipped.
   - Add `Owner` and `Due` columns.
   - Write `Open` in the empty Status cells.

7. **Action items don't cover every lesson, even though the section says they "should directly address items listed in lessons learned."** "Where we got lucky" (functional tests use an in-memory `/tmp`) has no item. Neither does "v3.5 was recommended for production without enough insight on the production adoption." **Fix:** Add items for both, for example:
   - "Functional tests run on a disk-backed data directory" (Prevent)
   - "Production-readiness criteria for releases are documented" (Prevent)

   Or drop the claim that the items cover every lesson.

8. **"What went wrong", last bullet: the text is garbled.** It reads: "Production ready recommendations based on after some internal feedback... to get diverse usage, but the user's hold on till someone else will discover issues." **Fix:** "We recommended v3.5 for production based on internal feedback alone. We hoped early adopters would provide diverse usage, but most users waited for others to find issues first."

9. **Key terms vary across the page, so readers may think they mean different things.**
   - "consistent index" appears alongside "consistency index" (Root cause, Trigger).
   - "data inconsistency" appears alongside "data corruption" (Timeline, Action items).

   **Fix:** Use "consistent index (CI)" everywhere. State once that "data corruption" in this document means the member's database no longer matches the WAL, or use a single term throughout.

10. **Typos and link labels.**
    - Fix these words: "loosing" → "losing"; "replying WAL entries" → "replaying WAL entries"; "will missing" → "will be missing"; "before to apply workflow finished" → "before the apply workflow finished"; "where detected" → "were detected"; "has lead" → "has led"; "Older maintainers run" → "Former maintainers ran"; "Reproduction run" → "The reproduction ran"; "imminently" → "immediately"; "Stretch  goals" → "Stretch goals"; "using etcd functional" → "using etcd functional tests"; "committed transactions are not reflected" → "committed transactions not being reflected".
    - Trigger: "released with bug (…/pull/13505)" links the fix PR as if it were the bug. Change it to "crash bug, fixed in v3.5.1 by #13505."

**Verdict:** ready after the listed edits. This is a published postmortem, so it should only be edited in place for mistakes: fix items 3 and 10 there, plus item 4 if it turns out the date is wrong. Items 1, 2 and 5–9 change the content. Put them in a revised postmortem and mark this one `superseded by <NEW_POSTMORTEM_URL>`.

**Question:** What is the v3.5.x release where corruption detection became the default (the `<N>` in item 6)?
