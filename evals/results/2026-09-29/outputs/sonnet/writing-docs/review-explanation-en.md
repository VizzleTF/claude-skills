I read `delivery-guarantees.md` and checked it against your four facts. I couldn't open the skill's `reference/review.md` (permission denied), so I reviewed against the main writing-docs rules.

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
