---
description: An English runbook request triggers the skill and gets the runbook skeleton with placeholders for unknown facts.
tags: [create, en]
runs: 2
---

Write a runbook for the alert QueueWorkerDown. It fires when no worker of the `orders` queue has sent a heartbeat for 5 minutes. Workers run as the Kubernetes deployment `orders-worker`.
