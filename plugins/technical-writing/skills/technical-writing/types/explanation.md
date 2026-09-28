# Explanation

An explanation helps the reader understand a part of the system: why it is built this way, how its parts relate, what the trade-offs are. The reader is not in the middle of a task.

## When to use it and when not

Use an explanation for questions that start with "why" or "how does it work": the architecture of a service, the reasons for a data model, the difference between two approaches.

Pick another type in these cases:

- The reader needs to do something now: how-to or runbook.
- The page records one decision at a point in time: ADR.
- The reader needs a fact: reference.

## Skeleton

Connected prose, in four parts:

1. Context: the situation and the problem the design answers.
2. How it works: the parts and how they interact. A diagram helps here.
3. Alternatives: other designs, and why this one was chosen.
4. Consequences: what this design makes simpler, what it makes harder, and where its limits are.

Minto's SCQA structure suits the opening: situation, complication, question, answer. The first paragraph states the answer; the rest supports it.

## Voice and verbs

Indicative. "We" is allowed for the team or for the reader and writer thinking together: "We store events because the audit log needs every change."

Order each sentence and paragraph from known to new. The first sentence of a paragraph states its topic.

## Length

As long as the understanding requires. A page that covers more than one question splits into one page per question. This is a rule of thumb.

## Differences from the core rules

- **Full sentences in place of lists.** General style advice turns a series of more than two items into a list. An explanation keeps reasoning in paragraphs, because the connections between the items ("because", "so", "unless") are the content. Use a list only for items that do not depend on each other.
- **No steps.** An explanation does not tell the reader to do anything.

## Forbidden

- Numbered steps and commands to run.
- Bulleted fragments in place of reasoning.
- Option tables. Link to the reference.
- A summary ending that repeats the page.

## Type checklist

- [ ] The first paragraph answers the question the page is about.
- [ ] Reasoning is in paragraphs, with the connections stated.
- [ ] Alternatives and consequences are present, including the costs.
- [ ] Each paragraph starts with its topic.
- [ ] No steps and no commands.
