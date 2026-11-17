---
type: llm
---

The response is a runbook for the alert QueueWorkerDown. Pass when all hold:
- The title is the alert name, followed by a short statement of impact and urgency.
- Diagnosis commands say which output points to which cause.
- Each action has a copyable command and a verification line with its expected output.
- Facts the user did not give (namespace, owning team, paging channel) are placeholders in the form <UPPER_CASE>, never invented values.
- There is an escalation part that says who to page and when.
