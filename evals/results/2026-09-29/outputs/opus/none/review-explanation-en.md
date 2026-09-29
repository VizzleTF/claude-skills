I haven't changed `delivery-guarantees.md`. Below are the problems I found, then the corrected document.

## Problems

**1. The opening says the opposite of how Kestrun works (line 3). This is the most serious problem.**
The draft promises that "every message is delivered exactly once." Kestrun delivers at least once and does not do exactly-once. This line would tell readers that the duplicates they're seeing can't happen.
*Fix:* Replace the paragraph with a plain statement: Kestrun delivers at least once, so a handler can receive the same message more than once.

**2. The default visibility timeout is wrong (line 7).**
The draft says 30 seconds; the default is 45 seconds.
*Fix:* Change "30 seconds" to "45 seconds".

**3. The dedup field has two different names (line 9).**
Producers attach a "dedup token", but consumers store the "idempotency key". Readers will think these are two fields, or go looking for a field called `dedup token`.
*Fix:* Use "idempotency key" in both places.

**4. It doesn't explain why Kestrun isn't exactly-once (the whole document).**
The readers are asking why this happens, and "because of the design" isn't enough. The design notes have the reason: exactly-once through transactions was considered and rejected because it costs two extra round trips per message.
*Fix:* Add a short section with that reasoning.

**5. The config steps suggest a longer timeout fixes duplicates (lines 11–16).**
A longer timeout makes redeliveries less common, but they can still happen, so the handler must deduplicate anyway. The heading "How to configure a consumer" also oversells a section that only covers one setting.
*Fix:* Rename the section to cover tuning the visibility timeout, and add a note that deduplication is still required. I also added the downside of a long timeout: a message whose consumer crashed takes longer to be redelivered.

**6. The redelivery description is slightly off (line 7).**
"Another consumer can receive it" suggests the redelivery always goes to a different consumer. It can go to any consumer, including the one that already handled it.
*Fix:* Say "any consumer, including the one that already received it."

**7. The intro and closing are filler (lines 3 and 18–20).**
Phrases like "In today's fast-paced world", "not just a queue, it's a promise", "crucial, pivotal", "unlock robust, seamless and scalable" and "In conclusion, Kestrun empowers developers" give the reader no information.
*Fix:* Delete them. Replace "Why this matters" with a short consumer checklist.

**8. Things I couldn't check against the design notes.**
The config key `visibility_timeout_s`, the file `kestrun.toml`, the dashboard redelivery metric, and "used by the order pipeline" aren't in the facts you gave me. I kept them, but someone should confirm them before this is published. My checklist advice to store the key in the same transaction as the handler's side effects is general best practice, not a Kestrun fact.

## Final document

```markdown
# Delivery Guarantees in Kestrun

Kestrun delivers messages **at least once**. It does not provide exactly-once delivery. Your handler can receive the same message more than once, and it must be written to handle that safely.

## Why you see duplicates

Kestrun is the internal message queue used by the order pipeline. When a consumer receives a message, the message becomes invisible to other consumers for the **visibility timeout**, which defaults to **45 seconds**. If the consumer does not acknowledge the message before the timeout expires, Kestrun makes the message visible again, and any consumer, including the one that already received it, can receive it again.

So if your handler is slow, crashes, or finishes its work but fails to acknowledge in time, the message is delivered again.

## Deduplicating with the idempotency key

Producers attach an **idempotency key** to each message. Consumers store the idempotency key in their own database and skip any message whose key they have already seen.

## Why Kestrun doesn't do exactly-once

We considered exactly-once delivery using transactions and rejected it: it costs two extra round trips per message. At-least-once delivery with consumer-side deduplication keeps the per-message cost low, and the price is that consumers must be idempotent.

## Tuning the visibility timeout

If your handler regularly takes longer than the visibility timeout, you will see a lot of avoidable redeliveries. To reduce them:

1. Open `kestrun.toml`.
2. Set `visibility_timeout_s` to a value larger than your slowest handler.
3. Restart the consumer.
4. Check the dashboard to confirm the redelivery rate went down.

A longer timeout reduces redeliveries but does not eliminate them, so you still need to deduplicate on the idempotency key. A longer timeout also means that if a consumer crashes, its message waits longer before another consumer can pick it up.

## Checklist for consumers

- Assume every message may arrive more than once.
- Deduplicate on the idempotency key.
- Record the idempotency key in the same database transaction as the handler's side effects, so a crash can't leave one written without the other.
- Set the visibility timeout above your slowest handler's processing time.
```
