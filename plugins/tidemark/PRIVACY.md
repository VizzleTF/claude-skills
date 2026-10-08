# Privacy

tidemark runs inside your Claude Code session and keeps everything on your machine. It has no server, no account, no telemetry and no analytics. The author receives nothing from it.

## What it reads

- The session figures Claude Code hands to plugins: context usage, token counts, cost, prompt-cache activity, rate-limit percentages, model, effort and subagents.
- Its config files: `~/.config/tidemark/config.json` (or under `$XDG_CONFIG_HOME`) and `.claude/tidemark.json` in the session's directory.
- `.claude/tidemark-project.txt` in the session's directory.
- The environment variables `HOME`, `XDG_CONFIG_HOME`, `CLAUDE_CODE_PROMPT_CACHE_TTL`, `ENABLE_PROMPT_CACHING_1H` and `FORCE_PROMPT_CACHING_5M`.

## What it writes

- A config file, only when you press `Save` in `/tidemark-config`.
- `.claude/tidemark-project.txt`, only when you run `/tidemark-project`.
- The plugin store, which Claude Code keeps for each plugin on your machine. It holds the last quota figures, the effort levels each model accepted, and the goals of the last 50 sessions keyed by session id.

## What reaches the network

tidemark makes no network request of its own except the ones below, each made by a widget:

| Widget | Request | Goes to |
|---|---|---|
| `git` (in the default band) | `git fetch` every 5 minutes; set `git.fetch` to `0` to stop it | the remote of the repository you work in |
| `gitPr` | `gh pr view` or `glab mr view` | your GitHub or GitLab host, with the credentials of those tools |
| `claudeStatus` | HTTPS GET of the public status page | `status.claude.com` |
| `command` | the shell command you configure | wherever that command goes |

The full list of commands and when they run is in [External runs](docs/reference.md#external-runs).

## Removing its data

`/plugin uninstall tidemark@vizzletf-skills` removes the plugin. Delete `~/.config/tidemark/`, `.claude/tidemark.json` and `.claude/tidemark-project.txt` by hand.

## Contact

Questions and reports: [GitHub issues](https://github.com/VizzleTF/claude-skills/issues).
