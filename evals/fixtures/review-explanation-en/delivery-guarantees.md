# Delivery Guarantees in Kestrun

In today's fast-paced world of distributed systems, reliable messaging is more important than ever. Kestrun is not just a queue, it's a promise: every message is delivered exactly once, seamlessly and robustly.

## Overview

Kestrun is the internal message queue used by the order pipeline. When a consumer receives a message, the message becomes invisible to other consumers for the visibility timeout, which defaults to 30 seconds. If the consumer does not acknowledge the message before the timeout expires, Kestrun makes the message visible again and another consumer can receive it.

Because of this, a message can be processed more than once. To handle this, producers attach a dedup token to each message. Consumers store the idempotency key in their own database and skip messages whose key they have already seen.

## How to configure a consumer

1. Open `kestrun.toml`.
2. Set `visibility_timeout_s` to a value larger than your slowest handler.
3. Restart the consumer.
4. Check the dashboard to make sure the redelivery rate went down.

## Why this matters

Delivery guarantees are a crucial, pivotal part of the Kestrun landscape. By leveraging idempotent consumers, teams can unlock robust, seamless and scalable processing. In conclusion, Kestrun empowers developers to build with confidence.
