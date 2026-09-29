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
