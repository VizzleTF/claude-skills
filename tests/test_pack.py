"""Tests for tools/pack.py on a temporary git repository."""

import contextlib
import importlib.util
import io
import json
import os
import subprocess
import tempfile
import unittest
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
_spec = importlib.util.spec_from_file_location("pack", ROOT / "tools/pack.py")
pack = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(pack)

CHANGELOG = """# Changelog

## [1.1.0] - 2026-01-02

### Added

- New rule.

## [1.0.0] - 2026-01-01

- First.
"""


class PackTest(unittest.TestCase):
    def setUp(self):
        self._tmp = tempfile.TemporaryDirectory()
        self.root = Path(self._tmp.name)
        self.write("plugins/p/.claude-plugin/plugin.json", json.dumps({"name": "p", "version": "1.1.0"}))
        self.write("plugins/p/hooks/hooks.json", "{}\n")
        self.write("plugins/p/CHANGELOG.md", CHANGELOG)
        subprocess.run(["git", "init", "-q"], cwd=self.root, check=True)
        subprocess.run(["git", "add", "."], cwd=self.root, check=True)
        self.write("plugins/p/untracked.txt", "x\n")
        self._cwd = os.getcwd()
        os.chdir(self.root)

    def tearDown(self):
        os.chdir(self._cwd)
        self._tmp.cleanup()

    def write(self, rel, text):
        path = self.root / rel
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text, encoding="utf-8")

    def run_main(self, *argv):
        out, err = io.StringIO(), io.StringIO()
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
            code = pack.main(list(argv))
        return code, out.getvalue(), err.getvalue()

    def test_zip_has_tracked_files_at_plugin_root(self):
        code, out, _ = self.run_main("p")
        self.assertEqual(code, 0)
        self.assertTrue(out.strip().endswith("dist/p-1.1.0.zip"))
        with zipfile.ZipFile(self.root / "dist/p-1.1.0.zip") as zf:
            self.assertEqual(
                sorted(zf.namelist()),
                [".claude-plugin/plugin.json", "CHANGELOG.md", "hooks/hooks.json"],
            )

    def test_zip_bytes_are_reproducible(self):
        self.run_main("p")
        first = (self.root / "dist/p-1.1.0.zip").read_bytes()
        self.run_main("p")
        self.assertEqual(first, (self.root / "dist/p-1.1.0.zip").read_bytes())

    def test_no_args_packs_every_plugin(self):
        code, out, _ = self.run_main("--out", "build")
        self.assertEqual(code, 0)
        self.assertEqual(len(out.splitlines()), 1)
        self.assertTrue((self.root / "build/p-1.1.0.zip").is_file())

    def test_notes_print_current_entry_only(self):
        code, out, _ = self.run_main("--notes", "p")
        self.assertEqual(code, 0)
        self.assertIn("- New rule.", out)
        self.assertNotIn("First.", out)

    def test_notes_missing_entry_fails(self):
        self.write("plugins/p/CHANGELOG.md", "# Changelog\n")
        code, _, err = self.run_main("--notes", "p")
        self.assertEqual(code, 1)
        self.assertIn("no entry for 1.1.0", err)

    def test_unknown_plugin_fails(self):
        code, _, err = self.run_main("nope")
        self.assertEqual(code, 1)
        self.assertIn("plugins/nope", err)


if __name__ == "__main__":
    unittest.main()
