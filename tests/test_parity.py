"""Tests for tools/parity.py through check_repo() and the CLI, on temporary fixture trees."""

import importlib.util
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
_spec = importlib.util.spec_from_file_location("parity", ROOT / "tools/parity.py")
parity = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(parity)

EN = "plugins/technical-writing/skills/technical-writing"
RU = "plugins/technical-writing-ru/skills/technical-writing-ru"
TYPES = ["tutorial", "how-to", "runbook", "troubleshooting", "reference", "explanation",
         "readme", "conventions", "adr", "postmortem", "changelog", "docstring",
         "cli-help-errors"]
SECTIONS = {
    "en": ["When to use it and when not", "Skeleton", "Voice and verbs", "Length",
           "Differences from the core rules", "Forbidden", "Type checklist"],
    "ru": ["Когда это он и когда нет", "Каркас", "Голос и глаголы", "Объём",
           "Отличия от общих правил", "Запрещено", "Чек-лист типа"],
}
CHECK_PY = (ROOT / EN / "scripts/check.py").read_text(encoding="utf-8")
PRIVATE = "/ho" + "me/someone/notes"  # split so this file does not trip the check itself


def type_file(lang):
    body = "".join(f"## {s}\n\nText.\n\n" for s in SECTIONS[lang])
    return f"# Type\n\n{body}- [ ] One check.\n"


def skill_md(lang, when="Use when writing docs. Triggers: «документация», \"write docs\"."):
    return (f"---\nname: technical-writing\ndescription: Writes docs.\nwhen_to_use: {when}\n---\n\n"
            "# Technical writing\n\n## Workflow\n\n- [ ] Reader.\n- [ ] Type.\n\n"
            "| a | b |\n|---|---|\n| 1 | 2 |\n\nSee [types/adr.md](types/adr.md).\n")


def build(root):
    for lang, base in (("en", EN), ("ru", RU)):
        d = root / base
        files = {"SKILL.md": skill_md(lang), "sources.md": "# Sources\n\nText.\n",
                 "style/llm-patterns.md": "# Patterns\n\nText.\n",
                 "process/doc-set.md": "# Doc set\n\nText.\n",
                 "process/review.md": "# Review\n\nText.\n",
                 "style/english.md" if lang == "en" else "style/russian.md": "# Style\n\nText.\n",
                 "scripts/check.py": CHECK_PY}
        files.update({f"types/{t}.md": type_file(lang) for t in TYPES})
        for name, text in files.items():
            (d / name).parent.mkdir(parents=True, exist_ok=True)
            (d / name).write_text(text, encoding="utf-8")


class Parity(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        build(self.root)

    def tearDown(self):
        self.tmp.cleanup()

    def write(self, rel, text):
        (self.root / rel).parent.mkdir(parents=True, exist_ok=True)
        (self.root / rel).write_text(text, encoding="utf-8")

    def assertReports(self, path, fragment):
        msgs = parity.check_repo(self.root)
        hits = [m for m in msgs if m.startswith(f"{path}: ") and fragment in m]
        self.assertTrue(hits, f"no '{path}: ...{fragment}...' in {msgs}")
        return msgs

    def test_good_tree_is_clean(self):
        self.assertEqual(parity.check_repo(self.root), [])

    def test_missing_skill_dirs(self):
        shutil.rmtree(self.root / "plugins")
        msgs = parity.check_repo(self.root)
        self.assertTrue(any(m.startswith(f"{RU}: ") for m in msgs), msgs)
        self.assertTrue(any(m.startswith(f"{EN}: ") for m in msgs), msgs)

    def test_missing_counterpart_and_expected_file(self):
        (self.root / RU / "types/adr.md").unlink()
        self.assertReports(f"{RU}/types/adr.md", "missing")

    def test_extra_file_without_counterpart(self):
        self.write(f"{EN}/types/extra.md", "# Extra\n")
        self.assertReports(f"{RU}/types/extra.md", "missing")

    def test_heading_checkbox_and_table_counts(self):
        self.write(f"{RU}/sources.md", "# Sources\n\n## More\n\n- [ ] x\n\n| a |\n|---|\n\n"
                   "```\n# not a heading\n```\n")
        msgs = parity.check_repo(self.root)
        for fragment in ("h2", "checklist", "table rows"):
            self.assertTrue(any(m.startswith(f"{RU}/sources.md: ") and fragment in m
                                for m in msgs), (fragment, msgs))
        self.assertFalse(any("h1" in m for m in msgs), msgs)

    def test_style_files_are_not_structure_compared(self):
        self.write(f"{RU}/style/russian.md", "# Style\n\n## A\n\n## B\n\n| a |\n|---|\n\n- [ ] x\n")
        self.assertEqual(parity.check_repo(self.root), [])

    def test_check_py_copies_differ(self):
        self.write(f"{RU}/scripts/check.py", "print('other')\n")
        self.assertReports(f"{RU}/scripts/check.py", "differs")

    def test_type_sections_order(self):
        order = SECTIONS["en"][:]
        order[0], order[1] = order[1], order[0]
        text = "# Type\n\n" + "".join(f"## {s}\n\n" for s in order) + "- [ ] One check.\n"
        self.write(f"{EN}/types/adr.md", text)
        self.assertReports(f"{EN}/types/adr.md", "sections")

    def test_russian_type_sections(self):
        self.write(f"{RU}/types/adr.md", type_file("en"))
        self.assertReports(f"{RU}/types/adr.md", "sections")

    def test_long_file_needs_contents(self):
        long_body = "Text.\n" * 101
        self.write(f"{EN}/sources.md", f"# Sources\n\n{long_body}")
        self.write(f"{RU}/sources.md", f"# Sources\n\n## Содержание\n\n{long_body}")
        msgs = self.assertReports(f"{EN}/sources.md", "contents")
        self.assertFalse(any(m.startswith(f"{RU}/sources.md: ") and "contents" in m
                             for m in msgs), msgs)

    def test_skill_md_line_limit(self):
        self.write(f"{EN}/SKILL.md", skill_md("en") + "\n" * 160)
        self.assertReports(f"{EN}/SKILL.md", "170")

    def test_frontmatter_length_and_languages(self):
        self.write(f"{EN}/SKILL.md", skill_md("en", when="Use when writing docs. " * 80 + "«доки»"))
        self.assertReports(f"{EN}/SKILL.md", "1536")
        self.write(f"{RU}/SKILL.md", skill_md("ru", when="Use when writing docs."))
        self.assertReports(f"{RU}/SKILL.md", "Cyrillic")

    def test_no_links_from_rule_files(self):
        self.write(f"{EN}/style/llm-patterns.md", "# Patterns\n\nSee [review](../process/review.md).\n")
        self.write(f"{EN}/process/review.md", "# Review\n\nLoad types/adr.md first.\n")
        self.assertReports(f"{EN}/style/llm-patterns.md", "links to")
        self.assertReports(f"{EN}/process/review.md", "links to")

    def test_bare_mentions_and_code(self):
        self.write(f"{EN}/style/english.md", "# Style\n\nThen follow review.md closely.\n")
        self.write(f"{EN}/process/review.md",
                   "# Review\n\n```\ncat types/adr.md SKILL.md\n[x](doc-set.md)\n```\n\n"
                   "See [the root readme](../../README.md).\n")
        msgs = self.assertReports(f"{EN}/style/english.md", "links to review.md")
        self.assertFalse(any(m.startswith(f"{EN}/process/review.md: ") for m in msgs), msgs)

    def test_fence_closes_only_with_long_enough_marker(self):
        self.write(f"{RU}/sources.md", "# Sources\n\nText.\n\n````\n```\n# not a heading\n```\n````\n")
        self.assertEqual(parity.check_repo(self.root), [])

    def test_description_without_triggers(self):
        for desc in ('Writes docs. Use when asked to write docs.', 'Writes docs, "write a README".',
                     "Writes docs. Triggers: docs.", "Writes docs и доки."):
            self.write(f"{EN}/SKILL.md", skill_md("en").replace("description: Writes docs.",
                                                                f"description: {desc}"))
            self.assertReports(f"{EN}/SKILL.md", "description")
        self.write(f"{EN}/SKILL.md", skill_md("en"))
        self.write(f"{RU}/SKILL.md", skill_md("ru").replace("description: Writes docs.",
                                                            "description: Пишет «доки»."))
        self.assertReports(f"{RU}/SKILL.md", "description")

    def test_secrets(self):
        tokens = ["AKIA" + "ABCDEFGHIJKLMNOP", "ghp_" + "a" * 36, "sk-" + "a1B2" * 8,
                  "github_pat_" + "A" * 30, "AIza" + "b" * 35, "xoxb-" + "1234567890-abc",
                  "-----BEGIN " + "RSA PRIVATE KEY-----"]
        for i, token in enumerate(tokens):
            self.write(f"notes{i}.md", f"key = {token}\n")
        self.write(".autopilot/log.md", f"key = {tokens[0]}\n")
        msgs = parity.check_repo(self.root)
        for i, token in enumerate(tokens):
            self.assertTrue(any(m.startswith(f"notes{i}.md: ") and "secret" in m for m in msgs),
                            (token, msgs))
        self.assertFalse(any(token in m for m in msgs for token in tokens), msgs)
        self.assertFalse(any(m.startswith(".autopilot") for m in msgs), msgs)

    def test_private_paths(self):
        self.write("README.md", f"Stored in {PRIVATE}.\n")
        self.write(".autopilot/log.md", f"Stored in {PRIVATE}.\n")
        msgs = self.assertReports("README.md", "private path")
        self.assertFalse(any(m.startswith(".autopilot") for m in msgs), msgs)

    def test_cli(self):
        script = self.root / "tools/parity.py"
        script.parent.mkdir()
        shutil.copy(ROOT / "tools/parity.py", script)
        ok = subprocess.run([sys.executable, str(script)], capture_output=True, text=True)
        self.assertEqual(ok.returncode, 0, ok.stdout + ok.stderr)
        (self.root / RU / "types/adr.md").unlink()
        bad = subprocess.run([sys.executable, str(script)], capture_output=True, text=True)
        self.assertEqual(bad.returncode, 1)
        self.assertIn(f"{RU}/types/adr.md: ", bad.stdout)


if __name__ == "__main__":
    unittest.main()
