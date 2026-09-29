# ADR, design doc and RFC

An architecture decision record (ADR) records one decision, its context and its consequences when it was made. A design doc or RFC proposes a design before the decision; once accepted, it is kept as a record in the same way.

## When to use it and when not

Use an ADR for a decision that is hard to reverse or that later readers will question: a database, a protocol, a module boundary. Use a design doc or RFC when the decision needs review before it is made.

Pick another type in these cases:

- How the system works today, kept current: explanation.
- A rule every contributor follows: conventions. It may link to the ADR behind it.
- The record of an incident: postmortem.

## Skeleton

Michael Nygard's form, with alternatives added from design doc practice:

1. Title: a number and a short noun phrase, "ADR-0012: Event store for orders". Numbers are sequential and never reused.
2. Status: proposed, accepted, deprecated, or superseded by ADR-NNNN. Date of the status.
3. Context: the forces at play, stated as facts.
4. Decision: what we will do.
5. Consequences: every consequence, the costs and risks as well as the benefits.
6. Alternatives considered: each option and why it was rejected.
7. Supersedes: a link to the record this one replaces, if any.

A design doc or RFC uses the same parts, with the decision written as a proposal and a section for open questions. Minto's SCQA structure (situation, complication, question, answer) suits its opening.

## Voice and verbs

State the decision in the active voice, as Nygard puts it: "We will …". The decision is a paragraph that opens with "We will": "We will use PostgreSQL for the order store, because…". Nygard asks for full sentences organized into paragraphs.

## Length

Most ADRs fit in about 150 words: one short paragraph per part, one line per alternative. Nygard's one or two pages is the upper bound. A design doc may run longer; keep the decision and its main consequences on the first page. This is a rule of thumb.

## Differences from the core rules

- **A record is not rewritten.** The core rules fix or delete a living document that is wrong. An ADR is a record: when a decision changes, write a new ADR with a `Supersedes: ADR-NNNN` line. In the old ADR, set the status to `superseded by ADR-MMMM` with a link. Besides typos and broken links, the only changes to a published record are its status mark (`[YANKED]`, `superseded by`) and the link to its replacement.
- **Full sentences in place of lists.** General style advice turns more than two items into a list. Context, decision and consequences are paragraphs, because the reasoning lives in the connections between the items. A list is fine for the alternatives when each item is a full sentence.

## Forbidden

- Editing the context, decision or consequences of an accepted ADR.
- Deleting an ADR that is no longer true.
- Consequences that list only benefits.
- Bullet fragments in place of the decision: "Postgres. Faster. Team knows it."
- Passive decisions: "It was decided that".

## Type checklist

- [ ] The title has a number and a noun phrase.
- [ ] Status and date are present.
- [ ] The decision is a paragraph that opens with "We will".
- [ ] Consequences include the costs.
- [ ] Alternatives say why each was rejected.
- [ ] A replacement is a new record; the old one changed only its status mark and the link to its replacement.
- [ ] Context, decision and consequences are paragraphs.
