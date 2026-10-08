"""Tests for the debug-log filter of tools/live_smoke.py; the tmux run itself is checked by hand."""

import importlib.util
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
_spec = importlib.util.spec_from_file_location("live_smoke", ROOT / "tools/live_smoke.py")
live_smoke = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(live_smoke)

LOG = """\
2026-10-08T07:23:45.327Z [DEBUG] hooks module tidemark@inline loaded (worker, environment 1, tier user)
2026-10-08T07:23:46.101Z [DEBUG] $.fs.stat (tidemark): /u/dev/proj/.claude/tidemark.json failed: ENOENT
2026-10-08T07:24:06.498Z [DEBUG] [tidemark] $.ui.log (to debug): band: boom
2026-10-08T07:24:07.000Z [DEBUG] tidemark: state.set: denied: it was made while ui.render is being dispatched
2026-10-08T07:24:08.000Z [ERROR] MCP server "github" Server stderr: running on stdio
"""


class LogProblemsTest(unittest.TestCase):
    def test_reports_hook_errors_and_refused_writes_only(self):
        self.assertEqual(live_smoke.log_problems(LOG), [
            "debug log: [tidemark] $.ui.log (to debug): band: boom",
            "debug log: tidemark: state.set: denied: it was made while ui.render is being dispatched",
        ])


if __name__ == "__main__":
    unittest.main()
