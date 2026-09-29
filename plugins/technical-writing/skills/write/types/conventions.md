# Conventions

Conventions state the rules a team follows: code style, naming, review, commits, API design. The reader is a team member who must apply them.

## When to use it and when not

Use conventions for rules that apply to every contributor and that a reviewer can check.

Pick another type in these cases:

- One decision with its context and trade-offs: ADR. A convention may link to the ADR that set it.
- Steps to set up a tool: how-to.
- Background on why the codebase is organized a certain way: explanation.

## Skeleton

Each rule is one entry:

1. The rule, in one sentence, with its modality.
2. Why: the reason, in one or two sentences.
3. Example: bad, then good.

Group rules by area. Number them so a reviewer can cite a rule: "See N-4".

## Voice and verbs

Modality follows a fixed scale, marked in capitals as in RFC 2119:

| Word | Meaning |
|---|---|
| MUST, MUST NOT | Required. A reviewer blocks the change. |
| SHOULD, SHOULD NOT | Recommended. An exception needs a stated reason. |
| MAY | Allowed. Either choice is fine. |

State at the top of the page that the words carry these meanings. Every rule carries one word from the scale. A plain imperative is not used, because the reader cannot tell a MUST from a SHOULD.

## Length

One to three lines per rule. A rule that needs a page of justification belongs in an ADR, linked from the rule. This is a rule of thumb.

## Differences from the core rules

- **A rule without a reason is not accepted.** Every rule states why. A reader who knows the reason applies the rule to cases the example does not cover.

## Forbidden

- Rules without a reason.
- Modal words outside the scale: "try to", "ideally", "it is preferable".
- Rules no reviewer can check: "write clean code".
- Examples that show only the good case.

## Type checklist

- [ ] Every rule has a modality from the scale.
- [ ] Every rule has a reason.
- [ ] Every rule has a bad and a good example.
- [ ] Rules are numbered and grouped by area.
- [ ] A reviewer can check every rule.
