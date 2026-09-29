I reviewed the draft against the four facts from the design notes. I didn't change the file. The fixed version is at the end.

## Problems

**1. The doc says the opposite of the design (line 3, intro).**
"every message is delivered exactly once" is wrong. Kestrun delivers at least once. This is the most serious error: it tells readers that the duplicates they're seeing can't happen. The rest of the sentence ("In today's fast-paced world…", "not just a queue, it's a promise", "seamlessly and robustly") is filler.
*Fix:* Replace the whole paragraph with a plain statement: Kestrun delivers at least once, so handlers can see the same message more than once and must deal with it.

**2. Wrong default visibility timeout (line 7).**
The draft says 30 seconds. The default is 45 seconds.
*Fix:* Change it to "defaults to 45 seconds."

**3. Two names for one field (line 9).**
The draft says producers attach a "dedup token", then the next sentence calls it the "idempotency key." Readers will think these are two different fields.
*Fix:* Use "idempotency key" in both places.

**4. The draft doesn't answer the reader's question (whole structure).**
Readers want to know why their handler got a message twice. The draft covers only the slow-handler case, under a vague "Overview" heading. It never mentions the other common case: the consumer finishes processing but crashes before it acknowledges the message.
*Fix:* Retitle the section "Why a message can arrive twice" and list both causes: a handler that runs longer than the timeout, and a crash before the acknowledgement.

**5. The design reason is missing, and "Why this matters" is filler (line 20).**
"crucial, pivotal", "Kestrun landscape", "unlock robust, seamless and scalable", "In conclusion, Kestrun empowers…": none of this tells the reader anything. The actual reason is missing: exactly-once through transactions was considered and rejected because it costs two extra round trips per message.
*Fix:* Replace the section with "Why Kestrun doesn't deliver exactly once" and state that trade-off.

**6. The configuration steps suggest that raising the timeout fixes duplicates (lines 11–16).**
A longer timeout cuts redeliveries caused by slow handlers. It does nothing about crashes, so consumers still have to deduplicate. The heading "How to configure a consumer" is also too broad, because the steps only change one setting.
*Fix:* Retitle it "Reducing redeliveries from slow handlers" and add a note after the steps that deduplication is still required. Merge "Open the file" and "Set the value" into one step.

**7. The deduplication advice leaves out when to record the key (line 9).**
If a consumer stores the key before the handler succeeds and the handler then fails, the redelivered message gets skipped and its work is lost.
*Fix:* Say to record the key after processing succeeds, ideally in the same transaction as the handler's side effects. This is general idempotent-consumer practice, not something from the Kestrun notes, so check it matches what your teams do.

**8. Details the design notes don't cover. Check them before publishing:**
- "the internal message queue used by the order pipeline" (line 7): is Kestrun only used by the order pipeline?
- `kestrun.toml` and `visibility_timeout_s` (lines 13–14): check the file name and key.
- "Producers attach…" (line 9): the notes name the field but don't say who sets it.
- "the dashboard" (line 16): say which one and add a link.

---

## Final document

```markdown
# Delivery guarantees in Kestrun

Kestrun delivers every message at least once. It does not guarantee exactly-once delivery, so your handler can receive the same message more than once and must handle duplicates.

## Why a message can arrive twice

Kestrun is the internal message queue used by the order pipeline. When a consumer receives a message, the message becomes invisible to other consumers for the visibility timeout, which defaults to 45 seconds. If the consumer does not acknowledge the message before the timeout expires, Kestrun makes the message visible again and another consumer can receive it.

This happens in two common cases:

- The handler runs longer than the visibility timeout.
- The consumer crashes after processing the message but before acknowledging it.

In both cases Kestrun delivers the message again, even though the first delivery may already have done its work.

## Why Kestrun doesn't deliver exactly once

We considered exactly-once delivery through transactions and rejected it: it costs two extra round trips per message. Instead, Kestrun delivers at least once and leaves deduplication to consumers.

## Handling duplicates

Producers attach an idempotency key to each message. Consumers store the idempotency key in their own database and skip messages whose key they have already seen.

Record the key only after the message is processed successfully, ideally in the same database transaction as the handler's side effects. If you record the key first and the handler then fails, the redelivered message is skipped and its work is never done.

## Reducing redeliveries from slow handlers

If your handler regularly runs longer than the visibility timeout, raise the timeout:

1. In `kestrun.toml`, set `visibility_timeout_s` to a value larger than the run time of your slowest handler.
2. Restart the consumer.
3. On the dashboard, check that the redelivery rate went down.

A longer timeout reduces redeliveries but does not remove them: a consumer can still crash before it acknowledges a message. Keep deduplicating by idempotency key.
```
