# English style

## Contents

- Characters and actions
- Verbs
- Nominalizations
- Known to new
- Classic style and the curse of knowledge
- Metadiscourse and hedges
- Stop words by category
- Concrete language
- Sentence and paragraph length
- Edit order

These rules apply to prose in any document type. When a type has its own voice rule (imperative steps, past tense, third person), the type rule wins.

## Characters and actions

Joseph Williams gives the test for a clear sentence: the main characters are subjects, and their actions are verbs. Find who does what, then build the sentence around that pair.

| Before | After |
|---|---|
| The validation of the token is performed by the gateway. | The gateway validates the token. |
| There is a need for a restart of the pod after the change. | Restart the pod after the change. |
| Failure of the job occurs when the disk is full. | The job fails when the disk is full. |

The character can be a program, a person or a team. In reference, the character is usually the thing described: "Sets the timeout."

## Verbs

The verb carries the action. Choose it before anything else in the sentence.

- **Pick the specific verb.** "Delete", "rename", "retry" say more than "handle", "manage", "process", "deal with". Keep a general verb only when the specific one is unknown.
- **Prefer active voice.** The active sentence names who acts. Use passive voice when the actor is unknown or irrelevant: "The file is created on first run." Passive also fits when the thing acted on is the topic and belongs at the front of the sentence.
- **Use one verb where the draft has a phrase.** | Phrase | Verb |
  |---|---|
  | `make use of` | use |
  | `is able to` | can |
  | `is required to` | must |
  | `perform a check of` | check |
- **Use imperative mood for instructions.** "Run the migration." Put the condition first: "If the build fails, clear the cache."
- **Use the simple present for facts and results.** "The command prints the version." Write "will" only for events that follow a user action at a later time.
- **Keep one tense within a step or an entry.** A postmortem timeline stays in the past; a reference entry stays in the present.
- **Match modal verbs to obligation.** "Must" for a requirement, "should" for a recommendation, "can" for an option. Do not mix "need to", "have to" and "must" for the same level.
- **Avoid verbs about the text itself.** `This section describes`, `we will discuss` and `it can be seen that` add a sentence about the text. Say the thing itself.

## Nominalizations

A nominalization is a verb or adjective turned into a noun: "implementation", "configuration", "failure", "availability". Williams treats them as the main source of heavy prose. They hide the actor and push the real verb into "perform", "occur" or "provide".

Turn the noun back into a verb and restore its subject:

| Before | After |
|---|---|
| Provide confirmation of the deletion. | Confirm the deletion. |
| The implementation of caching resulted in a reduction of latency. | Caching reduced latency. |
| Make a decision on the region before the installation. | Choose the region before you install. |

Keep a nominalization when it names a concept the reader already knows as a thing: "the migration", "the deployment". Keep it also when it refers back to the previous sentence: "This change broke the build."

## Known to new

Readers link sentences through their beginnings. Start a sentence with information the reader already has (a term from the previous sentence, the page topic) and put the new information at the end, where the stress falls.

| Before | After |
|---|---|
| The scheduler retries a failed job. A backoff policy, set per queue, controls the delay between retries. | The scheduler retries a failed job. The delay between retries comes from the queue's backoff policy. |

The same rule works at paragraph level. The first sentence names the topic. The following sentences keep that topic as their subject when they can, so the reader sees one thread.

## Classic style and the curse of knowledge

Steven Pinker describes classic style: the writer shows the reader something in the world, as if both are looking at it together. The writer is concrete and treats the reader as an intelligent equal.

The curse of knowledge is the main obstacle. An expert forgets what it was like not to know an abbreviation, a step or the reason behind a rule. The expert's draft skips those parts and reads as complete to its author. Rereading does not reveal the gap, because the author supplies the missing parts from memory. The remedy is a test with a cold reader who lacks that memory.

Practical signs of the curse of knowledge:

- an abbreviation or internal name used without definition;
- a step that says "configure X" without saying where or how;
- a reason that the writer thinks is obvious and leaves out;
- an example that only works with the writer's local setup.

## Metadiscourse and hedges

Metadiscourse is text about the text: `In this section we will look at`, `As mentioned above`, `It is important to note that`, `Let's now turn to`. Delete it and state the content. A heading already tells the reader what the section covers.

Pinker calls the reflexive qualifier a compulsive hedge: `somewhat`, `to some extent`, `it seems that`, `arguably`. A hedge belongs where the uncertainty is real and the reader needs to know it. Then say what is uncertain and why: "Throughput above 10,000 requests per second has not been tested."

## Stop words by category

These words usually add nothing. Delete the word and reread; keep it only if the meaning changed.

| Category | Examples | What to do |
|---|---|---|
| Intensifiers | `very`, `really`, `extremely`, `highly`, `truly` | delete, or give the measurement |
| Minimizers | `just`, `simply`, `merely`, `easily` | delete; the task may not be simple for the reader |
| Presumption | `obviously`, `clearly`, `of course`, `as everyone knows` | delete; if it is obvious, it needs no marker |
| Fillers | `basically`, `actually`, `in fact`, `essentially` | delete |
| Hedges | `quite`, `rather`, `somewhat`, `fairly`, `arguably` | delete, or state the real uncertainty |
| Evaluations | `powerful`, `robust`, `seamless`, `intuitive`, `easy to use` | replace with the fact behind the claim |
| Empty phrases | `in order to`, `due to the fact that`, `at this point in time` | `to`, `because`, `now` |
| Redundant pairs | `each and every`, `first and foremost`, `any and all` | pick one word |

Zinsser calls these words clutter. Orwell's advice points the same way: cut a word when it can go, and prefer the short everyday word to the long or foreign one.

## Concrete language

Replace an abstract claim with the specific fact. Strunk and White ask for definite, specific, concrete language; in documentation, that means a number, a name, a command or an example.

| Before | After |
|---|---|
| The service handles large volumes of data efficiently. | The service processes 2 GB per minute on one core. |
| Configure the relevant settings. | Set `max_connections` in `postgresql.conf`. |
| The tool supports various formats. | The tool reads CSV, JSON and Parquet. |

## Sentence and paragraph length

Long sentences are harder to scan, especially for readers working in a second language. As a rule of thumb, look again at any sentence over about 30 words and split it where it holds two ideas. The checker warns at that length by default, and the warning is a prompt to reread. Vary length: a series of short sentences reads as choppy.

One paragraph holds one idea. In documentation, most paragraphs run between one and five sentences (rule of thumb). A one-sentence paragraph is fine when the idea is complete.

Use a numbered list for steps in order, a bulleted list for parallel items the reader will scan, and a table when items share attributes. Keep reasoning in sentences: a list of fragments drops the "because" and "so" that connect ideas.

## Edit order

Edit in passes, largest unit first, so that work on words is not lost when a section moves:

1. Structure: does the order match the skeleton and the reader's task?
2. Paragraphs: does each open with its topic and follow known to new?
3. Sentences: characters as subjects, actions as verbs, no nominalizations left by accident.
4. Words: stop words, one term per concept, concrete facts in place of evaluations.
