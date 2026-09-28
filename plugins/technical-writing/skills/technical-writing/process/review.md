# Reviewing a document

## Contents

- Order of review
- Quality characteristics
- Self-contained page test
- Records under review
- Report format

Review goes from the largest unit to the smallest. A problem with the type or the skeleton makes sentence-level edits wasted work, so the report lists large problems first.

## Order of review

1. **Type.** Name the reader and the type. If the page mixes types (steps interleaved with design rationale, a tutorial that branches into reference), the first finding proposes a split.
2. **Skeleton.** Compare the sections with the skeleton of the type. Report missing, extra and misplaced sections.
3. **Facts.** Check commands, flags, defaults, versions and links against the code or the source the user points to. Run commands where possible. Mark each fact you could not check.
4. **Paragraphs and cohesion.** Each paragraph opens with its topic; sentences move from known to new; terms stay the same for the same concept.
5. **Sentences.** Characters as subjects, actions as verbs, no stray nominalizations, reasonable length.
6. **Words.** Stop words, LLM patterns, evaluations that should be facts.

Run the checker on the file before step 4 and use its output as input to steps 4 to 6.

## Quality characteristics

*Developing Quality Technical Information* (IBM Press) groups nine quality characteristics into three groups. Use them as review axes after the ordered pass, to find what the pass missed.

| Group | Characteristic | Question for the reviewer |
|---|---|---|
| *Easy to use* | Task orientation | Is the page organized around what the reader does? |
| *Easy to use* | Accuracy | Is every fact correct and checked? |
| *Easy to use* | Completeness | Is everything the reader needs present, and nothing extra? |
| *Easy to understand* | Clarity | Can each sentence be read only one way? |
| *Easy to understand* | Concreteness | Are there examples, numbers and names where the reader needs them? |
| *Easy to understand* | Style | Are voice, terms and tone consistent and suited to the type? |
| *Easy to find* | Organization | Does the order match the reader's path? |
| *Easy to find* | Retrievability | Can the reader find the page and the section by scanning or search? |
| *Easy to find* | Visual effectiveness | Do tables, diagrams and screenshots help, and do they have text equivalents? |

## Self-contained page test

Mark Baker's *Every Page is Page One* describes a topic that works for a reader who arrives from search. Check these seven characteristics:

| Characteristic | Check |
|---|---|
| Self-contained | Does the page work without reading the previous or next page? |
| Specific and limited purpose | Does the page do one job? |
| Conforms to type | Does it follow the skeleton of its type? |
| Establishes its context | Do the first lines say what this is and for whom? |
| Assumes the reader is qualified | Does it link to background material and leave the teaching to other pages? |
| Stays on one level | Does it keep one level of detail throughout? |
| Links richly | Does it link to related pages, terms and prerequisites? |

## Records under review

An ADR, a postmortem or a published changelog entry records a moment. The review does not rewrite it. When the content is out of date, the finding proposes a new record that supersedes the old one. The old record gets a one-line status change with a link to the new one. Besides typos and broken links, the only changes to a published record are its status mark (`[YANKED]`, `superseded by`) and the link to its replacement.

## Report format

Report findings as a table, largest problems first. Each row names one problem.

| Where | What | How to fix |
|---|---|---|
| "Install" section, step 3 | The command uses `--force`, removed in version 2 of the tool | Replace with `tool install --replace <PACKAGE>` |
| Whole page | Steps and design rationale are mixed | Split into a how-to and an explanation; link them |

"Where" is a section name, a heading or a quoted phrase that the author can search for. "What" states the problem as a fact. "How to fix" gives the replacement text or the concrete action. After the table, give a one-line verdict: ready, ready after the listed fixes, or needs restructuring first. Rewrite the page only if the user asks.
