"""Tests for scripts/check.py through its public seams: check_text() and the CLI."""

import contextlib
import importlib.util
import io
import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

ROOT = Path(__file__).resolve().parent.parent
SCRIPT = ROOT / "plugins/technical-writing/skills/technical-writing/scripts/check.py"
SCRIPT_RU = ROOT / "plugins/technical-writing-ru/skills/technical-writing-ru/scripts/check.py"

_spec = importlib.util.spec_from_file_location("check", SCRIPT)
check = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(check)


def rules(findings):
    return [f.rule for f in findings]


def words(n, word="word"):
    return " ".join([word] * n)


class SentenceLength(unittest.TestCase):
    def test_sentence_across_three_lines_is_one_sentence(self):
        text = f"The {words(13)}\n{words(13)}\n{words(12)} end.\n"  # 40 words
        found = check.check_text(text, "en")
        self.assertEqual(rules(found), ["sentence-length"])
        self.assertEqual(found[0].line, 1)
        self.assertEqual(found[0].level, "warning")

    def test_short_sentences_on_separate_lines(self):
        text = "The build runs.\nThe test passes.\nThe deploy starts.\n"
        self.assertEqual(check.check_text(text, "en"), [])

    def test_max_words_flag(self):
        text = f"The {words(19)}.\n"  # 20 words
        self.assertEqual(check.check_text(text, "en"), [])
        self.assertEqual(rules(check.check_text(text, "en", max_words=15)), ["sentence-length"])

    def test_russian_default_is_25(self):
        text = f"Это {words(26, 'слово')}.\n"  # 27 words
        self.assertEqual(rules(check.check_text(text, "ru")), ["sentence-length"])
        self.assertEqual(check.check_text(text, "en"), [])

    def test_list_items_are_separate(self):
        text = "".join(f"- item {words(10)}\n" for _ in range(5))
        self.assertEqual(check.check_text(text, "en"), [])

    def test_abbreviations_do_not_end_sentence(self):
        # 7, 6 and 6 words: with max 5 each is one long sentence only if not split early
        for text in ("Use a flag, e.g. Verbose mode here.\n", "See Fig. Three for the layout.\n",
                     "Written by J. Smith and team.\n"):
            self.assertEqual(rules(check.check_text(text, "en", max_words=5)),
                             ["sentence-length"], text)

    def test_inline_code_starting_a_sentence_splits(self):
        # 4 + 5 counted words; joined they would be 9 > 6
        text = "Run it now please. `kubectl` is the tool we use.\n"
        self.assertEqual(check.check_text(text, "en", max_words=6), [])


class NotProse(unittest.TestCase):
    long_line = words(60, "simply") + " 2024 currently delve"

    def test_fenced_code(self):
        text = f"Run this.\n\n```bash\n{self.long_line}\n```\n\n~~~\n{self.long_line}\n~~~\n"
        self.assertEqual(check.check_text(text, "en"), [])

    def test_inline_code(self):
        text = f"Run `{self.long_line}` now.\n"
        self.assertEqual(check.check_text(text, "en"), [])

    def test_table_not_counted_for_sentence_length(self):
        text = f"| a | b |\n|---|---|\n| {words(50)} | x |\n"
        self.assertEqual(check.check_text(text, "en"), [])

    def test_frontmatter(self):
        text = f"---\nname: x\ndescription: {self.long_line}\n---\n\n# Title\n"
        self.assertEqual(check.check_text(text, "en"), [])

    def test_url_and_html_comment(self):
        text = (
            "See https://example.com/2024/simply/delve for details.\n\n"
            f"<!--\n{self.long_line}\n-->\n\nSee <https://example.com/2023>.\n"
        )
        self.assertEqual(check.check_text(text, "en"), [])


class WordRules(unittest.TestCase):
    def test_stop_word(self):
        found = check.check_text("This is simply the fix.\n", "en")
        self.assertEqual(rules(found), ["stop-word"])
        self.assertEqual(found[0].level, "warning")
        self.assertEqual(check.check_text("This is the fix.\n", "en"), [])

    def test_stop_word_in_table_cell(self):
        text = "| a | b |\n|---|---|\n| simply | x |\n"
        found = check.check_text(text, "en")
        self.assertEqual(rules(found), ["stop-word"])
        self.assertEqual(found[0].line, 3)

    def test_stop_word_ru(self):
        self.assertEqual(rules(check.check_text("Это очень важно.\n", "ru")), ["stop-word"])
        self.assertEqual(check.check_text("Это важно.\n", "ru"), [])

    def test_llm_marker(self):
        self.assertEqual(rules(check.check_text("We delve into logs.\n", "en")), ["llm-marker"])
        self.assertEqual(
            rules(check.check_text("It is not just fast but safe.\n", "en")), ["llm-marker"]
        )
        self.assertEqual(check.check_text("We read the logs.\n", "en"), [])

    def test_llm_marker_across_line_break(self):
        found = check.check_text("It's worth\nnoting that logs rotate.\n", "en")
        self.assertEqual(rules(found), ["llm-marker"])
        self.assertEqual(found[0].line, 1)

    def test_llm_marker_ru(self):
        self.assertEqual(rules(check.check_text("Сервис является шлюзом.\n", "ru")), ["llm-marker"])
        self.assertEqual(
            rules(check.check_text("Это не просто кеш, а хранилище.\n", "ru")), ["llm-marker"]
        )
        self.assertEqual(check.check_text("Сервис принимает запросы.\n", "ru"), [])

    def test_dash_density(self):
        text = "The job — the nightly one — fails when disk — the root one — fills.\n"
        self.assertEqual(rules(check.check_text(text, "en")), ["dash-density"])
        self.assertEqual(check.check_text("The job fails — the disk is full.\n", "en"), [])

    def test_dated_phrase(self):
        self.assertEqual(rules(check.check_text("In 2025 we moved.\n", "en")), ["dated-phrase"])
        self.assertEqual(rules(check.check_text("It currently works.\n", "en")), ["dated-phrase"])
        self.assertEqual(rules(check.check_text("Сейчас это работает.\n", "ru")), ["dated-phrase"])
        self.assertEqual(check.check_text("Version 2 works on port 8080.\n", "en"), [])

    def test_dated_phrase_needs_year_context(self):
        for text, lang in (("Released on 2025-03-01.\n", "en"), ("Since March 2024 it runs.\n", "en"),
                           ("Это было в 2026 году.\n", "ru"), ("Итоги 2025 года.\n", "ru")):
            self.assertEqual(rules(check.check_text(text, lang)), ["dated-phrase"], text)
        self.assertEqual(check.check_text("Use port 2080 and a 2000 ms timeout.\n", "en"), [])
        self.assertEqual(check.check_text("Порт 2080 и таймаут 2000 мс.\n", "ru"), [])


class RussianTypography(unittest.TestCase):
    def test_quotes(self):
        found = check.check_text('Нажмите "OK".\n', "ru")
        self.assertEqual(rules(found), ["ru-quotes"])
        self.assertEqual(found[0].level, "error")
        self.assertEqual(check.check_text("Нажмите «OK».\n", "ru"), [])
        self.assertEqual(check.check_text('Press "OK".\n', "en"), [])

    def test_dash(self):
        found = check.check_text("Кеш - это память.\n", "ru")
        self.assertEqual(rules(found), ["ru-dash"])
        self.assertEqual(found[0].level, "error")
        self.assertEqual(check.check_text("Кто-то пишет код.\n", "ru"), [])

    def test_numeric_range_gets_en_dash_advice(self):
        found = check.check_text("Нужно 10 - 20 узлов.\n", "ru")
        self.assertEqual(rules(found), ["ru-dash"])
        self.assertIn("10–20", found[0].message)
        self.assertNotIn("em dash", found[0].message)

    def test_yo(self):
        self.assertEqual(rules(check.check_text("Попробуйте еще раз.\n", "ru")), ["ru-yo"])
        self.assertEqual(rules(check.check_text("Мне все равно.\n", "ru")), ["ru-yo"])
        self.assertEqual(rules(check.check_text("Спросите ее.\n", "ru")), ["ru-yo"])
        self.assertEqual(check.check_text("Пришли все.\n", "ru"), [])
        self.assertEqual(check.check_text("Попробуйте ещё раз.\n", "ru"), [])
        self.assertEqual(check.check_text("Удалите все файлы.\n", "ru"), [])

    def test_nbsp_before_dash(self):
        found = check.check_text("Кеш — это память.\n", "ru")
        self.assertEqual(rules(found), ["ru-nbsp"])
        self.assertEqual(check.check_text("Кеш — это память.\n", "ru"), [])

    def test_auto_language(self):
        self.assertEqual(rules(check.check_text('Нажмите "OK" сейчас.\n', "auto")),
                         ["dated-phrase", "ru-quotes"])
        self.assertEqual(check.check_text('Press "OK" to go.\n', "auto"), [])


class Links(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.dir = Path(self.tmp.name)
        (self.dir / "other.md").write_text("# Other\n\n## Real heading\n", encoding="utf-8")
        self.path = str(self.dir / "doc.md")

    def tearDown(self):
        self.tmp.cleanup()

    def run_check(self, text, **kw):
        return check.check_text(text, "en", self.path, **kw)

    def test_broken_file_link(self):
        found = self.run_check("See [x](missing.md).\n")
        self.assertEqual(rules(found), ["broken-link"])
        self.assertEqual(found[0].level, "error")

    def test_good_links(self):
        text = (
            "# Doc\n\n## Setup steps\n\nSee [x](other.md), [y](other.md#real-heading), "
            "[z](#setup-steps) and [w](https://example.com/nope).\n\n"
            "[ref]: other.md\n\n`[a](missing.md)`\n"
        )
        self.assertEqual(self.run_check(text), [])

    def test_broken_anchor(self):
        self.assertEqual(rules(self.run_check("See [x](other.md#nope).\n")), ["broken-link"])
        self.assertEqual(rules(self.run_check("# Doc\n\nSee [x](#nope).\n")), ["broken-link"])

    def test_broken_reference_definition_and_table_link(self):
        self.assertEqual(rules(self.run_check("[ref]: gone.md\n")), ["broken-link"])
        text = "| a |\n|---|\n| [x](gone.md) |\n"
        self.assertEqual(rules(self.run_check(text)), ["broken-link"])

    def test_check_urls(self):
        text = "See [x](https://example.invalid/page).\n"
        with mock.patch.object(check.urllib.request, "urlopen", side_effect=OSError("down")):
            self.assertEqual(rules(self.run_check(text, check_urls=True)), ["broken-link"])
        with mock.patch.object(check.urllib.request, "urlopen") as ok:
            self.assertEqual(self.run_check(text, check_urls=True), [])
            ok.assert_called()


def run_cli(*args, cwd=None):
    return subprocess.run(
        [sys.executable, str(SCRIPT), *args],
        capture_output=True, text=True, cwd=cwd, env={**os.environ, "PATH": ""},
    )


def run_main(*args):
    out, err = io.StringIO(), io.StringIO()
    with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
        code = check.main(list(args))
    return code, out.getvalue(), err.getvalue()


class Cli(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.dir = Path(self.tmp.name)

    def tearDown(self):
        self.tmp.cleanup()

    def write(self, name, text):
        path = self.dir / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text, encoding="utf-8")
        return str(path)

    def test_no_arguments_prints_help(self):
        r = run_cli()
        self.assertEqual(r.returncode, 2)
        self.assertIn("usage", (r.stdout + r.stderr).lower())

    def test_missing_path(self):
        r = run_cli(str(self.dir / "nope.md"))
        self.assertEqual(r.returncode, 2)
        self.assertEqual(len(r.stderr.strip().splitlines()), 1)
        self.assertNotIn("Traceback", r.stderr)

    def test_binary_file(self):
        path = self.dir / "bin.md"
        path.write_bytes(b"\x00\xff\xfe\x00binary")
        r = run_cli(str(path))
        self.assertEqual(r.returncode, 2)
        self.assertEqual(len(r.stderr.strip().splitlines()), 1)
        self.assertNotIn("Traceback", r.stderr)

    def test_empty_file(self):
        r = run_cli(self.write("empty.md", ""))
        self.assertEqual(r.returncode, 0)
        self.assertIn("no prose to check", r.stdout)

    def test_output_format_and_exit_codes(self):
        warn = self.write("warn.md", "This is simply the fix.\n")
        r = run_cli(warn)
        self.assertEqual(r.returncode, 0)
        self.assertIn(f"{warn}:1: warning stop-word:", r.stdout)
        self.assertEqual(run_cli("--strict", warn).returncode, 1)
        err = self.write("err.md", "See [x](gone.md).\n")
        r = run_cli(err)
        self.assertEqual(r.returncode, 1)
        self.assertIn(f"{err}:1: error broken-link:", r.stdout)

    def test_directory_is_recursive_and_json(self):
        self.write("a.md", "This is simply the fix.\n")
        self.write("sub/b.md", "It currently works.\n")
        self.write("sub/c.txt", "This is simply ignored.\n")
        r = run_cli("--format", "json", str(self.dir))
        self.assertEqual(r.returncode, 0)
        data = json.loads(r.stdout)
        got = sorted((Path(f["path"]).name, f["rule"]) for f in data["findings"])
        self.assertEqual(got, [("a.md", "stop-word"), ("b.md", "dated-phrase")])
        self.assertEqual(set(data["findings"][0]), {"path", "line", "level", "rule", "message"})

    def test_lang_flag(self):
        path = self.write("ru.md", 'Нажмите "OK".\n')
        self.assertEqual(run_cli(path).returncode, 1)
        self.assertEqual(run_cli("--lang", "en", path).returncode, 0)


class Vale(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.dir = Path(self.tmp.name)
        self.doc = self.dir / "doc.md"
        self.doc.write_text("The build runs.\n", encoding="utf-8")
        self.cwd = os.getcwd()
        os.chdir(self.dir)

    def tearDown(self):
        os.chdir(self.cwd)
        self.tmp.cleanup()

    def test_not_installed(self):
        with mock.patch.object(check.shutil, "which", return_value=None):
            code, out, err = run_main("--verbose", str(self.doc))
            self.assertEqual(code, 0)
            self.assertIn("vale: not found, skipped", err)
            code, out, err = run_main(str(self.doc))
            self.assertNotIn("vale", err + out)

    def fake_vale(self, seen):
        def run(argv, **kw):
            seen.append(argv)
            config = next(a.split("=", 1)[1] for a in argv if a.startswith("--config="))
            seen.append(Path(config).read_text(encoding="utf-8"))
            payload = {str(self.doc): [
                {"Line": 1, "Severity": "error", "Check": "Vale.Spelling", "Message": "Did you mean 'x'?"},
                {"Line": 1, "Severity": "suggestion", "Check": "Vale.Terms", "Message": "Use 'y'."},
            ]}
            return subprocess.CompletedProcess(argv, 1, stdout=json.dumps(payload), stderr="")
        return run

    def test_builtin_style_through_temp_config(self):
        seen = []
        with mock.patch.object(check.shutil, "which", return_value="/usr/bin/vale"), \
             mock.patch.object(check.subprocess, "run", side_effect=self.fake_vale(seen)):
            code, out, err = run_main(str(self.doc))
        self.assertEqual(code, 0)
        self.assertIn("BasedOnStyles = Vale", seen[1])
        self.assertIn("Vale.Spelling = NO", seen[1])
        self.assertIn(":1: warning vale: Vale.Spelling: Did you mean 'x'?", out)
        self.assertIn(":1: warning vale: Vale.Terms:", out)

    def test_project_config_is_used(self):
        (self.dir / ".vale.ini").write_text("StylesPath = styles\n[*.md]\nBasedOnStyles = Vale\n", encoding="utf-8")
        seen = []
        with mock.patch.object(check.shutil, "which", return_value="/usr/bin/vale"), \
             mock.patch.object(check.subprocess, "run", side_effect=self.fake_vale(seen)):
            run_main(str(self.doc))
        self.assertIn(f"--config={self.dir.resolve() / '.vale.ini'}", seen[0])


class Copies(unittest.TestCase):
    def test_copies_are_identical(self):
        self.assertEqual(SCRIPT.read_bytes(), SCRIPT_RU.read_bytes())


if __name__ == "__main__":
    unittest.main()
