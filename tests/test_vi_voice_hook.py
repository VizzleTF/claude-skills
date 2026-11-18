"""Tests for plugins/vi-voice/hooks/hooks.json: the SessionStart command must print style.md intact."""

import json
import os
import subprocess
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PLUGIN = ROOT / "plugins/vi-voice"


class SessionStartHookTest(unittest.TestCase):
    def test_command_prints_style_verbatim(self):
        hooks = json.loads((PLUGIN / "hooks/hooks.json").read_text())["hooks"]["SessionStart"]
        command = hooks[0]["hooks"][0]["command"]
        env = {**os.environ, "CLAUDE_PLUGIN_ROOT": str(PLUGIN)}
        out = subprocess.run(command, shell=True, env=env, capture_output=True, text=True, check=True).stdout
        self.assertEqual(out, (PLUGIN / "style.md").read_text())


if __name__ == "__main__":
    unittest.main()
