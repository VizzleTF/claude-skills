# LLM writing patterns

## Contents

- How to use this catalog
- Content patterns
- Sentence patterns
- Formatting patterns
- Conversation residue

The catalog follows the Wikipedia guide "Signs of AI writing" and adds patterns that matter in documentation. Each entry gives a before and an after. The before examples are in code spans so that the checker does not report them.

## How to use this catalog

Read the draft once per group below. A single instance is rarely a problem; a pattern that repeats across the page is. The usual fix is to state the fact the decoration stands in for.

## Content patterns

**Inflated significance.** Claims that something is `pivotal`, `transformative` or `part of a broader shift`. Documentation readers want what the thing does.

- Before: `The new cache marks a pivotal shift in how the platform approaches performance.`
- After: The cache cuts median response time for `/search` from 300 ms to 40 ms.

**Promotional language.** Words from marketing copy: `boasts`, `vibrant`, `groundbreaking`, `cutting-edge`, `seamless`, `powerful`.

- Before: `The CLI boasts a seamless, powerful workflow.`
- After: The CLI builds and deploys with one command, `make ship`.

**Evaluations in place of facts.** An adjective that asks the reader to trust the writer: `fast`, `simple`, `robust`, `flexible`, `intuitive`. Replace it with the fact that would make the reader draw that conclusion.

- Before: `Setup is quick and easy.`
- After: Setup takes two commands and about five minutes.

**Vague attributions.** Claims assigned to unnamed authorities: `experts say`, `it is widely considered`, `industry reports`.

- Before: `It is widely considered best practice to pin versions.`
- After: Pin versions: an unpinned dependency broke the build twice last quarter. (Or cite the specific source.)

**Superficial analysis.** A clause, often starting with an -ing verb, that comments on a fact without adding information: `highlighting`, `underscoring`, `reflecting`, `contributing to`.

- Before: `The job retries three times, highlighting the system's focus on reliability.`
- After: The job retries three times.

**Aphorisms.** A quotable line that sounds wise and instructs nothing: `Good docs are a gift to your future self.` `Clarity is kindness.` Delete it. If it carries a rule, write the rule.

**Escalation.** Sentences that raise the stakes step by step to build drama, or words like `crucial`, `critical`, `vital`, `essential` used for ordinary points. Keep strong words for real consequences and state the consequence.

- Before: `This step is absolutely critical.`
- After: Skip this step and the migration deletes the old table before copying it.

**Summary endings.** A closing paragraph that repeats the page: `In summary`, `Overall`, `In conclusion`. A reference or how-to ends with its last useful item. An explanation may end with consequences or next reading.

**Challenges and outlook sections.** Formulaic `Despite these challenges, the future looks promising` endings. Delete them, or turn them into a list of known limitations with facts.

## Sentence patterns

**Negative parallelism.** The pattern `not X, but Y`, `it's not just X, it's Y`, `not only X but also Y`. It sets up a claim nobody made in order to knock it down. State Y.

- Before: `This is not just a linter; it's a complete quality gate.`
- After: The tool lints the code and blocks the merge when a check fails.

**Rule of three.** Items grouped in threes for rhythm: `fast, reliable, and secure`. Keep a list of three only when there are exactly three real items. Otherwise give the true number, even if it is one.

- Before: `The API is fast, flexible, and developer-friendly.`
- After: The API answers in under 50 ms at the 99th percentile.

**AI vocabulary.** Words that cluster in model output: `delve`, `leverage`, `utilize`, `tapestry`, `landscape`, `intricate`, `underscore`, `foster`, `realm`, `additionally` at the start of every paragraph. Replace each with the plain word or delete it: use for `leverage` and `utilize`, look at for `delve into`.

**Copula avoidance.** `Serves as`, `functions as`, `stands as`, `represents` where `is` works.

- Before: `The config file serves as the single source of truth.`
- After: The config file is the only place where limits are set.

**Elegant variation.** A new synonym each time to avoid repeating a word: `service`, `application`, `system`, `platform` for the same thing. In documentation, a new word signals a new concept. Pick one term and repeat it.

**Metadiscourse.** Text about the text: `In this section, we will explore`, `It is worth noting that`, `As mentioned earlier`. Delete it and state the content.

**Compulsive hedging.** Qualifiers on every claim: `may potentially`, `generally tends to`, `in some cases it might`. Remove the hedge where you know the fact. Where the uncertainty is real, say what is uncertain.

## Formatting patterns

**Frequent em dashes.** Dashes used where a comma, colon, period or parentheses would do. More than one dash in a short paragraph usually means two sentences were joined. Split them or use a colon.

- Before: `The cache — which is shared — expires hourly — unless pinned.`
- After: The shared cache expires every hour. Pinned entries do not expire.

**Bold overuse.** Several bold phrases per paragraph. Bold one term per section at most: the one the reader scans for.

**Inline-header lists.** Every bullet starts with a bold label and a colon, even when the items are sentences that need no label. Use labels only when the reader scans by them.

**Emoji as formatting.** Emoji in headings or as bullets. Delete them.

**Title case headings.** `How To Configure The Proxy`. Use sentence case unless the project style says otherwise.

**Tables for prose.** A two-column table holding sentences that would read better as a paragraph. Keep tables for items that share attributes.

**Section summaries.** A paragraph under a heading that restates what the section will say. Start with the content.

## Conversation residue

Text written for the chat, left in the document.

- Offers and sign-offs: `I hope this helps`, `Let me know if you want more detail`, `Feel free to reach out`.
- Knowledge-cutoff notes: `As of my last update`, `I don't have information about`.
- Placeholders left unfilled: `[insert link]`, `TODO: add example`.
- Praise for the request: `Great question`.

Delete all of them. If information is missing, draft anyway with a `<UPPER_CASE>` placeholder in the gap and list the questions that fill it at the end of the response.
