# Troubleshooting

A troubleshooting page takes a reader from a specific error or symptom to its fix. The reader has hit a wall and searches by the text they see.

## When to use it and when not

Use troubleshooting for known errors and symptoms that readers hit repeatedly, each with a known cause and fix.

Pick another type in these cases:

- The reader reacts to an alert on call: runbook.
- The error happens only in one procedure: put it in that how-to under "If it did not work".
- The fix needs a design discussion: explanation or ADR.

## Skeleton

A table, one row per problem:

| Message or symptom | Cause | Action |
|---|---|---|
| `connection refused: 5432` | The database is not running. | Start it: `docker compose up db`. |
| Build hangs at "Resolving dependencies" | The proxy blocks the registry. | Set `HTTPS_PROXY` and run the build again. |

When a fix takes more than one step, give the row a short section below the table, with the message as the heading.

Group rows by where the reader meets the problem: install, build, run.

## Voice and verbs

The cause is in the indicative: "The database is not running." The action is in the imperative: "Start the database." Each cause is a fact about the system, stated plainly.

## Length

One entry per real problem, one or two lines each. The page grows as problems are found and shrinks when fixes ship. This is a rule of thumb.

## Differences from the core rules

- **Message verbatim.** The error message is copied exactly, in code format, so the reader can find it by search. Do not paraphrase or shorten it.
- **Error recovery.** Following Carroll's minimalism, the page helps the reader recognize the error and get back to their task. It does not teach the product.

## Forbidden

- Paraphrased or shortened error messages.
- Causes stated as guesses without saying so. Where the cause is uncertain, list the checks in order.
- Actions such as "check your configuration" that do not say what to check.
- Background on how the component works. Link to an explanation.

## Type checklist

- [ ] Each message appears verbatim, in code format.
- [ ] Each row has a cause and an action.
- [ ] Causes are in the indicative, actions in the imperative.
- [ ] Multi-step fixes have their own section with the message as the heading.
- [ ] Rows are grouped by where the reader meets the problem.
