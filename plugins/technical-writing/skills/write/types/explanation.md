# Explanation

An explanation helps the reader understand a part of the system: why it is built this way, how its parts relate, what the trade-offs are. The reader is not in the middle of a task.

## When to use it and when not

Use an explanation for questions that start with "why" or "how does it work": the architecture of a service, the reasons for a data model, the difference between two approaches.

Pick another type in these cases:

- The reader needs to do something now: how-to or runbook.
- The page records one decision at a point in time: ADR.
- The reader needs a fact: reference.

## Skeleton

Connected prose, in five parts:

1. Answer: the short answer to the question the page is about, in the first paragraph.
2. Context: the situation and the problem the design answers.
3. How it works: the parts and how they interact. A diagram helps here.
4. Alternatives: other designs, and why this one was chosen.
5. Consequences: what this design makes simpler, what it makes harder, and where its limits are.

This follows Minto's pyramid principle: the answer comes first, and the situation and complication follow as context. The rest of the page supports the answer.

## Voice and verbs

Indicative. "We" is allowed for the team or for the reader and writer thinking together: "We store events because the audit log needs every change."

Order each sentence and paragraph from known to new. The first sentence of a paragraph states its topic.

## Length

About 250 words for one question, one short paragraph per skeleton part. A page that covers more than one question splits into one page per question. This is a rule of thumb.

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
