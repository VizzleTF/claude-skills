#!/usr/bin/env python3
"""Check that every plugin changed since BASE bumps its version and has a changelog entry for it.

Run from the repo root: python3 tools/version_check.py BASE   (BASE: a commit, e.g. origin/main)
Compares the working tree, staged and untracked files included, with BASE.
Prints one "path: message" line per problem. Exit code 0 if clean, 1 on problems, 2 if BASE is unknown.
"""

import json
import subprocess
import sys
from pathlib import Path

MANIFEST = ".claude-plugin/plugin.json"


def git(root, *args):
    return subprocess.run(["git", *args], cwd=root, capture_output=True, text=True)


def parse_version(text):
    return tuple(int(part) for part in text.split("-")[0].split("."))


def changed_files(root, base, plugin):
    diff = git(root, "diff", "--name-only", base, "--", plugin).stdout.split()
    new = git(root, "ls-files", "--others", "--exclude-standard", "--", plugin).stdout.split()
    return set(diff) | set(new)


def check(root, base):
    problems = []
    for manifest in sorted(Path(root).glob(f"plugins/*/{MANIFEST}")):
        plugin = manifest.parent.parent.relative_to(root).as_posix()
        if not changed_files(root, base, plugin):
            continue
        old = git(root, "show", f"{base}:{plugin}/{MANIFEST}")
        if old.returncode != 0:
            continue  # a plugin added after BASE starts at any version
        old_version = json.loads(old.stdout)["version"]
        version = json.loads(manifest.read_text(encoding="utf-8"))["version"]
        if parse_version(version) <= parse_version(old_version):
            problems.append(f"{plugin}/{MANIFEST}: files changed since {base}, "
                            f"version {version} must be above {old_version}")
        changelog = Path(root, plugin, "CHANGELOG.md")
        if not changelog.exists() or f"## [{version}]" not in changelog.read_text(encoding="utf-8"):
            problems.append(f"{plugin}/CHANGELOG.md: no '## [{version}]' entry")
    return problems


def main(argv):
    if len(argv) != 1:
        print(__doc__.strip(), file=sys.stderr)
        return 2
    root = Path(__file__).resolve().parent.parent
    if git(root, "rev-parse", "--verify", "--quiet", f"{argv[0]}^{{commit}}").returncode != 0:
        print(f"version_check: unknown commit {argv[0]}", file=sys.stderr)
        return 2
    problems = check(root, argv[0])
    for line in problems:
        print(line)
    print(f"version: {len(problems)} problem(s)" if problems else "version: ok")
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
