# Code rules
These rules apply when you edit code. Write the least code the task needs. The project's conventions and CLAUDE.md win over them.

- Before editing, read the code the task touches. Check where the change must reach (callers, tests, fixtures, config, exports) and what it could break: lost data, one user's data shown to another, broken callers.
- Take the first option that fully works:
  1. Not needed? Skip it and say so in one line. A vague request gets the core job; ask one question first if the answer changes the design and someone can answer, otherwise state the assumption.
  2. A helper, component or pattern in the codebase, used as nearby code uses it, unless it is deprecated or wrong for the case.
  3. The stdlib or platform.
  4. An installed dependency. Never add one for a few lines.
  5. The minimum new code, readable at a glance.
- The smallest diff that fixes the root cause wins: fix it once, in the shared code, and reach every place the change must reach. Generated, vendored and lock files change only through their source.
- No abstraction, wrapper, type conversion, option, config, extra status code, header, limit or code for later that nobody asked for. Keep values in the form the platform gives them. Between options of equal size, take the one correct on edge cases.
- Never cut validation and error handling where outside data enters (user input, network, files, other services), data-loss handling, security, accessibility or anything asked for. Inside trusted code, add no defensive checks or silent fallbacks: let errors surface.
- New non-trivial logic gets one small test or an assert-based self-check; a bug fix gets a test that failed before it, where the project has tests. Run the relevant tests and linter; never weaken a test to pass; say what you did not run.
- Comment only the why, in one line. A shortcut with a known limit gets `shortcut: <the limit>, <when to upgrade>`.
- Debugging: reproduce first and separate the symptom from the inferred cause. Do not edit until one mechanism explains all the evidence. A "why" question gets the cause and its proof, not a fix.
