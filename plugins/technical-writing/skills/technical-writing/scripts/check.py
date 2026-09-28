#!/usr/bin/env python3
"""Deterministic checks for Markdown documentation (English and Russian).

Usage: check.py [options] PATH [PATH ...]

Checks prose only: fenced and inline code, tables (except for word lists),
frontmatter, URLs and HTML comments are skipped. Sentences are joined across
line breaks. If Vale is on PATH, its findings are merged into the report.

Exit codes: 0 no errors, 1 errors found, 2 usage or input error.
"""

import argparse
import bisect
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import urllib.parse
import urllib.request
from pathlib import Path
from typing import NamedTuple


class Finding(NamedTuple):
    line: int
    level: str  # "error" | "warning"
    rule: str
    message: str


MAX_WORDS = {"en": 30, "ru": 25}

STOP_WORDS = {
    "en": [
        "just", "simply", "obviously", "basically", "very", "really", "easy", "easily",
        "clearly", "actually", "of course", "quite", "extremely", "literally",
        "straightforward", "effortless(?:ly)?", "painless(?:ly)?", "merely", "totally",
    ],
    "ru": [
        # intensifiers
        "очень", "крайне", "чрезвычайно", "максимально", "абсолютно", "весьма", "действительно",
        # evaluations
        r"удобн\w*", r"эффективн\w*", r"качественн\w*", r"уникальн\w*", r"инновационн\w*",
        r"современн\w*",
        # officialese
        r"осуществл\w*", "осуществить", r"производит(?:ся|ь)", "посредством", "в рамках",
        "с целью", "в целях", "данный", "данная", "данное", "данного", "данной", "данном",
        r"вышеуказанн\w*",
        # parentheticals
        "как известно", "безусловно", "конечно", "по сути", "в принципе", "фактически",
        "как бы", "собственно",
    ],
}

LLM_MARKERS = {
    "en": [
        r"delv(?:e|es|ed|ing)", r"leverag(?:e|es|ed|ing)", r"seamless(?:ly)?", "robust",
        r"it(?:'|’)?s worth noting", "it is worth noting", r"tapestry", r"in today(?:'|’)s",
        r"game[- ]changer", "cutting-edge", r"empower(?:s|ed|ing)?", "in the realm of",
        r"plays? an? (?:crucial|key|vital|pivotal) role", "a testament to",
        r"not (?:just|only|merely|simply)\b[^.!?;]{1,60}?\bbut",
    ],
    "ru": [
        r"явля(?:ется|ются|лся|лась|лось|лись)", r"являющ\w*",
        r"игра(?:ет|ют) (?:ключевую|важную|решающую|значимую) роль",
        "стоит отметить", "важно отметить", "следует отметить", "в современном мире",
        r"бесшовн\w*", r"не просто\b[^.!?;]{1,60}?,? а",
    ],
}

_DATE = r"20\d\d-\d\d(?:-\d\d)?|\d{1,2}[./]\d{1,2}[./]20\d\d"
_MONTHS_EN = ("(?:January|February|March|April|May|June|July|August|September|October|"
              "November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)")
# A number followed by a range word, another number or a unit is a quantity, not a year.
_NOT_QTY = (r"(?!\s*(?:to|and|or|[-–—]|\d|%|(?:ms|s|secs?|seconds?|min|minutes?|h|hours?|"
            r"days?|bytes?|[kmgt]i?b|px|pt|lines?|chars?|characters?|rows?|items?|requests?|"
            r"users?|tokens?|words?|times|ports?|errors?|files?)\b))")
DATED = {
    "en": [_DATE, r"(?:in|since|by|until|till|from|during|before|after|as of|early|mid|late)"
           r"\s+(?:" + _MONTHS_EN + r"\s+)?20\d\d" + _NOT_QTY,
           _MONTHS_EN + r"\s+(?:\d{1,2},?\s+)?20\d\d", r"20\d\d\s+(?:release|version)",
           "currently", "as of", "at the moment", "at present", "nowadays",
           "latest version"],
    "ru": [_DATE, r"20\d\d\s*(?:год\w*|г\.)", r"(?:в|с|до|к|по|от|на)\s+20\d\d(?=\s*(?:[.,;:!?)]|$))",
           r"(?:январ|феврал|март|апрел|ма[йяе]|июн|июл|август|сентябр|октябр|ноябр|декабр)\w*"
           r"\s+20\d\d",
           "сейчас", "в настоящее время", "на данный момент",
           "на сегодняшний день", r"последн(?:яя|ей|юю) верси\w*", "недавно"],
}

RU_YO = [
    (r"еще", "ещё"), (r"ее", "её"), (r"нее", "неё"),
    (r"все равно", "всё равно"),
]

ABBREVIATIONS = {"e.g", "i.e", "etc", "vs", "cf", "approx", "fig", "figs", "vol",
                 "p", "pp", "ch", "sec", "eq", "cp", "т.е", "т.п", "т.д", "т.к", "др", "см"}


def _words_re(items):
    return re.compile(r"(?<![\w-])(?:" + "|".join(items) + r")(?![\w-])", re.I)


STOP_RE = {k: _words_re(v) for k, v in STOP_WORDS.items()}
LLM_RE = {k: _words_re(v) for k, v in LLM_MARKERS.items()}
DATED_RE = {k: _words_re(v) for k, v in DATED.items()}
WORD_RE = re.compile(r"[^\W_]+(?:['’-][^\W_]+)*")

FENCE_RE = re.compile(r"^\s*(`{3,}|~{3,})")
HEADING_RE = re.compile(r"^\s{0,3}(#{1,6})\s+(.*?)\s*#*\s*$")
LIST_RE = re.compile(r"^\s*(?:[-*+]|\d+[.)])\s+(?:\[[ xX]\]\s+)?")
TABLE_SEP_RE = re.compile(r"^[\s|:-]+$")
INLINE_CODE_RE = re.compile(r"(`+)(.+?)\1")
LINK_RE = re.compile(r"!?\[([^\]]*)\]\(\s*<?([^)\s>]*)>?(?:\s+\"[^\"]*\")?\s*\)")
REF_DEF_RE = re.compile(r"^\s{0,3}\[[^\]]+\]:\s*<?(\S+?)>?(?:\s+.*)?$")
AUTOLINK_RE = re.compile(r"<([a-z][a-z0-9+.-]*:[^>\s]+)>", re.I)
URL_RE = re.compile(r"\b[a-z][a-z0-9+.-]*://\S+", re.I)
HTML_TAG_RE = re.compile(r"</?[a-z][^>]*>", re.I)
COMMENT_RE = re.compile(r"<!--.*?-->", re.S)
SCHEME_RE = re.compile(r"^[a-z][a-z0-9+.-]*:", re.I)


CODE_MARK = "\x01"  # stands in for inline code: not a word, not lowercase


def _strip_code(line):
    return INLINE_CODE_RE.sub(CODE_MARK, line)


def code_lines(lines):
    """Return one bool per line: True inside a fenced code block, fence lines included.
    A closing fence uses the same character and is at least as long as the opening one."""
    out, fence = [], None
    for line in lines:
        m = FENCE_RE.match(line)
        if fence:
            if m and m.group(1)[0] == fence[0] and len(m.group(1)) >= len(fence):
                fence = None
            out.append(True)
        elif m:
            fence = m.group(1)
            out.append(True)
        else:
            out.append(False)
    return out


def _to_prose(line):
    line = AUTOLINK_RE.sub(" ", line)
    line = LINK_RE.sub(lambda m: m.group(1), line)
    line = URL_RE.sub(" ", line)
    return HTML_TAG_RE.sub(" ", line)


def slugify(heading):
    text = _to_prose(heading.replace("`", "")).strip().lower()
    return re.sub(r"\s", "-", re.sub(r"[^\w\- ]", "", text))


class Doc:
    """Markdown split into prose blocks, table cells, link lines and anchors."""

    def __init__(self, text):
        text = COMMENT_RE.sub(lambda m: "\n" * m.group().count("\n"), text)
        lines = text.split("\n")
        self.blocks, self.cells, self.link_lines, self.anchors = [], [], [], set()
        slugs = {}
        block, start, code = None, 0, code_lines(lines)
        if lines and lines[0].strip() == "---":
            for i in range(1, len(lines)):
                if lines[i].strip() in ("---", "..."):
                    start = i + 1
                    break

        def close():
            nonlocal block
            if block:
                self.blocks.append(block)
            block = None

        for i in range(start, len(lines)):
            raw, no = lines[i], i + 1
            if code[i]:
                close()
                continue
            line = _strip_code(raw)
            if not line.strip():
                close()
                continue
            ref = REF_DEF_RE.match(line)
            if ref:
                close()
                self.link_lines.append((no, "[](" + ref.group(1) + ")"))
                continue
            self.link_lines.append((no, line))
            if line.lstrip().startswith("|"):
                close()
                if not TABLE_SEP_RE.match(line):
                    self.cells.append((no, _to_prose(line.replace("|", " ; "))))
                continue
            h = HEADING_RE.match(raw)
            if h:
                close()
                slug = slugify(h.group(2))
                n = slugs.get(slug, 0)
                slugs[slug] = n + 1
                self.anchors.add(slug if n == 0 else f"{slug}-{n}")
                self.blocks.append([(no, _to_prose(_strip_code(h.group(2))))])
                continue
            lm = LIST_RE.match(line)
            if lm:
                close()
                line = line[lm.end():]
            line = re.sub(r"^\s*(?:>\s*)+", "", line)
            if block is None:
                block = []
            block.append((no, _to_prose(line).strip()))
        close()

    def has_prose(self):
        return any(WORD_RE.search(t) for b in self.blocks for _, t in b) or any(
            WORD_RE.search(t) for _, t in self.cells)

    def language(self):
        text = " ".join(t for b in self.blocks for _, t in b) + " ".join(t for _, t in self.cells)
        cyr = len(re.findall(r"[а-яё]", text, re.I))
        lat = len(re.findall(r"[a-z]", text, re.I))
        return "ru" if cyr and cyr >= lat else "en"


def _joined(block):
    """Join a block's lines with spaces; return text and a line lookup by offset."""
    starts, parts, pos = [], [], 0
    for _, t in block:
        starts.append(pos)
        parts.append(t)
        pos += len(t) + 1
    lines = [no for no, _ in block]
    return " ".join(parts), lambda off: lines[bisect.bisect_right(starts, off) - 1]


# ponytail: a capital letter plus "." is an initial only before another initial or a
# capitalized word that rarely starts a sentence; extend STARTERS if real text misfires.
STARTERS = {"the", "then", "this", "that", "these", "those", "it", "if", "when", "use", "run",
            "see", "a", "an", "in", "on", "for", "to", "we", "you", "after", "before", "now",
            "next", "otherwise", "also", "but", "and", "or", "so", "there", "here", "do",
            "это", "затем", "потом", "если", "когда", "теперь", "далее", "но", "и", "в", "на",
            "так", "там", "здесь", "после", "перед", "не"}


def _initial_follows(rest):
    if re.match(r"[A-ZА-ЯЁ]\.", rest):
        return True
    m = re.match(r"([A-ZА-ЯЁ][a-zа-яё]+)", rest)
    return bool(m) and m.group(1).lower() not in STARTERS


def _sentences(text):
    """Yield (offset, sentence) pairs; a sentence may span line breaks."""
    start = 0
    for m in re.finditer(r"[.!?…]+[)\"»’]*(?=\s|$)", text):
        head = text[start:m.start()].split()
        word = head[-1].lstrip("([«\"'*_") if head else ""
        token = word.lower()
        rest = text[m.end():].lstrip()
        if token in ABBREVIATIONS or token == "no" and rest[:1].isdigit():
            continue
        if m.group() == "." and re.fullmatch(r"[^\W\d_]", word) and (
                word.islower() or _initial_follows(rest)):
            continue
        if rest and rest[0].islower():
            continue
        yield start, text[start:m.end()]
        start = m.end()
    if text[start:].strip():
        yield start, text[start:]


def _check_url(url):
    req = urllib.request.Request(url, headers={"User-Agent": "check.py"})
    try:
        with urllib.request.urlopen(req, timeout=10):
            return None
    except Exception as e:  # noqa: BLE001 - any failure means the link is unusable
        return str(e)


def _check_links(doc, path, check_urls):
    out, base, cache = [], Path(path).parent, {}
    for no, line in doc.link_lines:
        for m in list(LINK_RE.finditer(line)) + list(AUTOLINK_RE.finditer(line)):
            target = m.group(m.lastindex)
            if not target:
                continue
            if SCHEME_RE.match(target):
                if check_urls and target.lower().startswith(("http://", "https://")):
                    err = _check_url(target)
                    if err:
                        out.append(Finding(no, "error", "broken-link", f"{target}: {err}"))
                continue
            file_part, _, anchor = target.partition("#")
            file_part = urllib.parse.unquote(file_part)
            if file_part.startswith("/"):
                continue
            if file_part:
                dest = base / file_part
                if not dest.exists():
                    out.append(Finding(no, "error", "broken-link", f"{target}: file not found"))
                    continue
                if not anchor or dest.suffix.lower() != ".md" or not dest.is_file():
                    continue
                if dest not in cache:
                    try:
                        cache[dest] = Doc(dest.read_text(encoding="utf-8")).anchors
                    except (OSError, UnicodeDecodeError):
                        cache[dest] = None
                anchors = cache[dest]
            else:
                anchors = doc.anchors
            if anchors is not None and anchor.lower() not in anchors:
                out.append(Finding(no, "error", "broken-link", f"{target}: anchor not found"))
    return out


def _analyze(text, lang, path, max_words, check_urls):
    doc = Doc(text)
    if lang == "auto":
        lang = doc.language()
    limit = max_words or MAX_WORDS[lang]
    out = []

    def words(regex, t, where, rule, fmt, skip=()):
        for m in regex.finditer(t):
            if not any(a <= m.start() < b for a, b in skip):
                out.append(Finding(where(m.start()), "warning", rule, fmt.format(m.group())))

    def word_rules(t, where):
        spans = [m.span() for m in LLM_RE[lang].finditer(t)]
        words(LLM_RE[lang], t, where, "llm-marker",
              "LLM marker \"{}\": say it plainly or cut it")
        words(STOP_RE[lang], t, where, "stop-word",
              "stop word \"{}\": cut it or replace it with a fact", spans)

    for no, cell in doc.cells:
        word_rules(cell, lambda _, no=no: no)

    for block in doc.blocks:
        text_, where = _joined(block)
        for off, s in _sentences(text_):
            n = len(WORD_RE.findall(s))
            if n > limit:
                out.append(Finding(where(off + len(s) - len(s.lstrip())), "warning",
                                   "sentence-length",
                                   f"sentence has {n} words (guide: {limit}); split it"))
        word_rules(text_, where)
        nwords, dashes = len(WORD_RE.findall(text_)), text_.count("—")
        if dashes > max(1, nwords / 40):
            out.append(Finding(block[0][0], "warning", "dash-density",
                               f"{dashes} em dashes in {nwords} words (guide: 1 per 40)"))
        words(DATED_RE[lang], text_, where, "dated-phrase",
              "\"{}\" dates the text; state the version or cut it")
        if lang != "ru":
            continue
        for m in re.finditer(r"\"[^\"]*\"|\"", text_):
            out.append(Finding(where(m.start()), "error", "ru-quotes",
                               "straight quotes in Russian prose; use «ёлочки»"))
        for m in re.finditer(r"(?<=[^\W_])\s+--?\s+(?=[^\W_])", text_):
            if text_[m.start() - 1].isdigit() and text_[m.end()].isdigit():
                out.append(Finding(where(m.start()), "error", "ru-dash",
                                   "hyphen in a numeric range; use an en dash without spaces "
                                   "(10–20)"))
                continue
            out.append(Finding(where(m.start()), "error", "ru-dash",
                               "hyphen between words; use an em dash « — »"))
        for pattern, fix in RU_YO:
            for m in re.finditer(r"(?<![\w-])" + pattern + r"(?![\w-])", text_, re.I):
                out.append(Finding(where(m.start()), "warning", "ru-yo",
                                   f"\"{m.group()}\": did you mean \"{fix}\"?"))
        for m in re.finditer(r"(?<=\S) —", text_):
            out.append(Finding(where(m.start()), "warning", "ru-nbsp",
                               "plain space before an em dash; use a no-break space"))

    out += _check_links(doc, path, check_urls)
    return sorted(set(out), key=lambda f: (f.line, f.rule, f.message)), doc


def check_text(text, lang, path="<text>", *, max_words=None, check_urls=False):
    """Check Markdown text. lang is "en", "ru" or "auto". Returns a sorted list of Finding."""
    return _analyze(text, lang, path, max_words, check_urls)[0]


def _find_vale_ini():
    for d in [Path.cwd(), *Path.cwd().parents]:
        if (d / ".vale.ini").is_file():
            return d / ".vale.ini"
    return None


def run_vale(files, verbose):
    """Return {path: [Finding]} from Vale, or {} if Vale is missing or fails."""
    vale = shutil.which("vale")
    if not vale:
        if verbose:
            print("vale: not found, skipped", file=sys.stderr)
        return {}
    with tempfile.TemporaryDirectory() as tmp:
        config = _find_vale_ini()
        if config is None:
            config = Path(tmp) / ".vale.ini"
            config.write_text(f"StylesPath = {tmp}\nMinAlertLevel = suggestion\n\n"
                              "[*.md]\nBasedOnStyles = Vale\n"
                              "Vale.Spelling = NO\n", encoding="utf-8")
        argv = [vale, f"--config={config}", "--output=JSON", "--no-exit", *files]
        try:
            proc = subprocess.run(argv, capture_output=True, text=True)
            data = json.loads(proc.stdout or "{}")
        except (OSError, ValueError) as e:
            if verbose:
                print(f"vale: failed, skipped: {e}", file=sys.stderr)
            return {}
    by_path = {Path(f).resolve(): f for f in files}
    out = {}
    for key, alerts in data.items() if isinstance(data, dict) else []:
        f = by_path.get(Path(key).resolve(), key)
        for a in alerts:
            level = "warning"  # Vale's rules are advisory here; only own rules fail the run
            out.setdefault(f, []).append(Finding(
                a.get("Line", 0), level, "vale", f"{a.get('Check')}: {a.get('Message')}"))
    return out


def _collect(paths):
    files = []
    for p in paths:
        path = Path(p)
        if path.is_dir():
            found = sorted(str(f) for f in path.rglob("*.md") if f.is_file())
            if not found:
                return None, f"no Markdown files in {p}"
            files += found
        elif path.is_file():
            files.append(p)
        else:
            return None, f"no such file or directory: {p}"
    texts = {}
    for f in files:
        try:
            data = Path(f).read_bytes()
            if b"\0" in data:
                raise UnicodeDecodeError("utf-8", data, 0, 1, "NUL byte")
            texts[f] = data.decode("utf-8")
        except UnicodeDecodeError:
            return None, f"not a UTF-8 text file: {f}"
        except OSError as e:
            return None, f"cannot read {f}: {e.strerror}"
    return texts, None


def main(argv=None):
    parser = argparse.ArgumentParser(
        prog="check.py", description="Check Markdown prose: sentence length, stop words, "
        "LLM markers, dashes, broken links, dated phrases, Russian typography.")
    parser.add_argument("paths", nargs="*", metavar="PATH", help="Markdown file or directory")
    parser.add_argument("--lang", choices=["en", "ru", "auto"], default="auto")
    parser.add_argument("--max-words", type=int, help="sentence length guide "
                        "(default: 30 for en, 25 for ru)")
    parser.add_argument("--format", choices=["text", "json"], default="text")
    parser.add_argument("--check-urls", action="store_true", help="also fetch external URLs")
    parser.add_argument("--strict", action="store_true", help="treat warnings as errors")
    parser.add_argument("--verbose", action="store_true")
    args = parser.parse_args(argv)
    if not args.paths:
        parser.print_help()
        return 2
    texts, err = _collect(args.paths)
    if err:
        print(f"check.py: error: {err}", file=sys.stderr)
        return 2

    results, no_prose = [], []
    vale = run_vale(list(texts), args.verbose)
    for f, text in texts.items():
        findings, doc = _analyze(text, args.lang, f, args.max_words, args.check_urls)
        findings = sorted(findings + vale.get(f, []), key=lambda x: (x.line, x.rule))
        if not findings and not doc.has_prose():
            no_prose.append(f)
        for x in findings:
            level = "error" if args.strict else x.level
            results.append({"path": f, "line": x.line, "level": level,
                            "rule": x.rule, "message": x.message})

    errors = sum(r["level"] == "error" for r in results)
    warnings = len(results) - errors
    if args.format == "json":
        print(json.dumps({"findings": results, "errors": errors, "warnings": warnings,
                          "files": len(texts), "no_prose": no_prose},
                         ensure_ascii=False, indent=2))
    else:
        for f in no_prose:
            print(f"{f}: no prose to check")
        for r in results:
            print(f"{r['path']}:{r['line']}: {r['level']} {r['rule']}: {r['message']}")
        print(f"{errors} error(s), {warnings} warning(s) in {len(texts)} file(s)")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
