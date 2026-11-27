#!/usr/bin/env python3
"""Pack plugins into zip files for upload to claude.ai (Customize > Plugins > upload).

Run from the repo root: python3 tools/pack.py [--out DIR] [--notes] [PLUGIN...]
PLUGIN is a directory name under plugins/; none means every plugin.
Each zip holds the plugin's git-tracked files with the plugin directory as the zip root,
named <plugin>-<version>.zip. Prints one zip path per line.
With --notes, prints the CHANGELOG entry of the plugin's current version instead of packing.
Exit code 0 on success, 1 on an unknown plugin or a missing CHANGELOG entry.
"""

import argparse
import json
import re
import subprocess
import sys
import zipfile
from pathlib import Path

MANIFEST = ".claude-plugin/plugin.json"
# Fixed timestamp so the same files give the same zip bytes.
ZIP_TIME = (1980, 1, 1, 0, 0, 0)


def plugin_version(plugin_dir):
    return json.loads((plugin_dir / MANIFEST).read_text(encoding="utf-8"))["version"]


def tracked_files(root, plugin_dir):
    rel = plugin_dir.relative_to(root).as_posix()
    out = subprocess.run(["git", "ls-files", "-z", "--", rel], cwd=root, capture_output=True, text=True, check=True)
    return sorted(Path(root, name) for name in out.stdout.split("\0") if name)


def pack(root, plugin_dir, out_dir):
    out_dir.mkdir(parents=True, exist_ok=True)
    target = out_dir / f"{plugin_dir.name}-{plugin_version(plugin_dir)}.zip"
    with zipfile.ZipFile(target, "w", zipfile.ZIP_DEFLATED) as zf:
        for path in tracked_files(root, plugin_dir):
            info = zipfile.ZipInfo(path.relative_to(plugin_dir).as_posix(), ZIP_TIME)
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = (path.stat().st_mode & 0o777 | 0o100000) << 16
            zf.writestr(info, path.read_bytes())
    return target


def changelog_entry(plugin_dir):
    version = plugin_version(plugin_dir)
    text = (plugin_dir / "CHANGELOG.md").read_text(encoding="utf-8")
    match = re.search(rf"^## \[{re.escape(version)}\].*?\n(.*?)(?=^## \[|\Z)", text, re.M | re.S)
    return match.group(1).strip() if match else None


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("plugins", nargs="*", metavar="PLUGIN")
    parser.add_argument("--out", default="dist", help="output directory (default: dist)")
    parser.add_argument("--notes", action="store_true", help="print the CHANGELOG entry of the current version")
    args = parser.parse_args(argv)

    root = Path.cwd()
    names = args.plugins or sorted(p.parent.parent.name for p in root.glob(f"plugins/*/{MANIFEST}"))
    status = 0
    for name in names:
        plugin_dir = root / "plugins" / name
        if not (plugin_dir / MANIFEST).is_file():
            print(f"plugins/{name}: no {MANIFEST}", file=sys.stderr)
            status = 1
            continue
        if args.notes:
            entry = changelog_entry(plugin_dir)
            if entry is None:
                print(f"plugins/{name}/CHANGELOG.md: no entry for {plugin_version(plugin_dir)}", file=sys.stderr)
                status = 1
            else:
                print(entry)
            continue
        print(pack(root, plugin_dir, root / args.out))
    return status


if __name__ == "__main__":
    sys.exit(main())
