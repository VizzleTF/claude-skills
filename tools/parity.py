#!/usr/bin/env python3
"""Structure and parity checks for the two editions of the technical-writing skill.

Run from anywhere without arguments: python3 tools/parity.py
Prints one "path: message" line per problem. Exit code 0 if clean, 1 otherwise.
"""

import importlib.util
import re
import subprocess
import sys
from collections import Counter
from pathlib import Path

EN = "plugins/technical-writing/skills/technical-writing"
RU = "plugins/technical-writing-ru/skills/technical-writing-ru"
TYPES = ["tutorial", "how-to", "runbook", "troubleshooting", "reference", "explanation",
         "readme", "conventions", "adr", "postmortem", "changelog", "docstring",
         "cli-help-errors"]
COMMON = ["SKILL.md", "sources.md", "style/llm-patterns.md", "process/doc-set.md",
          "process/review.md", "scripts/check.py"] + [f"types/{t}.md" for t in TYPES]
STYLE = {EN: "style/english.md", RU: "style/russian.md"}
SECTIONS = {
    EN: ["When to use it and when not", "Skeleton", "Voice and verbs", "Length",
         "Differences from the core rules", "Forbidden", "Type checklist"],
    RU: ["Когда это он и когда нет", "Каркас", "Голос и глаголы", "Объём",
         "Отличия от общих правил", "Запрещено", "Чек-лист типа"],
}
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


def structure(text):
    counts = Counter()
    for line in prose_lines(text):
        h = re.match(r"^(#{1,6})\s", line)
        if h:
            counts[f"h{len(h.group(1))}"] += 1
        elif re.match(r"^\s*[-*+] \[[ xX]\]", line):
            counts["checklist items"] += 1
        elif line.lstrip().startswith("|"):
            counts["table rows"] += 1
    return counts


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
    for rel in COMMON + [STYLE[base]]:
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
            if got != SECTIONS[base]:
                out.append(f"{path}: type sections {got} do not match the required order "
                           f"{SECTIONS[base]}")
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
            if re.search(r"[\"“”«»]|\buse when\b|\btrigger", desc, re.I) or (
                    base == EN and re.search(r"[а-яё]", desc, re.I)):
                out.append(f"{path}: description holds triggers (quoted phrases, 'Use when', "
                           "'Trigger', or Cyrillic in EN); move them to when_to_use")
            total = len(fm.get("description", "")) + len(fm.get("when_to_use", ""))
            if total > FRONTMATTER_MAX_CHARS:
                out.append(f"{path}: description + when_to_use is {total} characters; "
                           f"limit is {FRONTMATTER_MAX_CHARS}")
            when = fm.get("when_to_use", "")
            if when and not (re.search(r"[а-яё]", when, re.I) and re.search(r"[a-z]", when, re.I)):
                out.append(f"{path}: when_to_use needs triggers in both Cyrillic and Latin script")


def check_pair(root, out):
    en, ru = root / EN, root / RU
    # Style files are language-specific: each version's own is required (check_skill),
    # but they are not a pair and their structure is not compared.
    en_files = set(skill_files(en)) - {STYLE[EN]}
    ru_files = set(skill_files(ru)) - {STYLE[RU]}
    for rel in sorted(en_files - ru_files):
        out.append(f"{RU}/{rel}: missing (counterpart of {EN}/{rel})")
    for rel in sorted(ru_files - en_files):
        out.append(f"{EN}/{rel}: missing (counterpart of {RU}/{rel})")
    for rel in sorted(en_files):
        other = ru / rel
        if not other.is_file():
            continue
        if rel.endswith(".py"):
            if (en / rel).read_bytes() != other.read_bytes():
                out.append(f"{RU}/{rel}: differs from {EN}/{rel}; copies must be identical")
            continue
        if not rel.endswith(".md"):
            continue
        a = structure((en / rel).read_text(encoding="utf-8", errors="replace"))
        b = structure(other.read_text(encoding="utf-8", errors="replace"))
        for key in sorted(set(a) | set(b)):
            if a[key] != b[key]:
                out.append(f"{RU}/{rel}: {key} {b[key]}, {EN}/{rel} has {a[key]}")


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
    """Return "path: message" strings for every structure or parity problem under root."""
    root = Path(root)
    out = []
    present = [b for b in (EN, RU) if (root / b).is_dir()]
    for base in (EN, RU):
        if base not in present:
            out.append(f"{base}: skill directory not found")
    for base in present:
        check_skill(root, base, out)
    if len(present) == 2:
        check_pair(root, out)
    check_private_paths(root, out)
    missing = {m.split(": ", 1)[0] for m in out if m.endswith("(required by the skill layout)")}
    out = [m for m in out if not (" (counterpart of " in m and m.split(": ", 1)[0] in missing)]
    return list(dict.fromkeys(out))


def main():
    problems = check_repo(Path(__file__).resolve().parent.parent)
    for p in problems:
        print(p)
    print(f"parity: {len(problems)} problem(s)" if problems else "parity: ok")
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
