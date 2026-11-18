---
name: write
license: MIT
description: Writes and reviews documentation of 13 types, chosen by the reader
when_to_use: Use to write, rewrite, review, shorten or plan documentation: tutorial, how-to, runbook, troubleshooting, reference, explanation, README, conventions, ADR or design doc, postmortem, changelog or release notes, docstring or code comment, CLI help or error message. Triggers: "write docs", "document this", "write a README", "write a guide", "write a runbook", "review this doc", "release notes", "design doc", "postmortem", "write a docstring", «документация», «доки», «напиши README», «инструкция», «методичка», «описание», «ранбук», «гайд», «отревьюй текст», «постмортем», «напиши docstring». Not for commit messages, PR descriptions, a chat explanation of code, marketing copy or documents outside software.
---

# Technical writing

## Contents

Glossary, Choosing the type, Routing, Branches, Core rules, Workflow, Sources.

This skill writes and reviews documentation by type. It finds the reader first, picks one of 13 document types, and loads the rules for that type.

## Glossary

- **Reader**: the person the document serves, with a task and a state (learning, working, under stress, looking up one fact).
- **Type**: one of the 13 document types in the routing table.
- **Type file**: the file in `types/` that holds the rules for one type.
- **Skeleton**: the ordered parts a type requires: sections of a page, or parts of an entry, a table row or a comment.
- **Core rules**: the rules in this file. They apply to every type unless the type file says otherwise.
- **Living document**: a page that changes with the product and is fixed or deleted when it stops being true.
- **Record**: a page that captures a moment. Besides typos and broken links, the only changes to a published record are its status mark (`[YANKED]`, `superseded by`) and the link to its replacement.
- **Superseded**: the status of a record that a newer record replaces. The old record gets this status and a link to the newer one.
- **Finding**: one problem found in review, reported as where, what, and how to fix.
- **Cold reader**: someone who has not seen the draft or its context: a fresh subagent or a person.

## Choosing the type

The user's word ("description", "guide", "manual") names a form. The type comes from the reader:

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
| docs, «документация», «доки» | Is this one page or a set? Who reads it first? | the type of the one page, or the doc set branch |
| notes, write-up | Does it record a decision, an incident, or a release? | ADR, postmortem, changelog |

When the request does not settle the type, pick the default type from the reader most likely to read it and draft it. The response opens with one line naming that reader and type: "For someone deploying today: a how-to." The question about the other reading goes to the list after the document.

One document has one type. A short section of a second type inside it is fine (troubleshooting in a README); separate pages go to the doc set branch.

## Routing

Read one type file per document (workflow step 2), the style file and the pattern catalog. When a type file conflicts with the core rules, the type file wins. Type files: [tutorial](types/tutorial.md), [how-to](types/how-to.md), [runbook](types/runbook.md), [troubleshooting](types/troubleshooting.md), [reference](types/reference.md), [explanation](types/explanation.md), [README](types/readme.md), [conventions](types/conventions.md). Records, code and interface: [ADR, design doc, RFC](types/adr.md), [postmortem](types/postmortem.md), [changelog, release notes, migration guide](types/changelog.md), [docstring, code comment](types/docstring.md), [CLI help, error message](types/cli-help-errors.md). Style files by the language of the document: [English](style/english.md), [Russian](style/russian.md). Patterns to remove: [style/llm-patterns.md](style/llm-patterns.md).

The style file is `style/<language>.md`, named in English. It follows the language of the document's prose; code, commands and quotes do not count. A Russian request for an English README loads the English file. A language with no style file gets the core rules, the type file and the pattern catalog; say so once. The catalog's examples are in English, and its patterns apply to a document in any language. Where a style file gives a language form for a type's voice rule, that form replaces the English examples of the type file. A Russian how-to title is an infinitive, not an imperative.

## Branches

**Create.** Follow the workflow checklist below from step 1.

**Review.** Identify the type of the existing text, load its type file, the style file and the pattern catalog, then follow [process/review.md](process/review.md). The report is the document of this branch, also when the request asks for the final or complete document. It goes to the chat; a file the user named is the text under review, never the place for the report. A record under review stays as written: propose a new record that supersedes it.

**Rewrite.** When the user asks to rewrite, shorten, rework or fix an existing text, load the same files as for review. Keep its type, headings and facts unless the user asks to change them. Fix what breaks the type file and the style file; cut toward the type's budget only when asked to shorten. It adds no parts. A record is not rewritten: propose a new one. Write the result over the file the user named, or give it in the chat. Add at most three lines on what changed, with no findings list.

**Doc set.** For "document this project", a request that needs several types, or a docs audit, follow [process/doc-set.md](process/doc-set.md). Then run the create branch for each page in priority order.

## Core rules

**Reader.** Write down who reads the page, what they are trying to do, and in what state. Every later decision follows from that sentence.

**Answer first.** Put the conclusion before the reasoning: in the page, the section, the paragraph and the list item. A tutorial opens with its goal instead. Type files list other exceptions.

**Self-contained page.** Readers arrive from search. The title and one first sentence say what the page is and, when the title does not, who it is for. Prerequisites and context are restated where the reader needs them. Write the Docs calls this ARID: Accept (some) Repetition In Documentation. Normative facts (a default, a limit, a flag) live in one place, and other pages link to it. A runbook keeps its commands on the page.

**One term per concept.** Pick one word for each concept, define it at first use, and keep it. A new word signals a new concept to the reader.

**Cohesion.** Start each sentence with what the reader already knows and end with the new information. The first sentence of a paragraph states its topic. A heading states the key message of its section, in plain words.

**Examples run.** Every command and snippet works as written. After a step that can fail quietly, show what success looks like.

**Placeholders and unknown facts.** Take facts from the user, the files they point to and the repository you are in. Never invent a fact: a date, a name, a number, a command, a link, a reason, a claim that something was verified. A required part with no fact gets one placeholder of the form `<UPPER_CASE>`, such as `<NAMESPACE>`; an optional part or a detail with no fact is left out. Do not wait for answers: draft in the same response and put a visible placeholder where each missing fact goes. End the response with at most three questions, one short line each, about a placeholder or the default type. Never ask the user to confirm any other inference.

**Current.** Fix or delete a living document as soon as it is wrong. Never change the content of a record (see Glossary): write a newer record and mark the old one superseded. Say which version a page applies to where it matters; avoid phrases that expire on a date.

**Compact.** Write the shortest document that lets the named reader do the task. The Length section of the type file gives a budget in words, lines or items. Rewrite the facts the user gave into the skeleton without expanding them. Add no reason, example, failure or caveat the user did not give. Leave out introductions, recaps, closing summaries and notes about the text. Write an optional skeleton part (marked "when…" or "if any") only when the reader needs it. State each fact once and give a single example. Use a table only for three or more comparable items; an optional part of one or two lines gets no heading. Every required part stays, with each condition, fact and command the reader needs. Numbers in the type and style files are rules of thumb with a source or marked as such.

**Visual content.** Use a picture only where text does worse: architecture, a flow, a user interface. Keep diagrams as code (Mermaid or similar) so they change together with the text. Crop a screenshot to the area that matters, mark the action, write alt text, and keep the step in text too. Put data in a table. A caption says what the reader should notice.

## Workflow

Run these steps in order. Do not print the list:

```
Documentation progress:
- [ ] 1. Reader: who, their task, their state
- [ ] 2. Type chosen; type file read with the Read tool, style file and pattern catalog read
- [ ] 3. Skeleton parts from the type file written out
- [ ] 4. First draft
- [ ] 5. Edit passes: structure, paragraphs and cohesion, sentences, words; cut toward the type's budget
- [ ] 6. check.py run when available, every error fixed, every warning read
- [ ] 7. Type checklist passed, Forbidden list clear
- [ ] 8. Cold reader test passed
```

Run all eight steps in one response without pausing for confirmation. A step that cannot run is skipped as its paragraph says. Say nothing about checks, run or skipped, and offer no additions: the response is the document and its questions. The only other lines: one each for a default type, an unreadable type file or a language with no style file, and the rewrite's three lines on what changed. A document written to a file is not repeated in the reply: one line names the file. The response ends with the final document, given once: never a draft followed by a final version. After it comes the list of questions, if there is one. With no questions the response ends with the document: no note on assumptions or on what was left out. If the user named a file for a new or rewritten page, write it there. A docstring, a comment or a changelog entry is inserted into its file by an edit. Otherwise deliver it in the chat as plain Markdown, never wrapped in a code block. Keep the checklist and any mention of this skill or its files out of the document.

**Step 1.** If the arguments start with `type=<type>`, that type is already chosen: skip choosing and go to step 2 with it. Settle in one sentence: who reads the page, what they are trying to do, and in what state. If the type is unclear, take the default type and name it in one line; a missing fact becomes a placeholder.

**Step 2.** Before drafting, read `${CLAUDE_SKILL_DIR}/types/<type>.md` with the Read tool, then the style file and the pattern catalog. If the type file cannot be read, say so in one line and do not rebuild the skeleton from memory. Still draft in the same response with the core rules only, and note that the type skeleton was not applied. The Skeleton, Forbidden and Type checklist sections of that file drive steps 3, 4 and 7.

**Step 3.** List the parts in the Skeleton section of the type file, in its order. For page types (tutorial, how-to, runbook, explanation, README, ADR, postmortem, changelog) the parts become the headings of the draft. For troubleshooting, reference, conventions, docstring and CLI help or error message, the skeleton sets the order of parts inside each entry, table row or comment, not headings. Omit a part marked "when…" or "if any" when its condition does not hold. Without the type file the draft follows the core rules only.

**Step 4.** Fill each skeleton part (heading, table row or field). Where a fact is missing, write a placeholder and add a question to the list at the end of the response.

**Step 5.** Edit in separate passes, largest unit first. A separate last pass cuts the draft toward the budget in the Length section of the type file. Delete in this order. First go sentences on what the page covers and facts stated twice. Then go reasons and examples the user did not give, and closing summaries. Last go optional parts the reader can do without and questions with no placeholder behind them. Stop when only required parts and the conditions, facts and commands the reader needs remain, even above the budget: it is a guide.

**Step 6.** Run the checker from any directory on the file, or pipe the draft through standard input when it exists only in the chat:

```bash
python3 "${CLAUDE_SKILL_DIR}/scripts/check.py" --lang auto <file>
python3 "${CLAUDE_SKILL_DIR}/scripts/check.py" --lang auto - <<'EOF'
<DRAFT>
EOF
```

It reports long sentences, broken links, dated phrases, and a subset of the stop words and LLM markers in the style files. Fix every `error`. Read every `warning` and either fix it or keep the text for a reason you can state. If the checker cannot run, for example because Bash is not permitted, continue to step 7 without comment.

**Step 7.** Check the draft item by item against both the Type checklist and the Forbidden list of the type file. A failed item or a forbidden pattern sends the draft back to step 4 once.

**Step 8.** Give the draft to a cold reader with only the reader's task: "You are a new engineer. Using only this page, deploy the service to staging. Report where you got stuck or had to guess." Give a subagent only the document and the task. A docstring, a code comment, CLI help, an error message or a changelog entry gets no subagent. For them, and when no subagent is available, make a separate pass reading the draft as the named reader. A placeholder is not a stall. Fix every place the reader stalled, then run steps 6 and 7 again.

## Sources

Where each rule comes from, with what was taken and where it is used: [sources.md](sources.md).
