id: real-backstage-adr
lang: en
kind: review
expect: adr
core: false
fixtures: real-backstage-adr/
expect_notes:
- The review does not propose silently rewriting the decision of an accepted record; a changed decision belongs in a new ADR that supersedes it, and the field specification can move to a separate reference page
- The review points to specific sections and gives a concrete fix for each finding
facts:
- The document is Backstage's ADR002 "Default Software Catalog File Format"
- It has sections Background (with Inspiration and Core Concepts), Format, Envelope, Metadata and Component
- It has no status, no date, and no explicit Decision, Consequences or Alternatives sections
- Most of the text specifies the descriptor file format field by field, which is reference content
- The format draws on the Kubernetes object format and on a catalog used internally at Spotify

The attached `adr002-default-catalog-file-format.md` comes from the Backstage repository. A new maintainer opens it to learn why the catalog file format looks the way it does. Review it for that reader: list the problems with where each one is and how to fix it.
