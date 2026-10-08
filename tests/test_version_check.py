"""Tests for tools/version_check.py on a temporary git repository."""

import importlib.util
import json
import subprocess
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
_spec = importlib.util.spec_from_file_location("version_check", ROOT / "tools/version_check.py")
version_check = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(version_check)


class VersionCheckTest(unittest.TestCase):
    def setUp(self):
        self._tmp = tempfile.TemporaryDirectory()
        self.root = Path(self._tmp.name)
        self.write("plugins/p/hooks/a.ts", "a\n")
        self.release("1.0.0")
        self.git("init", "-q")
        self.git("add", ".")
        self.git("-c", "user.name=t", "-c", "user.email=t@t", "commit", "-qm", "init")

    def tearDown(self):
        self._tmp.cleanup()

    def git(self, *args):
        subprocess.run(["git", *args], cwd=self.root, check=True)

    def write(self, rel, text):
        path = self.root / rel
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text, encoding="utf-8")

    def release(self, version):
        self.write("plugins/p/.claude-plugin/plugin.json", json.dumps({"name": "p", "version": version}))
        self.write("plugins/p/CHANGELOG.md", f"# Changelog\n\n## [{version}] - 2026-10-08\n")

    def test_untouched_plugin_passes(self):
        self.assertEqual(version_check.check(self.root, "HEAD"), [])

    def test_change_without_bump_fails(self):
        self.write("plugins/p/hooks/a.ts", "b\n")
        problems = version_check.check(self.root, "HEAD")
        self.assertEqual(len(problems), 1)
        self.assertIn("must be above 1.0.0", problems[0])

    def test_new_file_without_bump_fails(self):
        self.write("plugins/p/hooks/b.ts", "b\n")
        self.assertEqual(len(version_check.check(self.root, "HEAD")), 1)

    def test_bump_without_changelog_entry_fails(self):
        self.write("plugins/p/.claude-plugin/plugin.json", json.dumps({"name": "p", "version": "1.0.1"}))
        problems = version_check.check(self.root, "HEAD")
        self.assertEqual(problems, ["plugins/p/CHANGELOG.md: no '## [1.0.1]' entry"])

    def test_bump_with_changelog_passes(self):
        self.write("plugins/p/hooks/a.ts", "b\n")
        self.release("1.0.10")
        self.assertEqual(version_check.check(self.root, "HEAD"), [])


if __name__ == "__main__":
    unittest.main()
