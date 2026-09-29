# fd

[![CICD](https://github.com/sharkdp/fd/actions/workflows/CICD.yml/badge.svg)](https://github.com/sharkdp/fd/actions/workflows/CICD.yml)
[![Version info](https://img.shields.io/crates/v/fd-find.svg)](https://crates.io/crates/fd-find)

`fd` finds entries in your filesystem. It is a simple, fast and user-friendly alternative to [`find`](https://www.gnu.org/software/findutils/). It does not aim to support all of `find`'s functionality. Instead it has sensible, opinionated defaults for most use cases.

- **Short syntax:** `fd PATTERN` instead of `find -iname '*PATTERN*'`.
- **Fast:** directory traversal is parallelized ([benchmark](docs/benchmark.md)).
- **Smart defaults:** case-insensitive unless the pattern has an uppercase letter. Hidden files and `.gitignore` patterns are skipped.
- **Patterns:** regular expressions (default) or globs. Output is colored by file type, like `ls`.

## Install

| Platform | Command |
|---|---|
| Ubuntu 19.04+, Debian Buster+ | `apt install fd-find` (see the note below) |
| Fedora 28+ | `dnf install fd-find` |
| Arch Linux | `pacman -S fd` |
| macOS | `brew install fd` |
| Windows | `winget install sharkdp.fd` (or `scoop install fd`, `choco install fd`) |
| Any, with Rust 1.90.0+ and `make` | `cargo install fd-find` |

On Ubuntu and Debian the binary is called `fdfind`, because another package already uses the name `fd`. To get `fd`, run `ln -s $(which fdfind) ~/.local/bin/fd` and make sure `$HOME/.local/bin` is in your `$PATH`.

Precompiled binaries for Linux, macOS and Windows are on the [release page](https://github.com/sharkdp/fd/releases). Archives with `musl` in the name are statically linked. For other platforms, see [all installation options](docs/installation.md).

## Example

```bash
> fd netfl                # entries in the current directory whose name contains "netfl"
Software/python/imdb-ratings/netflix-details.py

> fd -e md                # all Markdown files
CONTRIBUTING.md
README.md

> fd passwd /etc          # search in a given directory
/etc/default/passwd
/etc/pam.d/passwd
/etc/passwd
```

Run `fd -h` for a short help message or `fd --help` for a detailed one.

## More

- [Usage guide](docs/usage.md): regular expressions, globs, extensions, running commands on results
- [Installation](docs/installation.md): all platforms
- [Benchmark](docs/benchmark.md)
- [Troubleshooting](docs/troubleshooting.md)
- Translations: [中文](https://github.com/cha0ran/fd-zh), [한국어](https://github.com/spearkkk/fd-kor)

## Maintainers

[sharkdp](https://github.com/sharkdp), [tmccombs](https://github.com/tmccombs), [tavianator](https://github.com/tavianator)

## License

Distributed under the terms of both the MIT License and the Apache License 2.0. See [LICENSE-APACHE](LICENSE-APACHE) and [LICENSE-MIT](LICENSE-MIT).

---

Notes for you (not part of the README):
- The four `docs/*.md` paths are my placeholders. Rename them to match where you put the cut sections. `docs/installation.md` should hold the full install list from the original.
- I dropped the demo screencast and the "command name is 50% shorter" joke to fit one screen.
- The excerpt doesn't say who `fd` is for. "Who it's for" is only implied by the comparison to `find` and the "defaults for most use cases" line.
- I didn't run anything, so I haven't checked how the README renders.
