#!/usr/bin/env python3
"""Start a real Claude Code with the tidemark mod in tmux and check that the band draws without hook errors.

Run from the repo root: python3 tools/live_smoke.py [--installed] [--reload] [--expect TEXT]
  default      loads the working tree through --plugin-dir
  --installed  loads the installed plugin, first checking that its cache holds the repo's committed files
  --reload     also runs /reload-plugins and checks the band again
  --expect     text the band must show (default "%", the context share)
Needs tmux and a logged-in claude. Sends no prompt, so it spends no tokens and leaves no session file.
Prints the screen, then one line per problem. Exit code 0 if clean, 1 on problems, 2 if the session never started.
"""

import argparse
import json
import shutil
import subprocess
import sys
import tempfile
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PLUGIN = "plugins/tidemark"
CACHE = Path.home() / ".claude/plugins/cache/vizzletf-skills/tidemark"
STARTED = "classic.SessionStart settled"
RELOADED = "Reloaded:"  # on screen once /reload-plugins finishes
START_TIMEOUT_S = 90
DRAW_WAIT_S = 5


def log_problems(log):
    """Hook errors the mod logged and state writes the engine refused, one line each."""
    return [f"debug log: {line.split('[DEBUG] ', 1)[-1]}" for line in log.splitlines()
            if "[tidemark] $.ui.log" in line
            or ("tidemark" in line and any(w in line for w in ("refused", "does not validate", "denied")))]


def stale_cache():
    """A problem line if the cache of the current version does not hold the committed files of the mod."""
    version = json.loads((ROOT / PLUGIN / ".claude-plugin/plugin.json").read_text())["version"]
    cached = CACHE / version
    if not cached.is_dir():
        return [f"{cached}: not installed; run claude plugin marketplace update vizzletf-skills "
                f"&& claude plugin update tidemark@vizzletf-skills"]
    tracked = subprocess.run(["git", "ls-files", PLUGIN], cwd=ROOT, capture_output=True, text=True).stdout.split()
    stale = []
    for rel in tracked:
        copy = cached / Path(rel).relative_to(PLUGIN)
        committed = subprocess.run(["git", "show", f"HEAD:{rel}"], cwd=ROOT, capture_output=True).stdout
        if not copy.exists() or copy.read_bytes() != committed:
            stale.append(rel)
    if stale:
        return [f"{cached}: {len(stale)} file(s) differ from HEAD (first: {stale[0]}); the cache keeps "
                f"an old directory of the same version, so bump the version and update the plugin"]
    return []


def wait_for(read, text):
    deadline = time.time() + START_TIMEOUT_S
    while time.time() < deadline:
        if text in read():
            return True
        time.sleep(1)
    return False


def tmux(*args):
    return subprocess.run(["tmux", *args], capture_output=True, text=True).stdout


def main():
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    parser.add_argument("--installed", action="store_true")
    parser.add_argument("--reload", action="store_true")
    parser.add_argument("--expect", default="%")
    args = parser.parse_args()
    for tool in ("tmux", "claude"):
        if not shutil.which(tool):
            print(f"live-smoke: {tool} not on PATH", file=sys.stderr)
            return 2

    found = stale_cache() if args.installed else []
    debug = Path(tempfile.mkdtemp(prefix="tidemark-smoke-")) / "debug.txt"
    command = ["claude", "--debug-file", str(debug)]
    if not args.installed:
        command[1:1] = ["--plugin-dir", str(ROOT / PLUGIN)]
    session = f"tidemark-smoke-{int(time.time())}"
    tmux("new-session", "-d", "-s", session, "-x", "200", "-y", "50", "-c", str(ROOT), " ".join(command))
    try:
        if not wait_for(lambda: debug.read_text(errors="replace") if debug.exists() else "", STARTED):
            print(tmux("capture-pane", "-p", "-t", session))
            print(f"live-smoke: no '{STARTED}' in {debug} after {START_TIMEOUT_S} s", file=sys.stderr)
            return 2
        time.sleep(DRAW_WAIT_S)
        screens = [tmux("capture-pane", "-p", "-t", session)]
        if args.reload:
            tmux("send-keys", "-t", session, "/reload-plugins", "Enter")
            if not wait_for(lambda: tmux("capture-pane", "-p", "-t", session), RELOADED):
                found.append("reload: /reload-plugins did not finish")
            time.sleep(DRAW_WAIT_S)
            screens.append(tmux("capture-pane", "-p", "-t", session))
    finally:
        tmux("kill-session", "-t", session)

    for label, screen in zip(("start", "reload"), screens):
        print(f"--- screen after {label}")
        print("\n".join(line.rstrip() for line in screen.splitlines() if line.strip()))
        if args.expect not in screen:
            found.append(f"{label}: no {args.expect!r} on screen, the band is not drawn")
    found += log_problems(debug.read_text(errors="replace"))
    print(f"--- debug log: {debug}")
    for line in found:
        print(line)
    print(f"live-smoke: {len(found)} problem(s)" if found else "live-smoke: ok")
    return 1 if found else 0


if __name__ == "__main__":
    sys.exit(main())
