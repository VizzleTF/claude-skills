"""config.schema.json of tidemark stays in step with the tables in hooks/config.ts."""

import json
import re
import unittest
from pathlib import Path

MOD = Path(__file__).resolve().parent.parent / "plugins" / "tidemark"
CONFIG_TS = (MOD / "hooks" / "config.ts").read_text(encoding="utf-8")
SCHEMA = json.loads((MOD / "config.schema.json").read_text(encoding="utf-8"))


def top_keys(body):
    """Keys at the top level of an object literal body like `a: x, b: { c: 1 }`."""
    keys, depth, start = [], 0, 0
    for i, ch in enumerate(body + ","):
        if ch in "{[(":
            depth += 1
        elif ch in "}])":
            depth -= 1
        elif ch == "," and depth == 0:
            part = body[start:i].strip()
            if part:
                keys.append(part.split(":", 1)[0].strip())
            start = i + 1
    return keys


def ts_widget_options():
    """{widget: [option names]} read from WIDGET_OPTIONS; QUOTA is expanded."""
    consts = {"QUOTA": top_keys(re.search(r"const QUOTA = \{(.*)\}\n", CONFIG_TS).group(1))}
    block = re.search(r"export const WIDGET_OPTIONS[^=]*= \{\n(.*?)\n\}\n", CONFIG_TS, re.S).group(1)
    out = {}
    for line in block.splitlines():
        widget, value = line.strip().rstrip(",").split(":", 1)
        value = value.strip()
        out[widget] = consts[value] if value in consts else top_keys(value[1:-1])
    return out


def ts_list(name):
    return re.findall(r"'([^']+)'", re.search(rf"export const {name} = \[(.*?)\]", CONFIG_TS).group(1))


class SchemaTest(unittest.TestCase):
    def test_widgets_and_options(self):
        props = SCHEMA["properties"]["lines"]["items"]["items"]["anyOf"]
        ids = props[0]["enum"]
        schema_options = {
            p["properties"]["widget"]["const"]: list(p["properties"]["options"]["properties"]) for p in props[1:]
        }
        ts = ts_widget_options()
        self.assertEqual(ids, list(ts))
        self.assertEqual(schema_options, ts)

    def test_style_and_limits(self):
        style = SCHEMA["properties"]["style"]["properties"]
        self.assertEqual(style["separator"]["enum"], ts_list("SEPARATORS"))
        self.assertEqual(style["icons"]["enum"], ts_list("ICONS"))
        max_lines = int(re.search(r"export const MAX_LINES = (\d+)", CONFIG_TS).group(1))
        self.assertEqual(SCHEMA["properties"]["lines"]["maxItems"], max_lines)
        self.assertEqual(SCHEMA["$id"], re.search(r"export const SCHEMA_URL = '([^']+)'", CONFIG_TS).group(1))


if __name__ == "__main__":
    unittest.main()
