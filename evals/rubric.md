# Judge rubric

You score documentation written for a scenario. You get the scenario request, its fact list, its answer expectations (`expect_notes`, when present), the expected document type or a list of acceptable types, the fixture files if the scenario has any, and several outputs labelled with letters. Score each output on its own, from 1 to 5 on every criterion. Scores 2 and 4 are for outputs between two anchors.

Each criterion heading ends with its JSON key in backticks. Use exactly these keys in the result: `type`, `skeleton`, `accuracy`, `answer_first`, `scannable`, `voice`, `no_llm_patterns`, `concise`, `actionable`.

The anchors describe what a reader can or cannot do with the output, or they cite a public source for the type. The sources are listed at the end.

## Rules for the judge

1. **Length is not merit.** A longer output does not score higher because it covers more. Content the reader does not need for their task counts against the output under `concise`, even when it is correct. Two outputs that serve the reader equally well get the same score whatever their lengths.
2. **Asking is a legitimate answer to an ambiguous request.** The writer runs non-interactively and cannot wait for a reply, so a clarifying question is a valid outcome and not a failure. For `kind: ambiguous` any type from the expected list is correct. An output scores 5 on `type` in either of two cases: it picks an expected type and states which reader it assumed, or it asks who the reader is and what they need to do and names the candidate types.
3. **Cap for a question without a document.** An output that asks a clarifying question and writes no document scores at most 3 on each of the other eight criteria. Its total is therefore at most 29 of 45, below the 45 a complete, correct document can reach. An output that asks the question and also delivers a draft for the reader it assumed is scored on that draft with no cap.
4. **Style is judged in the language of the document.** A Russian document is judged by Russian style norms, an English document by English ones. Do not penalise a Russian text for not following English conventions, or the reverse. Quoted source text, commands and identifiers are not judged for style.
5. **The facts and the fixtures are the source of truth.** A statement that contradicts a fact, or adds a specific fact (a number, a name, a command, a flag, a date, a team, a channel) that is in neither the request, the facts nor the fixtures, is an error. Marking a missing fact as a gap for the author to fill is correct and is not an error. `expect_notes` describe what a good answer does; use them when scoring, but they are not facts the document has to state.
6. **A review is a document too.** For `kind: review` the output is a review report, judged on the same criteria: `type` — the review identifies what kind of document it reviews and judges it by what that kind's reader needs; `skeleton` — it checks the parts that kind needs; `accuracy` — every finding is true of the reviewed text, and the problems listed in the facts are found; `answer_first`, `scannable`, `voice`, `no_llm_patterns` and `concise` apply to the report itself; `actionable` — each finding names a place and gives a concrete fix.
7. **Records are superseded, not edited.** Nygard's ADR format and Keep a Changelog treat accepted decisions and released versions as fixed history. An output that edits the body of an accepted record to reflect a new decision scores at most 2 on `skeleton` and `accuracy`. The expected change is a new record that supersedes the old one, with the old one's status set to superseded.
8. **Ignore tool chatter.** Skip lines where the writer talks about its own process ("I will now write…", "Here is the document"). Judge the document.
9. **Do not guess the writer.** Outputs carry no names. Do not reward or punish an output for how it seems to have been produced.

## Criteria

### 1. Type selection `type`

Would the scenario's reader, in the situation the request describes, get the kind of document they need? Diátaxis separates four reader needs: learning (tutorial), doing a task (how-to), looking up a fact (reference) and understanding (explanation). Records (ADR, postmortem, changelog) and in-code text (docstring, `--help`, error messages) are separate kinds.

- **1** — The reader gets the wrong kind: a learning walkthrough when they must act on an alert now, an essay when they came to look up one value.
- **3** — The main kind is right, but a large part serves a different need: numbered steps inside an explanation, project history at the top of a README, advice inside a reference.
- **5** — The kind matches the reader's need, and no section serves a different need. For an ambiguous request, see rule 2.

### 2. Type skeleton `skeleton`

Does the document contain the parts its public model requires?

- **1** — A part the type's public model requires is missing. Examples: a postmortem without impact, timeline or action items (Google SRE); an ADR without context, decision or consequences (Nygard); a changelog entry without version and date (Keep a Changelog); an error message without what failed or how to fix it (Google developer documentation style guide); a runbook step without a way to confirm it worked.
- **3** — All required parts are present, but some are incomplete or in an order that makes the reader search: action items without an owner or due date, breaking changes listed after fixes, a how-to that ends without a check.
- **5** — Every required part is present and complete, in the order the reader needs them. Examples: an ADR has status and date, and a `supersedes` link when it replaces a record; postmortem times carry a time zone; changelog changes are grouped by kind (Added, Changed, Deprecated, Removed, Fixed, Security).

### 3. Factual accuracy `accuracy`

Could a reader act on every statement without being misled?

- **1** — At least one fact from the list is stated wrongly, or the output invents a specific fact the reader would act on (a command, a flag, a default, a team, a date).
- **3** — No fact is wrong, but a fact the reader needs is missing, or the output adds a minor invented detail that does not change what the reader does.
- **5** — Every fact the reader needs is present and correct, nothing is invented, and gaps in the source are marked as gaps.

### 4. Answer first `answer_first`

After reading the first paragraph or block, does the reader know the thing they came for? This is the inverted pyramid of news writing, applied to docs.

- **1** — The first screen holds no part of the answer: only history, motivation, a restatement of the request or a table of contents.
- **3** — The answer appears in the first section, but only after a paragraph the reader has to skip.
- **5** — The first sentence or block gives the reader what they came for: the action, the value, the decision, the impact. For a tutorial it states what the reader will have built by the end, as Diátaxis recommends.

### 5. Scannability `scannable`

Can a reader who scans only headings, first sentences and tables find the part they need?

- **1** — No: headings are absent or do not name their content, and finding anything requires reading line by line.
- **3** — Partly: some headings are generic ("Overview", "Notes"), a sequence of steps is not numbered, or repeated records are written as prose where a table would let the eye compare them.
- **5** — Yes: each heading names a task or a thing, sequences are numbered, repeated records use one table or one entry format, and each paragraph states its point in the first sentence. Reasoning that needs connected sentences (explanations, ADR context) stays in prose.

### 6. Voice and verbs for the type `voice`

Does the grammatical voice match what public guides for this type prescribe?

- **1** — The voice works against the type. Examples: a postmortem that names a person as the cause (Google SRE asks for blameless postmortems); a reference page that gives advice in the second person; a docstring whose first line restates the signature.
- **3** — Mostly right, with lapses: an instruction whose condition comes after the action, passive voice that hides who acts in a step, a tense switch inside a timeline.
- **5** — Consistent with the type's guides. How-to, runbook and tutorial steps are imperative, with any condition before the action (Google developer documentation style guide). Reference is indicative and descriptive. ADR decisions are active and first person: "We will …" (Nygard). Postmortems use past tense and name systems, not people (Google SRE). A Python docstring's first line is an imperative phrase ending in a period, "Return …" (PEP 257). An error message says what went wrong and how to fix it (Google developer documentation style guide).

### 7. No LLM patterns `no_llm_patterns`

Would a reader who knows the common signs of machine-generated prose find any in the text? The reference list is Wikipedia's "Signs of AI writing".

- **1** — Three or more instances in the output, from the reference list: promotional adjectives ("seamless", "robust", "powerful", «бесшовно»), negative parallelism ("not just X, it's Y", «не просто X, а Y»), rhetorical triplets, a closing summary that restates the text, filler openers ("In today's world", «В современном мире»), praise of the product or the reader.
- **3** — One or two instances, none of them in steps, commands or facts.
- **5** — None.

### 8. Length without padding `concise`

Can any sentence be deleted without the reader losing information or ability to act? The test comes from Strunk and White's "omit needless words".

- **1** — Many: a quarter or more of the text restates facts, gives generic advice not tied to the facts, adds sections the type does not use, or repeats the body in a conclusion.
- **3** — A few sentences or one paragraph can be deleted with no loss.
- **5** — None can be deleted with no loss. Repeating what the reader must have at hand in that place (prerequisites in a how-to, full commands in a runbook) does not count as padding. A short output that drops needed facts loses points under `accuracy`, not here.

### 9. Actionability `actionable`

Can the reader do their job using this output alone?

- **1** — No: a command is incomplete or wrong, a placeholder is ambiguous, there is no way to tell whether an action worked, or review findings have no location or fix.
- **3** — Mostly, with guesses: a command lacks a required argument, a check has no expected output, a finding has no concrete fix.
- **5** — Yes: every command runs when copied with its placeholders filled, each placeholder is marked, each action has a check and, where it changes a system, a way back, and links point to the next step. For a review, every finding names the place and the fix. For an explanation or ADR, the reader can make the decision or change the code the document is about.

## Sources

- Diátaxis, https://diataxis.fr/ — tutorial, how-to, reference, explanation.
- Michael Nygard, "Documenting Architecture Decisions" (2011), https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions — ADR parts and "We will …".
- Google SRE Book, chapter 15 "Postmortem Culture: Learning from Failure", https://sre.google/sre-book/postmortem-culture/ — blameless postmortems, impact, timeline, action items.
- Keep a Changelog 1.1.0, https://keepachangelog.com/en/1.1.0/ — version, ISO date, change groups.
- PEP 257, https://peps.python.org/pep-0257/ — docstring first line.
- Google developer documentation style guide, https://developers.google.com/style — procedures, conditions before instructions, error messages.
- Wikipedia, "Signs of AI writing", https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing — LLM patterns.
- Strunk and White, "The Elements of Style" — "omit needless words".
