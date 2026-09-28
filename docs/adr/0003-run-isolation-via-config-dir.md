# ADR-0003: Run isolation through a temporary CLAUDE_CONFIG_DIR

Status: Accepted, 2026-09-28

## Context

The A/B comparison is fair only if each run sees exactly one documentation skill. The owner's configuration has hooks, a global `CLAUDE.md` and other skills, and any of them would leak into the output. Runs must use the owner's subscription, not a paid API key. The runner must not write to `~/.claude` or touch the installed `writing-docs`. A check showed that `--bare` isolates the CLI but requires an API key.

## Decision

We will give every run its own temporary `CLAUDE_CONFIG_DIR` that holds a symlink to `~/.claude/.credentials.json` and nothing else. The participant is added with `--plugin-dir`, or for `writing-docs` with a symlink under `skills/`. The runner never reads the credentials file. If the symlink cannot be made and `ANTHROPIC_API_KEY` is set, the runner uses the key; otherwise it stops with exit code 2. Temporary directories are removed in `finally`.

## Consequences

Runs work on the subscription and see no hooks, no `CLAUDE.md` and no foreign skills. A test checks the contents of the directory. The owner's `~/.claude` stays untouched.

The approach depends on credentials being a file. On macOS, where they live in the keychain, the runner needs an API key. It also depends on the CLI honouring `CLAUDE_CONFIG_DIR`; if a later CLI version reads settings from elsewhere, isolation fails without an error. The runner therefore records from `stream-json` which skill fired in each run, and the report shows it.

## Alternatives considered

- `--bare`. Rejected: it needs an API key, and the owner runs on a subscription.
- Running in the owner's normal configuration. Rejected: hooks, `CLAUDE.md` and other skills would contaminate every participant.
- Moving the owner's skills aside for the duration of the run. Rejected: it writes to `~/.claude`, which the brief forbids, and an interrupted run would leave it broken.
