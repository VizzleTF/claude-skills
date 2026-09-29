I reviewed `delivery-guarantees.md` against the design notes and found 10 problems. Three of them state facts that are wrong. I didn't modify the file; the corrected version is at the end.

## Problems

### Facts that are wrong

**1. Line 3 says Kestrun delivers "exactly once."**
The design notes say it delivers at least once and does not do exactly-once. This is the most harmful error: it tells readers that the duplicates they're debugging can't happen.
*Fix:* Open the page with the real guarantee: "Kestrun delivers every message at least once, not exactly once, so your handler can see the same message twice."

**2. Line 7 gives the default visibility timeout as 30 seconds.**
The actual default is 45 seconds. An engineer tuning a handler against 30 s will set the wrong limit.
*Fix:* Change it to 45 seconds.

**3. Line 9 calls the field both "dedup token" and "idempotency key."**
The two names appear in consecutive sentences, so readers will think there are two fields. The correct name is idempotency key.
*Fix:* Use "idempotency key" throughout.

### Content that's missing or misleading

**4. The page never says why Kestrun doesn't do exactly-once.**
Readers who find out their handler gets duplicates will ask this next.
*Fix:* Add a short section: exactly-once through transactions was considered and rejected because it costs two extra round trips per message.

**5. Lines 7–9 give only one cause of duplicates: a slow handler.**
By the draft's own model, a consumer that crashes or restarts after doing its work but before acknowledging will also get a redelivery. Together with the configuration steps, this suggests a longer timeout makes duplicates go away.
*Fix:* List both causes. After the timeout advice, say that raising it reduces redeliveries but doesn't remove them, so deduplication is still required.

**6. Line 9 doesn't say *when* to record the idempotency key.**
If the key is saved separately from the handler's side effects, a crash between the two writes causes either a duplicate or a lost message.
*Fix:* Tell readers to write the key in the same transaction as the side effects. This is general at-least-once practice, not something from the design notes, so check it matches your team's guidance.

### Structure and tone

**7. Line 3 is marketing copy.** ("In today's fast-paced world…", "not just a queue, it's a promise", "seamlessly and robustly.")
*Fix:* Delete it and put the answer in its place (see #1).

**8. Line 20, "Why this matters," has no information.** ("crucial, pivotal," "unlock robust, seamless and scalable," "In conclusion…")
*Fix:* Delete the whole section.

**9. Lines 11–16 put how-to steps inside an explanation page, and the steps can't be followed as written.**
- Step 4 says "check the dashboard" without naming the dashboard or the metric.
- The design notes don't cover `kestrun.toml` or `visibility_timeout_s`, so I couldn't verify them.

*Fix:* Replace the steps with one short paragraph on reducing redeliveries. Check the file name and key against the code. If a full configuration guide is needed, make it a separate how-to page that names the dashboard and metric, and link to it.

**10. Line 5's heading, "Overview," says nothing about the section.**
*Fix:* Use headings that say what each section answers, such as "Why your handler sees duplicates" and "How to handle duplicates."

## Corrected document

```markdown
# Delivery guarantees in Kestrun

Kestrun delivers every message at least once, not exactly once. Your handler can receive the same message more than once, so it must be idempotent. This page explains why duplicates happen, how to handle them, and why Kestrun works this way.

## Why your handler sees duplicates

Kestrun is the internal message queue used by the order pipeline. When a consumer receives a message, Kestrun hides it from other consumers for the visibility timeout, which defaults to 45 seconds. If the consumer does not acknowledge the message before the timeout expires, Kestrun makes it visible again and another consumer can receive it.

This means a message is redelivered when:

- your handler takes longer than the visibility timeout;
- your consumer crashes or restarts after receiving the message but before acknowledging it, even if the handler already finished its work.

## How to handle duplicates: the idempotency key

Producers attach an idempotency key to each message. Your consumer stores the keys it has processed in its own database and skips any message whose key it has already seen.

Write the key in the same transaction as the handler's side effects. If you write them separately, a crash between the two writes leaves you with either a duplicate or a lost message.

## Reducing redeliveries

If your handler regularly runs longer than 45 seconds, set `visibility_timeout_s` in `kestrun.toml` to a value above your slowest handler's run time, then restart the consumer.

A longer timeout reduces redeliveries but does not remove them: a consumer can still crash before it acknowledges. Keep deduplicating on the idempotency key.

## Why Kestrun does not do exactly-once

We considered exactly-once delivery through transactions and rejected it: it costs two extra round trips per message.
```

Before publishing, check three things that the design notes don't cover:
- **Configuration:** the `kestrun.toml` file name and the `visibility_timeout_s` key.
- **Same-transaction advice:** make sure it matches your team's guidance.
- **Dashboard:** if you want to keep the "check the dashboard" step, it needs the dashboard's name or link and the metric to watch.
