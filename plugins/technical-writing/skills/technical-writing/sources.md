# Sources

## Contents

- How to read this file
- Process and quality
- Structure and reading
- Style
- Document types
- Patterns and skill format
- Sources the skill does not rely on

## How to read this file

Each row gives the source, what the skill takes from it, and where the rule appears. Text in quotation marks was checked against the original web page. Rules from books are paraphrased without quotation marks, and terms from books are set in italics, because the books were not available for checking. Books give no figures here, with one exception: the 10% in King's formula, checked against published excerpts of *On Writing* that reproduce the formula. The book itself was not available. The Russian-language sources are listed for parity with the Russian edition of this skill; their rules are used only there.

## Process and quality

| Source | What the skill takes | Where in the skill |
|---|---|---|
| Jared Bhatti, Zachary Sarah Corleissen, Jen Lambourne, David Nunez, Heidi Waterhouse. *Docs for Developers: An Engineer's Field Guide to Technical Writing*. Apress. | The documentation process from audience and plan through drafting, editing, examples, visuals and publishing to feedback, metrics, maintenance and retirement. | SKILL.md workflow and core rules (audience, plan, draft, edit passes, examples, visuals); process/doc-set.md (publishing, feedback, metrics, maintenance and retirement) |
| Michelle Carey, Moira McFadden Lanyi, Deirdre Longo, Eric Radzinski, Shannon Rouiller, Elizabeth Wilde. *Developing Quality Technical Information: A Handbook for Writers and Editors*, 3rd edition. IBM Press. Earlier editions list Gretchen Hargis as lead author. | Nine quality characteristics in three groups: *easy to use* (task orientation, accuracy, completeness), *easy to understand* (clarity, concreteness, style), *easy to find* (organization, retrievability, visual effectiveness). Names checked against the publisher's description. | process/review.md |
| Mark Baker. *Every Page is Page One: Topic-Based Writing for Technical Communication and the Web*. XML Press. | The self-contained page and its seven characteristics, as listed on the author's site everypageispageone.com. | SKILL.md core rules; process/review.md |
| John M. Carroll. *The Nurnberg Funnel: Designing Minimalist Instruction for Practical Computer Skill*. MIT Press. John M. Carroll (ed.), with Hans van der Meij among the authors. *Minimalism Beyond the Nurnberg Funnel*. MIT Press. | Minimalism: orient on the reader's real task, cut what does not serve it, support recognizing errors and recovering from them. | types/tutorial.md, types/how-to.md, types/troubleshooting.md |
| Google. Documentation best practices, "Minimum viable documentation". google.github.io/styleguide/docguide | "A small set of fresh and accurate docs is better than a large assembly of 'documentation' in various states of disrepair." | process/doc-set.md |
| Write the Docs. Documentation principles. writethedocs.org/guide/writing/docs-principles | ARID: "Accept (some) Repetition In Documentation". Skimmable, Exemplary, Current: "Consider incorrect documentation to be worse than missing documentation." | SKILL.md core rules |

## Structure and reading

| Source | What the skill takes | Where in the skill |
|---|---|---|
| Janice (Ginny) Redish. *Letting Go of the Words: Writing Web Content that Works*. Morgan Kaufmann. | Headings that carry the key message; a page as one side of a conversation that starts with the reader's question. | SKILL.md core rules; process/doc-set.md |
| Steve Krug. *Don't Make Me Think*. New Riders. | Readers scan; cut *happy talk* and instructions nobody reads. His third law, about removing a large share of the words on a web page, is applied only to navigation text such as landing pages and READMEs. | types/readme.md |
| Barbara Minto. *The Pyramid Principle: Logic in Writing and Thinking*. Pearson. | Answer first, then the supporting reasons; SCQA (situation, complication, question, answer) to open an explanation or a design document. | SKILL.md core rules; types/explanation.md, types/adr.md |
| Diátaxis, by Daniele Procida. diataxis.fr | The action and understanding axes, and study and work, that separate tutorial, how-to, reference and explanation. For tutorials: "we", a stated goal at the start, and "Ruthlessly minimise explanation" with a link to fuller explanation. The skill keeps short explanations in tutorials. | SKILL.md type choice; types/tutorial.md |

## Style

| Source | What the skill takes | Where in the skill |
|---|---|---|
| Joseph M. Williams (later editions with Joseph Bizup). *Style: Lessons in Clarity and Grace*. Pearson. | Characters as subjects and actions as verbs; nominalizations; known to new; the topic of a paragraph up front. | style/english.md; SKILL.md core rules (cohesion) |
| Steven Pinker. *The Sense of Style*. Viking. | Classic style; the curse of knowledge; metadiscourse; compulsive hedging. The remedy for the curse of knowledge is a test with a cold reader. | style/english.md; style/llm-patterns.md; SKILL.md workflow step 8 |
| William Zinsser. *On Writing Well*. Harper. | Clutter words and how to cut them. | style/english.md |
| William Strunk Jr. and E. B. White. *The Elements of Style*. | Active voice; definite, specific, concrete language; omitting needless words. | style/english.md |
| George Orwell. *Politics and the English Language*. Essay. | Prefer the short everyday word; cut words that can go; prefer active voice. | style/english.md |
| Stephen King. *On Writing: A Memoir of the Craft*. Scribner. | The second draft is the first minus about 10%, a formula King took from an editor's rejection note. The skill uses it as a rule of thumb. | SKILL.md workflow step 5 |
| Maxim Ilyakhov, Lyudmila Sarycheva. *Pishi, sokrashchai* (Write, Cut). Alpina. Maxim Ilyakhov. *Yasno, ponyatno*. Alpina. | Stop words by category; a fact in place of an evaluation. | Russian edition style file; the evaluation pattern also appears in style/llm-patterns.md |
| Nora Gal. *Slovo zhivoe i mertvoe* (The Word, Living and Dead). Korney Chukovsky. *Zhivoi kak zhizn* (Alive as Life). | Officialese and verbal nouns in Russian. | Russian edition style file |
| Arkady Milchin, Lyudmila Cheltsova. *Spravochnik izdatelya i avtora* (Handbook for Publishers and Authors). | Russian typography. | Russian edition style file and the checker's Russian rules |

## Document types

| Source | What the skill takes | Where in the skill |
|---|---|---|
| Betsy Beyer, Chris Jones, Jennifer Petoff, Niall Richard Murphy (eds.). *Site Reliability Engineering*. O'Reilly. Chapter "Postmortem Culture: Learning from Failure", sre.google. Also *The Site Reliability Workbook*. | A blameless postmortem focuses "on identifying the contributing causes of the incident without indicting any individual or team". Contents of a postmortem: impact, actions taken, root causes, follow-up actions. A playbook entry for each alert. | types/postmortem.md, types/runbook.md |
| Michael Nygard. "Documenting Architecture Decisions". Cognitect blog. | ADR sections: title, context, decision, status, consequences. The decision is stated "in full sentences, with active voice. 'We will …'". All consequences are listed. One or two pages. A replaced decision stays in the repository, marked superseded. | types/adr.md |
| Olivier Lacan. Keep a Changelog 1.1.0. keepachangelog.com | "Changelogs are for humans, not machines." Change types Added, Changed, Deprecated, Removed, Fixed, Security; the latest version first; ISO 8601 dates. | types/changelog.md |
| David Goodger, Guido van Rossum. PEP 257, Docstring Conventions. peps.python.org | The one-line docstring prescribes the effect as a command ("Do this", "Return that") and does not restate the signature. | types/docstring.md |
| John Ousterhout. *A Philosophy of Software Design*. Yaknyam Press. | Comments describe what the code cannot show; interface comments are separate from implementation comments. | types/docstring.md |
| Google. Technical Writing, "Error messages". developers.google.com/tech-writing | Identify the cause, identify the user's invalid inputs, specify requirements and constraints, explain how to fix the problem, provide examples. | types/cli-help-errors.md |

## Patterns and skill format

| Source | What the skill takes | Where in the skill |
|---|---|---|
| Wikipedia. "Wikipedia:Signs of AI writing". en.wikipedia.org | The catalog of patterns: inflated significance, promotional language, vague attributions, superficial analysis, AI vocabulary, copula avoidance, negative parallelisms, rule of three, em dash overuse, bold overuse, and conversation residue. | style/llm-patterns.md |
| Anthropic. Skill authoring best practices. platform.claude.com/docs | Third-person description; references one level deep from SKILL.md; a table of contents in files over 100 lines; copyable workflow checklists; consistent terminology; no time-sensitive text. | the layout of the whole skill |
| Anthropic. Claude Code skills documentation. code.claude.com/docs/en/skills | The `when_to_use` field and the combined limit for `description` and `when_to_use`; `${CLAUDE_SKILL_DIR}` for script paths; SKILL.md stays in context after compaction only up to a token budget, so it is kept short. | SKILL.md frontmatter and length |

## Sources the skill does not rely on

Nielsen Norman Group published a web-reading study run in 1997 on a tourism website about Nebraska. It measured usability of promotional web text and says nothing about technical documentation. The skill does not use its figures as an argument; at most, its findings on scanning apply to navigation text.

Blog retellings and SEO articles about writing are not used as sources.
