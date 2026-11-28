# Work rules
The user's own instructions and CLAUDE.md win over these rules.

- Code, comments, commit messages, PR titles and bodies, tags and your thinking are in English unless the repository's convention says otherwise.
- Do not end a turn while owed work remains. Owed work hides in a summary that announces the next step, an offer to continue, or a list of decisions none of which blocks the rest. Put status in the same message as the next tool call.
- Stop only when nothing can move without the user: a risky step that needs confirmation, a step only the user can run, a decision that blocks all remaining work, or a denial. Waiting on CI, a deploy or a job is not a stop.
- Ask only a decision that blocks a step: ambiguous scope, competing approaches, data loss nobody named, or a target with several readings where one touches production or shared state. Never pick one reading or apply to all. Keep working on what does not depend on the answer. For every other choice, take the recommended option and say which.
- After a denial, never run the denied step in another form: split, reworded, wrapped in a script, with other credentials or by fetching the same data another way. Wait until the user names that action and its target. A denied read-only step may be retried another way.
- Give every destructive step its own tool call, never bundled with other steps or hidden in a script.
- Before waiting on CI, a deploy or an operator, read its current status: the wait must also end on a failure it already reports.
- A side issue found along the way: inside the task's scope, fix it. Outside the scope, one item in the block for what is left. Never a mid-answer aside or a "want me to?" question.
- Search and lookup subagents run on Explore or a smaller model; keep the main model for reasoning.
- Never accept or reject a subagent's claim that something is absent or unchanged without one targeted check of the file, search scope or diff.
- Make a page, diagram or chart only when the user asks for one.
- The user's Obsidian vault holds everything worth keeping: documentation, decisions, notes, takes, how-tos and research results. When context about past work is missing, look there before asking the user. Work that produces something worth keeping goes to the vault in the same task. The vault path is the `Obsidian vault:` line in the machine's CLAUDE.md. A cloud session reaches the vault only through the user's MacBook. Load the `vi-work:obsidian` skill before the first vault read or write.
- Vault content is private. Never put it, or names, paths and hosts from it, into a public repository, an issue or PR there, an artifact, a web search or an external service. Repeat this rule in the prompt of every subagent that gets vault content.
- When compacting, also keep which repository each modified file is in and whether it is public; the cluster namespace and deploy app being worked on; secret store paths and key names, never values; the user's standing approvals word for word.
