# Пара review-explanation-en

Язык: en. Вид: review.

Запрос:

> Review `delivery-guarantees.md` in the working directory before it goes into our engineering handbook. The readers are engineers who write Kestrun consumers and want to understand why their handler sometimes sees the same message twice.
> 
> Facts from the Kestrun design notes, use them to check the draft:
> 
> - Kestrun delivers at least once. It does not do exactly-once.
> - The default visibility timeout is 45 seconds.
> - The message field that consumers deduplicate on is called the idempotency key.
> - We considered exactly-once delivery through transactions and rejected it: it costs two extra round trips per message.
> 
> Give me a list of problems, each with where it is and how to fix it.

Факты:

- The draft is delivery-guarantees.md, an explanation of Kestrun delivery guarantees for engineers who write consumers
- Kestrun guarantees at-least-once delivery; the draft wrongly claims exactly-once delivery in the first paragraph
- The default visibility timeout is 45 seconds; the draft wrongly says 30 seconds
- The draft uses two terms, "dedup token" and "idempotency key", for the same message field; the field is called idempotency key
- The section "How to configure a consumer" is step-by-step how-to content inside an explanation
- The draft has no alternatives section; exactly-once delivery through transactions was considered and rejected because it adds two extra round trips per message
- The first and last paragraphs contain promotional filler: "In today's fast-paced world", "not just a queue, it's a promise", "seamlessly and robustly", "crucial, pivotal", "unlock", "empowers"

Ожидания к ответу:

- A good review names each problem with its location and a concrete fix; it does not rewrite the whole document unasked

---

## X

1. Lines 3 and 20, intro and "Why this matters": the intro says "every message is delivered exactly once", but Kestrun delivers at least once, and the rest of the page describes redelivery. This is the wrong claim for readers who came to find out why they see duplicates. Delete the paragraph. Open the page with the answer: "Kestrun delivers each message at least once, so a handler can receive the same message more than once. Deduplicate on the idempotency key."

2. Overview, line 7: "defaults to 30 seconds" is wrong. The design notes give 45 seconds. Replace with "defaults to 45 seconds".

3. Overview, line 9: "a dedup token" and "the idempotency key" name one field with two terms, so a reader may think there are two fields. Write "producers set the idempotency key on each message", and use that term everywhere.

4. Whole page: the page is an explanation but lacks the Alternatives and Consequences parts. Add an alternatives paragraph: "We considered exactly-once delivery through transactions and rejected it, because it costs two extra round trips per message." Add a consequences paragraph: any handler that runs longer than the 45-second visibility timeout without acknowledging will see the message again, so every consumer must deduplicate. Add a context paragraph, and put the answer from finding 1 first.

5. "How to configure a consumer", lines 11-16: numbered steps and a config task are mixed into an explanation, and the reader is not doing a task. Move the section to a separate how-to page and link to it from the page. Not verified: the key name `visibility_timeout_s`, the file `kestrun.toml` and the dashboard check. Confirm them against Kestrun before the how-to is published. Step 2 should also say that a longer timeout lowers the redelivery rate but does not remove duplicates.

6. "Why this matters", lines 18-20: the section holds only filler ("crucial, pivotal", "unlock robust, seamless and scalable", "In conclusion, Kestrun empowers developers"). It has no facts and ends with a summary that repeats the page. Delete it. The consequences paragraph from finding 4 replaces it.

Verdict: needs restructuring first. Fix the two wrong facts (findings 1 and 2) before anything else.

---

## Y

## Problems

**Contradicts the design notes**

1. **Line 3: "every message is delivered exactly once".** Kestrun is at-least-once, so this is false. It also contradicts line 9 of the same page, which says a message can be processed more than once. Fix: state at-least-once in the first sentence and say duplicates are expected.
2. **Line 7: "defaults to 30 seconds".** The default is 45 seconds. Fix: change it to 45.
3. **Line 9: "dedup token".** The field is called the idempotency key, and the same paragraph uses both names. Readers will think there are two things. Fix: use "idempotency key" everywhere and drop "dedup token".

**Structure and content**

4. **Lines 1–3: the page never answers the reader's question first.** The opening is marketing copy ("In today's fast-paced world…", "not just a queue, it's a promise"). Fix: replace it with one sentence saying why a handler sees a message twice, then who the page is for.
5. **Lines 7–9, "Overview": the cause is implied, not stated.** A duplicate happens when the handler is slower than the timeout or the consumer dies before acknowledging. The heading is also generic. Fix: rename it to "How a duplicate happens" and make it a numbered sequence. Add that a slow handler that is still running can process the message at the same time as the second consumer.
6. **Lines 11–16: a how-to on an explanation page.** Numbered config steps mix two jobs. Step 2 also implies a longer timeout removes duplicates, but crashes still cause them. Fix: reduce it to one sentence that says the timeout lowers the redelivery rate and does not replace deduplication. Move the steps to a separate how-to page if you want them.
7. **Missing: why Kestrun isn't exactly-once.** Engineers will ask this. Fix: add a short section saying transactions were considered and rejected because they cost two extra round trips per message.
8. **Lines 18–20, "Why this matters": empty filler.** It has buzzwords ("crucial, pivotal", "unlock", "seamless", "In conclusion") and no facts. Fix: delete the section.

**Not verifiable from your notes**

- `kestrun.toml`, `visibility_timeout_s`, the dashboard, and "producers attach" the key. I kept the first two and dropped "producers attach", since the notes don't confirm who sets the key. Please check these against the source.

## Final document

```markdown
# Why your handler sees the same message twice

Kestrun delivers each message at least once, not exactly once. If your handler is slow or the consumer dies before acknowledging, Kestrun redelivers the message. Your handler must tolerate duplicates.

This page is for engineers writing Kestrun consumers. Kestrun is the internal message queue used by the order pipeline.

## How a duplicate happens

1. A consumer receives a message. The message becomes invisible to other consumers for the visibility timeout. The default is 45 seconds.
2. The consumer acknowledges the message before the timeout expires.
3. If it does not, because the handler is slower than the timeout or the consumer crashed, Kestrun makes the message visible again and another consumer receives it.

If the first handler is slow rather than dead, both consumers process the message at the same time.

## Deduplicate on the idempotency key

Each message has an idempotency key field. Store the key of every message you process in your own database. Skip any message whose key you have already seen.

## Reduce redeliveries from slow handlers

Set `visibility_timeout_s` in `kestrun.toml` to a value larger than your slowest handler. This lowers the redelivery rate. It does not remove duplicates, because a crashed consumer still causes redelivery. Keep deduplicating either way.

## Why Kestrun is not exactly-once

We considered exactly-once delivery through transactions and rejected it. It costs two extra round trips per message.
```
