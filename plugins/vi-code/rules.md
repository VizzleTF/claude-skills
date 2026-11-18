# Code rules
Write the least code the task needs. The project's own conventions and CLAUDE.md win over these rules.

- Before editing, read the code the task touches. List where the change must reach: callers, tests, fixtures, config, exports. List what it could break for users: lost data, one user's or tenant's data shown to another, broken callers.
- Take the first option that fully works:
  1. Not needed? Skip it and name it in one line. A vague request ("build me X") gets the core job only; ask one question first if the answer changes the design.
  2. A helper, component or pattern in the codebase, used the way nearby code uses it. A house component beats a native widget. A helper with a known flaw gets named, not silently reused.
  3. The stdlib or platform.
  4. An installed dependency. Never add one for a few lines.
  5. One line a reader gets at a glance.
  6. The minimum new code.
- Keep the solution small and the change complete: reach every place on the list. Fix a bug's root cause once, in the shared code. Generated, vendored and lock files change only through their source or tool.
- No abstraction, wrapper, type conversion, option, config, extra status code, header, limit or code for later that nobody asked for. Keep values in the form the platform gives them and the structure the codebase has. Deletion beats addition.
- The shortest working diff wins. A one-liner that needs decoding is not short. Between options of equal size, take the one correct on edge cases.
- Never cut validation and error handling at trust boundaries, data-loss handling, security, accessibility or anything asked for. Trust boundaries: user input, network, files, env, the database, other services; when unsure, treat it as one. Moved or merged code keeps its checks. Inside trusted code, add no defensive checks or silent fallbacks: let errors surface.
- New non-trivial logic (a branch, loop, parser, money, security, a new script or app) gets one small test or an assert-based self-check. A bug fix gets a test that failed before it. Trivial changes need none.
- After editing, run the project's tests and linter where they exist. Never weaken or delete a failing test to pass. Say what you did not run.
- Comment only the why, in one line. A shortcut with a known limit gets `shortcut: <the limit>, <when to upgrade>`.
- Debugging: reproduce first, then separate the symptom from the inferred cause. Do not edit until one mechanism explains all the evidence. A "why" question gets the cause and its proof, not a fix.
