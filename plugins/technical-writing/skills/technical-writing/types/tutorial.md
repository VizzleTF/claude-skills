# Tutorial

A tutorial teaches a newcomer by walking them through one complete task. The reader learns by doing, and the page is responsible for their success.

## When to use it and when not

Use a tutorial when the reader is new to the product and wants to learn it through a guided exercise. The tutorial chooses the task for the reader.

Pick another type in these cases:

- The reader already knows the product and needs to finish a real task at work: how-to.
- The reader wants to know why the system works this way: explanation.
- The reader looks up an option or a limit: reference.

## Skeleton

1. Goal and time, on the first line: "In this tutorial, we will build X. It takes about 20 minutes."
2. Prerequisites: what the reader installs or has before step 1, with versions.
3. Steps. Each step has one action, the command or code, and the expected output.
4. Visible result: what the reader sees at the end and how it proves the goal was reached.
5. What next: links to the how-to guides, reference and explanation pages for the topics the tutorial touched.

The tutorial follows one path from start to finish. It has no branches and no "if you prefer" alternatives.

## Voice and verbs

Diátaxis recommends the first-person plural: "we" for the shared work ("Now we add a route"), with the imperative inside steps ("Run `make dev`"). Diátaxis puts it this way: "you are not alone; we are in this together."

Show the expected result after every step that produces one: "The output should look something like this:". Point out what matters in it: "Notice that the port is 8080."

## Length

A tutorial is as long as its one path. Aim for a session of 15 to 30 minutes and fewer than 15 steps, with one or two sentences between commands; this is a rule of thumb. A longer path becomes a series of tutorials, each with its own visible result.

## Differences from the core rules

- **Goal before answer.** The core rules put the answer first. A tutorial opens with its goal instead: "In this tutorial, we will build X and run it on your machine."
- **"We" in place of "you".** The tutorial speaks as a teacher working beside the reader.
- **Short explanations stay.** Diátaxis says "Ruthlessly minimise explanation". This type keeps a minimum: one or two sentences where a step would otherwise look arbitrary, with a link to the full explanation. A tutorial with zero explanation leaves the reader copying commands without learning.
- **Repetition is allowed.** Restate prerequisites and context on the page so the reader never leaves the path. Normative facts (a default value, a limit) stay in the reference; link to them.
- **Error recovery.** Following Carroll's minimalism, show what a common mistake looks like at the step where it happens and how to get back on the path.

## Forbidden

- Options, alternatives and "you can also" branches.
- Long explanations in the middle of a step. Move them to an explanation page and link.
- Steps without visible output where failure is possible.
- A goal that the reader cannot see or verify at the end.
- Commands that depend on the reader's own setup without a placeholder such as `<PROJECT_NAME>`.

## Type checklist

- [ ] The first line states the goal and the time it takes.
- [ ] Prerequisites list versions.
- [ ] One path, no branches.
- [ ] Each step has one action and its expected output.
- [ ] Every explanation is one or two sentences and links to more.
- [ ] Common mistakes have a way back.
- [ ] The end shows a visible result and links to what next.
- [ ] A cold reader finished the tutorial without help.
