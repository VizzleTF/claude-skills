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

    def copy_script(self, d, rules=None):
        (Path(d) / "hooks").mkdir()
        script = Path(d) / "hooks/subagent-context.sh"
        script.write_text(SCRIPT.read_text())
        if rules is not None:
            (Path(d) / "rules.md").write_bytes(rules.encode())
        return script

    def test_escapes_json_specials(self):
        text = 'quote " backslash \\ tab \t `code`\nsecond line\n'
        with tempfile.TemporaryDirectory() as d:
            self.assertEqual(run_hook(self.copy_script(d, text))["additionalContext"], text)

    def test_crlf_and_control_chars_stay_valid_json(self):
        with tempfile.TemporaryDirectory() as d:
            script = self.copy_script(d, "one\r\ntwo\x01three\r\n")
            self.assertEqual(run_hook(script)["additionalContext"], "one\ntwothree\n")

    def test_missing_rules_prints_nothing(self):
        with tempfile.TemporaryDirectory() as d:
            out = subprocess.run(["sh", str(self.copy_script(d))], capture_output=True, text=True)
            self.assertEqual((out.returncode, out.stdout), (0, ""))


if __name__ == "__main__":
    unittest.main()
