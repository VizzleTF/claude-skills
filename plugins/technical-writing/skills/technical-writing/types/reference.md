# Reference

Reference describes the parts of a system: options, fields, commands, endpoints, limits. The reader looks up one fact and leaves.

## When to use it and when not

Use reference for anything the reader looks up rather than reads: configuration keys, API endpoints, CLI flags, error codes, limits.

Pick another type in these cases:

- The reader needs steps: how-to.
- The reader needs the reasons behind a design: explanation.
- The facts live next to the code and are read by callers: docstring.

## Skeleton

Uniform entries. Every entry has the same fields in the same order:

| Field | Content |
|---|---|
| Name | The exact name as typed: `timeout`, `--dry-run`, `GET /users`. |
| Type | Data type or kind of value. |
| Default | The value when nothing is set, or "required". |
| Limits | Allowed range, units, formats, when there are any. |
| Example | A working value or call, when type and limits do not show the format. |

Add a description sentence after the name when the name does not say enough. Order entries the way the reader searches: alphabetically, or in the order of the file or the API.

Generate reference from the code or schema where possible, so it stays current.

## Voice and verbs

Indicative, third person: "Sets the connection timeout", "Returns the list of users". The subject is the thing described.

## Length

One entry per item, every entry as short as its fields, with no prose between entries. Entries that fit in one row go in one table, a column per field, with no heading per entry. A column that is empty for most entries is dropped, and its few values go into the description. An entry gets its own heading only when it needs more than a row. A fact that holds for every entry, such as the version or what happens on an invalid value, is stated once under the title. The length of the page follows the size of the system. This is a rule of thumb.

## Differences from the core rules

- **Third person in place of "you".** Reference describes the system. Write "The flag disables caching" in place of "You can use the flag to disable caching".
- **Facts only.** Reference carries no advice and no recommended practice. Advice goes to a how-to.

## Forbidden

- Advice, opinions and best practices.
- Entries that skip fields the other entries have.
- Units left implied: write `30s` or "seconds".
- Prose paragraphs between entries.
- Narration of steps.

## Type checklist

- [ ] Every entry has the same fields in the same order.
- [ ] Every default and unit is stated.
- [ ] Every example works as written.
- [ ] Verbs are in the indicative, third person.
- [ ] No advice appears.
- [ ] The order of entries matches how the reader searches.
