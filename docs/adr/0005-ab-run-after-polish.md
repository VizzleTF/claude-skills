# ADR-0005: The A/B run happens last, after polish

Status: Accepted, 2026-09-28

## Context

The full comparison is about 180 generations and 180 judge calls on the owner's subscription, which takes hours. The brief asks for a result polished to reference quality, so the skill text keeps changing through the final polish. The spec first placed the run inside the README and validation ticket. The build showed that a run made at that point would compare a skill that no longer exists.

## Decision

We will run the full A/B comparison last, after the polish, so the report compares the final version of the skill. The README, validation and fixes-map ticket ships without results. The orchestrator starts the run in the acceptance phase.

## Consequences

The report and the owner's verdict describe the skill that visitors install. The quota is spent once, not once per revision.

Until the run finishes, the requirements for the report, the verdict and the full run stay open. Any change to the skill after the run makes the results stale, and the run must be repeated. Problems that only the run can reveal show up at the end, when fixing them means another run.

## Alternatives considered

- Run during the README ticket, as first planned. Rejected: the polish would change the skill after the comparison.
- Run after every change. Rejected: each run costs hours of quota.
