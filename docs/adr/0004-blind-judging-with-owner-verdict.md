# ADR-0004: Blind judging with a mandatory owner verdict

Status: Accepted, 2026-09-28

## Context

The owner needs proof that the new skill beats `writing-docs`; the author's opinion is not enough. A model judge prefers long, structured text and favours answers by position. The owner added a requirement: he judges the pairs against `writing-docs` blind himself, and he always writes why one is better.

## Decision

We will judge in two layers. A model judge scores the outputs of all four participants under labels A to D by a rubric with anchors at 1, 3 and 5. It runs twice with different orders, and skill names are stripped from the outputs. For the owner, the runner writes pairs X and Y: `writing-docs` against the new skill in the scenario's language, with the key in a separate `pairs/key.json`. `run.py --reveal` refuses to reveal the key while any filled-in pair has an empty "why", and names those pairs.

## Consequences

Position bias shows up as a disagreement between the two passes, and length appears as its own column, so a long answer does not win by length alone. The owner's verdict comes with reasons that later readers can check. After the reveal, the verdict file shows where the owner and the model judge agree.

Judging costs two Opus calls per scenario and model, on top of generation. The owner has to read every pair and write reasons before seeing any result. Blindness depends on scrubbing skill names from the outputs; a trace the scrubber misses tells the judge who wrote the text.

## Alternatives considered

- Model judge only. Rejected: the brief gives the final verdict to the owner, and the judge's biases are known.
- Owner verdict without a model judge. Rejected: the owner cannot score four participants on nine criteria over 30 scenarios by hand.
- An optional "why" field. Rejected: the owner asked for it to be mandatory, and a verdict without reasons proves nothing.
