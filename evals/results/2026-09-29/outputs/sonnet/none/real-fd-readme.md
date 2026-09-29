# fd

[![CICD](https://github.com/sharkdp/fd/actions/workflows/CICD.yml/badge.svg)](https://github.com/sharkdp/fd/actions/workflows/CICD.yml)
[![Version info](https://img.shields.io/crates/v/fd-find.svg)](https://crates.io/crates/fd-find)
[[中文](https://github.com/cha0ran/fd-zh)] [[한국어](https://github.com/spearkkk/fd-kor)]

`fd` is a simple, fast and user-friendly alternative to [`find`](https://www.gnu.org/software/findutils/) for finding entries in your filesystem. It does not aim to support all of `find`'s functionality. Instead it offers sensible, opinionated defaults for most use cases.

- **Simple syntax:** `fd PATTERN` instead of `find -iname '*PATTERN*'`
- **Fast:** parallelized directory traversal
- **Patterns:** regular expressions (default) or globs, with smart case
- **Quiet by default:** skips hidden files and anything in your `.gitignore`

## Install

| Platform | Command |
| --- | --- |
| Ubuntu 19.04+, Debian Buster+ | `apt install fd-find` (the binary is named `fdfind`, see note) |
| Fedora 28+ | `dnf install fd-find` |
| Arch Linux | `pacman -S fd` |
| macOS | `brew install fd` |
| Windows | `winget install sharkdp.fd` (or `scoop install fd`, `choco install fd`) |
| Any, from source | `cargo install fd-find` (needs Rust 1.90.0+ and `make`) |

Note for Debian/Ubuntu: `fd` is already taken by another package. Run `ln -s $(which fdfind) ~/.local/bin/fd` and make sure `~/.local/bin` is in your `$PATH`.

Precompiled binaries for Linux, macOS and Windows (including static `musl` builds) are on the [release page](https://github.com/sharkdp/fd/releases). Other platforms and package managers are listed in [all install options](doc/install.md).

## Example

```bash
> fd netfl                # entries whose name contains "netfl", searched recursively from here
Software/python/imdb-ratings/netflix-details.py

> fd -e md                # all Markdown files
CONTRIBUTING.md
README.md

> fd passwd /etc          # search a specific directory
/etc/default/passwd
/etc/pam.d/passwd
/etc/passwd
```

Run `fd -h` for a short help message or `fd --help` for the detailed one.

## More

[Usage guide](doc/usage.md) • [Benchmark](doc/benchmark.md) • [Troubleshooting](doc/troubleshooting.md) • [All install options](doc/install.md)

Maintainers: [sharkdp](https://github.com/sharkdp), [tmccombs](https://github.com/tmccombs), [tavianator](https://github.com/tavianator). Licensed under MIT or Apache 2.0 ([LICENSE-MIT](LICENSE-MIT), [LICENSE-APACHE](LICENSE-APACHE)).

---

The README no longer contains the full install list, usage guide, or demo screencast, so the four `doc/*.md` links above need those pages to exist. I picked the paths, so rename them as you like. The install list should move to `doc/install.md`, and the usage guide to `doc/usage.md`. Benchmark and troubleshooting weren't in the excerpt.

The excerpt doesn't say who fd is for, so the "who" line is inferred from its `find`-alternative framing. It's the sentence about sensible defaults instead of full `find` coverage.
