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
