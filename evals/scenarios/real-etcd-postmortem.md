id: real-etcd-postmortem
lang: en
kind: review
expect: postmortem
core: true
fixtures: real-etcd-postmortem/
expect_notes:
- The review does not ask the document to name or blame individuals
facts:
- The document is the etcd v3.5 data inconsistency postmortem
- Root cause: a code refactor in v3.5.0 stopped saving the consistent index atomically, so an independent crash could leave committed transactions missing on some members
- The fix shipped in v3.5.3, published 2022-04-24 according to the timeline
- The header says the document date is 2022-04-20, which is earlier than the v3.5.3 release in the timeline
- The timeline row dated 2021-01-28 is out of chronological order between 2021-12-01 and 2022-03-08; it is probably 2022-01-28
- The timeline has dates only, with no times and no time zone
- Action items have a type (Prevent, Detect, Mitigate), priority, bug link and status, but no owner and no due date
- The impact section says no user reported problems in production; the main impact was loss of user trust
- The document does not blame individuals

Review the attached etcd document, `v3.5-data-inconsistency.md`, about the data inconsistency found in v3.5. The readers are etcd users deciding whether to trust v3.5 and contributors picking up the action items. List the problems with where each one is and how to fix it. Check the facts inside the document against each other.
