# Changelog, release notes and migration guide

A changelog lists the notable changes in each version for the people who use the project. Release notes present one version to a wider audience. A migration guide takes the reader through the breaking changes between two versions.

## When to use it and when not

Use a changelog entry for every release. Add release notes when users need more than the list: context, highlights, screenshots. Add a migration guide when a breaking change needs more than one step to adopt.

Pick another type in these cases:

- The reasons behind a change: ADR, linked from the entry.
- A procedure unrelated to an upgrade: how-to.

## Skeleton

Keep a Changelog 1.1.0 gives the form of the file:

1. An `Unreleased` section on top, collecting changes before the next release.
2. One section per version, newest first, with the version and the release date in ISO 8601 form: `## [1.4.0] - YYYY-MM-DD`.
3. Inside a version, changes grouped by type, in this order: Added, Changed, Deprecated, Removed, Fixed, Security.

This type adds one rule for breaking changes. Each one stays in its group (usually Changed or Removed) and comes first within it. It starts with `BREAKING:` and links to the migration guide.

Release notes follow the same order: breaking changes, then what the reader gains, then fixes.

A migration guide has a skeleton of its own:

1. From which version to which, and who must act.
2. Each breaking change: what changed, what breaks, and the steps to adapt, with code before and after.
3. How to verify the upgrade.

## Voice and verbs

Written for people. Keep a Changelog puts it this way: "Changelogs are for humans, not machines." Each entry says what changed for the user, in the past tense or as a noun phrase: "Added the `--json` flag to `list`." The migration guide uses the imperative for its steps.

## Length

One line per change, as a rule of thumb. A change that needs a paragraph gets a link to the release notes or the migration guide.

## Differences from the core rules

- **A release is a record.** The core rules fix or delete a wrong living document. A published version section is not rewritten. If a release was pulled, Keep a Changelog marks it `[YANKED]` next to the version; add a link to the version that replaces it. A correction goes into the next version's entries, and the old entry gets a link to that version. Typos and broken links are the only fixes made in place.

## Forbidden

- A dump of commit messages or `git log`.
- Entries that describe the code change in place of its effect on the user: "Refactored the parser".
- Dates in any format other than ISO 8601.
- A breaking change buried in the Changed group without a mark.
- Deleting or rewriting the section of a published version.

## Type checklist

- [ ] Versions are newest first, each with an ISO 8601 date.
- [ ] Changes are grouped by the six types, in order.
- [ ] Each breaking change opens its group, starts with `BREAKING:` and links to a migration guide.
- [ ] Every entry states the effect on the user.
- [ ] Published versions were not rewritten.
- [ ] A migration guide shows code before and after, and a verification step.
