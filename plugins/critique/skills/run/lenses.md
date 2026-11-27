# Lenses

Pick lenses for the target's kind; mix kinds when the target spans them. Each lens lists what to hunt and what proves it.

## Any kind

- approach: whether the goal needs this approach at all. Hunt up to three strong reasons it fails the goal and the plain alternative that avoids them; prove with the stated goal and a concrete case where the approach fails

## Code

- correctness: wrong output for valid input, edge cases, error paths; prove with a failing test or a run
- callers and contracts: broken callers, changed signatures, config and fixtures left behind; prove with a search and a run
- security: untrusted input, secrets, authz, injection; prove with the input that breaks it
- performance: work repeated per call, unbounded growth, blocking calls; prove with a measurement
- tests: behaviour no test covers, tests that pass on broken code; prove by breaking the code

## Infrastructure (Helm, CI, Docker, Terraform)

- template logic: values that render wrong or crash; prove with `helm template`, `terraform plan`, a dry run
- platform fit: names, quotas, policies, network and secrets of the real cluster or runner; prove with read-only queries
- upgrade and rollback: what breaks for an existing release or pipeline
- docs vs behaviour: every documented value and default matches the render
- supply chain and secrets: pinned versions, image sources, leaked values

## Documents

- task fit: can the reader do each task the document promises
- accuracy: every command, path, flag and number matches the code; prove by running or reading it
- structure: the answer first, one topic per section, nothing the reader must wade through
- consistency: terms, translations and copies of the same fact agree

## Skills, prompts, rules

- compliance: would a model follow each rule; which rules a model already follows by default
- conflicts: rules that contradict each other or the platform docs
- compactness: words that change no behaviour, duplicated meaning
- triggers: when it fires and when it should not

## UI and dashboards

- first use: what a new user cannot find or misreads
- correctness of data: every number matches its source; prove with the source
- states: empty, error, loading, long values, narrow screens
- accessibility: contrast, keyboard, labels
