# Docstring and code comment

A docstring documents an interface for the people who call it. A code comment explains to the next maintainer what the code cannot show.

## When to use it and when not

Use a docstring on every public module, class, function and method. Use a comment where the code alone leaves a question: why this approach, what invariant holds, what breaks if this line changes.

Pick another type in these cases:

- Usage across several functions, with steps: how-to.
- The full list of options of a public API: reference, generated from the docstrings where possible.
- The design of a module and its history: explanation or ADR.

## Skeleton

A docstring:

1. Summary line: what the function does, in one line.
2. A blank line, then details the signature does not show: units, allowed ranges, side effects, exceptions raised, thread safety.
3. Parameters and return value, in the format the project uses, each described only with what the signature does not show: units, ranges, invariants, meaning.
4. An example, when the use is not obvious.

A comment is one to three lines above the code it explains. John Ousterhout separates interface comments from implementation comments, among other kinds. An interface comment describes what the caller needs: the contract. An implementation comment describes how and why the code does its work inside. Keep them apart: the docstring carries the interface; comments inside the body carry the implementation.

## Voice and verbs

In Python, follow PEP 257: the summary line prescribes the effect as a command, "Return the user's ID", and does not describe it as "Returns the user's ID". PEP 257 also says the one-line docstring should not restate the signature.

In other languages, follow the project's convention. Javadoc uses the third person: "Returns the user's ID."

## Length

One line when the name and the signature say the rest. More lines only for facts a caller would otherwise learn by reading the code or by failing. This is a rule of thumb.

## Differences from the core rules

- **Imperative summary in Python.** Reference describes an item in the third person. A Python docstring states the same fact as a command, following PEP 257.
- **Why over what.** A comment inside the body gives the reason for the code. The code already shows what it does.

## Forbidden

- Restating the signature: "Takes a string and returns an int." This includes a parameter or return description that repeats a type or a default the signature already carries.
- Comments that narrate the code line by line: `# increment i`.
- Comments that record history: "changed by X in March". Version control holds history.
- Units, ranges or side effects left to the reader to guess.
- A docstring that disagrees with the code.

## Type checklist

- [ ] The summary line fits on one line.
- [ ] In Python, the summary is imperative.
- [ ] No description repeats a type or a default from the signature; each parameter and return value adds units, ranges, invariants or meaning.
- [ ] Units, ranges, side effects and exceptions are stated.
- [ ] Interface and implementation comments are kept apart.
- [ ] Every comment says something the code does not.
