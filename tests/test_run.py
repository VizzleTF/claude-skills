"""Offline tests for evals/run.py. call_claude is always stubbed."""
import hashlib
import importlib.util
import io
import json
import os
import re
import stat
import sys
import tempfile
import threading
import unittest
from contextlib import redirect_stderr, redirect_stdout
from pathlib import Path
from unittest import mock

ROOT = Path(__file__).resolve().parent.parent
_spec = importlib.util.spec_from_file_location("evals_run", ROOT / "evals" / "run.py")
run = importlib.util.module_from_spec(_spec)
sys.modules["evals_run"] = run
_spec.loader.exec_module(run)

SCENARIO_EN = """id: runbook-disk-full
lang: en
kind: create
expect: runbook
core: true
fixtures: runbook-disk-full/
facts:
- The alert is NodeDiskUsageHigh, fires at 85%
- Logs live in /var/log/app
expect_notes:
- A runbook, not a how-to

Write a runbook for the disk-full alert.
Keep it short.
"""

SCENARIO_RU = """id: ambiguous-deploy
lang: ru
kind: ambiguous
expect: how-to, runbook
core: false
facts:
- Деплой идёт через Argo CD

нужна инструкция по деплою
"""


def write_scenarios(evals_dir, extra=()):
    sc = Path(evals_dir) / "scenarios"
    sc.mkdir(parents=True, exist_ok=True)
    (sc / "runbook-disk-full.md").write_text(SCENARIO_EN, encoding="utf-8")
    (sc / "ambiguous-deploy.md").write_text(SCENARIO_RU, encoding="utf-8")
    fx = Path(evals_dir) / "fixtures" / "runbook-disk-full"
    fx.mkdir(parents=True, exist_ok=True)
    (fx / "notes.txt").write_text("FIXTURE-CONTENT-42", encoding="utf-8")
    for name, text in extra:
        (sc / name).write_text(text, encoding="utf-8")
    return sc


class LoadScenariosTest(unittest.TestCase):
    def test_parses_header_facts_and_prompt(self):
        with tempfile.TemporaryDirectory() as d:
            sc = write_scenarios(d)
            items = {s.id: s for s in run.load_scenarios(sc)}
        en = items["runbook-disk-full"]
        self.assertEqual(en.lang, "en")
        self.assertEqual(en.kind, "create")
        self.assertEqual(en.expect, ["runbook"])
        self.assertTrue(en.core)
        self.assertEqual(en.fixtures, "runbook-disk-full/")
        self.assertEqual(en.facts, ["The alert is NodeDiskUsageHigh, fires at 85%",
                                    "Logs live in /var/log/app"])
        self.assertEqual(en.expect_notes, ["A runbook, not a how-to"])
        self.assertEqual(en.prompt, "Write a runbook for the disk-full alert.\nKeep it short.")
        ru = items["ambiguous-deploy"]
        self.assertEqual(ru.expect, ["how-to", "runbook"])
        self.assertFalse(ru.core)
        self.assertIsNone(ru.fixtures)
        self.assertEqual(ru.expect_notes, [])
        self.assertEqual(ru.prompt, "нужна инструкция по деплою")

    def test_glob_filter_and_id_mismatch(self):
        with tempfile.TemporaryDirectory() as d:
            sc = write_scenarios(d)
            self.assertEqual([s.id for s in run.load_scenarios(sc, "runbook-*")],
                             ["runbook-disk-full"])
            (sc / "wrong.md").write_text(SCENARIO_EN, encoding="utf-8")
            with self.assertRaises(ValueError):
                run.load_scenarios(sc)


QUALITY = {"writing-docs": 3, "technical-writing": 5, "technical-writing-ru": 4, "none": 1}


def participant_of(argv, env):
    if "--plugin-dir" in argv:
        return Path(argv[argv.index("--plugin-dir") + 1]).name
    cfg = Path(env["CLAUDE_CONFIG_DIR"])
    return "writing-docs" if (cfg / "skills" / "writing-docs").is_symlink() else "none"


LEGIT = "Soft skills and good technical writing matter; writing docs is a habit."


def gen_stdout(p, prompt, extra="", reads=()):
    ref = hashlib.md5(prompt.encode()).hexdigest()[:8]
    text = (f"Using the {p} skill.\nDocumentation progress:\n- [x] Reader\n- [ ] Draft\n\n"
            f"# Doc REF={ref}\nQUALITY={QUALITY[p]}\n{LEGIT}\n{extra}\n{'word ' * (10 * QUALITY[p])}\n"
            "Run python3 scripts/check.py doc.md\nCompare with writing-docs here.\n")
    events = [{"type": "system", "subtype": "init"}]
    if p != "none":
        name = p if p == "writing-docs" else f"{p}:write"
        events.append({"type": "assistant", "message": {"content": [
            {"type": "tool_use", "name": "Skill", "input": {"skill": name}}]}})
    for i, (path, denied) in enumerate(reads):
        events.append({"type": "assistant", "message": {"content": [
            {"type": "tool_use", "id": f"r{i}", "name": "Read", "input": {"file_path": path}}]}})
        events.append({"type": "user", "message": {"content": [
            {"type": "tool_result", "tool_use_id": f"r{i}", "is_error": denied,
             "content": f"Claude requested permissions to read from {path}, but you haven't granted it yet."
             if denied else "text"}]}})
    events.append({"type": "result", "subtype": "success", "is_error": False,
                   "result": text, "total_cost_usd": 0.01, "duration_ms": 1000})
    return "\n".join(json.dumps(e) for e in events) + "\n"


def judge_stdout(labels, qualities, second_pass):
    """Label i scores the i-th QUALITY marker; the second pass scores 2 lower."""
    scores = {}
    for label, q in zip(labels, qualities):
        v = max(q - 2, 1) if second_pass else q
        scores[label] = {k: v for k in run.CRIT_KEYS}
    return json.dumps({"type": "result", "is_error": False, "structured_output": {"scores": scores}})


class FakeClaude:
    def __init__(self, fail=(), rate_limit=False, bad_judge=False, bad_second=False,
                 auth=False, extra="", too_long=False, session_limit=False):
        self.calls, self.judge_prompts, self.configs, self.who = [], [], [], []
        self.fail, self.rate_limit, self.bad_judge = set(fail), rate_limit, bad_judge
        self._judged = {}
        self.lock = threading.Lock()
        self.bad_second, self.auth, self.extra = bad_second, auth, extra
        self.inputs, self.too_long, self.session_limit = [], too_long, session_limit

    def _record(self, argv, cwd, env):
        cfg = Path(env["CLAUDE_CONFIG_DIR"])
        self.configs.append({
            "dir": cfg,
            "entries": sorted(str(p.relative_to(cfg)) for p in cfg.rglob("*")),
            "links": {str(p.relative_to(cfg)): os.readlink(p) for p in cfg.rglob("*") if p.is_symlink()},
            "cwd_files": sorted(os.listdir(cwd)),
        })
        self.calls.append(argv)
        self.who.append(None if "--json-schema" in argv else participant_of(argv, env))

    def __call__(self, argv, cwd, env, input=None):
        with self.lock:  # keep calls/configs/who aligned across worker threads
            self._record(argv, cwd, env)
            self.inputs.append(input)
        if max(map(len, argv)) > 131072:
            raise OSError(7, "Argument list too long")
        if self.too_long and "--json-schema" in argv:
            raise OSError(7, "Argument list too long")
        if self.rate_limit:
            return run.CallResult(1, json.dumps({"type": "result", "is_error": True,
                                                 "result": "API Error: 429 rate limit exceeded"}))
        if self.session_limit:
            return run.CallResult(1, json.dumps({"type": "result", "is_error": True,
                                                 "result": "You've hit your session limit · resets 10:10pm (Europe/Nicosia)"}))
        if self.auth:
            return run.CallResult(1, json.dumps({"type": "result", "is_error": True,
                                                 "result": "Not logged in · Please run /login"}))
        if "--json-schema" in argv:
            prompt = input
            self.judge_prompts.append(prompt)
            labels = json.loads(argv[argv.index("--json-schema") + 1])["properties"]["scores"]["required"]
            ref = re.search(r"REF=(\w+)", prompt).group(1)
            n = self._judged.get(ref, 0)
            if self.bad_judge or (self.bad_second and n == 1):
                return run.CallResult(0, json.dumps({"type": "result", "result": "not json"}))
            self._judged[ref] = n + 1
            qualities = [int(q) for q in re.findall(r"QUALITY=(\d)", prompt)]
            return run.CallResult(0, judge_stdout(labels, qualities, second_pass=n % 2 == 1))
        p = participant_of(argv, env)
        if p in self.fail:
            return run.CallResult(1, "", "boom")
        model = argv[argv.index("--model") + 1]  # one REF per model x scenario
        reads = []
        if p == "writing-docs":  # read through the symlink in the temp config
            reads = [(f"{env['CLAUDE_CONFIG_DIR']}/skills/writing-docs/SKILL.md", False)]
        elif p != "none":
            reads = [(str(ROOT / "plugins" / p / "skills" / "write" / "types" / "runbook.md"), False),
                     ("/elsewhere/outside.md", True)]
        return run.CallResult(0, gen_stdout(p, model + input, self.extra, reads))


class RunnerCase(unittest.TestCase):
    def setUp(self):
        self._tmp = tempfile.TemporaryDirectory()
        self.tmp = Path(self._tmp.name)
        self.evals = self.tmp / "evals"
        write_scenarios(self.evals)
        self.creds = self.tmp / "home" / ".credentials.json"
        self.creds.parent.mkdir()
        self.creds.write_text("{}")
        self.creds.chmod(0)  # the runner must never read it
        self.baseline_real = self.tmp / "real-writing-docs"
        self.baseline_real.mkdir()
        (self.baseline_real / "SKILL.md").write_text("baseline")
        self.baseline = self.tmp / "home" / "skills" / "writing-docs"
        self.baseline.parent.mkdir(parents=True)
        self.baseline.symlink_to(self.baseline_real)
        self.sleeps = []

    def tearDown(self):
        if self.creds.exists():
            self.creds.chmod(stat.S_IRUSR | stat.S_IWUSR)
        self._tmp.cleanup()

    def main(self, *args, fake=None, which="/usr/bin/claude", env_extra=None):
        fake = fake or FakeClaude()
        argv = ["--date", "2026-01-02", "--baseline-path", str(self.baseline), *args]
        out, err = io.StringIO(), io.StringIO()
        env = {k: v for k, v in os.environ.items() if k != "ANTHROPIC_API_KEY"}
        env.update(env_extra or {})
        with mock.patch.object(run, "call_claude", fake), \
             mock.patch.object(run, "EVALS_DIR", self.evals), \
             mock.patch.object(run, "CREDENTIALS", self.creds), \
             mock.patch.object(run, "sleep", self.sleeps.append), \
             mock.patch.object(run.shutil, "which", lambda name: which), \
             mock.patch.dict(os.environ, env, clear=True), \
             redirect_stdout(out), redirect_stderr(err):
            code = run.main(argv)
        self.out, self.err, self.fake = out.getvalue(), err.getvalue(), fake
        return code

    @property
    def results(self):
        return self.evals / "results" / "2026-01-02"


class GenerationTest(RunnerCase):
    def test_isolated_config_per_call(self):
        code = self.main("--participants", "writing-docs,technical-writing,none",
                         "--core-models", "", "--skip-judge")
        self.assertEqual(code, 0, self.err)
        by_p = {}
        for argv, cfg, who in zip(self.fake.calls, self.fake.configs, self.fake.who):
            by_p.setdefault(who, []).append((argv, cfg))
        self.assertEqual(sorted(by_p), ["none", "technical-writing", "writing-docs"])
        argv, cfg = by_p["writing-docs"][0]
        self.assertEqual(cfg["entries"], [".credentials.json", "skills", "skills/writing-docs"])
        self.assertEqual(cfg["links"], {".credentials.json": str(self.creds),
                                        "skills/writing-docs": str(self.baseline)})
        self.assertNotIn("--plugin-dir", argv)
        argv, cfg = by_p["technical-writing"][0]
        self.assertEqual(cfg["entries"], [".credentials.json"])
        self.assertEqual(argv[argv.index("--plugin-dir") + 1],
                         str(ROOT / "plugins" / "technical-writing"))
        for flag in ("-p", "--no-session-persistence", "--verbose"):
            self.assertIn(flag, argv)
        self.assertEqual(argv[argv.index("--output-format") + 1], "stream-json")
        self.assertEqual(argv[argv.index("--model") + 1], "sonnet")
        self.assertEqual(argv[argv.index("--permission-mode") + 1], "acceptEdits")
        self.assertEqual(by_p["none"][0][1]["entries"], [".credentials.json"])
        dirs = {c["dir"] for c in self.fake.configs}
        self.assertEqual(len(dirs), len(self.fake.calls))
        self.assertFalse(any(d.exists() for d in dirs))
        self.assertIn("notes.txt", [c for c in self.fake.configs if "notes.txt" in c["cwd_files"]][0]["cwd_files"])

    def test_output_files_and_metadata(self):
        self.main("--participants", "technical-writing", "--core-models", "", "--skip-judge")
        out = self.results / "outputs" / "sonnet" / "technical-writing"
        self.assertIn("QUALITY=5", (out / "runbook-disk-full.md").read_text())
        meta = json.loads((out / "runbook-disk-full.json").read_text())
        self.assertEqual(meta["status"], "ok")
        self.assertEqual(meta["skills"], ["technical-writing:write"])
        self.assertTrue(meta["skill_fired"])
        self.assertEqual(meta["cost_usd"], 0.01)
        self.assertEqual(meta["duration_ms"], 1000)

    def test_add_dir_and_files_read(self):
        self.main("--core-models", "", "--skip-judge")
        for argv, who in zip(self.fake.calls, self.fake.who):
            dirs = [argv[i + 1] for i, a in enumerate(argv) if a == "--add-dir"]
            expect = {"writing-docs": [str(self.baseline_real)], "none": [],
                      "technical-writing": [str(ROOT / "plugins" / "technical-writing")],
                      "technical-writing-ru": [str(ROOT / "plugins" / "technical-writing-ru")]}[who]
            self.assertEqual(dirs, expect, who)
        out = self.results / "outputs" / "sonnet"
        tw = json.loads((out / "technical-writing" / "runbook-disk-full.json").read_text())
        self.assertEqual(tw["files_read"], ["skills/write/types/runbook.md"])
        self.assertEqual(tw["read_denied"], 1)
        wd = json.loads((out / "writing-docs" / "runbook-disk-full.json").read_text())
        self.assertEqual(wd["files_read"], ["SKILL.md"])
        self.assertEqual(wd["read_denied"], 0)
        report = (self.results / "report.md").read_text()
        self.assertIn("Файлы скилла прочитаны", report)
        self.assertRegex(report, r"\| runbook-disk-full \| technical-writing \| — \| \d+ \| да \| 1 \|")
        denied = report.split("## Отказы в чтении")[1].split("\n## ")[0]
        self.assertIn("sonnet / technical-writing / runbook-disk-full", denied)
        self.assertNotIn("writing-docs / runbook", denied)

    def test_dry_run_counts_and_calls_nothing(self):
        code = self.main("--dry-run", which=None)
        self.assertEqual(code, 0)
        self.assertEqual(self.fake.calls, [])
        # 2 scenarios (1 core) x 4 participants; judge = 2 passes per model x scenario
        self.assertRegex(self.out, r"sonnet: 8 generations, 4 judgments")
        self.assertRegex(self.out, r"haiku: 4 generations, 2 judgments")
        self.assertRegex(self.out, r"opus: 4 generations, 2 judgments")
        self.assertFalse(self.results.exists())

    def test_resume_skips_finished_work(self):
        self.main()
        first = len(self.fake.calls)
        self.assertEqual(first, 8 + 4 + 4 + 4 + 2 + 2)
        self.main()
        self.assertEqual(self.fake.calls, [])

    def test_failed_call_retried_twice_then_reported(self):
        code = self.main("--participants", "writing-docs,technical-writing",
                         "--core-models", "", "--skip-judge", fake=FakeClaude(fail={"writing-docs"}))
        self.assertEqual(code, 0)
        wd = [a for a in self.fake.calls if "--plugin-dir" not in a]
        self.assertEqual(len(wd), 2 * 3)
        report = (self.results / "report.md").read_text()
        self.assertIn("sonnet / writing-docs / runbook-disk-full", report)

    def test_rate_limit_pauses_then_stops_with_resume_command(self):
        code = self.main("--participants", "technical-writing", "--core-models", "",
                         "--jobs", "1", fake=FakeClaude(rate_limit=True))
        self.assertEqual(code, 3)
        self.assertEqual(self.sleeps, run.RATE_PAUSES)
        self.assertIn("python3 evals/run.py", self.err)
        self.assertIn("--date 2026-01-02", self.err)

    def test_session_limit_stops_at_once_with_resume_command(self):
        code = self.main("--core-models", "", "--jobs", "1", fake=FakeClaude(session_limit=True))
        self.assertEqual(code, 3)
        self.assertEqual(len(self.fake.calls), 1)
        self.assertEqual(self.sleeps, [])
        self.assertIn("--date 2026-01-02", self.err)
        self.assertFalse(list((self.results / "outputs").rglob("*.json")))

    def test_failed_items_retried_on_rerun(self):
        self.main("--core-models", "", fake=FakeClaude(fail={"writing-docs"}, bad_judge=True))
        self.main("--core-models", "")
        gen = [w for w in self.fake.who if w is not None]
        self.assertEqual(sorted(gen), ["writing-docs", "writing-docs"])
        self.assertEqual(len(self.fake.judge_prompts), 4)
        for f in self.results.rglob("*.json"):
            if f.parent.name != "pairs":
                self.assertEqual(json.loads(f.read_text()).get("status"), "ok", f)

    def test_first_run_errors(self):
        self.assertEqual(self.main(which=None), 2)
        self.assertIn("claude", self.err)
        self.assertEqual(self.main("--scenarios", "nothing-*"), 2)
        self.assertIn("nothing-*", self.err)
        self.creds.chmod(0o600)
        self.creds.unlink()
        self.assertEqual(self.main("--skip-judge"), 2)
        self.assertIn("ANTHROPIC_API_KEY", self.err)
        self.assertEqual(self.main("--skip-judge", "--core-models", "",
                                   env_extra={"ANTHROPIC_API_KEY": "x"}), 0)
        self.assertFalse(any(".credentials.json" in c["entries"] for c in self.fake.configs))
        self.creds.write_text("{}")

    def test_missing_baseline_warns_and_drops_participant(self):
        code = self.main("--baseline-path", str(self.tmp / "nope"), "--core-models", "", "--skip-judge")
        self.assertEqual(code, 0)
        self.assertIn("writing-docs", self.err)
        self.assertNotIn("writing-docs", self.fake.who)
        self.assertEqual(len(self.fake.calls), 6)


NAMES = re.compile(r"(?i)writing-docs|technical-writing|Documentation progress|check\.py|\[\.\.\.\]")


class ScrubTest(unittest.TestCase):
    def test_new_and_old_skill_ids(self):
        text = ("Keep me.\nSkill technical-writing:write ran.\nSkill technical-writing-ru:write ran.\n"
                "Old technical-writing:technical-writing id.\nRead skills/write/types/adr.md\n"
                "Ran /technical-writing:runbook.\nKeep me too.")
        self.assertEqual(run.scrub(text), "Keep me.\nKeep me too.")


class JudgeReportPairsTest(RunnerCase):
    def run_main_model(self, fake=None):
        return self.main("--core-models", "", fake=fake)

    def test_judge_is_isolated_blind_and_permuted(self):
        self.assertEqual(self.run_main_model(), 0, self.err)
        judge_calls = [(a, c) for a, c in zip(self.fake.calls, self.fake.configs) if "--json-schema" in a]
        self.assertEqual(len(judge_calls), 4)
        for argv, cfg in judge_calls:
            self.assertEqual(argv[argv.index("--model") + 1], "opus")
            self.assertNotIn("--plugin-dir", argv)
            self.assertEqual(cfg["entries"], [".credentials.json"])
            json.loads(argv[argv.index("--json-schema") + 1])
        for prompt in self.fake.judge_prompts:
            self.assertIsNone(NAMES.search(prompt), prompt)
            self.assertIn(LEGIT, prompt)
        orders = {}
        for prompt in self.fake.judge_prompts:
            ref = re.search(r"REF=(\w+)", prompt).group(1)
            orders.setdefault(ref, []).append(re.findall(r"QUALITY=(\d)", prompt))
        for pair in orders.values():
            self.assertEqual(len(pair), 2)
            self.assertEqual(sorted(pair[0]), sorted(pair[1]))
            self.assertNotEqual(pair[0], pair[1])

    def test_scores_are_averaged_and_position_gaps_flagged(self):
        self.run_main_model()
        j = json.loads((self.results / "judgments" / "sonnet" / "runbook-disk-full.json").read_text())
        # pass 1 gives QUALITY, pass 2 gives QUALITY-2 (min 1): 5/3 -> 4.0, 3/1 -> 2.0, 1/1 -> 1.0
        self.assertEqual(j["scores"]["technical-writing"]["accuracy"], 4.0)
        self.assertEqual(j["scores"]["writing-docs"]["voice"], 2.0)
        self.assertEqual(j["scores"]["none"]["type"], 1.0)
        flagged = {f["participant"] for f in j["position_flags"]}
        self.assertEqual(flagged, {"technical-writing", "technical-writing-ru", "writing-docs"})
        report = (self.results / "report.md").read_text()
        self.assertRegex(report, r"\| technical-writing \|( 4\.0 \|){9}")
        self.assertRegex(report, r"\| none \|( 1\.0 \|){9}")
        self.assertIn("verdict.md", report)

    def test_invalid_judge_answer_retried_then_failed(self):
        self.run_main_model(fake=FakeClaude(bad_judge=True))
        self.assertEqual(len(self.fake.judge_prompts), 2 * 2)  # 2 scenarios x 2 attempts, stop at first failed pass
        j = json.loads((self.results / "judgments" / "sonnet" / "runbook-disk-full.json").read_text())
        self.assertEqual(j["status"], "failed")
        self.assertIn("judge sonnet / runbook-disk-full", (self.results / "report.md").read_text())

    def test_blind_pairs_key_and_verdict(self):
        self.run_main_model()
        pairs = self.results / "pairs"
        key = json.loads((pairs / "key.json").read_text())
        self.assertEqual(key["model"], "sonnet")
        key = key["pairs"]
        self.assertEqual(sorted(key["runbook-disk-full"].values()), ["technical-writing", "writing-docs"])
        self.assertEqual(sorted(key["ambiguous-deploy"].values()), ["technical-writing-ru", "writing-docs"])
        page = (pairs / "runbook-disk-full.md").read_text()
        self.assertIsNone(NAMES.search(page), page)
        for needle in ("Write a runbook for the disk-full alert.", "NodeDiskUsageHigh", "## X", "## Y",
                       LEGIT, "A runbook, not a how-to"):
            self.assertIn(needle, page)
        x_quality = re.search(r"## X.*?QUALITY=(\d)", page, re.S).group(1)
        self.assertEqual(x_quality, str(QUALITY[key["runbook-disk-full"]["X"]]))
        verdict = (self.results / "verdict.md").read_text()
        self.assertEqual(verdict.count("Лучше:"), 2)
        self.assertEqual(verdict.count("Почему:"), 2)
        # runbook gap 4.0 vs 2.0 is larger than ambiguous 3.0 vs 2.0, so it comes first
        self.assertLess(verdict.index("runbook-disk-full"), verdict.index("ambiguous-deploy"))
        report = (self.results / "report.md").read_text()
        self.assertNotIn('"X"', report)
        self.assertNotIn("Раскрытие", report)
        # owner's answers survive a re-run
        (self.results / "verdict.md").write_text(verdict.replace("Почему:", "Почему: мой текст", 1))
        self.main("--report-only")
        self.assertIn("мой текст", (self.results / "verdict.md").read_text())


    def test_judge_sees_fixtures_and_expectations_generation_does_not(self):
        self.run_main_model()
        prompt = next(p for p in self.fake.judge_prompts if "disk-full" in p)
        for needle in ("notes.txt", "FIXTURE-CONTENT-42", "A runbook, not a how-to", "NodeDiskUsageHigh"):
            self.assertIn(needle, prompt)
        gen = [i for a, i in zip(self.fake.calls, self.fake.inputs) if "--json-schema" not in a]
        self.assertTrue(gen)
        self.assertFalse(any("A runbook, not a how-to" in g for g in gen))

    def test_prompts_go_through_stdin_and_oversize_call_fails_softly(self):
        self.run_main_model()
        for argv, inp in zip(self.fake.calls, self.fake.inputs):
            self.assertTrue(inp)
            self.assertNotIn(inp, argv)
        code = self.main("--core-models", "", "--date", "2026-01-03", fake=FakeClaude(too_long=True))
        self.assertEqual(code, 0, self.err)
        j = json.loads((self.evals / "results" / "2026-01-03" / "judgments" / "sonnet" /
                        "runbook-disk-full.json").read_text())
        self.assertEqual(j["status"], "failed")
        self.assertIn("Argument list too long", j["error"])

    def test_passed_first_judge_pass_is_reused(self):
        self.run_main_model(fake=FakeClaude(bad_second=True))
        j = json.loads((self.results / "judgments" / "sonnet" / "runbook-disk-full.json").read_text())
        self.assertEqual(j["status"], "failed")
        self.assertEqual(len(j["passes"]), 1)
        self.run_main_model()
        self.assertEqual(len(self.fake.judge_prompts), 2)  # only pass 2, one per scenario
        j = json.loads((self.results / "judgments" / "sonnet" / "runbook-disk-full.json").read_text())
        self.assertEqual(j["status"], "ok")

    def test_core_model_sections_in_report(self):
        self.main()
        report = (self.results / "report.md").read_text()
        for m in ("haiku", "opus"):
            section = report.split(f"## Ключевые сценарии ({m})")[1].split("\n## ")[0]
            self.assertRegex(section, r"\| technical-writing \|( 4\.0 \|){9}")
            self.assertIn("runbook-disk-full", section)
            self.assertNotIn("ambiguous-deploy", section)

    def test_compactness_section(self):
        self.main("--core-models", "", "--skip-judge")
        out = self.results / "outputs" / "sonnet"
        words = {p: json.loads((out / p / "runbook-disk-full.json").read_text())["words"] for p in QUALITY}
        # every participant writes the same length in both scenarios, so median == mean == words
        self.assertEqual(words["technical-writing"] - words["writing-docs"], 20)
        report = (self.results / "report.md").read_text()
        section = report.split("## Компактность")[1].split("\n## ")[0]
        ratio = words["technical-writing"] / words["writing-docs"]
        self.assertIn(f"| sonnet | technical-writing | {words['technical-writing']} | "
                      f"{words['technical-writing']:.1f} | {ratio:.2f} |", section)
        self.assertIn(f"| sonnet | writing-docs | {words['writing-docs']} | {words['writing-docs']:.1f} | 1.00 |", section)

    def test_verdict_order_recomputed_answers_kept(self):
        self.main("--core-models", "", "--skip-judge")
        verdict = self.results / "verdict.md"
        text = verdict.read_text()
        self.assertLess(text.index("## ambiguous-deploy"), text.index("## runbook-disk-full"))
        head, sep, tail = text.partition("## ambiguous-deploy\n")
        verdict.write_text(head + sep + tail.replace("Лучше:\nПочему:\n", "Лучше: равно\nПочему: оба\nхороши\n", 1))
        self.main("--core-models", "")
        text = verdict.read_text()
        self.assertLess(text.index("## runbook-disk-full"), text.index("## ambiguous-deploy"))
        self.assertIn("## ambiguous-deploy\n\nПара: [pairs/ambiguous-deploy.md](pairs/ambiguous-deploy.md)"
                      "\n\nЛучше: равно\nПочему: оба\nхороши\n", text)
        self.assertEqual(text.count("Лучше:"), 2)


class AuthTest(RunnerCase):
    def test_auth_error_stops_run(self):
        self.assertEqual(self.main("--core-models", "", fake=FakeClaude(auth=True)), 2)
        self.assertIn("not authorized", self.err)

    def test_auth_words_inside_a_good_document_do_not_stop(self):
        code = self.main("--core-models", "", "--skip-judge",
                         fake=FakeClaude(extra="If you see 'Not logged in', please run /login."))
        self.assertEqual(code, 0, self.err)
        self.assertEqual(len(self.fake.calls), 8)


class RevealTest(RunnerCase):
    def setUp(self):
        super().setUp()
        self.main("--core-models", "")
        self.verdict = self.results / "verdict.md"
        self.key = json.loads((self.results / "pairs" / "key.json").read_text())["pairs"]

    def fill(self, sid, choice, why):
        text = self.verdict.read_text()
        head, sep, tail = text.partition(f"## {sid}\n")
        tail = tail.replace("Лучше:\n", f"Лучше: {choice}\n", 1).replace("Почему:\n", f"Почему: {why}\n", 1)
        self.verdict.write_text(head + sep + tail)

    def label_of(self, sid, participant):
        return next(lb for lb, p in self.key[sid].items() if p == participant)

    def test_refuses_when_nothing_filled(self):
        self.assertEqual(self.main("--reveal"), 1)
        self.assertNotIn("Раскрытие", self.verdict.read_text())

    def test_refuses_pair_with_choice_but_no_reason(self):
        self.fill("runbook-disk-full", "X", "")
        self.fill("ambiguous-deploy", "равно", "оба годятся")
        self.assertEqual(self.main("--reveal"), 1)
        self.assertIn("runbook-disk-full", self.err)
        self.assertNotIn("ambiguous-deploy", self.err)
        self.assertNotIn("Раскрытие", self.verdict.read_text())

    def test_reveal_counts_and_agreement(self):
        self.fill("runbook-disk-full", self.label_of("runbook-disk-full", "technical-writing"),
                  "короче и шаги\nпроверяемые")
        self.fill("ambiguous-deploy", "равно", "оба годятся")
        self.assertEqual(self.main("--reveal"), 0, self.err)
        self.assertEqual(self.main("--reveal"), 0, self.err)
        text = self.verdict.read_text()
        self.assertEqual(text.count("# Раскрытие"), 1)
        self.assertIn("проверяемые", text)
        self.assertIn("побед 1, поражений 0, ничьих 1", text)
        # judge model: 4.0 vs 2.0 and 3.0 vs 2.0 both favour the new skill; owner agrees once
        self.assertIn("Согласие с судьёй-моделью: 1 из 2", text)
        reveal = text.split("# Раскрытие")[1]
        self.assertIn("technical-writing-ru", reveal)
        self.assertIn("0.25", reveal)


if __name__ == "__main__":
    unittest.main()
