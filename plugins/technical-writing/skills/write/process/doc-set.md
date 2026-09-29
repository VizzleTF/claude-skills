# Planning a doc set

## Contents

- Audience
- Inventory
- Friction log
- Minimum set
- Priority
- Publishing
- Feedback and metrics
- Maintenance and retirement
- Plan format

Use this process before the first page when the request covers a whole project, several readers, or a docs audit. The output is a short plan the user approves. After approval, each page is written as a single document of one type.

## Audience

List the readers. For each, write one line: who they are, what they came to do, what they already know, and in what state they arrive. A software project usually has these readers: a visitor evaluating it, a new user installing it, a regular user doing one task, an operator on call, a contributor.

Ginny Redish frames a page as one side of a conversation: the reader arrives with a question, and the page answers it. For each reader, write down the questions they bring. Those questions become page titles and headings.

When readers are unknown, ask the user one question with a default: "Who reads these docs first: people evaluating the tool, or engineers on your team? I will assume engineers on the team."

## Inventory

List what already exists: README, wiki pages, comments, runbooks, chat threads that people keep linking to. For each item, note its type, its reader, whether it is correct, and when someone last checked it. Mark duplicates and pages that mix several types.

## Friction log

Walk through the main reader tasks yourself, from a clean environment where possible: install, first run, the most common task, the most common failure. Record every point where you had to guess, search, read the code or ask someone. Each entry is a line: step, what happened, what was missing. The inventory lists what exists; the friction log shows which pages readers need, and it is the better guide to what to write.

## Minimum set

Google's documentation guide puts it this way: "A small set of fresh and accurate docs is better than a large assembly of 'documentation' in various states of disrepair." Plan the smallest set that covers the reader tasks from the friction log. A typical minimum for a tool: a README, one tutorial or quick start, how-to pages for the frequent tasks, reference for configuration and commands. Services that run in production add runbooks for each alert. Records (ADRs, postmortems, changelogs) are added as the events happen.

Each planned page has one type. When a topic needs two types, plan two pages and link them.

## Priority

Order pages by reader impact: how many readers hit the gap, how often, and what it costs them. A missing runbook for a paging alert and a broken install step come first. Pages that only restate the code come last. Correcting a wrong page usually outranks writing a new one, because a wrong page sends readers down a path that fails.

## Publishing

Decide where each page lives and how readers find it. Keep docs next to the code they describe when the same people change both, so that a code review can require the docs change. Give each page a stable address. Link from the places readers already start: the README, the error message, the alert.

## Feedback and metrics

Plan how readers report problems: an issue template, a link at the bottom of each page, a channel. *Docs for Developers* (Bhatti and co-authors) treats measurement as part of the documentation process and ties each metric to a goal of the docs. Pick one or two measures the team can collect without new tooling. Examples: support questions on a topic, or the time a new user needs to reach a first result. Page views alone do not show whether a page helped.

## Maintenance and retirement

Name an owner for each page. Tie review to events: a release, a changed flag, a closed incident. When a living page stops being true, fix it or delete it and redirect its address. Records follow a different rule: the content of an ADR, a postmortem or a changelog entry is never changed. A newer record supersedes it, and the old record is marked superseded with a link. Besides typos and broken links, the only changes to a published record are its status mark (`[YANKED]`, `superseded by`) and the link to its replacement.

## Plan format

Present the plan as a table and wait for approval before writing:

| Page | Type | Reader | Reader's question | Priority | Source of facts |
|---|---|---|---|---|---|
| Install on Linux | how-to | new user | How do I install it on my server? | 1 | install script, CI config |
