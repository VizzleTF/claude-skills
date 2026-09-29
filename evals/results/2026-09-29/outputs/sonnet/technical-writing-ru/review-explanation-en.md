I checked the draft against the design notes and found seven problems. The corrected document is at the end.

## Problems

1. **Line 3: the draft says the opposite of the design.**
   - It claims every message is delivered "exactly once". Kestrun delivers at least once.
   - This is the worst problem, because it tells readers duplicates can't happen and contradicts the rest of the page.
   - Fix: state at-least-once delivery plainly in the first paragraph, and say that Kestrun does not do exactly-once.

2. **Line 3: the opening is filler.**
   - "In today's fast-paced world…" and "not just a queue, it's a promise" tell the reader nothing.
   - Fix: replace it with the answer to the reader's question, which is why a handler can see the same message twice.

3. **Line 7: the timeout value is wrong.** The draft says 30 seconds and the default is 45. Fix: change it to 45 seconds.

4. **Lines 7–9: the causes of duplicates are incomplete and hard to find.**
   - The text implies only one cause, a handler that runs past the timeout. It never says that a consumer crashing before it acknowledges has the same effect.
   - The at-least-once guarantee is never named.
   - The rejected exactly-once option is missing, so readers may assume the team simply didn't build it. Fix: name both causes, and give the reason exactly-once was rejected (two extra round trips per message).

5. **Line 9: the terminology is inconsistent.**
   - The draft says "dedup token" in one sentence and "idempotency key" in the next, so readers may think these are two different fields.
   - Fix: use "idempotency key" everywhere, since that is the field name consumers deduplicate on.

6. **Lines 11–16: the configuration steps mislead.**
   - Step 2 gives no number to start from. Say that the default is 45 seconds and that the value should exceed the slowest handler's run time.
   - The steps imply that a longer timeout removes duplicates. It only makes them rarer, so consumers still have to deduplicate.
   - A longer timeout also delays redelivery after a consumer crashes. Say so.
   - Step 4 doesn't say which dashboard metric to look at. I couldn't verify the dashboard's name or metric from the design notes, so the fixed text says "redelivery rate" without naming a panel. Please add the exact name.
   - I also couldn't verify that `kestrun.toml` and `visibility_timeout_s` are correct. Please check them.

7. **Lines 18–20: "Why this matters" has no content.**
   - It is filler ("crucial, pivotal", "unlock robust, seamless", "In conclusion…").
   - Fix: replace it with what the reader should do, which is to deduplicate on the idempotency key whatever the timeout is.

## Final document

```markdown
# Delivery Guarantees in Kestrun

Kestrun delivers each message at least once. Your handler can receive the same message more than once, so it must tolerate duplicates. Kestrun does not offer exactly-once delivery.

## Why a handler sees the same message twice

Kestrun is the internal message queue used by the order pipeline. When a consumer receives a message, the message becomes invisible to other consumers for the visibility timeout, which defaults to 45 seconds. If the consumer does not acknowledge the message before the timeout expires, Kestrun makes the message visible again and another consumer can receive it.

This produces a duplicate in two cases:

- Your handler runs longer than the visibility timeout, so the message becomes visible again while the first handler is still working.
- The consumer crashes or loses its connection before it acknowledges the message.

We considered exactly-once delivery through transactions and rejected it, because it costs two extra round trips per message. At-least-once delivery with idempotent consumers is cheaper.

## Deduplicate on the idempotency key

Each message carries an idempotency key. Store the key in your consumer's own database and skip any message whose key you have already seen.

## Reduce redeliveries by tuning the timeout

A longer timeout makes duplicates rarer, but it does not remove them: a crash can still cause one. Keep the deduplication above whatever timeout you choose.

1. Open `kestrun.toml`.
2. Set `visibility_timeout_s` to a value larger than your slowest handler's run time. The default is 45.
3. Restart the consumer.
4. Check the dashboard to make sure the redelivery rate went down.

A longer timeout also delays redelivery after a consumer crashes: the message stays invisible until the timeout expires. Don't set it much higher than you need.
```
