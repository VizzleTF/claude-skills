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
3. Inside a version, the breaking changes come first, one line each, starting with `BREAKING:`.
4. Then the other changes, grouped by category in the Keep a Changelog order: Added, Changed, Deprecated, Removed, Fixed, Security.

The breaking-changes block is this skill's addition to Keep a Changelog. A breaking change whose migration takes more than one step links to the migration guide. A one-step migration is stated in the line itself: "`BREAKING:` Removed `--legacy`; use `--mode=classic`."

Release notes open with the breaking changes too, then what the reader gains, then fixes.

A migration guide has a skeleton of its own:

1. From which version to which, and who must act.
2. Each breaking change: what changed, what breaks, and the steps to adapt, with code before and after.
3. How to verify the upgrade.

## Voice and verbs

Written for people. Keep a Changelog puts it this way: "Changelogs are for humans, not machines." Each entry says what changed for the user, in the past tense or as a noun phrase: "Added the `--json` flag to `list`." The migration guide uses the imperative for its steps.

## Length

One line per change, as a rule of thumb. A change that needs a paragraph gets a link to the release notes or the migration guide.

## Differences from the core rules

- **A release is a record.** The core rules fix or delete a wrong living document. A published version section is not rewritten. If a release was pulled, Keep a Changelog marks it `[YANKED]` next to the version; add a link to the version that replaces it. A correction goes into the next version's entries, and the old entry gets a link to that version. Besides typos and broken links, the only changes to a published record are its status mark (`[YANKED]`, `superseded by`) and the link to its replacement.

## Forbidden

- A dump of commit messages or `git log`.
- Entries that describe the code change in place of its effect on the user: "Refactored the parser".
- Dates in any format other than ISO 8601.
- A breaking change without the `BREAKING:` mark, or placed inside the category groups.
- Deleting or rewriting the section of a published version.

## Type checklist

- [ ] Versions are newest first, each with an ISO 8601 date.
- [ ] Changes are grouped by the six categories, in order.
- [ ] Breaking changes open the version section, each starts with `BREAKING:` and either links to a migration guide or states its one-step migration.
- [ ] Every entry states the effect on the user.
- [ ] Published versions changed only their status mark and the link to their replacement.
- [ ] A migration guide shows code before and after, and a verification step.
