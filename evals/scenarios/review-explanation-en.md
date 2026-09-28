id: review-explanation-en
lang: en
kind: review
expect: explanation
core: true
fixtures: review-explanation-en/
expect_notes:
- A good review names each problem with its location and a concrete fix; it does not rewrite the whole document unasked
facts:
- The draft is delivery-guarantees.md, an explanation of Kestrun delivery guarantees for engineers who write consumers
- Kestrun guarantees at-least-once delivery; the draft wrongly claims exactly-once delivery in the first paragraph
- The default visibility timeout is 45 seconds; the draft wrongly says 30 seconds
- The draft uses two terms, "dedup token" and "idempotency key", for the same message field; the field is called idempotency key
- The section "How to configure a consumer" is step-by-step how-to content inside an explanation
- The draft has no alternatives section; exactly-once delivery through transactions was considered and rejected because it adds two extra round trips per message
- The first and last paragraphs contain promotional filler: "In today's fast-paced world", "not just a queue, it's a promise", "seamlessly and robustly", "crucial, pivotal", "unlock", "empowers"

Review `delivery-guarantees.md` in the working directory before it goes into our engineering handbook. The readers are engineers who write Kestrun consumers and want to understand why their handler sometimes sees the same message twice.

Facts from the Kestrun design notes, use them to check the draft:

- Kestrun delivers at least once. It does not do exactly-once.
- The default visibility timeout is 45 seconds.
- The message field that consumers deduplicate on is called the idempotency key.
- We considered exactly-once delivery through transactions and rejected it: it costs two extra round trips per message.

Give me a list of problems, each with where it is and how to fix it.
