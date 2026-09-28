# README

A README is the first page a newcomer sees in a repository. It tells them what the project is and gets them to a first working result.

## When to use it and when not

Use a README for the front page of a repository, package or directory.

Pick another type in these cases:

- A full guided exercise for newcomers: tutorial, linked from the README.
- Every option of the tool: reference, linked from the README.
- Team rules for contributors: conventions, linked from the README.

## Skeleton

1. Name and one sentence: what the project is and what problem it solves.
2. Who it is for, when that is not obvious from the first sentence.
3. Installation: the commands, with supported versions.
4. Minimal example: the smallest use that produces a visible result, with its output.
5. Links: documentation, contributing, license, support.

## Voice and verbs

The description is in the indicative: "Parses YAML into typed structs." Installation and the example are in the imperative: "Install with pip", "Run the example".

## Length

One screen before the links, as a rule of thumb. Steve Krug's advice for navigation pages applies here: readers scan, so cut *happy talk* and instructions nobody reads. Everything beyond the first result moves to linked pages.

## Differences from the core rules

- **Repetition is allowed.** A README restates the installation steps and prerequisites that also appear in the documentation, because the reader must get to a first result without leaving the page. Normative facts, such as the full list of options and their defaults, stay in the reference and are linked.

## Forbidden

- Welcome paragraphs and praise for the project: "blazing fast", "powerful".
- Badges and logos that push the first sentence below the fold.
- A changelog, a full option list or a design discussion inside the README.
- An example that does not run as written.

## Type checklist

- [ ] The first sentence says what the project is.
- [ ] Installation commands run as written and name versions.
- [ ] The minimal example shows its output.
- [ ] The page up to the links fits on one screen.
- [ ] No evaluations in place of facts.
- [ ] Links lead to the rest of the documentation.
