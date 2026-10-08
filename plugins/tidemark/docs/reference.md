# tidemark reference

## Contents

- Commands
- Config files
- Config keys
- Widget keys
- Widgets
- Widget options
- Presets
- External runs
- Limits
- Troubleshooting

This reference covers tidemark 0.1.10. The config is read from two JSON files, the project file over the global one. A top-level key in the project file replaces the same key of the global file whole: to add one widget in a project, repeat the whole `lines` in the project file. Until a file exists, the default config applies; `Save` in the editor creates the file and its directories. A hand edit is picked up on the next prompt or within 30 seconds. An unknown key, widget or option and an invalid value are dropped, and the editor shows a warning. A file that does not parse is skipped: the band shows a dim `⚠ config`, and the editor shows the path and the error.

## Commands

| Command | Opens |
|---|---|
| `/tidemark` | The details pane. Section `context`: the auto-compaction threshold, `/context` categories, the five heaviest MCP servers. Section `cacheQuota`: hit rate, tokens, quota exhaustion forecast. Section `agents`: the session and the last 8 subagents |
| `/tidemark-config` | The editor: preview, lines, widgets and their options, style, pane sections, alerts, the compact button, presets. Edits go to a draft. The `save to` field picks the file: `global` or `project`. `Save` writes the draft to that file and applies it, `Revert` drops it |
| `/tidemark-goal [text]` | With text, nothing: sets the goal the `goal` widget shows. Without, a field holding the current goal: Enter sets it, an empty field clears it, Esc closes. The goal is kept per session: `/clear`, a restart and `--resume` keep it |
| `/tidemark-project [text]` | The same for the project name the `project` widget shows. It is kept in `.claude/tidemark-project.txt` in the session's directory, so every session there shows it |

## Config files

| File | Path |
|---|---|
| Global | `$XDG_CONFIG_HOME/tidemark/config.json`, else `~/.config/tidemark/config.json` |
| Project | `.claude/tidemark.json` in the Claude Code session's working directory |

## Config keys

| Key | Type | Default | Limits |
|---|---|---|---|
| `$schema` | string | `https://raw.githubusercontent.com/VizzleTF/claude-skills/main/plugins/tidemark/config.schema.json` | the JSON Schema a code editor uses to suggest keys and values; `Save` writes it |
| `version` | number | `1` | `1` only; the key may be left out |
| `lines` | array of band rows; a row is an array of widgets | one row: `context`, `cache`, `quota5h`, `quota7d`, `model`, `git`, `flex`, `compact`, `actions` | 1–3 rows; extra rows are dropped |
| `style.separator` | string | `space` | `pipe` (` │ `), `space`, `dot` (` · `), `powerline` (`▶` arrows, Nerd Font glyphs with `icons: "nerd"`), `custom` |
| `style.custom` | string | none | the separator when `separator: "custom"` |
| `style.icons` | string | `nerd` | `text`, `nerd` (Nerd Font glyphs instead of labels and powerline arrows) |
| `style.buttons` | boolean | `true` | `false` draws the presses and links of the Widgets table as plain text |
| `pane.sections` | array of `{id, enabled}` | all three sections on | `id`: `context`, `cacheQuota`, `agents`; the array order is the section order |
| `alerts.enabled` | boolean | `false` | turns on a toast when a figure crosses its threshold upwards |
| `alerts.context` | number, % used | `80` | 0–100 |
| `alerts.quota5h` | number, % used | `90` | 0–100 |
| `alerts.quota7d` | number, % used | `90` | 0–100 |
| `alerts.cacheSeconds` | number, s | `60` | 0–3600; seconds before the prompt cache goes cold |
| `compact.enabled` | boolean | `true` | the `/compact` button under the band |
| `compact.at` | integer, % of the context window | `70` | 1–100 |

Thresholds compare with the used share whatever the widget's `mode`. A repeat percentage toast comes after the figure drops 5 points below its threshold. The cache toast comes once per cache write. Quota alerts stay quiet while the session shows the figure saved by a previous session.

A `/compact · context 72%` button appears under the band once the main conversation's context fills `compact.at` percent of the window. Pressing it runs the same compaction as `/compact`. While a turn runs the button is hidden: the engine compacts only between turns. In the terminal the `c` key presses it when the band holds the focus (ctrl+x tab). The 70% default is a heuristic: answers degrade as the window fills, and auto-compaction waits until the window is nearly full (967k of 1M).

Example:

```json
{
  "$schema": "https://raw.githubusercontent.com/VizzleTF/claude-skills/main/plugins/tidemark/config.schema.json",
  "version": 1,
  "lines": [
    ["context", "cache", "flex", "quota5h", "quota7d"],
    ["model", { "widget": "cwd", "options": { "style": "short" } }, { "widget": "git", "label": "git", "priority": 45 }]
  ],
  "style": { "separator": "dot", "icons": "text" },
  "alerts": { "enabled": true, "context": 85 },
  "compact": { "at": 75 }
}
```

## Widget keys

A widget in `lines` is a name (`"git"`) or an object with these keys:

| Key | Type | Default | Limits |
|---|---|---|---|
| `widget` | string | required | a name from the Widgets table |
| `enabled` | boolean | `true` | |
| `label` | string or `null` | `ctx`, `cache`, `5h`, `7d`, `⏱`, `⇣`; the other widgets have none | `null` removes the label |
| `priority` | integer | the widget's priority from the Widgets table | 0–1000 |
| `options` | object | the default options | keys from the Widget options table |

While a row is wider than the window, the visible widget with the lowest `priority` (the rightmost on a tie) loses its next detail, then disappears. The last widget left is cut with `…`. A widget with nothing to show is hidden.

## Widgets

| Widget | Shows | Priority |
|---|---|---|
| `context` | the `ctx` bar, percent, `used/window`, a growth sparkline over the last 7 turns, the last growth; `agent` while a subagent's transcript is open | 100 |
| `quota5h` | `5h 42% ↻ 2h34m` | 80 |
| `cache` | `warm 38m`, `cold`, `rewrote 45k`; `warm` without minutes while the cache lifetime is unknown | 70 |
| `quota7d` | `7d 63% ↻ 2d7h`; the model's own week as `7d fable` when the engine reports one | 60 |
| `model` | `opus 5.5 · high`; a press on the name switches to the next model of `cycle`, on the effort steps to the next level `/effort` lists (`low → medium → high → xhigh → max` today) and skips one the model was sent lower. A press runs `/model` or `/effort` as if typed: Claude Code asks before a model switch that re-reads the conversation, and saves the choice as the default for new sessions | 50 |
| `git` | branch or short SHA, `*` for uncommitted changes, sync with the upstream, `+12 −3` against HEAD | 40 |
| `cost` | `≈$1.84 (+$0.12)`: the session and the current turn | 20 |
| `agents` | a spinner per running subagent, up to three, then `+N` | 20 |
| `cwd` | project name, directory name, `~/…/a/b` or the full path | 20 |
| `sessionTime` | `⏱ 1h12m` since the conversation started | 20 |
| `compactions` | `⇣2` | 20 |
| `tokenSpeed` | `42 t/s` for the last turn | 20 |
| `goal` | `goal <text>` from `/tidemark-goal`, cut to 24 characters when narrow; hidden until set | 20 |
| `project` | `project <text>` from `/tidemark-project`, cut to 24 characters when narrow; hidden until set | 20 |
| `command` | the first line of your command's output, `?` on failure | 20 |
| `claudeStatus` | `● ok`, `● minor`, `● major`, `● critical` from status.claude.com | 20 |
| `gitPr` | `#123 ✓`, `✗` or `…` for the current branch's PR or MR; needs `gh` or `glab` signed in, hidden without them or without a PR | 20 |
| `compact` | a `/compact` button: compacts the conversation as `/compact` does; hidden on a subagent's transcript and until the session reports | 10 |
| `actions` | a small `⚙` button that opens `/tidemark-config`; hidden until the session reports | 10 |
| `flex` | nothing; splits the row into groups: one `flex` sends the widgets after it to the right edge, two put the widgets between them in the middle | never narrowed away |

Figures are coloured on a 10-colour scale from blue to red by the used share.

Some parts of the band are buttons or links. A click works on the desktop and in the fullscreen terminal; otherwise ctrl+x tab focuses the band, Tab moves between buttons and Enter presses. `style.buttons: false` turns them back into text.

| Press on | Does |
|---|---|
| the `context` label (`ctx`) | runs `/context` |
| the `quota5h` or `quota7d` label | runs `/usage` |
| the `cache` label | opens the `/tidemark` pane |
| the model name, the effort | the next model of `cycle`, the next effort level (see `model` above) |
| `/compact` in `compact` | compacts the conversation |
| `⚙` in `actions` | opens `/tidemark-config` |
| the `gitPr` number | opens the PR in the browser |
| the `claudeStatus` word | opens status.claude.com |

A label removed with `label: null` is no button.

The sync in `git` compares the branch with its upstream after the last `git fetch`:

| Mark | Means |
|---|---|
| `⇣3` red | the remote is 3 commits ahead: pull |
| `⇡2` teal | the local branch is 2 commits ahead: push |
| `⇣3 ⇡2` red | the branches diverged |
| `gone` red | the upstream was deleted on the remote |
| `?` dim | the last `git fetch` failed; the counts are from the fetch before |

With no upstream, or level with it, there is no mark.

A row takes its first two `flex`; any other is dropped. The groups spread across the row with equal gaps, so the middle group is exactly centred only when the left and right groups are equally wide. Narrowing keeps `flex` in place.

## Widget options

`cost`, `agents`, `sessionTime` and `tokenSpeed` have no options. TTLs are in seconds, timeouts in milliseconds.

| Widget | Option | Type | Default | Limits |
|---|---|---|---|---|
| `context` | `mode` | string | `used` | `used`, `left` (`58% left`; the colour still follows the used share) |
| `context` | `barWidth` | integer | `10` | 4–20 |
| `context` | `showTokens` | boolean | `true` | |
| `context` | `showGrowth` | boolean | `true` | |
| `context` | `showLast` | boolean | `true` | |
| `cache` | `showRewrite` | boolean | `true` | |
| `cache` | `showMinutes` | boolean | `true` | |
| `cache` | `ttl` | string | `auto` | `auto`, `5m`, `1h` |
| `quota5h`, `quota7d` | `mode` | string | `used` | `used`, `left` |
| `quota5h`, `quota7d` | `showReset` | boolean | `true` | |
| `quota5h`, `quota7d` | `bar` | boolean | `false` | |
| `model` | `showEffort` | boolean | `true` | |
| `model` | `format` | string | `short` | `short`, `full` |
| `model` | `cycle` | array of strings | empty | models a press on the name steps through, as `/model` takes them. Empty: the models Claude Code offers in `/config`, without `default`, `best` and `opusplan`; while the running model has the 1M window, `[1m]` aliases in place of the plain ones |
| `git` | `showDirty` | boolean | `true` | |
| `git` | `showDiff` | boolean | `true` | |
| `git` | `showSync` | boolean | `true` | |
| `git` | `maxLength` | integer | `24` | 4–200 |
| `git` | `ttl` | integer, s | `5` | 1–3600 |
| `git` | `fetch` | integer, s | `300` | 0–86400; `0` turns `git fetch` off |
| `cwd` | `style` | string | `project` | `project`, `basename`, `short`, `full` |
| `actions` | `config` | boolean | `true` | the `⚙` button |
| `compactions` | `hideZero` | boolean | `true` | |
| `command` | `command` | string | empty | run as `sh -c <command>` |
| `command` | `maxWidth` | integer | `40` | 4–200 |
| `command` | `timeout` | integer, ms | `2000` | 100–30000 |
| `command` | `ttl` | integer, s | `10` | 1–3600 |
| `claudeStatus` | `ttl` | integer, s | `300` | 30–3600 |
| `gitPr` | `githubHosts` | array of strings | empty | GitHub hosts besides `github.com` |
| `gitPr` | `ttl` | integer, s | `120` | 10–3600 |

`cache.ttl: auto` takes the lifetime a model switch, a resume or a pause over five minutes proved. Until then it takes the first one set: `FORCE_PROMPT_CACHING_5M`, `CLAUDE_CODE_PROMPT_CACHE_TTL`, the `promptCacheTtl` setting, `ENABLE_PROMPT_CACHING_1H`. With none set, it takes one hour on a subscription and five minutes otherwise. `5m` or `1h` pins the lifetime, for the cache alert too.

`command` gets JSON `{sessionId, model, cwd, contextPercent}` on stdin.

## Presets

A preset is picked in the editor, changes the draft and is written on `Save`.

| Preset | Rows |
|---|---|
| `minimal` | context, quota5h |
| `classic` | context, cache, quota5h, quota7d |
| `default` | project, context, compact, cache, flex, quota5h, quota7d, flex, sessionTime, git, model, cwd, actions |
| `full` | 1: project, goal, context, cache, quota5h, quota7d, cost; 2: model, cwd, git, sessionTime, compactions, tokenSpeed, agents |
| `powerline` | `default` with `separator: "powerline"` and `icons: "nerd"` |

## External runs

A disabled widget runs nothing. The default band runs `git` locally and `git fetch` against the remote every 5 minutes.

| Widget | Runs | When |
|---|---|---|
| `git` | `git status`, `git diff --numstat HEAD` | after each turn and on the 30-second tick, once `ttl` has passed |
| `git` with `showSync` | `git fetch --quiet --no-tags` with `GIT_TERMINAL_PROMPT=0`: updates the remote refs, a credential prompt fails instead of waiting | every `fetch` seconds |
| `cwd` with `style: "project"` | `git rev-parse --show-toplevel` | at most once a minute |
| `gitPr` | `git status`, `git remote get-url origin`, then `gh pr view` for `github.com` and `githubHosts` or `glab mr view` for the rest | once `ttl` has passed |
| `command` | `sh -c <command>` | once `ttl` has passed |
| `claudeStatus` | HTTPS GET to `status.claude.com` | once `ttl` has passed |

Besides that, tidemark reads its config files and writes two kinds of file: a config on `Save` in `/tidemark-config`, and `.claude/tidemark-project.txt` on `/tidemark-project`. The plugin store keeps the last quota, which a new session shows dim until its own figure arrives, and the goals of the last sessions by session id. Nothing else leaves the machine: the only network calls are the `git`, `gh` and `glab` runs and the status page above.

## Limits

| Limit | Value |
|---|---|
| Colours | a fixed scale; no themes or colour overrides |
| Width | one cell per code point; emoji and other wide glyphs are undercounted |
| Timeouts | `git` 2 s, `git fetch` 15 s, `gh` and `glab` 10 s, the status page 5 s; not configurable |
| Surfaces | VS Code and mobile do not draw the band. Panes open on both; on mobile `/tidemark-config`, `/tidemark-goal` and `/tidemark-project` without text show a note instead of fields |

## Troubleshooting

| Symptom | Fix |
|---|---|
| No band above the prompt | Run `/reload-plugins`. Check `claude --version` is 2.1.288 or later and `claude plugin list` shows `tidemark` enabled. VS Code and mobile do not draw the band |
| A dim `⚠ config` at the end of the band | A config file does not parse. `/tidemark-config` shows the path and the error |
| Boxes or question marks instead of icons | `icons: "nerd"` without a Nerd Font in the terminal. Set `style.icons` to `text` |
| `git` shows nothing | The session directory is not in a git repository, or `git` is not on `PATH` |
| A dim `?` after the `git` sync | `git fetch` failed: no network, or the remote asks for credentials. Set `git.fetch` to `0` to stop fetching |
| Anything else | Start `claude --debug`: tidemark writes the failures it survives to the debug log, each line led by `tidemark` |
