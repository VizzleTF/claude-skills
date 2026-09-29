I read the file. The review comes first, followed by the complete revised document.

## Review

The main problem is that this is an ADR in name only. It is a format specification, so a new maintainer looking for the reasons behind the format has to infer them. The reasons are in the text, but scattered.

**Structure and "why"**

1. **Whole document, and lines 7-17.** There is no Status, Context, Decision or Consequences. It also has no date, so the reader can't tell if this is current or a historical snapshot. *Fix (done):* add Context, Decision and Consequences sections around the reference material, and say it is a point-in-time record. A Status line and a date need a maintainer, since the file doesn't contain them (see the maintainer-only list).
2. **Lines 19-27 and 94-101.** The rationale is scattered and never tied to a choice. For example, Kubernetes inspiration is mentioned, but the reader isn't told what it caused: the `apiVersion`+`kind` envelope, the label/annotation split, and the `backstage.io/` prefix for co-hosting. *Fix (done):* a "Decision" section lists each choice with its stated reason, using only reasons the original text gives.
3. **Whole document.** There are no alternatives considered and no trade-offs. *Fix:* maintainer-only. I did not invent them. The revised Consequences section records only what follows from the text.

**Vague, undefined or contradictory content**

4. **Lines 59-61 vs 152-157.** The example's `description` is a multi-line block containing Markdown, but the field is defined as "short and informative". *Fix (done):* the example now uses a one-line description.
5. **Lines 63, 176-177.** The example uses the labels `system` and `lifecycle`. The text says `system` "has predefined semantics" but never says what they are. `lifecycle` is not mentioned at all. *Fix:* maintainer-only. Say what these keys mean, or link to where they are defined. I left the sentence as written.
6. **Lines 42, 127-129.** "Entities have distinct names, and they may reference each other by those names" doesn't match the actual rule, which is unique per kind within a namespace. The document also never says how a reference resolves when it gives only a name, or what namespace applies when none is given. *Fix (done in part):* the Core Concepts sentence now states the real scope. The reference semantics need a maintainer.
7. **Lines 149-150.** "`v1` / `Namespace` entities" is cryptic, and it looks like it breaks the rule that Backstage entities use the `backstage.io/` prefix. *Fix (done):* the text now says these are Kubernetes-native and so unprefixed.
8. **Lines 86-87, 38.** The system model is defined only by a link to GitHub issue #390. An issue is mutable and may not still describe the model. *Fix:* maintainer-only. Point to a stable page for the model.
9. **Lines 87-88, 99-101.** Time-relative wording ("first versions will focus on", "early versions will use alpha/beta", "After that") has no anchor date, so a new maintainer can't tell whether it has already happened. *Fix (done):* reworded as what this ADR defines, but a real date or status is still needed.
10. **Lines 9-13.** "one of them that is included with the package": "the package" is undefined, and the sentence hides that this is the default source. *Fix (done):* reworded.
11. **Lines 22-24.** "Certain pieces of metadata … carried over" from Spotify's internal catalog doesn't say which pieces, so the reader can't tell which fields have that origin. *Fix:* maintainer-only.
12. **Line 213.** `type` gives `service` as an example only. It doesn't say whether the value is free-form or an enumerated set. *Fix:* maintainer-only.
13. **Lines 33-35.** Registration is "not covered in this document" with no pointer to where it is. *Fix:* maintainer-only. Add a link.

**Duplication and consistency**

14. **Lines 171-174 and 193-196.** The key format rules are copied verbatim into `labels` and `annotations`, so they can drift apart. *Fix (done):* one shared "Label and annotation keys" subsection.
15. **Lines 129 vs 136-138.** The text says "registry" in one place and "catalog" everywhere else. The character class is written `[a-z0-9A-Z]` in one place and `[a-zA-Z0-9]` in another. *Fix (done):* unified.
16. **Line 34, 73, 162, 189.** Small errors: "a CI/CD pipelines", "kubernetes" and "pagerduty" not capitalized, "mocked data". *Fix (done).*
17. **Lines 72-75.** "Likewise" is followed by a list that omits `description`, and "See below" is vague. *Fix (done):* the sentence now names the sections.

## Revised document

```markdown
---
id: adrs-adr002
title: 'ADR002: Default Software Catalog File Format'
description: Decision record for the default software catalog descriptor file format, which uses YAML files with a Kubernetes-style envelope
---

This is a point-in-time record of the initial design of the format. It explains
the choices made and then specifies the format as decided.

## Context

Backstage comes with software catalog functionality that you can use to track
all your software components and more. It can be powered by data from various
sources. The default source included with Backstage is a custom database-backed
catalog. It keeps itself updated automatically based on the contents of small
descriptor files in your version control system of choice. Developers create
these files and maintain them side by side with their code, and the catalog
system reacts accordingly.

This ADR describes the default format of these descriptor files.

### Inspiration

Internally at Spotify, a homegrown software catalog system is used heavily and
forms a core part of Backstage and other important pieces of the infrastructure.
The user experience, learnings, and certain pieces of metadata from that catalog
are being carried over to the open source effort.

The file format also draws heavy inspiration from the
[Kubernetes object format](https://kubernetes.io/docs/concepts/overview/working-with-objects/kubernetes-objects/).

### Core Concepts

There are a number of descriptor files, all of whose locations (e.g., within a
version control system) are registered with the software catalog. The method of
registration is not covered in this document; it could happen manually inside
Backstage, by push events from a CI/CD pipeline, by webhook triggers from the
version control system, etc.

Each file describes one or more entities in accordance with the
[Backstage System Model](https://github.com/backstage/backstage/issues/390). All
of these entities have a common structure and nomenclature, and they are stored
in the software catalog from which they can then be queried.

Entities have names that are unique per kind within a namespace (see
[`name`](#name)), and they may reference each other by those names.

## Decision

Descriptor files are YAML files with a Kubernetes-style envelope. The specific
choices, and the reasons given for them, are:

- **Descriptor files live in version control, next to the code they describe.**
  Developers create and maintain them, and the catalog updates itself in
  response, so ownership of the metadata stays with the people who own the
  software.
- **YAML, with several documents allowed per file.** Files can be written by
  hand or generated by tools. Each YAML document describes exactly one entity.
- **A common envelope of `apiVersion`, `kind`, `metadata` and `spec`, borrowed
  from Kubernetes.** The `apiVersion` and `kind` pair is enough for a parser to
  know how to interpret the rest of the document, and the version lets the
  format evolve.
- **A `backstage.io/` prefix on Backstage-specific `apiVersion` values.** This
  distinguishes Backstage entities from other objects with the same structure,
  which matters when they are co-hosted with, for example, Kubernetes manifests.
- **Alpha versions first** (e.g. `backstage.io/v1alpha1`), to signal that the
  format may still change. Stable formats use `backstage.io/v1` and up.
- **Labels and annotations follow Kubernetes conventions, but with separate
  roles.** Labels classify an entity and are used in queries and filters.
  Annotations are for references into external systems.
- **Naming rules are configurable.** The defaults are given below, and entities
  that break the configured rules are rejected at registration.

## Consequences

- Anyone who knows Kubernetes manifests will recognize the structure, and
  Backstage entities can share files and tooling with Kubernetes objects without
  being mistaken for them.
- Because names are unique only per kind within a namespace, a reference by name
  alone is not necessarily unambiguous across kinds.
- While formats are alpha, they may change incompatibly.
- This ADR defines only the `Component` kind. Other kinds from the system model
  are expected to follow.

## Format

Descriptor files use the [YAML](https://yaml.org/spec/1.2/spec.html) format.
They may be written by hand or created using automated tools. Each file may
consist of several YAML documents (separated by `---`), where each document
describes a single entity.

This is an example entity definition with made-up data.

```yaml
---
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: frobs-awesome
  description: Backend service that implements the Frobs API.
  labels:
    system: frobs
    lifecycle: production
    example.com/service-discovery-name: frobsawesome
  annotations:
    circleci.com/project-slug: github/example-org/frobs-awesome
spec:
  type: service
```

The root fields `apiVersion`, `kind`, `metadata`, and `spec` are part of the
_envelope_, defining the overall structure of all kinds of entities. Likewise,
the `name`, `namespace`, `labels`, and `annotations` metadata fields are of
special significance and have reserved purposes and distinct shapes. The
following sections describe the envelope and these fields.

## Envelope

The root envelope object has the following structure.

### `apiVersion` and `kind`

The `kind` is the high level entity type being described, typically from the
[Backstage system model](https://github.com/backstage/backstage/issues/390).

The `apiVersion` is the version of the specification format for that particular
entity that this file is written against. The version is used for being able to
evolve the format, and the tuple of `apiVersion` and `kind` should be enough for
a parser to know how to interpret the contents of the rest of the document.

Backstage-specific entities have an `apiVersion` that is prefixed with
`backstage.io/`, to distinguish them from other types of objects that share the
same type of structure. This may be relevant when co-hosting these
specifications with, e.g., Kubernetes object manifests.

Formats start out as alpha versions, e.g., `backstage.io/v1alpha1`, to signal
that the format may still change. Stable formats use `backstage.io/v1` and up.

### `metadata`

A structure that contains metadata about the entity, i.e., things that aren't
directly part of the entity specification itself. See the Metadata section below
for details.

### `spec`

The actual specification data that describes the entity.

The precise structure of the `spec` depends on the `apiVersion` and `kind`
combination, and some kinds may not even have a `spec` at all. See the
per-kind sections at the end of this document for the specification structure of
specific kinds.

## Metadata

The `metadata` root field has the following nested structure.

### `name`

The name of the entity. This name is both meant for human eyes to recognize the
entity, and for machines and other components to reference the entity (e.g. in
URLs or from other entity specification files).

Names must be unique per kind, within a given namespace (if specified), at any
point in time. This uniqueness constraint is also case insensitive. Names may be
reused at a later time, after an entity is deleted from the catalog.

Names are required to follow a certain format. Entities that do not follow those
rules will not be accepted for registration in the catalog. The ruleset is
configurable to fit your organization's needs, but the default behavior is as
follows.

- Strings of length at least 1, and at most 63
- Must consist of sequences of `[a-zA-Z0-9]` possibly separated by one of
  `[-_.]`

Example: `visits-tracking-service`, `CircleciBuildsDs_avro_gcs`

### `namespace`

The `name` of a namespace that the entity belongs to. This field is optional
and currently has no special semantics apart from bounding the name uniqueness
constraint if specified. It is reserved for future use and may get broader
semantic implication.

Namespaces may also be part of the catalog. They are entities of kind
`Namespace` with `apiVersion: v1`, with no `backstage.io/` prefix, because they
are not Backstage-specific but the same as in Kubernetes.

### `description`

A human readable description of the entity to be shown in Backstage. Should be
kept short and informative, suitable to give an overview of the entity's purpose
at a glance. More detailed explanations and documentation should be placed
elsewhere.

### Label and annotation keys

Label and annotation keys share the same format. A key has an optional prefix
followed by a slash, and then the name part, which is required. The prefix must
be a valid lowercase domain name, at most 253 characters in total. The name part
must be sequences of `[a-zA-Z0-9]` separated by any of `[-_.]`, at most 63
characters in total.

The `backstage.io/` prefix is reserved for use by Backstage core components.

### `labels`

Labels are optional key/value pairs that are attached to the entity, and
their use is identical to
[Kubernetes object labels](https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/).

Their main purpose is for references to other entities and for information that
is in one way or another classifying for the current entity. They are often used
as values in queries or filters.

Both the key and the value are strings. Keys follow the format described in
[Label and annotation keys](#label-and-annotation-keys). Some keys, such as
`system`, also have predefined semantics.

Values are strings that follow the same restrictions as `name` above.

### `annotations`

An object with arbitrary non-identifying metadata attached to the entity,
identical in use to
[Kubernetes object annotations](https://kubernetes.io/docs/concepts/overview/working-with-objects/annotations/).

Their purpose is mainly, but not limited, to reference into external systems.
This could, for example, be a reference to the git ref the entity was ingested
from, to monitoring and logging systems, to PagerDuty schedules, etc.

Both the key and the value are strings. Keys follow the format described in
[Label and annotation keys](#label-and-annotation-keys).

Values can be of any length but are limited to being strings.

## Component

| Field        | Value                   |
| ------------ | ----------------------- |
| `apiVersion` | `backstage.io/v1alpha1` |
| `kind`       | `Component`             |

The `spec` object for this kind is as follows:

| Field  | Type   | Required | Description                            |
| ------ | ------ | -------- | -------------------------------------- |
| `type` | String | Yes      | The type of component, e.g. `service`. |
```

## What needs a maintainer

I could not fix these from the file alone:

- **Status and date.** Both are missing (item 1).
- **Alternatives considered.** For example, why YAML and why the Kubernetes model (item 3).
- **Predefined label keys.** What `system` and `lifecycle` mean (item 5).
- **Reference resolution.** How references resolve, and what namespace applies when none is given (item 6).
- **System model link.** A stable replacement for issue #390 (item 8).
- **Spotify metadata.** Which pieces of metadata came over from Spotify's internal catalog (item 11).
- **Component `type` values.** Whether they are free-form or enumerated (item 12).
- **Registration pointer.** A link to where registration is documented (item 13).
