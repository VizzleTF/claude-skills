---
description: Procedures for the user's Obsidian vault - finding it on each machine and from a cloud session, the Claude bookmark group used as memory, Self-hosted LiveSync as the only sync, obsidian-git as backup only.
when_to_use: Before the first read or write of the Obsidian vault in a session; when a doc, decision, note or take should be saved to Obsidian; when Obsidian bookmarks, LiveSync or obsidian-git come up. Triggers «обсидиан», «запиши в обсидиан», «заметки в обсидиане», «закладки обсидиана», «LiveSync», "Obsidian vault", "save to Obsidian", "Obsidian bookmarks". Not for HashiCorp Vault, OpenBao or browser bookmarks.
---

# Obsidian vault

## 1. Find the vault

- The vault path on a machine is the line `Obsidian vault: <path>` in that machine's `~/.claude/CLAUDE.md`. Without that line, ask the user for the path: it blocks every vault step. Add the line once the user names the path.
- A repository may link part of the vault into itself (an `obsidian/` folder or symlink). Those files are the vault, and every rule here applies to them.
- A cloud session has no vault. It reaches the vault through the user's MacBook when the session is linked to it, which shows as tools named `mcp__remote-devices__*`. Without them, say the vault is out of reach and write nothing to it. Put the note text in the reply so it can be saved later.

## 2. Read

- Start with the bookmark group `Claude` from section 4. Then read the vault's home note and search by words and frontmatter tags.
- A note can be stale. When it disagrees with what you observe (code, a cluster, a config), trust the observation. Fix the note in the same task and say so.

## 3. Write

- A note names where a secret lives (store path, key name), never its value.
- Update the existing note on the topic before you create a new one. A new note goes into the folder that holds its neighbours and copies their format, frontmatter and language. With no fitting folder, use the nearest existing one and say which. Create no new top-level folder.
- Link related notes with `[[note name]]`. When the folder has an index or registry note, add the new note to it.
- A deletion or rename reaches every device through LiveSync. Ask first, and prefer moving the note to the vault's archive folder.

## 4. Bookmarks as memory

- The group `Claude` in the core Bookmarks plugin is the index you read first: entry notes for each area and the notes to remember. Add a note when it becomes an entry point. Remove an item whose note is gone.
- The file is `.obsidian/bookmarks.json`, shaped `{"items":[{"type":"group","title":"Claude","items":[{"type":"file","path":"<path from the vault root>.md"}]}]}`. Groups can nest. Leave other groups and items of other types (folder, search, graph) as they are. Create the file or the group when missing, and keep the JSON valid.
- Obsidian keeps bookmarks in memory and may write over an outside edit. Edit the file only while Obsidian is not running on that machine; when you cannot tell, treat it as running. While it runs, name the notes to bookmark in the reply.
- LiveSync carries `.obsidian/` files only with hidden file sync on (the `syncInternalFiles` setting), and it is off by default. While it is off, the group lives on one machine. Tell the user and ask them to turn on hidden file sync for `bookmarks.json` on every device.
- The scan applies `syncInternalFilesTargetPatterns` to folders too, to paths without a leading `/`. To sync only the bookmarks, the patterns must admit the folder as well: `^\.obsidian$, ^\.obsidian\/bookmarks\.json$`. A file pattern alone finds 0 files.
- Claude Code memory keeps how to work with the user. Facts and documentation go to the vault.

## 5. Sync

- Self-hosted LiveSync is the only sync. A change written to disk reaches other devices once Obsidian with LiveSync runs on that machine and replicates. When Obsidian is closed, say the change waits for its next start.
- Two syncs on one vault corrupt notes. The core Sync plugin stays off: `"sync": false` in `.obsidian/core-plugins.json`. Obsidian may write over an outside edit of that file too, so change it only while Obsidian is closed. While it runs, ask the user to turn Sync off in Settings > Core plugins.
- When the vault lives inside iCloud Drive or another synced folder, tell the user and do not move the vault yourself.
- obsidian-git is a backup only: it commits and pushes on a timer. With `pullBeforePush` on, it pulls before each push, and LiveSync carries the merge to every device. When that setting is on, tell the user; turning it or git off is the user's decision.
- In the vault run only read-only git commands such as status, log and diff. On conflict markers or a failed push, stop and tell the user.
- LiveSync marks conflicted notes. Never resolve a conflict by deleting a version; show the user both.
- Never print a plugin's `data.json` under `.obsidian/plugins/`: it can hold sync credentials and passphrases. To check a setting, read that one key with a command that prints nothing else.

## 6. Privacy

The always-on privacy rule covers what leaves the user's machines. On top of it:

- Quote vault content in chat only as far as the task needs.
- A private repository or service gets a piece of the vault only when the task asks for that piece.
