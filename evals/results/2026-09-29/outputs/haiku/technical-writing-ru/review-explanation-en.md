I found several issues in the document. Here's the list:

## Problems Found

1. **Line 3** — Contradicts core fact
   - **Problem:** "every message is delivered exactly once" contradicts the fact that Kestrun delivers at-least-once, not exactly-once
   - **Fix:** Change "exactly once" to "at least once"

2. **Line 7** — Wrong default visibility timeout
   - **Problem:** States "defaults to 30 seconds" but the correct default is 45 seconds
   - **Fix:** Change "30 seconds" to "45 seconds"

3. **Line 9** — Inconsistent terminology
   - **Problem:** Mixes "dedup token" and "idempotency key" for the same field; the design notes specify the field is called "idempotency key"
   - **Fix:** Replace "dedup token" with "idempotency key" for consistency

4. **Lines 18–20** — Doesn't address the core reader question
   - **Problem:** The "Why this matters" section is generic marketing language. It doesn't explain *why handlers see the same message twice*, which is the stated purpose for engineers reading this
   - **Fix:** Replace with a concrete explanation: that at-least-once delivery + visibility timeout redelivery means handlers can receive duplicates, and idempotency keys are how to handle it. Optionally mention that exactly-once was rejected due to cost (2 extra round trips per message)

---

## Final Document

```markdown
# Delivery Guarantees in Kestrun

Kestrun delivers at least once. This means your handler can sometimes see the same message twice—and you need to be ready for it.

## Overview

Kestrun is the internal message queue used by the order pipeline. When a consumer receives a message, the message becomes invisible to other consumers for the visibility timeout, which defaults to 45 seconds. If the consumer does not acknowledge the message before the timeout expires, Kestrun makes the message visible again and another consumer can receive it.

Because of this, a message can be processed more than once. To handle this, producers attach an idempotency key to each message. Consumers store the idempotency key in their own database and skip messages whose key they have already seen.

## How to configure a consumer

1. Open `kestrun.toml`.
2. Set `visibility_timeout_s` to a value larger than your slowest handler.
3. Restart the consumer.
4. Check the dashboard to make sure the redelivery rate went down.

## Why this matters

Kestrun uses at-least-once delivery because exactly-once would cost two extra round trips per message. This trade-off means your handler will occasionally receive the same message twice: either when it doesn't acknowledge in time, or during failures. Making your handler idempotent—by tracking idempotency keys—is how you handle this safely.
```
