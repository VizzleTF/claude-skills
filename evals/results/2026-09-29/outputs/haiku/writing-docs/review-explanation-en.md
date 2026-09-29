I found 4 issues. Here's the problem list:

## Issues Found

| Problem | Location | Fix |
|---------|----------|-----|
| **Claims exactly-once delivery** | Line 3: "delivered exactly once" | Change to "delivered at least once" — Kestrun guarantees at least once, not exactly once. Handlers can see duplicates. |
| **Wrong visibility timeout value** | Line 7: "defaults to 30 seconds" | Change to "defaults to 45 seconds" — the actual default is 45 seconds. |
| **Missing design rationale** | After line 9 | Add a paragraph explaining why exactly-once delivery was rejected: it would require two extra round trips per message, making throughput unacceptable. |
| **Vague conclusion that doesn't answer the reader's question** | Lines 18-20: "Why this matters" | Rewrite to explain concretely: readers want to know *why their handler sees duplicates* and *how to avoid their problems*. Current text is corporate platitudes that don't address this. |

---

# Delivery Guarantees in Kestrun

Kestrun uses **at-least-once delivery**, which means a message may be processed more than once. This guide explains why, and how to write consumers that handle it correctly.

## Overview

Kestrun is the internal message queue used by the order pipeline. When a consumer receives a message, the message becomes invisible to other consumers for the visibility timeout, which defaults to 45 seconds. If the consumer does not acknowledge the message before the timeout expires, Kestrun makes the message visible again and another consumer can receive it.

Because of this, a message can be processed more than once. To handle this, producers attach an idempotency key to each message. Consumers store the idempotency key in their own database and skip messages whose key they have already seen.

### Why at-least-once and not exactly-once?

We considered adding transactions to guarantee exactly-once delivery, but it would require two extra round trips per message. At our scale, that cost is unacceptable. Instead, we've optimized for throughput and built idempotency into the consumer model.

## How to configure a consumer

1. Open `kestrun.toml`.
2. Set `visibility_timeout_s` to a value larger than your slowest handler.
3. Restart the consumer.
4. Check the dashboard to make sure the redelivery rate went down.

## Why this matters

Your handler will sometimes see the same message twice. This happens when a consumer crashes, gets slow, or times out before acknowledging. By maintaining an idempotency key store in your own database, you can skip duplicate processing without changing your handler logic. This approach is simple, durable, and scales with your throughput.
