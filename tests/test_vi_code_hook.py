"""Tests for plugins/vi-code/hooks/subagent-context.sh: rules.md must reach subagents intact."""

import json
import subprocess
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SCRIPT = ROOT / "plugins/vi-code/hooks/subagent-context.sh"


def run_hook(script):
    out = subprocess.run(["sh", str(script)], capture_output=True, text=True, check=True).stdout
    return json.loads(out)["hookSpecificOutput"]


class SubagentHookTest(unittest.TestCase):
    def test_emits_rules_verbatim(self):
        ctx = run_hook(SCRIPT)
        self.assertEqual(ctx["hookEventName"], "SubagentStart")
        self.assertEqual(ctx["additionalContext"], (ROOT / "plugins/vi-code/rules.md").read_text())

    def test_escapes_json_specials(self):
        text = 'quote " backslash \\ tab \t `code`\nsecond line\n'
        with tempfile.TemporaryDirectory() as d:
            (Path(d) / "hooks").mkdir()
            script = Path(d) / "hooks/subagent-context.sh"
            script.write_text(SCRIPT.read_text())
            (Path(d) / "rules.md").write_text(text)
            self.assertEqual(run_hook(script)["additionalContext"], text)


if __name__ == "__main__":
    unittest.main()
