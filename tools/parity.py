#!/usr/bin/env python3
"""Structure checks for the technical-writing skill and repo-wide secret checks.

Run from anywhere without arguments: python3 tools/parity.py
Prints one "path: message" line per problem. Exit code 0 if clean, 1 otherwise.
"""

import importlib.util
import re
import subprocess
import sys
from pathlib import Path

EN = "plugins/technical-writing/skills/write"
TYPES = ["tutorial", "how-to", "runbook", "troubleshooting", "reference", "explanation",
         "readme", "conventions", "adr", "postmortem", "changelog", "docstring",
         "cli-help-errors"]
COMMON = ["SKILL.md", "sources.md", "style/llm-patterns.md", "process/doc-set.md",
          "process/review.md", "scripts/check.py"] + [f"types/{t}.md" for t in TYPES]
# English is the default style file; other languages add style/<language>.md beside it.
STYLE = "style/english.md"
SECTIONS = ["When to use it and when not", "Skeleton", "Voice and verbs", "Length",
            "Differences from the core rules", "Forbidden", "Type checklist"]
CONTENTS = {"Contents", "Содержание", "Оглавление"}
SKILL_MD_MAX_LINES = 170
FRONTMATTER_MAX_CHARS = 1536
LONG_FILE_LINES = 100
# Split literals so this file does not report itself.
PRIVATE_PATTERNS = [b"/ho" + b"me/", b"/mnt/c/" + b"Users", b"C:\\" + b"Users"]
SECRET_PATTERNS = [(kind, re.compile(rx)) for kind, rx in [
    ("OpenAI/Anthropic key", rb"\bsk-[A-Za-z0-9_-]{20,}"),
    ("GitHub token", rb"\bghp_[A-Za-z0-9]{36}"),
    ("GitHub token", rb"\bgithub_pat_[A-Za-z0-9_]{22,}"),
    ("AWS access key", rb"\bAKIA[0-9A-Z]{16}\b"),
    ("Google API key", rb"\bAIza[0-9A-Za-z_-]{35}"),
    ("Slack token", rb"\bxox[bpa]-[A-Za-z0-9-]{10,}"),
    ("private key", rb"-----BEGIN [A-Z ]*PRIVATE KEY-----"),
]]
SKILL_FILE_NAMES = ["SKILL.md", "sources.md", "english.md", "russian.md", "llm-patterns.md",
                    "doc-set.md", "review.md"] + [f"{t}.md" for t in TYPES]
SKILL_FILE_MENTION = re.compile(r"(?<![\w.-])(?:[\w.-]+/)*(?:"
                                + "|".join(map(re.escape, SKILL_FILE_NAMES)) + r")(?![\w-])")
MD_LINK = re.compile(r"\]\(\s*<?([^)\s>]+)")

# Fence parsing is shared with check.py so both tools agree on what is code.
_spec = importlib.util.spec_from_file_location(
    "check", Path(__file__).resolve().parent.parent / EN / "scripts/check.py")
check = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(check)


def prose_lines(text):
    """Lines outside fenced code blocks."""
    lines = text.split("\n")
    return [line for line, code in zip(lines, check.code_lines(lines)) if not code]


def skill_file_refs(text):
    """Links and bare mentions, outside fenced code, that name a file of the skill."""
    prose = "\n".join(prose_lines(text))
    refs = [t for t in MD_LINK.findall(prose)
            if t.split("#")[0].rsplit("/", 1)[-1] in SKILL_FILE_NAMES]
    return list(dict.fromkeys(refs + SKILL_FILE_MENTION.findall(prose)))


def h2_titles(text):
    return [m.group(1).strip() for line in prose_lines(text)
            if (m := re.match(r"^##\s+(.*?)\s*#*\s*$", line))]


def frontmatter(text):
    lines = text.split("\n")
    if not lines or lines[0].strip() != "---":
        return {}
    fields, key = {}, None
    for line in lines[1:]:
        if line.strip() == "---":
            break
        m = re.match(r"^([\w-]+):\s*(.*)$", line)
        if m:
            key = m.group(1)
            fields[key] = m.group(2).strip()
        elif key and line.startswith((" ", "\t")):
            fields[key] = (fields[key] + " " + line.strip()).strip()
    return {k: re.sub(r"^[>|]-?\s*", "", v).strip("\"'") for k, v in fields.items()}


def skill_files(d):
    return sorted(str(p.relative_to(d)).replace("\\", "/") for p in d.rglob("*")
                  if p.is_file() and "__pycache__" not in p.parts)


def check_skill(root, base, out):
    d = root / base
    for rel in COMMON + [STYLE]:
        if not (d / rel).is_file():
            out.append(f"{base}/{rel}: missing (required by the skill layout)")
    for rel in skill_files(d):
        if not rel.endswith(".md"):
            continue
        text = (d / rel).read_text(encoding="utf-8", errors="replace")
        path = f"{base}/{rel}"
        n = len(text.splitlines())
        titles = h2_titles(text)
        if n > LONG_FILE_LINES and (not titles or titles[0] not in CONTENTS):
            out.append(f"{path}: {n} lines; files over {LONG_FILE_LINES} lines must start "
                       "with a contents section (## Contents)")
        if rel.startswith("types/"):
            got = [t for t in titles if t not in CONTENTS]
            if got != SECTIONS:
                out.append(f"{path}: type sections {got} do not match the required order "
                           f"{SECTIONS}")
        if rel.startswith(("types/", "style/", "process/")):
            for t in skill_file_refs(text):
                out.append(f"{path}: links to {t}; rule files must not point to other skill files")
        if rel == "SKILL.md":
            if n > SKILL_MD_MAX_LINES:
                out.append(f"{path}: {n} lines; limit is {SKILL_MD_MAX_LINES}")
            fm = frontmatter(text)
            for key in ("description", "when_to_use"):
                if not fm.get(key):
                    out.append(f"{path}: frontmatter has no {key}")
            desc = fm.get("description", "")
            if re.search(r"[\"“”«»]|\buse when\b|\btrigger|[а-яё]", desc, re.I):
                out.append(f"{path}: description holds triggers (quoted phrases, 'Use when', "
                           "'Trigger', or Cyrillic); move them to when_to_use")
            total = len(fm.get("description", "")) + len(fm.get("when_to_use", ""))
            if total > FRONTMATTER_MAX_CHARS:
                out.append(f"{path}: description + when_to_use is {total} characters; "
                           f"limit is {FRONTMATTER_MAX_CHARS}")
            when = fm.get("when_to_use", "")
            if when and not (re.search(r"[а-яё]", when, re.I) and re.search(r"[a-z]", when, re.I)):
                out.append(f"{path}: when_to_use needs triggers in both Cyrillic and Latin script")


def check_commands(root, base, out):
    """Each type has a user-only command skill next to the main one; nothing else lives there."""
    skills = (root / base).parent
    rel = base.rsplit("/", 1)[0]
    allowed = {Path(base).name, *TYPES}
    for d in sorted(p for p in skills.iterdir() if p.is_dir()):
        if d.name not in allowed:
            out.append(f"{rel}/{d.name}: unexpected skill directory; allowed are "
                       f"{Path(base).name} and one command per type")
    for t in TYPES:
        path = f"{rel}/{t}/SKILL.md"
        if not (root / path).is_file():
            out.append(f"{path}: missing (command skill for the {t} type)")
            continue
        fm = frontmatter((root / path).read_text(encoding="utf-8", errors="replace"))
        if not fm.get("description"):
            out.append(f"{path}: frontmatter has no description")
        if fm.get("disable-model-invocation") != "true":
            out.append(f"{path}: command skills need disable-model-invocation: true")


def repo_files(root):
    if (root / ".git").exists():
        r = subprocess.run(["git", "-C", str(root), "ls-files", "-z", "--cached", "--others",
                            "--exclude-standard"], capture_output=True)
        if r.returncode == 0:
            return sorted({f for f in r.stdout.decode("utf-8", "replace").split("\0") if f})
    return sorted(str(p.relative_to(root)).replace("\\", "/") for p in root.rglob("*")
                  if p.is_file() and not {".git", "__pycache__"} & set(p.parts))


def check_private_paths(root, out):
    for rel in repo_files(root):
        if rel.startswith(".autopilot/") or not (root / rel).is_file():
            continue
        data = (root / rel).read_bytes()
        for kind, rx in SECRET_PATTERNS:
            m = rx.search(data)
            if m:
                line = data[:m.start()].count(b"\n") + 1
                out.append(f"{rel}: possible secret ({kind}) on line {line}")
        for pattern in PRIVATE_PATTERNS:
            if pattern in data:
                line = data[:data.index(pattern)].count(b"\n") + 1
                out.append(f"{rel}: private path {pattern.decode()!r} on line {line}")


def check_repo(root: Path) -> list:
    """Return "path: message" strings for every structure or secret problem under root."""
    root = Path(root)
    out = []
    if (root / EN).is_dir():
        check_skill(root, EN, out)
        check_commands(root, EN, out)
    else:
        out.append(f"{EN}: skill directory not found")
    check_private_paths(root, out)
    return list(dict.fromkeys(out))


def main():
    problems = check_repo(Path(__file__).resolve().parent.parent)
    for p in problems:
        print(p)
    print(f"parity: {len(problems)} problem(s)" if problems else "parity: ok")
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
