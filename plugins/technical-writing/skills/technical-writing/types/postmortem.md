# Postmortem

A postmortem records an incident after it ends: what happened, what it cost, why it happened, and what the team will change. It is a record, written once and then kept.

## When to use it and when not

Use a postmortem after an incident that met the team's criteria: user impact, data loss, an on-call intervention, or a monitoring failure.

Pick another type in these cases:

- The steps to handle the next alert of this kind: runbook, linked from the follow-up actions.
- A decision the incident forced: ADR.

## Skeleton

1. Summary: two or three sentences on what happened and the impact.
2. Impact: who was affected, for how long, and how much, in numbers.
3. Timeline in UTC: detection, escalation, mitigation, resolution. One line per event.
4. Root causes and contributing factors.
5. What went well, what went badly, where we were lucky.
6. Follow-up actions: a table with the action, owner, due date and tracking link.

Google SRE lists the core contents: impact, actions taken to mitigate or resolve, root causes, and follow-up actions to prevent recurrence.

## Voice and verbs

Past tense for events: "The deploy started at 14:02 UTC." Causes name systems and processes: "The deploy script did not check the migration lock." Roles replace names in the timeline where a name adds nothing: "the on-call engineer".

## Length

As long as the incident requires. The summary and impact fit on the first screen. This is a rule of thumb.

## Differences from the core rules

- **Past tense, no address to the reader.** Instructions address the reader as "you". A postmortem narrates events in the past tense and does not address the reader.
- **Blameless.** Google SRE defines a blameless postmortem as focused "on identifying the contributing causes of the incident without indicting any individual or team". A cause is a gap in a system or process.
- **A record is not rewritten.** When new facts change the account, write a new postmortem. The old one gets the status `superseded by` and a link to the new one. Besides typos and broken links, the only changes to a published record are its status mark (`[YANKED]`, `superseded by`) and the link to its replacement.

## Forbidden

- Naming a person as the cause.
- "Human error" as a root cause. Ask what let the error reach production.
- Follow-up actions without an owner or a date.
- Times without a time zone.
- Editing or appending to a published postmortem.

## Type checklist

- [ ] Impact is stated in numbers.
- [ ] The timeline uses UTC.
- [ ] Causes name systems and processes.
- [ ] Every follow-up action has an owner, a due date and a link.
- [ ] Events are in the past tense.
- [ ] New facts went into a new record; the old one changed only its status mark and the link to its replacement.
