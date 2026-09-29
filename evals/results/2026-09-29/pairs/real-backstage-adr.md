# Пара real-backstage-adr

Язык: en. Вид: review.

Запрос:

> The attached `adr002-default-catalog-file-format.md` comes from the Backstage repository. A new maintainer opens it to learn why the catalog file format looks the way it does. Review it for that reader: list the problems with where each one is and how to fix it.

Факты:

- The document is Backstage's ADR002 "Default Software Catalog File Format"
- It has sections Background (with Inspiration and Core Concepts), Format, Envelope, Metadata and Component
- It has no status, no date, and no explicit Decision, Consequences or Alternatives sections
- Most of the text specifies the descriptor file format field by field, which is reference content
- The format draws on the Kubernetes object format and on a catalog used internally at Spotify

Ожидания к ответу:

- The review does not propose silently rewriting the decision of an accepted record; a changed decision belongs in a new ADR that supersedes it, and the field specification can move to a separate reference page
- The review points to specific sections and gives a concrete fix for each finding

---

## X

## Findings

Path: `adr002-default-catalog-file-format.md`

```
:9-17: структура: The reader wants to know why the format looks this way, but the page never states a decision. It opens with background and then becomes a field reference. Add Context / Decision / Why sections, keeping the file an ADR.
:19-27,94-101 (and 26-28): структура: The rationale is scattered and partial. The Spotify inspiration, the Kubernetes model, co-hosting with Kubernetes manifests (l.96-97), alpha versions for evolution (l.99-101) and files kept beside code (l.13-15) each appear in a different place. Collect them under one "Why" list.
:1-5: структура: There is no status, date, alternatives or consequences. Nothing shows whether the decision still holds. The revision states this gap openly. A maintainer must fill in the date and status, because the file does not contain them.
:86-88: факт: "The first versions of the catalog will focus on the Component kind" is stale future tense. The catalog now has many kinds. Replace it with a pointer to the current reference.
:99-101: факт: "After that, we will be using backstage.io/v1" is an undated plan. Say it was the plan when the ADR was written, and check whether v1 was ever adopted.
:202-213: факт: The Component section is stale. Current Component specs require more than `type` (`lifecycle` and `owner`). It also duplicates the reference docs. Remove it and link to the descriptor-format page.
:62-65 vs 159-180: факт: The example puts `system` and `lifecycle` in labels. The example spec is only `type`, which would not pass current validation. Add a note that the example is illustrative and historical.
:38,86: факт: The system model link is a GitHub issue (#390), not a spec. I could not check it offline. Verify it and replace it with the current system model docs.
:42 vs 127: факт: "Entities have distinct names" contradicts "unique per kind, within a namespace". Use the precise rule only.
:72-75: факт: The list of special metadata fields omits `description`, which is documented in the Metadata section. Make the two consistent.
:82-200: структура: A field reference is mixed into an explanation page. This is a second job, and the same content lives in the descriptor-format docs. Keep only the rules that are decisions (name, label and annotation constraints). Link to the reference for everything else.
:169-179 vs 191-198: объём: The key rules for labels and annotations are duplicated word for word. State them once.
:9-15,26-28,31-35: объём: Filler such as "little descriptor files in your version control system of choice". Also the long "Core Concepts" paragraphs. Cut them.
:33: слова: "by push events from a CI/CD pipelines" is ungrammatical. Fix it to "from CI/CD pipelines".
:4: слова: The description is a boilerplate restatement of the title. Replace it with a one-line summary of the decision.
:21-24: слова: "certain pieces of metadata from that catalog are being carried over" does not say which ones. Name them, or cut the sentence.
```

## Final document

````markdown
---
id: adrs-adr002
title: 'ADR002: Default Software Catalog File Format'
description: Catalog descriptor files are YAML documents with a Kubernetes-style envelope (apiVersion, kind, metadata, spec), kept in version control next to the code.
---

**Status:** in use. The original ADR did not record a decision date or status.
**Not recorded:** alternatives considered and consequences.

## Context

The software catalog tracks software components and more. Its built-in source is a
database-backed catalog that updates itself from descriptor files in version
control. Developers maintain these files next to their code, and the catalog reacts
to changes.

This ADR sets the default format of those files. How files are registered (manually,
from CI/CD pipelines, by webhooks from version control) is out of scope.

## Decision

Descriptor files are [YAML](https://yaml.org/spec/1.2/spec.html). They may be written
by hand or generated. A file holds one or more YAML documents separated by `---`, and
each document describes one entity.

Every entity has the same envelope. It follows the
[Kubernetes object format](https://kubernetes.io/docs/concepts/overview/working-with-objects/kubernetes-objects/).

| Field        | Meaning                                                                                                                                  |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `apiVersion` | Version of the format for this kind. Together with `kind`, it tells a parser how to read the rest of the document.                       |
| `kind`       | High-level entity type from the [Backstage system model](https://github.com/backstage/backstage/issues/390).                             |
| `metadata`   | Data about the entity that is not part of its specification. `name`, `namespace`, `description`, `labels` and `annotations` have reserved meanings. |
| `spec`       | The entity's specification. Its structure depends on `apiVersion` and `kind`. Some kinds have none.                                      |

Entities are stored in the catalog, where they can be queried. They reference each
other by name.

Illustrative example with mocked data. It comes from the original ADR, and current
kinds define more required `spec` fields (see the
[descriptor format reference](https://backstage.io/docs/features/software-catalog/descriptor-format)).

```yaml
---
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: frobs-awesome
  description: |
    Backend service that implements the Frobs API, as defined
    in [the Frobs RFC](https://example.com/spec/frob.html).
  labels:
    system: frobs
    lifecycle: production
    example.com/service-discovery-name: frobsawesome
  annotations:
    circleci.com/project-slug: github/example-org/frobs-awesome
spec:
  type: service
```

## Why

- **Spotify's internal catalog.** A homegrown catalog is a core part of Spotify's
  infrastructure. Its user experience, learnings and some of its metadata carry over
  to the open source catalog.
- **Kubernetes object format.** It is a familiar, proven structure. Labels and
  annotations keep their Kubernetes semantics. Backstage entities use an `apiVersion`
  prefixed with `backstage.io/`, so they can be told apart from other objects with the
  same structure, for example when stored alongside Kubernetes manifests.
- **`apiVersion` plus `kind`.** The pair lets the format evolve per kind. Early versions
  use alpha/beta versions such as `backstage.io/v1alpha1` to signal that the format may
  still change. The plan was `backstage.io/v1` and up after that.
- **Files in version control, beside the code.** The people who change the software
  keep its catalog entry current, and the catalog follows automatically.

## Rules the format enforces

The full field reference is in the
[descriptor format docs](https://backstage.io/docs/features/software-catalog/descriptor-format).
These are the constraints that were decided here.

| Field         | Rule                                                                                                                                                                                                 |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`        | Required. Used by people to recognize the entity and by machines to reference it (URLs, other entity files). Unique per kind within a namespace at any point in time, compared case-insensitively. Can be reused after the entity is deleted. |
| `namespace`   | Optional. Only bounds the scope of name uniqueness for now. Reserved for future semantics. Namespaces can be catalog entities (`v1` / `Namespace`), as in Kubernetes.                                  |
| `description` | Optional. Short, human-readable overview for display. Longer documentation goes elsewhere.                                                                                                           |
| `labels`      | Optional string key/value pairs, used like [Kubernetes labels](https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/). For classifying an entity and referencing other entities, and used in queries and filters. Values follow the `name` format below. Some keys, such as `system`, have predefined meaning. |
| `annotations` | Optional string key/value pairs, used like [Kubernetes annotations](https://kubernetes.io/docs/concepts/overview/working-with-objects/annotations/). Non-identifying. Mainly for references into external systems: the git ref an entity came from, monitoring, logging, PagerDuty schedules. Values are strings of any length. |

**`name` format.** Entities that break these rules are rejected at registration. The
rules are configurable per organization. The defaults:

- 1 to 63 characters.
- Sequences of `[a-zA-Z0-9]`, optionally separated by one of `[-_.]`.
- Examples: `visits-tracking-service`, `CircleciBuildsDs_avro_gcs`.

**Label and annotation keys.** Both use the same format:

- An optional prefix followed by `/`, then a required name part.
- The prefix is a lowercase domain name, at most 253 characters.
- The name part is sequences of `[a-zA-Z0-9]` separated by `[-_.]`, at most 63 characters.
- The `backstage.io/` prefix is reserved for Backstage core components.
````

---

## Y

1. Whole page: this is a format reference under an ADR title. It has no Status, Decision, Consequences or Alternatives, so a maintainer asking "why is it like this?" gets a field spec instead. Split it into two pages. Write a new ADR (roughly 150 words, see items 2 to 4) that supersedes this one. Move "Format", "Envelope", "Metadata" and "Component" to a reference page, and link the ADR to it. Then set this ADR's status to `superseded by ADR-NNNN` and leave the body unchanged.

2. Missing Decision: nowhere does the page say what was chosen: YAML descriptor files kept in version control, a Kubernetes-style envelope, and `apiVersion`/`kind`/`metadata`/`spec`. "This ADR describes the default format" only announces a topic. Add a paragraph that opens "We will describe every catalog entity as a YAML document with `apiVersion`, `kind`, `metadata` and `spec`, stored next to the code it describes, because…".

3. "Inspiration" section: the reasons for the design are vague. The text says only "learnings, and certain pieces of metadata" and "heavy inspiration" from the Kubernetes format. Name what carried over from Spotify's internal catalog and why the Kubernetes envelope fits. For example, say what `apiVersion` plus `kind` buys the parser and why labels and annotations are split. If nobody recorded the reasons, write `<REASON_FOR_KUBERNETES_STYLE_FORMAT>` rather than leaving "inspiration" to imply one.

4. Missing Alternatives and Consequences: no other format or storage approach appears, such as JSON, a database-only catalog or a bespoke schema. No cost is listed either. Costs the page does hint at:
   - the alpha format may change;
   - names are limited to 63 characters and are case-insensitive;
   - `namespace` is reserved.

   Add "Alternatives considered", one line each with `<WHY_REJECTED>`. Add "Consequences" covering costs as well as benefits.

5. Missing Status and date: the front matter has neither. Add "Status: `<STATUS>`, `<DATE>`". The title also lacks the ADR number format used elsewhere in the log (`ADR-0002`, not "ADR002"). Not verified against the sibling ADRs. The `description` only repeats the title; say what was decided.

6. "Core Concepts", "Entities have distinct names": this contradicts the `name` section, where uniqueness holds per kind within a namespace, case-insensitively. Replace with "Names are unique per kind within a namespace".

7. Stale or unverifiable statements, which a new maintainer cannot date:
   - "The first versions of the catalog will focus on the `Component` kind"
   - "Early versions… will be using alpha/beta versions"
   - "namespace… is reserved for future use"
   - the only kind documented is `Component`

   Not verified against the current catalog. Replace each with the state at the decision date ("At the time of this decision, only `Component` exists") or link to the current kinds list. Also replace the System Model link, which points to GitHub issue #390, with a stable document if one exists.

8. "Labels" and "annotations": the key-format paragraph (optional prefix, 253-character lowercase domain, 63-character name part) is copied word for word. The `name` rule is a third variant, so the copies can drift. State the key format once and have the other sections link to it. Not verified whether the `name` and label-value rules are meant to be identical. Note also that `name` allows `[a-z0-9A-Z]` while uniqueness is case-insensitive.

9. Terms: "registry" ("deleted from the registry") and "catalog" name the same thing. "Registered" and "registration" also appear for two different acts: locating a file and accepting an entity. "Descriptor file", "entity definition", "document" and "specification" overlap. Pick one term for each concept, define it at first use, and keep it.

10. Filler and hedges throughout:
    - "little descriptor files"
    - "See below for details about these fields."
    - "This is an example entity definition with some mocked data."
    - "may get broader semantic implication"
    - "or by push events… etc."

    Delete the metadiscourse. Replace "may get broader semantic implication" with the actual plan, or drop it. Remove "etc." and list the real registration methods or link to them.

Verdict: needs restructuring first. Write the new ADR and the reference page, then change only this record's status mark.
