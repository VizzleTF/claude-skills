#!/usr/bin/env python3
"""A/B runner for the documentation skills: generate, judge blind, report.

Usage: python3 evals/run.py [--help]. See evals/README.md.
"""
import argparse
import fnmatch
import json
import os
import random
import re
import shlex
import shutil
import subprocess
import sys
import tempfile
from statistics import median
import threading
import time
from concurrent.futures import ThreadPoolExecutor
from contextlib import contextmanager
from dataclasses import dataclass, field
from datetime import date as _date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
EVALS_DIR = ROOT / "evals"
CREDENTIALS = Path.home() / ".claude" / ".credentials.json"
DEFAULT_BASELINE = Path.home() / ".claude" / "skills" / "writing-docs"
PARTICIPANTS = ["writing-docs", "technical-writing", "technical-writing-ru", "none"]
PLUGIN_DIRS = {
    "technical-writing": ROOT / "plugins" / "technical-writing",
    "technical-writing-ru": ROOT / "plugins" / "technical-writing-ru",
}
CRITERIA = [
    ("type", "Тип"),
    ("skeleton", "Каркас"),
    ("accuracy", "Точность"),
    ("answer_first", "Ответ первым"),
    ("scannable", "Сканируемость"),
    ("voice", "Голос"),
    ("no_llm_patterns", "Без LLM-паттернов"),
    ("concise", "Без воды"),
    ("actionable", "Пригодность"),
]
CRIT_KEYS = [k for k, _ in CRITERIA]
SUFFIX = {
    "en": "Return the complete final document in your last message.",
    "ru": "Верни итоговый документ целиком в последнем сообщении.",
}
GEN_ATTEMPTS = 3      # first call + 2 retries
JUDGE_ATTEMPTS = 2    # invalid judge answer twice -> failed
RATE_PAUSES = [60, 180, 600]
sleep = time.sleep    # patched in tests
REVEAL_HEAD = "\n# Раскрытие\n"


@dataclass
class Scenario:
    id: str
    lang: str
    kind: str
    expect: list
    core: bool
    fixtures: "str | None"
    facts: list
    prompt: str
    expect_notes: list = field(default_factory=list)


@dataclass
class CallResult:
    returncode: int
    stdout: str
    stderr: str = ""


class RateLimited(Exception):
    pass


class AuthError(Exception):
    pass


def load_scenarios(directory, pattern="*"):
    """Parse evals/scenarios/*.md (format: spec §6); pattern filters by id."""
    out = []
    for path in sorted(Path(directory).glob("*.md")):
        if not fnmatch.fnmatch(path.stem, pattern):
            continue
        head, _, body = path.read_text(encoding="utf-8").partition("\n\n")
        meta, lists, key = {}, {"facts": [], "expect_notes": []}, None
        for line in head.splitlines():
            if key in lists and line.lstrip().startswith("- "):
                lists[key].append(line.lstrip()[2:].strip())
                continue
            key, _, value = line.partition(":")
            key = key.strip()
            meta[key] = value.split("#", 1)[0].strip()
        if meta.get("id") != path.stem:
            raise ValueError(f"{path}: id {meta.get('id')!r} does not match file name")
        for required in ("lang", "kind", "expect"):
            if not meta.get(required):
                raise ValueError(f"{path}: missing '{required}'")
        out.append(Scenario(
            id=meta["id"], lang=meta["lang"], kind=meta["kind"],
            expect=[e.strip() for e in meta["expect"].split(",") if e.strip()],
            core=meta.get("core", "false").lower() == "true",
            fixtures=meta.get("fixtures") or None, facts=lists["facts"], prompt=body.strip(),
            expect_notes=lists["expect_notes"],
        ))
    return out


def call_claude(argv, cwd, env, input=None):
    """The single place that runs the claude CLI. Tests replace it.
    The prompt goes through stdin: a single argv element is capped at 128 KiB on Linux."""
    p = subprocess.run(argv, cwd=cwd, env=env, input=input, capture_output=True, text=True,
                       timeout=3600)
    return CallResult(p.returncode, p.stdout, p.stderr)


@contextmanager
def isolated_config(baseline=None):
    """Temp CLAUDE_CONFIG_DIR holding only symlinks; the credentials file is never opened."""
    d = Path(tempfile.mkdtemp(prefix="tw-eval-cfg-"))
    try:
        if os.path.lexists(CREDENTIALS):
            (d / ".credentials.json").symlink_to(CREDENTIALS)
        if baseline is not None:
            (d / "skills").mkdir()
            (d / "skills" / "writing-docs").symlink_to(baseline)
        yield d
    finally:
        shutil.rmtree(d, ignore_errors=True)


@contextmanager
def workdir(scenario=None):
    d = Path(tempfile.mkdtemp(prefix="tw-eval-wd-"))
    try:
        if scenario is not None and scenario.fixtures:
            src = EVALS_DIR / "fixtures" / scenario.fixtures.rstrip("/")
            if src.is_dir():
                shutil.copytree(src, d, dirs_exist_ok=True)
        yield d
    finally:
        shutil.rmtree(d, ignore_errors=True)


RATE_RE = re.compile(r"rate.?limit|\b429\b|overloaded|\b529\b", re.I)
# quota/session limits reset in hours: pausing is pointless, stop at once
LIMIT_RE = re.compile(r"hit your (session |usage |weekly )?limit|session limit|usage limit|"
                      r"limit.{0,40}\bresets\b", re.I)
AUTH_RE = re.compile(r"not logged in|invalid api key|please run /login|authentication_error", re.I)


def _result_event(stdout):
    """Last JSON object with type == result in stream-json or json output."""
    for line in reversed(stdout.strip().splitlines()):
        try:
            ev = json.loads(line)
        except ValueError:
            continue
        if isinstance(ev, dict) and ev.get("type") == "result":
            return ev
    return None


def _checked_call(argv, cwd, env, parse, attempts, prompt):
    """Run with retries. parse(CallResult) -> value or raises ValueError."""
    rate_hits, errors = 0, []
    while True:
        try:
            res = call_claude(argv, cwd, env, input=prompt)
        except (OSError, subprocess.SubprocessError) as e:
            res = CallResult(1, "", f"{type(e).__name__}: {e}")
        ev = _result_event(res.stdout) or {}
        blob = f"{ev.get('result', '') if ev else res.stdout[-500:]} {res.stderr}"
        if (res.returncode != 0 or ev.get("is_error")) and LIMIT_RE.search(blob):
            raise RateLimited(blob.strip()[:300])
        if (res.returncode != 0 or ev.get("is_error")) and RATE_RE.search(blob):
            if rate_hits >= len(RATE_PAUSES):
                raise RateLimited(blob.strip()[:300])
            sleep(RATE_PAUSES[rate_hits])
            rate_hits += 1
            continue
        try:
            if res.returncode != 0 or ev.get("is_error"):
                if AUTH_RE.search(blob):
                    raise AuthError(blob.strip()[:300])
                raise ValueError(f"exit {res.returncode}: {blob.strip()[:300]}")
            return parse(res)
        except ValueError as e:
            errors.append(str(e))
            if len(errors) >= attempts:
                raise ValueError("; ".join(errors))


DENIED_RE = re.compile(r"(?i)permission|haven't granted|not allowed")


def parse_stream(res):
    """Final text, Skill calls, cost and duration from stream-json output."""
    skills, texts, reads, denied = [], [], {}, set()
    for line in res.stdout.splitlines():
        try:
            ev = json.loads(line)
        except ValueError:
            continue
        if ev.get("type") == "assistant":
            for block in ev.get("message", {}).get("content", []) or []:
                if block.get("type") == "tool_use" and block.get("name") == "Skill":
                    skills.append(str(block.get("input", {}).get("skill", "")))
                elif block.get("type") == "tool_use" and block.get("name") == "Read":
                    reads[block.get("id")] = str(block.get("input", {}).get("file_path", ""))
                elif block.get("type") == "text":
                    texts.append(block.get("text", ""))
        elif ev.get("type") == "user":
            content = ev.get("message", {}).get("content", [])
            for block in content if isinstance(content, list) else []:
                if (block.get("type") == "tool_result" and block.get("tool_use_id") in reads
                        and block.get("is_error") and DENIED_RE.search(json.dumps(block.get("content")))):
                    denied.add(block["tool_use_id"])
    ev = _result_event(res.stdout)
    if ev is None:
        raise ValueError("no result event in stream-json output")
    text = ev.get("result") or (texts[-1] if texts else "")
    if not text.strip():
        raise ValueError("empty final message")
    return {"text": text, "skills": skills, "reads": [(p, i in denied) for i, p in reads.items()],
            "cost_usd": ev.get("total_cost_usd"),
            "duration_ms": ev.get("duration_ms")}


def _write_json(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    text = json.dumps(data, ensure_ascii=False, indent=2).replace(str(Path.home()), "~")
    path.write_text(text + "\n", encoding="utf-8")


def _read_json(path):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return None


def generate(results, model, participant, scenario, baseline, stop):
    base = results / "outputs" / model / participant / scenario.id
    if stop.is_set() or base.with_suffix(".md").exists():
        return
    argv = ["claude", "-p", "--model", model, "--no-session-persistence",
            "--output-format", "stream-json", "--verbose", "--permission-mode", "acceptEdits"]
    skill_dir = (PLUGIN_DIRS.get(participant) if participant != "writing-docs"
                 else Path(os.path.realpath(baseline)))
    if participant in PLUGIN_DIRS:
        argv += ["--plugin-dir", str(PLUGIN_DIRS[participant])]
    if skill_dir is not None:  # claude -p denies Read outside cwd without it
        argv += ["--add-dir", str(skill_dir)]
    prompt = f"{scenario.prompt}\n\n{SUFFIX.get(scenario.lang, SUFFIX['en'])}"
    meta = {"scenario": scenario.id, "model": model, "participant": participant}
    with isolated_config(baseline if participant == "writing-docs" else None) as cfg, \
            workdir(scenario) as wd:
        env = dict(os.environ, CLAUDE_CONFIG_DIR=str(cfg))
        try:
            out = _checked_call(argv, wd, env, parse_stream, GEN_ATTEMPTS, prompt)
        except ValueError as e:
            _write_json(base.with_suffix(".json"), {**meta, "status": "failed", "error": str(e)})
            return
        root = os.path.realpath(skill_dir) if skill_dir is not None else None
        files_read = sorted({os.path.relpath(os.path.realpath(p), root) for p, bad in out["reads"]
                             if root and not bad and os.path.realpath(p).startswith(root + os.sep)})
        read_denied = sum(bad for _, bad in out["reads"])
        text = out["text"].replace(str(wd) + "/", "").replace(str(wd), ".").replace(str(Path.home()), "~")
    fired = participant != "none" and any(s.split(":")[-1] == participant for s in out["skills"])
    _write_json(base.with_suffix(".json"), {
        **meta, "status": "ok", "skills": out["skills"], "skill_fired": fired,
        "files_read": files_read, "read_denied": read_denied,
        "cost_usd": out["cost_usd"], "duration_ms": out["duration_ms"],
        "words": len(text.split())})
    base.with_suffix(".md").write_text(text.rstrip() + "\n", encoding="utf-8")


def _csv(value):
    return [v.strip() for v in value.split(",") if v.strip()]


def parse_args(argv):
    ap = argparse.ArgumentParser(prog="python3 evals/run.py", description=__doc__.split("\n")[0])
    ap.add_argument("--models", default="sonnet", type=_csv)
    ap.add_argument("--core-models", default="haiku,opus", type=_csv)
    ap.add_argument("--judge-model", default="opus")
    ap.add_argument("--participants", default=",".join(PARTICIPANTS), type=_csv)
    ap.add_argument("--scenarios", default="*", metavar="GLOB")
    ap.add_argument("--jobs", default=3, type=int)
    ap.add_argument("--date", default=_date.today().isoformat())
    ap.add_argument("--baseline-path", default=str(DEFAULT_BASELINE), type=Path)
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--skip-judge", action="store_true")
    ap.add_argument("--report-only", action="store_true")
    ap.add_argument("--reveal", action="store_true")
    a = ap.parse_args(argv)
    bad = [p for p in a.participants if p not in PARTICIPANTS]
    if bad:
        ap.error(f"unknown participants: {', '.join(bad)}")
    return a


def plan(args, scenarios):
    """[(model, [scenarios])]: main models take all scenarios, core models the core ones."""
    out = [(m, scenarios) for m in args.models]
    out += [(m, [s for s in scenarios if s.core]) for m in args.core_models if m not in args.models]
    return out


def resume_command(argv, day):
    kept, skip = [], False
    for a in argv:
        if skip:
            skip = False
        elif a == "--date":
            skip = True
        elif not a.startswith("--date="):
            kept.append(a)
    return " ".join(["python3 evals/run.py", *map(shlex.quote, kept), "--date", day])


def _pool(tasks, jobs, stop):
    """Run callables in parallel; the first RateLimited/AuthError stops the rest."""
    def guarded(task):
        try:
            task()
        except (RateLimited, AuthError):
            stop.set()
            raise

    with ThreadPoolExecutor(max_workers=max(1, jobs)) as ex:
        futures = [ex.submit(guarded, t) for t in tasks]
        first = None
        for f in futures:
            try:
                f.result()
            except (RateLimited, AuthError) as e:
                first = first or e
    if first:
        raise first


def failed_calls(results):
    out = []
    for f in sorted((results / "outputs").glob("*/*/*.json")):
        m = _read_json(f) or {}
        if m.get("status") == "failed":
            out.append(f"{m['model']} / {m['participant']} / {m['scenario']}: {m.get('error', '')}")
    for f in sorted((results / "judgments").glob("*/*.json")):
        j = _read_json(f) or {}
        if j.get("status") == "failed":
            out.append(f"judge {j['model']} / {j['scenario']}: {j.get('error', '')}")
    return out


TRACE_LINE = re.compile(  # skill ids only: plain "technical writing" is ordinary prose
    r"(?i)\btechnical-writing(-ru)?\b|\bwriting-docs\b|check\.py|CLAUDE_SKILL_DIR")
PROGRESS_HEAD = re.compile(r"(?i)documentation progress|прогресс документации")
CHECK_ITEM = re.compile(r"^\s*[-*] \[[ xX]\]")


def scrub(text):
    """Drop traces of a skill run before a blind read: lines naming a participant skill,
    check.py calls and the "Documentation progress" checklist block."""
    kept, in_progress = [], False
    for ln in text.splitlines():
        if PROGRESS_HEAD.search(ln):
            in_progress = True
            continue
        if in_progress and (CHECK_ITEM.match(ln) or not ln.strip()):
            continue
        in_progress = False
        if not TRACE_LINE.search(ln):
            kept.append(ln)
    return "\n".join(kept).strip()


def judge_schema(labels):
    doc = {"type": "object", "additionalProperties": False, "required": CRIT_KEYS,
           "properties": {k: {"type": "integer", "minimum": 1, "maximum": 5} for k in CRIT_KEYS}}
    return {"type": "object", "required": ["scores"], "properties": {
        "scores": {"type": "object", "required": labels, "additionalProperties": False,
                   "properties": {lb: doc for lb in labels}},
        "notes": {"type": "string"}}}


def fixture_files(scenario):
    """[(relative name, text)] of the scenario's fixtures; binary files are skipped."""
    if not scenario.fixtures:
        return []
    src = EVALS_DIR / "fixtures" / scenario.fixtures.rstrip("/")
    out = []
    for f in sorted(p for p in src.rglob("*") if p.is_file()):
        try:
            out.append((str(f.relative_to(src)), f.read_text(encoding="utf-8")))
        except (UnicodeDecodeError, OSError):
            pass
    return out


def judge_prompt(scenario, docs):
    rubric_path = EVALS_DIR / "rubric.md"
    rubric = rubric_path.read_text(encoding="utf-8") if rubric_path.is_file() else ""
    crit = "\n".join(f"- {k}: {label}" for k, label in CRITERIA)
    parts = [
        "You grade documentation drafts written for the same request. You do not know who "
        "produced them. Score every document on every criterion from 1 to 5 using the rubric. "
        "Length is not a merit by itself. Judge style by the language of the document.",
        f"Criteria (keys for the answer):\n{crit}",
        f"Rubric:\n{rubric.strip()}" if rubric.strip() else "",
        f"Kind: {scenario.kind}. Acceptable document types: {', '.join(scenario.expect)}. "
        f"Language: {scenario.lang}.",
        f"Request:\n{scenario.prompt}",
        "Facts the document must respect:\n" + "\n".join(f"- {f}" for f in scenario.facts),
        "Expectations for the answer (what a good answer does):\n"
        + "\n".join(f"- {n}" for n in scenario.expect_notes) if scenario.expect_notes else "",
        *(f"Source file {name} (given to the writer):\n{body}" for name, body in fixture_files(scenario)),
    ]
    parts += [f"Document {label}\n{text}" for label, text in docs]
    return "\n\n".join(p for p in parts if p)


def _parse_judgment(labels):
    def parse(res):
        so = (_result_event(res.stdout) or {}).get("structured_output")
        scores = so.get("scores") if isinstance(so, dict) else None
        ok = isinstance(scores, dict) and all(
            isinstance(scores.get(lb), dict) and all(
                isinstance(scores[lb].get(k), int) and 1 <= scores[lb][k] <= 5 for k in CRIT_KEYS)
            for lb in labels)
        if not ok:
            raise ValueError("judge answer does not match the schema")
        return scores
    return parse


def judge(results, model, scenario, participants, judge_model, stop):
    path = results / "judgments" / model / f"{scenario.id}.json"
    outdir = results / "outputs" / model
    ready = [p for p in participants if (outdir / p / f"{scenario.id}.md").exists()]
    old = _read_json(path)
    if stop.is_set() or not ready or (
            old and old.get("status") == "ok" and sorted(old["participants"]) == sorted(ready)):
        return
    order = sorted(ready)
    random.Random(scenario.id).shuffle(order)
    texts = {p: scrub((outdir / p / f"{scenario.id}.md").read_text(encoding="utf-8")) for p in ready}
    labels = list("ABCD")[:len(order)]
    meta = {"scenario": scenario.id, "model": model, "judge_model": judge_model, "participants": ready}
    passes = []
    if old and old.get("status") == "failed" and sorted(old.get("participants", [])) == sorted(ready):
        passes = [ps for ps in old.get("passes", [])[:1] if ps["order"] == order]
    for perm in (order, order[::-1])[len(passes):]:
        prompt = judge_prompt(scenario, [(lb, texts[p]) for lb, p in zip(labels, perm)])
        argv = ["claude", "-p", "--model", judge_model, "--no-session-persistence",
                "--output-format", "json", "--json-schema", json.dumps(judge_schema(labels))]
        with isolated_config() as cfg, workdir() as wd:
            try:
                scores = _checked_call(argv, wd, dict(os.environ, CLAUDE_CONFIG_DIR=str(cfg)),
                                       _parse_judgment(labels), JUDGE_ATTEMPTS, prompt)
            except ValueError as e:
                _write_json(path, {**meta, "status": "failed", "error": str(e), "passes": passes})
                return
        passes.append({"order": perm, "scores": {p: scores[lb] for lb, p in zip(labels, perm)}})
    a, b = (ps["scores"] for ps in passes)
    avg = {p: {k: (a[p][k] + b[p][k]) / 2 for k in CRIT_KEYS} for p in ready}
    _write_json(path, {
        **meta, "status": "ok", "passes": passes, "scores": avg,
        "totals": {p: sum(v.values()) / len(CRIT_KEYS) for p, v in avg.items()},
        "position_flags": [{"participant": p, "criterion": k, "pass1": a[p][k], "pass2": b[p][k]}
                           for p in ready for k in CRIT_KEYS if abs(a[p][k] - b[p][k]) > 1]})


def _judgments(results, model):
    out = {}
    for f in sorted((results / "judgments" / model).glob("*.json")):
        j = _read_json(f)
        if j and j.get("status") == "ok":
            out[j["scenario"]] = j
    return out


def _new_skill(scenario):
    return "technical-writing-ru" if scenario.lang == "ru" else "technical-writing"


def write_pairs(results, model, scenarios, participants):
    """Blind pairs writing-docs vs the new skill of the scenario's language, plus verdict.md."""
    if "writing-docs" not in participants:
        return
    outdir, pairs_dir, key, gaps = results / "outputs" / model, results / "pairs", {}, {}
    judged = _judgments(results, model)
    for s in scenarios:
        new = _new_skill(s)
        files = {p: outdir / p / f"{s.id}.md" for p in (new, "writing-docs")}
        if new not in participants or not all(f.exists() for f in files.values()):
            continue
        x, y = (new, "writing-docs") if random.Random("pair:" + s.id).random() < 0.5 else ("writing-docs", new)
        key[s.id] = {"X": x, "Y": y}
        facts = "\n".join(f"- {f}" for f in s.facts) or "нет"
        if s.expect_notes:
            facts += "\n\nОжидания к ответу:\n\n" + "\n".join(f"- {n}" for n in s.expect_notes)
        request = "\n".join("> " + ln for ln in s.prompt.splitlines())
        page = (f"# Пара {s.id}\n\nЯзык: {s.lang}. Вид: {s.kind}.\n\nЗапрос:\n\n{request}\n\n"
                f"Факты:\n\n{facts}\n\n---\n\n## X\n\n{scrub(files[x].read_text(encoding='utf-8'))}\n\n"
                f"---\n\n## Y\n\n{scrub(files[y].read_text(encoding='utf-8'))}\n")
        pairs_dir.mkdir(parents=True, exist_ok=True)
        (pairs_dir / f"{s.id}.md").write_text(page, encoding="utf-8")
        t = judged.get(s.id, {}).get("totals", {})
        gaps[s.id] = abs(t[new] - t["writing-docs"]) if new in t and "writing-docs" in t else -1
    if not key:
        return
    _write_json(pairs_dir / "key.json", {"model": model, "pairs": key})
    verdict = results / "verdict.md"
    text = verdict.read_text(encoding="utf-8") if verdict.exists() else (
        "# Вердикт владельца\n\n"
        "В каждой паре два документа на один запрос под метками X и Y, без имён. "
        "Откройте пару, затем впишите после «Лучше» одно из: X, Y, равно. "
        "После «Почему» объясните выбор, можно в несколько строк. "
        f"Раскрыть, кто есть кто: `python3 evals/run.py --reveal --date {results.name}`. "
        "Пары идут от большего расхождения оценок судьи-модели к меньшему.\n")
    head, sep, revealed = text.partition(REVEAL_HEAD)
    intro, *blocks = head.split("\n## ")
    sections = {b.partition("\n")[0].strip(): "## " + b.rstrip("\n") + "\n" for b in blocks}
    ordered = sorted(key, key=lambda i: (-gaps[i], i))
    body = [sections.pop(sid, f"## {sid}\n\nПара: [pairs/{sid}.md](pairs/{sid}.md)\n\nЛучше:\nПочему:\n")
            for sid in ordered] + list(sections.values())
    verdict.write_text(intro.rstrip("\n") + "\n\n" + "\n".join(body) + sep + revealed, encoding="utf-8")


def _table(head, rows):
    out = ["| " + " | ".join(head) + " |", "|" + "---|" * len(head)]
    return out + ["| " + " | ".join(map(str, r)) + " |" for r in rows]


def _f(v):
    return "—" if v is None else f"{v:.1f}"


def _mean(xs):
    xs = list(xs)
    return sum(xs) / len(xs) if xs else None


def model_section(results, model, participants, title):
    judged = _judgments(results, model)
    if not judged:
        return [f"## {title}", "", "Оценок нет.", ""]
    head = ["Участник", *(lb for _, lb in CRITERIA), "Итог"]
    rows = []
    for p in participants:
        js = [j for j in judged.values() if p in j["scores"]]
        rows.append([p, *(_f(_mean(j["scores"][p][k] for j in js)) for k in CRIT_KEYS),
                     _f(_mean(j["totals"][p] for j in js))])
    lines = [f"## {title}", "", *_table(head, rows), ""]
    for p in participants:
        rows = [[sid, *(_f(j["scores"][p][k]) for k in CRIT_KEYS), _f(j["totals"][p])]
                for sid, j in sorted(judged.items()) if p in j["scores"]]
        if rows:
            lines += [f"### {p}: сценарий × критерий", "",
                      *_table(["Сценарий", *(lb for _, lb in CRITERIA), "Итог"], rows), ""]
    return lines


def compactness(results, runs, participants):
    """Median/mean words per participant and model; ratio of medians to writing-docs
    on the scenarios both have."""
    rows = []
    for m, scs in runs:
        words = {p: {} for p in participants}
        for s in scs:
            for p in participants:
                meta = _read_json(results / "outputs" / m / p / f"{s.id}.json") or {}
                if meta.get("status") == "ok":
                    words[p][s.id] = meta["words"]
        for p in participants:
            if not words[p]:
                continue
            ratio = "—"
            base = words.get("writing-docs", {})
            common = sorted(set(words[p]) & set(base))
            if common:
                ratio = f"{median(words[p][i] for i in common) / median(base[i] for i in common):.2f}"
            rows.append([m, p, f"{median(words[p].values()):g}", f"{_mean(words[p].values()):.1f}", ratio])
    return ["## Компактность (слов в документе)", "",
            *(_table(["Модель", "Участник", "Медиана", "Среднее", "Медиана / writing-docs"], rows)
              if rows else ["нет данных"]), ""]


def write_report(results, args, runs, participants):
    m0 = args.models[0]
    judged = _judgments(results, m0)
    lines = ["# Отчёт A/B", "", "## Параметры", "",
             f"- Дата: {args.date}",
             f"- Основные модели: {', '.join(args.models)}",
             f"- Модели на ключевых сценариях: {', '.join(args.core_models) or 'нет'}",
             f"- Судья: {args.judge_model}, два прохода с разным порядком, оценка — среднее",
             f"- Участники: {', '.join(participants)}",
             *(f"- {m}: сценариев {len(scs)}" for m, scs in runs), ""]
    lines += model_section(results, m0, participants, f"Участник × критерий ({m0})")
    for m, _ in runs[1:]:
        lines += model_section(results, m, participants, f"Ключевые сценарии ({m})")
    rows, denied = [], []
    for m, scs in runs[:1]:
        for s in scs:
            for p in participants:
                meta = _read_json(results / "outputs" / m / p / f"{s.id}.json") or {}
                fired = "—" if p == "none" or meta.get("status") != "ok" else (
                    "да" if meta.get("skill_fired") else "нет")
                total = judged.get(s.id, {}).get("totals", {}).get(p)
                nread = "—" if fired == "—" else len(meta.get("files_read", []))
                rows.append([s.id, p, _f(total), meta.get("words", "—"), fired, nread])
                if meta.get("read_denied"):
                    denied.append(f"{m} / {p} / {s.id}: {meta['read_denied']}")
    lines += [f"## По сценариям ({m0})", "",
              *_table(["Сценарий", "Участник", "Итог", "Слов", "Скилл сработал", "Файлы скилла прочитаны"], rows), "",
              "## Отказы в чтении (Read вернул ошибку прав)", "", *([f"- {d}" for d in denied] or ["нет"]), ""]
    spread = sorted(((max(j["totals"].values()) - min(j["totals"].values()), sid, j)
                     for sid, j in judged.items()), key=lambda t: (-t[0], t[1]))[:5]
    lines += ["## Наибольшее расхождение между участниками", "", *_table(
        ["Сценарий", "Разброс", "Лучший", "Худший"],
        [[sid, _f(g), max(j["totals"], key=j["totals"].get), min(j["totals"], key=j["totals"].get)]
         for g, sid, j in spread]), ""]
    flags = {}
    for m, _ in runs:
        for sid, j in sorted(_judgments(results, m).items()):
            for f in j["position_flags"]:
                flags.setdefault((m, sid, f["participant"]), []).append(
                    f"{f['criterion']} {f['pass1']}/{f['pass2']}")
    lines += ["## Позиционные расхождения (> 1 балла между проходами)", "",
              *(_table(["Модель", "Сценарий", "Участник", "Критерии (проход 1/проход 2)"],
                       [[*k, ", ".join(v)] for k, v in flags.items()]) if flags else ["нет"]), ""]
    lines += compactness(results, runs, participants)
    lines += ["## Упавшие вызовы", "", *([f"- {f}" for f in failed_calls(results)] or ["нет"]), ""]
    lines += ["## Слепой вердикт владельца", "",
              "Пары «writing-docs против нового скилла» лежат в `pairs/`, бланк — `verdict.md`. "
              "Отчёт не называет, какая метка у какого участника; это покажет "
              f"`python3 evals/run.py --reveal --date {args.date}`.", ""]
    results.mkdir(parents=True, exist_ok=True)
    (results / "report.md").write_text("\n".join(lines), encoding="utf-8")


CHOICES = {"x": "X", "х": "X", "y": "Y", "у": "Y", "равно": "=", "tie": "=", "=": "="}
TIE_EPS = 0.25  # ponytail: judge totals closer than this count as a tie; tune after the first run


def parse_verdict(text):
    """{pair id: (raw choice, reason)} from the owner's verdict.md (before the reveal part)."""
    out = {}
    for block in text.split(REVEAL_HEAD)[0].split("\n## ")[1:]:
        sid, _, body = block.partition("\n")
        choice, why, in_why = "", [], False
        for ln in body.splitlines():
            if ln.startswith("Лучше:"):
                choice, in_why = ln[len("Лучше:"):].strip(), False
            elif ln.startswith("Почему:"):
                why, in_why = [ln[len("Почему:"):]], True
            elif in_why:
                why.append(ln)
        out[sid.strip()] = (choice, "\n".join(why).strip())
    return out


def reveal(results):
    verdict, key_path = results / "verdict.md", results / "pairs" / "key.json"
    key = _read_json(key_path)
    if not verdict.is_file() or not key:
        print(f"error: no {verdict} or {key_path}; run the comparison first", file=sys.stderr)
        return 2
    text = verdict.read_text(encoding="utf-8")
    answers = parse_verdict(text)
    problems = []
    for sid, (choice, why) in answers.items():
        if choice and choice.lower() not in CHOICES:
            problems.append(f"{sid}: «Лучше» must be X, Y or равно, got {choice!r}")
        elif choice and not why:
            problems.append(f"{sid}: «Почему» is empty")
    if not any(c for c, _ in answers.values()):
        problems.append("no pair has «Лучше» filled yet")
    if problems:
        print("refusing to reveal until every judged pair says why:\n  " + "\n  ".join(problems),
              file=sys.stderr)
        return 1
    judged = _judgments(results, key["model"])
    rows, tally, agree, compared = [], {"win": 0, "loss": 0, "tie": 0, "open": 0}, 0, 0
    for sid, (choice, _) in answers.items():
        pair = key["pairs"].get(sid)
        if not pair:
            continue
        new = next(p for p in pair.values() if p != "writing-docs")
        c = CHOICES.get(choice.lower()) if choice else None
        owner = None if c is None else "=" if c == "=" else pair[c]
        tally["open" if owner is None else "tie" if owner == "=" else
              "win" if owner == new else "loss"] += 1
        t = judged.get(sid, {}).get("totals", {})
        model_pick = None
        if new in t and "writing-docs" in t:
            d = t[new] - t["writing-docs"]
            model_pick = "=" if abs(d) < TIE_EPS else new if d > 0 else "writing-docs"
        same = "—"
        if owner is not None and model_pick is not None:
            compared += 1
            agree += owner == model_pick
            same = "да" if owner == model_pick else "нет"
        name = {None: "не оценено", "=": "равно"}
        rows.append([sid, pair["X"], pair["Y"], name.get(owner, owner),
                     "—" if model_pick is None else name.get(model_pick, model_pick), same])
    lines = [REVEAL_HEAD.strip(), "",
             *_table(["Пара", "X", "Y", "Лучше (владелец)", "Лучше (судья-модель)", "Согласие"], rows), "",
             f"Новый скилл против writing-docs: побед {tally['win']}, поражений {tally['loss']}, "
             f"ничьих {tally['tie']}; не оценено {tally['open']}.", "",
             f"Согласие с судьёй-моделью: {agree} из {compared}. Судья-модель ставит «равно», "
             f"если итоги участников различаются меньше чем на {TIE_EPS}.", ""]
    verdict.write_text(text.split(REVEAL_HEAD)[0].rstrip() + "\n\n" + "\n".join(lines),
                       encoding="utf-8")
    print(f"revealed: {verdict}")
    return 0


def main(argv=None):
    argv = sys.argv[1:] if argv is None else argv
    args = parse_args(argv)
    results = EVALS_DIR / "results" / args.date
    if args.reveal:
        return reveal(results)
    try:
        scenarios = load_scenarios(EVALS_DIR / "scenarios", args.scenarios)
    except ValueError as e:
        print(f"error: {e}", file=sys.stderr)
        return 2
    if not scenarios:
        print(f"error: no scenarios match '{args.scenarios}' in evals/scenarios/", file=sys.stderr)
        return 2
    participants = list(args.participants)
    baseline = args.baseline_path.expanduser()
    if "writing-docs" in participants and not (baseline / "SKILL.md").is_file():
        print(f"warning: writing-docs not found at {baseline}; running without this participant "
              "(set --baseline-path)", file=sys.stderr)
        participants.remove("writing-docs")
    runs = plan(args, scenarios)
    if args.dry_run:
        for model, scs in runs:
            print(f"{model}: {len(scs) * len(participants)} generations, "
                  f"{0 if args.skip_judge else 2 * len(scs)} judgments")
        print(f"judge model: {args.judge_model}; participants: {', '.join(participants)}")
        return 0
    if not args.report_only:
        if shutil.which("claude") is None:
            print("error: 'claude' is not in PATH; install Claude Code first", file=sys.stderr)
            return 2
        if not os.path.lexists(CREDENTIALS) and not os.environ.get("ANTHROPIC_API_KEY"):
            print(f"error: no {CREDENTIALS} to link and ANTHROPIC_API_KEY is not set; "
                  "log in with `claude` or export ANTHROPIC_API_KEY", file=sys.stderr)
            return 2
        stop = threading.Event()
        try:
            _pool([lambda m=m, p=p, s=s: generate(results, m, p, s, baseline, stop)
                   for m, scs in runs for s in scs for p in participants], args.jobs, stop)
            if not args.skip_judge:
                _pool([lambda m=m, s=s: judge(results, m, s, participants, args.judge_model, stop)
                       for m, scs in runs for s in scs], args.jobs, stop)
        except RateLimited as e:
            print(f"error: rate limit persists ({e}).\nContinue later with:\n  "
                  f"{resume_command(argv, args.date)}", file=sys.stderr)
            return 3
        except AuthError as e:
            print(f"error: claude is not authorized: {e}", file=sys.stderr)
            return 2
    write_pairs(results, args.models[0], scenarios, participants)
    write_report(results, args, runs, participants)
    print(f"report: {results / 'report.md'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
