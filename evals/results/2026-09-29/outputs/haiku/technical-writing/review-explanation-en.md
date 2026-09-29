## Problems Found

1. **Line 3 (opening paragraph)** — Claims "exactly once" delivery
   - **Fix:** Change "every message is delivered exactly once" to "every message is delivered at least once"
   - **Why:** This directly contradicts the design fact and misleads engineers about why they'll see duplicate messages

2. **Line 7** — Wrong default visibility timeout
   - **Fix:** Change "defaults to 30 seconds" to "defaults to 45 seconds"
   - **Why:** Factually incorrect; will cause engineers to misconfigure their timeouts

3. **Line 9** — Inconsistent terminology
   - **Fix:** Change "producers attach a dedup token" to "producers attach an idempotency key" (or use "idempotency key" consistently throughout)
   - **Why:** The document correctly uses "idempotency key" later but introduces it as "dedup token" first; engineers should have one clear term

4. **Missing context (after line 8)** — No explanation of design tradeoffs
   - **Fix:** Add a sentence explaining why exactly-once wasn't chosen: "We considered exactly-once delivery through transactions but rejected it because it requires two extra round trips per message, significantly increasing latency."
   - **Why:** Helps engineers understand the intentional design choice and trust the at-least-once approach

5. **Lines 19–20** — Marketing language not suited to the audience
   - **Fix:** Remove or replace the "Why this matters" section with concrete guidance: "This means you must design your handlers to be idempotent. If your handler has already processed a message with a given idempotency key, it should return success without re-executing side effects."
   - **Why:** Engineers need actionable takeaways, not sales copy

---

## Revised Document

```markdown
# Delivery Guarantees in Kestrun

Kestrun is the internal message queue used by the order pipeline. It delivers messages with an **at-least-once guarantee**, which means a message can be processed more than once.

## Overview

When a consumer receives a message, the message becomes invisible to other consumers for the visibility timeout, which defaults to 45 seconds. If the consumer does not acknowledge the message before the timeout expires, Kestrun makes the message visible again and another consumer can receive it.

To handle potential redelivery, producers attach an idempotency key to each message. Consumers store the idempotency key in their own database and skip messages whose key they have already seen.

We considered exactly-once delivery through transactions but rejected it because it requires two extra round trips per message, significantly increasing latency.

## How to configure a consumer

1. Open `kestrun.toml`.
2. Set `visibility_timeout_s` to a value larger than your slowest handler.
3. Restart the consumer.
4. Check the dashboard to make sure the redelivery rate went down.

## Implementing idempotent handlers

Your message handler must be idempotent: if it processes the same idempotency key twice, it should return success without re-executing side effects. Store the idempotency key in your database when you first process a message, then check for it on subsequent deliveries before performing any mutations.
```
