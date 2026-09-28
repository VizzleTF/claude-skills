# Runbook

A runbook tells the on-call engineer what to do when a specific alert fires. The reader is under stress, often at night, and copies commands from the page.

## When to use it and when not

Use a runbook for one alert or one operational event with known steps. Every alert that pages a person needs a runbook.

Pick another type in these cases:

- A planned task done in calm conditions, such as a quarterly key rotation: how-to.
- A list of error messages and their causes: troubleshooting.
- The record of an incident after it ends: postmortem.

## Skeleton

1. Alert name, exactly as it appears in the alerting system, as the title.
2. Impact and urgency: who is affected, how badly, and how fast to act.
3. Diagnosis: commands that confirm the cause, each with the output that means "yes". Before an action that cannot be undone, diagnosis also records the state needed to recover (for example, the current replica count or the pending message IDs).
4. Action. Every action has three parts:
   - the command, complete and copyable;
   - verification: the command that shows it worked and the expected output;
   - rollback: the command that undoes it. When the action cannot be undone, say so, point to the state recorded in diagnosis, and name the escalation path.
5. Final verification: how to confirm the alert has cleared.
6. Escalation: who to call, how, and when (for example, "after 15 minutes without recovery").
7. Last verified: the date someone last ran the runbook end to end, and who. A new runbook that nobody has run gets `Last verified: <DATE> by <NAME>`. Never invent the date or the name.

## Voice and verbs

Imperative, without prose: "Scale the deployment", "Check the queue depth". One action per numbered step. Explanations are one clause at most.

Placeholders are explicit and uppercase in angle brackets: `<NAMESPACE>`, `<POD_NAME>`. The runbook says where to get each value.

## Length

As short as the procedure allows. The reader should see the first action without scrolling past the impact section. This is a rule of thumb.

## Differences from the core rules

- **Commands stay on the page.** The core rules keep a normative fact in one place and link to it. A runbook copies every command it needs into its own steps, because the reader must not follow links under stress. Context and prerequisites may repeat too. Normative facts, such as a limit or an SLO, still live in one place and are linked.
- **No prose.** Explanation of why the system behaves this way goes to an explanation page.

## Forbidden

- Partial commands, `...`, or commands the reader must edit in unmarked places.
- An action without verification.
- An action without rollback that does not say so explicitly, point to the recovery state captured in diagnosis, and name the escalation path. "No rollback needed" alone is forbidden.
- Links in place of the commands.
- A runbook without a last-verified line, or with an invented date or name.
- Paragraphs of background above the first action.

## Type checklist

- [ ] The title matches the alert name.
- [ ] Impact and urgency come before diagnosis.
- [ ] Every command is complete and copyable.
- [ ] Every placeholder has the `<NAME>` form and a source for its value.
- [ ] Every action has verification and rollback, or says it has none, points to the recovery state captured in diagnosis, and names the escalation path.
- [ ] Escalation names a contact and a time limit.
- [ ] The last-verified line has a real date and name, or the `<DATE>` and `<NAME>` placeholders if nobody has run the runbook yet.
