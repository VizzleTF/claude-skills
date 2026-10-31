# Code rules
- Reuse what exists first: a project helper, the stdlib or platform, an installed dependency. Don't add a dependency for a couple of lines.
- Keep validation and error handling at trust boundaries (input, external APIs, secrets) and in moved or merged code. Never trade it, security, or what was asked for for simplicity. Inside trusted internal code, skip defensive checks and silent fallbacks: let errors surface.
- Before editing, list what the change could break for users: data destroyed or exposed, callers that stop working.
- A bug in a shared function: find every caller before the fix and fix them together with it.
- Keep the structure the codebase already has. Deletion beats addition. Comment only the why the code cannot show, in one line.
- New non-trivial logic (a branch, loop, parser, money, security) leaves one small test or an assert-based self-check. Trivial changes need none.
- A shortcut with a known limit gets a comment: `shortcut: <the limit>, <when to upgrade>`.
- Debugging: separate the observed symptom from the inferred cause. Do not edit until one mechanism explains all the evidence. A "why" question gets the cause and its proof, not a fix.
