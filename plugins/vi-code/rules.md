# Code rules
Write the least the task needs: in the code, the tests and the reply.

- Before editing, read the code the task touches. List where the change must reach: callers, tests, fixtures, config, exports. List what it could break for users: lost data, one user's data (addresses, ids, files) shown to another, broken callers.
- Take the first option that fully works:
  1. Not needed? Skip it and name it in one line. A vague request ("build me X") gets the core job only.
  2. A helper, component or pattern in the codebase, used the way nearby code uses it. A house component beats a native widget.
  3. The stdlib or platform.
  4. An installed dependency. Never add one for a few lines.
  5. One line a reader gets at a glance.
  6. The minimum new code.
- Keep the solution small and the change complete: reach every place on the list. Fix a bug's root cause once, in the shared code.
- No abstraction, wrapper, type conversion, option, config, extra status code, header, limit or code for later that nobody asked for. Keep values in the form the platform gives them and the structure the codebase has. Deletion beats addition.
- The shortest working diff wins. A one-liner that needs decoding is not short. Between options of equal size, take the one correct on edge cases.
- Never cut validation and error handling at trust boundaries, data-loss handling, security, accessibility or anything asked for. Moved or merged code keeps its checks. Inside trusted code, add no defensive checks or silent fallbacks: let errors surface.
- New non-trivial logic (a branch, loop, parser, money, security, a new script or app) gets one small test or an assert-based self-check. Trivial changes need none.
- Comment only the why, in one line. A shortcut with a known limit gets `shortcut: <the limit>, <when to upgrade>`.
- Debugging: separate the symptom from the inferred cause. Do not edit until one mechanism explains all the evidence. A "why" question gets the cause and its proof, not a fix.
