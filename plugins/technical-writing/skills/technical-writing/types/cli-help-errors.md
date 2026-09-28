# CLI help and error messages

`--help` output tells the user how to call a command. An error message tells the user what went wrong and how to fix it. Both live inside the tool and are read while the user works.

## When to use it and when not

Use this type for `--help` and usage text, error and warning messages, and short interface text that guides an action.

Pick another type in these cases:

- A list of errors with causes and fixes, kept as a page: troubleshooting.
- Every flag with types, defaults and limits: reference, generated from the same source as `--help` where possible.

## Skeleton

`--help` output:

1. Usage line: `tool deploy [OPTIONS] <ENVIRONMENT>`.
2. One sentence on what the command does.
3. Arguments and options, one per line: name, value form, short description, default.
4. One or two examples of common calls.
5. Where to find more: the documentation link or `tool help <topic>`.

An error message, following Google's Technical Writing course on error messages:

1. What went wrong: the cause, stated precisely.
2. Which input was invalid: the value the user gave, quoted.
3. The requirements and constraints the input must meet.
4. How to fix it: the action.
5. An example of a valid input, when it helps.

Example: `Error: port "80a" is not a number. Set --port to an integer from 1 to 65535, for example --port 8080.`

## Voice and verbs

What went wrong is in the indicative: "The config file is missing." How to fix it is in the imperative: "Create it with `tool init`." Descriptions in `--help` use one form for every line: the imperative ("Print the version"), the indicative ("Prints the version") or a noun phrase ("Version number").

## Length

An error message fits the terminal line or wraps to a few lines at most. Google's course asks for concise messages; this skill adds no fixed count. `--help` fits on one screen for a single command; longer material goes to a `help <topic>` page or to the documentation. These are rules of thumb.

## Differences from the core rules

- **Two parts, fixed order.** Google's course reduces a good error message to two questions: what went wrong, and how the user fixes it. The cause comes first, because the fix makes sense only after the reader knows what failed.

## Forbidden

- Messages that give no cause: "Something went wrong", "Invalid input".
- Blaming or joking tone. State the facts.
- Double negatives: "Cannot disable non-optional feature".
- Stack traces as the only message for a user error.
- Internal codes without an explanation.
- Failing silently.

## Type checklist

- [ ] The error names the cause and the invalid input.
- [ ] The error says how to fix it, in the imperative.
- [ ] An example of valid input is given where it helps.
- [ ] Terms match the rest of the tool and its documentation.
- [ ] `--help` starts with a usage line and has an example.
- [ ] Option descriptions use one grammatical form throughout.
