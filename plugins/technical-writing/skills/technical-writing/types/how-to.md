# How-to guide

A how-to guide gives a competent reader the steps to reach one goal at work. The reader knows the product and has a real task in front of them.

## When to use it and when not

Use a how-to when the reader knows what they want ("add a package", "rotate the key") and needs the steps. The reader brings their own situation, so the guide may name conditions that change the steps.

Pick another type in these cases:

- The reader is new and learning: tutorial.
- An alert fired and the reader is on call: runbook.
- The reader starts from an error message: troubleshooting.
- The reader needs one fact: reference.

## Skeleton

1. Title as the task, in the imperative: "Add a package", "Rotate the API key".
2. One line on what the guide achieves and when the reader needs it.
3. Prerequisites: access, tools, versions, and the state the system must be in.
4. Steps, numbered. One action per step.
5. Verification: how the reader confirms the goal was reached, with the command and its expected output.
6. If it did not work: the likely failures, what each looks like, and what to do.

## Voice and verbs

Use the imperative: "Run", "Open", "Set". The title uses the same form: "Configure the proxy".

Put the condition before the action: "If the cluster uses RBAC, create the role first." A reader who acts on the first words of a step must see the condition before acting.

Describe results in the present tense: "The command prints the new version."

## Length

As long as the task, and no longer. A guide with more than about 10 steps usually holds two tasks; split it. This is a rule of thumb.

## Differences from the core rules

- **Condition first.** Inside a step the condition comes before the action, even though the action is the main point. This is the order in which the reader acts.
- **Error recovery.** Following Carroll's minimalism, the guide names the failures a reader is likely to hit and shows how to recover. Put this in the "If it did not work" section or at the step itself.

## Forbidden

- Teaching the basics of the product. Link to a tutorial.
- Explanations of design longer than one sentence. Link to an explanation.
- Two actions in one step.
- Tables of every option. Link to the reference.
- Steps that end without a way to tell whether they worked, when failure is possible.

## Type checklist

- [ ] The title is the task in the imperative.
- [ ] Prerequisites name access, tools and versions.
- [ ] Each step has one action.
- [ ] Every condition comes before its action.
- [ ] Commands run as written; placeholders are marked, such as `<NAMESPACE>`.
- [ ] A verification step shows the expected output.
- [ ] Likely failures have a recovery.
