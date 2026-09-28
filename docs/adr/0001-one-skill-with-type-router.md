# ADR-0001: One skill with a type router

Status: Accepted, 2026-09-28

## Context

The owner writes documentation with `writing-docs`, one skill with one rule set for every document. That rule set gives wrong advice for some types. It tells the author to delete an outdated ADR, to use the second person in reference, and to drop all explanation from a tutorial. A review found 16 such defects. The brief covers 13 document types and asks for a skill that picks rules by type. The skill also has to survive auto-compaction, so its entry file must stay near 150 lines.

## Decision

We will ship one skill per language whose `SKILL.md` is a router. It decides the type from the reader and the reader's state, loads exactly one file from `types/`, and adds the style file and the LLM-pattern catalogue. Every type file has the same seven sections in a fixed order, and a type file overrides the core rules where they conflict. Type, style and process files link to no other skill file, so Claude never follows a chain deeper than one level.

## Consequences

An author gets type-specific voice, skeleton and exceptions without having to pick the right skill among many. Claude matches one `description` against a request, so a vague request such as "write a description of the service" still reaches the skill and gets classified inside it. The core rules live in one place.

The cost is that the router must classify correctly. An ambiguous request needs one question about the reader, and a wrong guess loads the wrong rules for the whole document. `SKILL.md` has a hard ceiling of 170 lines, which limits how much core guidance fits. A rule shared by two types must stay in the core or be repeated in both type files, because type files cannot link to each other.

## Alternatives considered

- Thirteen separate skills, one per type. The brief rejects this. Each skill would need its own trigger, several would compete for the same request, and shared rules would be copied thirteen times.
- One flat skill with all rules inline, as in `writing-docs`. This design produced the 16 defects, and 13 skeletons do not fit in 150 lines.
- Type files that link to the style file themselves. This creates chains of references; the router pairs type and style instead.
