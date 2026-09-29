I found four problems in the document:

1. **Line 3 — Critical accuracy issue**
   - **Problem**: States "every message is delivered exactly once" 
   - **Fix**: Change to "at least once" per Kestrun design (exactly-once was considered but rejected due to performance cost)

2. **Line 7 — Wrong default timeout**
   - **Problem**: Says visibility timeout "defaults to 30 seconds"
   - **Fix**: Change to 45 seconds (the actual default)

3. **Line 9 — Terminology clarity**
   - **Problem**: Calls it "dedup token" when the term is "idempotency key"
   - **Fix**: Replace "dedup token" with "idempotency key" for consistency

4. **Lines 18-20 — Weak conclusion for engineers**
   - **Problem**: The "Why this matters" section is vague marketing language that doesn't explain *why* handlers see duplicates or what the real consequences are
   - **Fix**: Replace with concrete explanation of duplicate handling and the visibility timeout mechanism

Here's the corrected document:

```markdown
# Delivery Guarantees in Kestrun

Kestrun is the internal message queue used by the order pipeline. It provides at-least-once delivery: every message will be delivered at least once, but may be delivered more than once.

## Overview

When a consumer receives a message, the message becomes invisible to other consumers for the visibility timeout, which defaults to 45 seconds. If the consumer does not acknowledge the message before the timeout expires, Kestrun makes the message visible again and another consumer can receive it.

Because of this, a message can be processed more than once. To handle this, producers attach an idempotency key to each message. Consumers store the idempotency key in their own database and skip messages whose key they have already seen.

## How to configure a consumer

1. Open `kestrun.toml`.
2. Set `visibility_timeout_s` to a value larger than your slowest handler.
3. Restart the consumer.
4. Check the dashboard to make sure the redelivery rate went down.

## Why duplicate processing happens

Your handler may see the same message twice because the visibility timeout expired before the message was acknowledged. This can happen if:

- Your handler takes longer than the configured visibility timeout to process and acknowledge the message
- Your consumer crashes or becomes unreachable before acknowledging the message
- Network issues delay the acknowledgment

By storing the idempotency key and skipping already-seen messages, your consumer ensures that even if a message is delivered multiple times, the end result is the same as if it were delivered once.
```
