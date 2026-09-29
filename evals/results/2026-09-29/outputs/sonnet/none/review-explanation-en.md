I read the draft against the four design-note facts. I haven't edited `delivery-guarantees.md`. The corrected document is at the end.

## Problems

1. **Line 3: the draft claims exactly-once delivery.** It says "every message is delivered exactly once". Kestrun delivers at least once, and the draft's own Overview contradicts the claim. A reader who trusts this line will skip deduplication.
   - **Fix:** Replace the sentence with an at-least-once statement. Put it first, so the reader learns at the start that duplicates are expected.

2. **Line 3: marketing filler.** "In today's fast-paced world…", "not just a queue, it's a promise" and "seamlessly and robustly" tell an engineer nothing.
   - **Fix:** Delete the sentence. The new opening is the guarantee itself.

3. **Line 7: the default visibility timeout is wrong.** The draft says 30 seconds. The design notes say 45.
   - **Fix:** Change it to 45 seconds.

4. **Line 9: the term for the deduplication field is inconsistent.** The draft says "dedup token" and then "idempotency key" in the next sentence. Readers will wonder whether these are two different fields.
   - **Fix:** Use "idempotency key" everywhere, and say once that it is the message field consumers deduplicate on.

5. **Missing: the draft never says why Kestrun isn't exactly-once.** The readers want to know why they see duplicates. The rejected-transactions decision answers that.
   - **Fix:** Add a short paragraph. Exactly-once through transactions was considered and rejected because it costs two extra round trips per message, so Kestrun deliberately chooses at-least-once and leaves deduplication to consumers.

6. **Line 7: the redelivery cause is only half stated.** It covers the timeout expiring, but not the case that hurts most. The consumer finished the work and the acknowledgement didn't arrive in time, so the work runs twice.
   - **Fix:** Name the two triggers, a handler slower than the timeout or a consumer that fails before acknowledging. State that the duplicate run is real work being repeated.

7. **Lines 11–16: the configuration steps imply that a longer timeout fixes duplicates.** Step 4 ("make sure the redelivery rate went down") suggests tuning is the remedy. A longer timeout only reduces redeliveries caused by slow handlers. It doesn't remove duplicates, and it delays redelivery of messages whose consumer failed.
   - **Fix:** Add a note after the steps. Also mention the 45-second default in step 2, so readers know what they're raising from.

8. **Lines 11–16: the config details are unverified.** I couldn't check `kestrun.toml` or `visibility_timeout_s` against the design notes. The steps also don't say to keep the timeout within what your handlers can actually finish.
   - **Fix:** Confirm the file and key names with the Kestrun owners before publishing. I kept them unchanged.

9. **Lines 18–20: the closing section has no content.** "Crucial, pivotal", "unlock robust, seamless and scalable processing" and "In conclusion, Kestrun empowers developers…" say nothing, and the section never explains how to write an idempotent consumer.
   - **Fix:** Replace it with an actionable section on how to deduplicate. Mark it for a technical check: the "record the key together with the side effect" advice is general practice, not from the design notes.

## Corrected document

```markdown
# Delivery Guarantees in Kestrun

Kestrun delivers each message at least once. It does not deliver exactly once, so your handler can see the same message more than once. Consumers must be written to tolerate that.

## Why your handler sometimes sees a message twice

Kestrun is the internal message queue used by the order pipeline. When a consumer receives a message, the message becomes invisible to other consumers for the visibility timeout, which defaults to 45 seconds. If the consumer does not acknowledge the message before the timeout expires, Kestrun makes the message visible again and another consumer can receive it.

This happens in two situations: your handler takes longer than the visibility timeout, or the consumer fails before it acknowledges. In both cases the first attempt may have already done the work, so the redelivered message repeats it.

### Why Kestrun is not exactly-once

We considered exactly-once delivery through transactions and rejected it, because it costs two extra round trips per message. Kestrun instead guarantees at-least-once delivery and leaves deduplication to consumers.

## Deduplicate on the idempotency key

Producers attach an idempotency key to each message. This is the message field consumers deduplicate on. Consumers store the idempotency key in their own database and skip messages whose key they have already seen.

To keep this reliable, record the key in the same transaction as your handler's side effects where your database allows it. Otherwise a crash between the two steps can either lose the work or repeat it.

## How to configure a consumer

1. Open `kestrun.toml`.
2. Set `visibility_timeout_s` to a value larger than your slowest handler. The default is 45 seconds.
3. Restart the consumer.
4. Check the dashboard to confirm the redelivery rate went down.

A longer timeout reduces redeliveries caused by slow handlers, but it does not eliminate duplicates. A consumer can still fail before it acknowledges. A longer timeout also means a message whose consumer failed takes longer to become visible again. Keep idempotency-key deduplication in place whatever timeout you choose.
```
