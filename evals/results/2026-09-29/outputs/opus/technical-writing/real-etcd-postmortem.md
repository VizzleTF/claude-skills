1. **Summary**: the page never says which versions have the bug, which version fixes it, or what users should do. Readers deciding whether to trust v3.5 can't tell if they are affected. v3.5.3 appears only in the last row of the Timeline. **Fix:** add to Summary: "Affected: v3.5.0–v3.5.2. Fixed in v3.5.3 (2022-04-24). Upgrade to v3.5.3 or later and run with `--experimental-initial-corrupt-check`." I took the version range from the Timeline and did not verify it against the release notes.
2. **Summary "Impact" row and the "Impact" section**: both say no user reported problems in production. The Timeline lists three "Report of data corruption" rows (#13514, #13654, #13766). "What went wrong" says "All reported cases were detected manually". **Fix:** say where the three reports came from (production or test clusters) and how many clusters were affected. Keep one Impact text and delete the other, which repeats it word for word.
3. **Timeline, row "2021-01-28 … #13654"**: the date is out of order. It sits between 2021-12-01 and 2022-03-08 and falls before v3.5.0 was released on 2021-06-16. **Fix:** correct it to the real date, probably 2022-01-28 (not verified).
4. **Header "Date 2022-04-20"**: this is earlier than the v3.5.3 release on 2022-04-24 in the Timeline. The action items also link to #14039, #14045 and #14911 with status DONE. Those numbers are far above #13885, the April 2022 fix, so the page was changed after it was published. **Fix:** set Date to the real publication date. Move action item status to the linked issues, or add a line "Last updated `<DATE>`" above the table.
5. **"What went well", second bullet**: #13514 is listed as one of the "other edge cases" found while fixing this bug. The Timeline lists #13514 as the first report of this bug, on 2021-12-01. **Fix:** keep #13514 in only one place, or explain how it is both.
6. **"What went wrong", "fixing the data inconsistency took almost 2 weeks"**: the Timeline shows 30 days from confirmation (2022-03-25) to the v3.5.3 release (2022-04-24). It has no row for when the fix was merged. **Fix:** add a Timeline row with the fix PR and its merge date, then make the duration in the bullet match it.
7. **"Action items" table**: contributors can't see who owns an item or when it is due. The table has no Owner or Due column. Three open items have no link ("apply code should be easy to understand", "hash is linearizable", "recovery … procedures are documented"). The "Bug" column holds a PR (#14911). The P2 row says "imminently" where "immediately" is meant. **Fix:** add Owner and Due columns and rename "Bug" to "Tracking". Open issues for the three unlinked items, or mark them `<ISSUE>`. Change "imminently" to "immediately".
8. **"What went wrong", last bullet** ("Production ready recommendations based on after some internal feedback… but the user's hold on till someone else will discover issues"): the sentence can't be parsed. **Fix:** rewrite it, for example: "We recommended v3.5 for production based only on internal feedback. Users waited for others to adopt it first, so the release saw little varied production use before the recommendation." Confirm the meaning with the author.
9. **Terms**: two concepts each go by two names.
   - The CI is called "consistent index" in Background and "consistency index" in Root cause and Trigger. **Fix:** use "consistent index (CI)" everywhere.
   - "data inconsistency" (title, Summary) and "data corruption" (Detection, Timeline, Action items) are used for the same thing. **Fix:** pick one, or define how they differ.
10. **Typos and grammar across the page**:

    | Where | Change |
    |---|---|
    | Background | "two forms write ahead log" → "two forms: write-ahead log"; "replying WAL entries" → "replaying WAL entries" |
    | Summary, Impact | "loosing" (twice) → "losing"; "aware any" → "aware of any" |
    | Trigger | "before to apply workflow finished" → "before the apply workflow finished" |
    | Detection | "will missing" → "will miss"; "has lead" → "has led" |
    | What went wrong | "where detected" → "were detected"; "Older maintainers run" → "Older maintainers ran" |
    | Action items | "Stretch  goals" (double space) → "Stretch goals" |
    | Where we got lucky | "using etcd functional only because weird partition setup" → "using etcd functional tests only because of an unusual partition setup" |

**Verdict:** ready after the listed fixes. Typo, link and date fixes (3, 4, 10) can go into this page directly. Because this is a published record, the content changes (1, 2, 5, 6, 8) belong in a revised postmortem that replaces this one. Mark this page "superseded by" with a link to the new one.
