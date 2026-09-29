1. Lines 3 and 20, intro and "Why this matters": the intro says "every message is delivered exactly once", but Kestrun delivers at least once, and the rest of the page describes redelivery. This is the wrong claim for readers who came to find out why they see duplicates. Delete the paragraph. Open the page with the answer: "Kestrun delivers each message at least once, so a handler can receive the same message more than once. Deduplicate on the idempotency key."

2. Overview, line 7: "defaults to 30 seconds" is wrong. The design notes give 45 seconds. Replace with "defaults to 45 seconds".

3. Overview, line 9: "a dedup token" and "the idempotency key" name one field with two terms, so a reader may think there are two fields. Write "producers set the idempotency key on each message", and use that term everywhere.

4. Whole page: the page is an explanation but lacks the Alternatives and Consequences parts. Add an alternatives paragraph: "We considered exactly-once delivery through transactions and rejected it, because it costs two extra round trips per message." Add a consequences paragraph: any handler that runs longer than the 45-second visibility timeout without acknowledging will see the message again, so every consumer must deduplicate. Add a context paragraph, and put the answer from finding 1 first.

5. "How to configure a consumer", lines 11-16: numbered steps and a config task are mixed into an explanation, and the reader is not doing a task. Move the section to a separate how-to page and link to it from the page. Not verified: the key name `visibility_timeout_s`, the file `kestrun.toml` and the dashboard check. Confirm them against Kestrun before the how-to is published. Step 2 should also say that a longer timeout lowers the redelivery rate but does not remove duplicates.

6. "Why this matters", lines 18-20: the section holds only filler ("crucial, pivotal", "unlock robust, seamless and scalable", "In conclusion, Kestrun empowers developers"). It has no facts and ends with a summary that repeats the page. Delete it. The consequences paragraph from finding 4 replaces it.

Verdict: needs restructuring first. Fix the two wrong facts (findings 1 and 2) before anything else.
