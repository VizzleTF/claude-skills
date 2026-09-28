---
name: technical-writing
description: Writes and reviews technical documentation by document type. Picks the type from the reader and the reader's situation, loads that type's skeleton and voice rules together with an English style guide and a catalog of LLM writing patterns, and works through a copyable checklist that ends with a text-checking script and a cold-reader test. Covers tutorials, how-to guides, runbooks, troubleshooting pages, reference, explanations, READMEs, team conventions, ADRs and design docs, postmortems, changelogs and release notes, docstrings and code comments, CLI help and error messages.
when_to_use: Use when asked to write, rewrite, review, shorten, restructure or plan documentation or explanatory text, when a README, CHANGELOG, runbook, ADR or onboarding page is created or updated, or when a docstring, --help text or error message needs prose. Triggers include "write docs", "document this", "write a README", "write a guide", "write a runbook", "review this doc", "release notes", "design doc", "postmortem", «документация», «доки», «напиши README», «описание», «методичка», «инструкция», «ранбук», «ADR», «гайд», «отревьюй текст», «постмортем».
---

# Technical writing

## Contents

Glossary, Choosing the type, Routing, Branches, Core rules, Workflow, Sources.

This skill writes and reviews documentation by type. It finds the reader first, picks one of 13 document types, and loads the rules for that type.

## Glossary

- **Reader**: the person the document serves, with a task and a state (learning, working, under stress, looking up one fact).
- **Type**: one of the 13 document types in the routing table.
- **Type file**: the file in `types/` that holds the rules for one type.
- **Skeleton**: the ordered sections a type requires.
- **Core rules**: the rules in this file. They apply to every type unless the type file says otherwise.
- **Living document**: a page that changes with the product and is fixed or deleted when it stops being true.
- **Record**: a page that captures a moment. Besides typos and broken links, the only changes to a published record are its status mark (`[YANKED]`, `superseded by`) and the link to its replacement.
- **Superseded**: the status of a record that a newer record replaces. The old record gets this status and a link to the newer one.
- **Finding**: one problem found in review, reported as where, what, and how to fix.
- **Cold reader**: someone who has not seen the draft or its context: a fresh subagent or a person.

## Choosing the type

The user's word ("description", "guide", "manual") names a form. The type comes from the reader. Place the request on four axes:

| Axis | One end | Other end |
|---|---|---|
| Purpose | the reader acts | the reader wants to understand |
| Situation | the reader is learning | the reader is at work |
| Lifecycle | living document | record |
| Location | a standalone page | inside code or a user interface |

| Reader and moment | Type |
|---|---|
| Newcomer learning by doing, one guided path | tutorial |
| Knows the topic, mid-task, needs steps for one goal | how-to |
| On call, under stress, an alert has fired | runbook |
| Hit a specific error message or symptom | troubleshooting |
| Looks up one fact: an option, a field, a limit | reference |
| Wants to know why the system is built this way | explanation |
| Arrives at the project for the first time | README |
| Team member who must follow shared rules | conventions |
| Needs the record of a decision and its trade-offs | ADR (includes design doc and RFC) |
| Needs the record of an incident and its follow-ups | postmortem |
| Upgrades and needs to know what changed | changelog (includes release notes and migration guide) |
| Reads or calls the code | docstring or code comment |
| Runs a command or hits an error in a tool | CLI help or error message |

### Request words

| Request word | Questions about the reader | Possible types |
|---|---|---|
| description, «описание» | Does the reader need a fact, the reasons behind a design, or a first look at the project? | reference, explanation, README |
| guide, manual, «методичка» | Is the reader a newcomer learning, a worker solving one task, or a team member following rules? | tutorial, how-to, conventions |
| instructions, «инструкция» | Is the reader doing a planned task, or reacting to an alert or an error? | how-to, runbook, troubleshooting |
| docs, «документация», «доки» | Is this one page or a set? Who reads it first? | doc set branch |
| notes, write-up | Does it record a decision, an incident, or a release? | ADR, postmortem, changelog |

When the request does not settle the type, ask one question about the reader and offer a default answer. Example: "Who reads this: a new engineer learning the deploy, or someone deploying today? I will assume the second and write a how-to." If nobody can answer, state the assumption in one line and continue.

One document has one type. When a request needs two types, propose two documents and switch to the doc set branch.

## Routing

Read exactly one type file (workflow step 2), the style file and the pattern catalog. When a type file conflicts with the core rules, the type file wins.

| Type | Type file |
|---|---|
| tutorial | [types/tutorial.md](types/tutorial.md) |
| how-to | [types/how-to.md](types/how-to.md) |
| runbook | [types/runbook.md](types/runbook.md) |
| troubleshooting | [types/troubleshooting.md](types/troubleshooting.md) |
| reference | [types/reference.md](types/reference.md) |
| explanation | [types/explanation.md](types/explanation.md) |
| README | [types/readme.md](types/readme.md) |
| conventions | [types/conventions.md](types/conventions.md) |
| ADR, design doc, RFC | [types/adr.md](types/adr.md) |
| postmortem | [types/postmortem.md](types/postmortem.md) |
| changelog, release notes, migration guide | [types/changelog.md](types/changelog.md) |
| docstring, code comment | [types/docstring.md](types/docstring.md) |
| CLI help, error message | [types/cli-help-errors.md](types/cli-help-errors.md) |

Style: [style/english.md](style/english.md). Patterns to remove: [style/llm-patterns.md](style/llm-patterns.md).

This version holds English style rules. If the document is in another language, say so once, then apply the core rules, the type file and the pattern catalog, and skip the English style file. The catalog's examples are in English, and its patterns apply to a document in any language.

## Branches

**Create.** Follow the workflow checklist below from step 1.

**Review.** Identify the type of the existing text, load its type file, the style file and the pattern catalog, then follow [process/review.md](process/review.md). Report findings; rewrite only when asked. A record under review stays as written: propose a new record that supersedes it.

**Doc set.** For "document this project", a request that needs several types, or a docs audit, follow [process/doc-set.md](process/doc-set.md). Then run the create branch for each page in priority order.

## Core rules

**Reader.** Write down who reads the page, what they are trying to do, and in what state. Every later decision follows from that sentence.

**Answer first.** Put the conclusion before the reasoning: in the page, the section, the paragraph and the list item. A tutorial opens with its goal instead. Type files list other exceptions.

**Self-contained page.** Readers arrive from search. The first lines say what the page is and who it is for; prerequisites and context are restated where the reader needs them. Write the Docs calls this ARID: Accept (some) Repetition In Documentation. Normative facts (a default, a limit, a flag) live in one place, and other pages link to it. A runbook keeps its commands on the page.

**One term per concept.** Pick one word for each concept, define it at first use, and keep it. A new word signals a new concept to the reader.

**Cohesion.** Start each sentence with what the reader already knows and end with the new information. The first sentence of a paragraph states its topic. A heading states the key message of its section, in plain words.

**Examples run.** Every command and snippet works as written. After a step that can fail quietly, show what success looks like.

**Placeholders and unknown facts.** Every placeholder, in any type, has the form `<UPPER_CASE>`: `<NAMESPACE>`, `<DATE>`. Never invent a fact: a date, a name, a command, a host, a claim that something was verified. When a fact is missing, ask at most one question and offer a default, as for an unknown type. Do not stop to wait for the answer: in the same response, draft with the default and put a visible placeholder where each fact goes. End the response with a short list of the questions that fill them.

**Current.** Incorrect documentation is worse than missing documentation. Fix or delete a living document that is wrong. Never change the content of a record: write a newer record and mark the old one superseded. Besides typos and broken links, the only changes to a published record are its status mark (`[YANKED]`, `superseded by`) and the link to its replacement. Say which version a page applies to where it matters; avoid phrases that expire on a date.

**Lengths are guides.** Numbers in the type and style files are rules of thumb with a source or marked as such. None of them is a hard limit.

**Visual content.** Use a picture only where text does worse: architecture, a flow, a user interface. Keep diagrams as code (Mermaid or similar) so they change together with the text. Crop a screenshot to the area that matters, mark the action, write alt text, and keep the step in text too. Put data in a table. A caption says what the reader should notice.

## Workflow

Copy this checklist into the response and tick items as they are done:

```
Documentation progress:
- [ ] 1. Reader: who, their task, their state
- [ ] 2. Type chosen; type file read with the Read tool, style file and pattern catalog read
- [ ] 3. Skeleton parts from the type file written out
- [ ] 4. First draft
- [ ] 5. Edit passes: structure, paragraphs and cohesion, sentences, words
- [ ] 6. check.py run (or reported as unavailable), every error fixed, every warning read
- [ ] 7. Type checklist passed
- [ ] 8. Cold reader test passed
```

The checklist tracks progress in the conversation. Keep it out of the document delivered to the reader, together with any mention of this skill or its files.

**Step 1.** Write one sentence: who reads the page, what they are trying to do, and in what state. If the type is still unclear, ask the one question from "Choosing the type".

**Step 2.** Before drafting, read `${CLAUDE_SKILL_DIR}/types/<type>.md` with the Read tool, then the style file and the pattern catalog. If the type file cannot be read, say so in one line and do not rebuild the skeleton from memory. The Skeleton, Forbidden and Type checklist sections of that file drive steps 3, 4 and 7.

**Step 3.** Write out the parts listed in the Skeleton section of the type file, in its order. For page types (tutorial, how-to, runbook, explanation, README, ADR, postmortem, changelog) the parts become the headings of the draft. For troubleshooting, reference, conventions, docstring and CLI help or error message, the skeleton sets the order of parts inside each entry, table row or comment, not headings. Omit a part marked "when…" or "if any" when its condition does not hold. A required part with no known content gets a `<PLACEHOLDER>`; a runbook with no alert name gets `<ALERT_NAME>` as its title. Without the type file there is nothing to copy, so this box stays empty until step 2 is done.

**Step 4.** Fill each skeleton heading. Where a fact is missing, write a `<UPPER_CASE>` placeholder and add a question to the list at the end of the response.

**Step 5.** Edit in separate passes, largest unit first. Stephen King gives the formula in *On Writing*: the second draft is the first minus 10%. This skill treats it as a rule of thumb.

**Step 6.** Run the checker from any directory on the file, or pipe the draft through standard input when it exists only in the chat:

```bash
python3 "${CLAUDE_SKILL_DIR}/scripts/check.py" --lang en <file>
python3 "${CLAUDE_SKILL_DIR}/scripts/check.py" --lang en - <<'EOF'
<DRAFT>
EOF
```

It reports long sentences, stop words, LLM markers, broken links and dated phrases. Fix every `error`. Read every `warning` and either fix it or keep the text for a reason you can state. If the checker cannot run, for example because Bash is not permitted, say so in one line and continue to step 7.

**Step 7.** Go through the Type checklist of the type file item by item. Fix the draft for every item that fails, then tick the box.

**Step 8.** Give the draft to a cold reader with only the reader's task: "You are a new engineer. Using only this page, deploy the service to staging. Report where you got stuck or had to guess." Use a subagent with no conversation context, or ask the user to show it to a person. Fix every place the reader stalled, then run steps 6 and 7 again.

## Sources

Where each rule comes from, with what was taken and where it is used: [sources.md](sources.md).
