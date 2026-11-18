"""Tests for the SessionStart hooks of vi-voice and vi-code: print the rules file intact, stay silent without it."""

import json
import os
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PLUGINS = {"vi-voice": "style.md", "vi-code": "rules.md"}


def run_session_hook(plugin_dir):
    hooks = json.loads((plugin_dir / "hooks/hooks.json").read_text())["hooks"]["SessionStart"]
    env = {**os.environ, "CLAUDE_PLUGIN_ROOT": str(plugin_dir)}
    return subprocess.run(hooks[0]["hooks"][0]["command"], shell=True, env=env, capture_output=True, text=True)


class SessionStartHookTest(unittest.TestCase):
    def test_prints_rules_verbatim_from_a_path_with_spaces(self):
        for name, rules in PLUGINS.items():
            with self.subTest(name), tempfile.TemporaryDirectory() as d:
                copy = Path(d) / "with space" / name
                shutil.copytree(ROOT / "plugins" / name, copy)
                out = run_session_hook(copy)
                self.assertEqual((out.returncode, out.stdout), (0, (copy / rules).read_text()))

    def test_missing_rules_prints_nothing(self):
        for name, rules in PLUGINS.items():
            with self.subTest(name), tempfile.TemporaryDirectory() as d:
                copy = Path(d) / name
                shutil.copytree(ROOT / "plugins" / name, copy)
                (copy / rules).unlink()
                out = run_session_hook(copy)
                self.assertEqual((out.returncode, out.stdout, out.stderr), (0, "", ""))


if __name__ == "__main__":
    unittest.main()
