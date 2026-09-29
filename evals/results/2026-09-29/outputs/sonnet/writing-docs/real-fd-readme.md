# fd

[![CICD](https://github.com/sharkdp/fd/actions/workflows/CICD.yml/badge.svg)](https://github.com/sharkdp/fd/actions/workflows/CICD.yml) [![Version info](https://img.shields.io/crates/v/fd-find.svg)](https://crates.io/crates/fd-find)

`fd` finds entries in your filesystem. It is a simple, fast and user-friendly alternative to [`find`](https://www.gnu.org/software/findutils/). It does not aim to support all of `find`'s functionality, but its defaults suit most use cases. If you type `find -iname '*PATTERN*'`, you can type `fd PATTERN` instead.

- Regular expression (default) or glob patterns.
- Fast: directory traversal is parallelized.
- Smart case: case-insensitive, unless the pattern contains an uppercase character.
- Skips hidden files and anything matched by your `.gitignore`.
- Colors file types the same way as `ls`.

## Example

```bash
> fd netfl               # entries whose name contains "netfl", searched recursively from here
Software/python/imdb-ratings/netflix-details.py
> fd -e md               # all Markdown files
> fd passwd /etc         # search in a specific directory
```

## Install

| Platform | Command |
|---|---|
| Ubuntu 19.04+, Debian Buster+ | `apt install fd-find` (see note) |
| Fedora 28+ | `dnf install fd-find` |
| Arch Linux | `pacman -S fd` |
| macOS | `brew install fd` |
| Windows | `winget install sharkdp.fd` (or `scoop install fd`, `choco install fd`) |
| Any, with Rust 1.90.0+ and `make` | `cargo install fd-find` |

Note for Debian and Ubuntu: the binary is called `fdfind`, because `fd` is taken by another package. Link it with `ln -s $(which fdfind) ~/.local/bin/fd` and make sure `$HOME/.local/bin` is in your `$PATH`.

Precompiled binaries for Linux, macOS and Windows are on the [release page](https://github.com/sharkdp/fd/releases). Archives with `musl` in the name are statically linked.

## Learn more

[All install options](docs/INSTALL.md) • [Usage guide](docs/USAGE.md) • [Benchmark](docs/BENCHMARK.md) • [Troubleshooting](docs/TROUBLESHOOTING.md)

Run `fd -h` for a short help message or `fd --help` for the detailed one. Translations: [中文](https://github.com/cha0ran/fd-zh), [한국어](https://github.com/spearkkk/fd-kor).

## Maintainers and license

Maintained by [sharkdp](https://github.com/sharkdp), [tmccombs](https://github.com/tmccombs) and [tavianator](https://github.com/tavianator). Distributed under both the MIT License and the Apache License 2.0: see [LICENSE-MIT](LICENSE-MIT) and [LICENSE-APACHE](LICENSE-APACHE).

---

Notes for you, not part of the README:
- The link targets `docs/INSTALL.md`, `docs/USAGE.md`, `docs/BENCHMARK.md` and `docs/TROUBLESHOOTING.md` are placeholder names. Adjust them to your real paths.
- `docs/INSTALL.md` needs the install sections I cut: Alpine, Gentoo, openSUSE, Void, ALT, Solus, RHEL family (Copr/EPEL), Guix, mise, Nix, Flox, FreeBSD, npm, and the `.deb` route for Ubuntu older than 19.04.
- I dropped the demo screencast, the packaging-status badge and the 50%-shorter joke. The screencast fits better in the usage guide.
- "Who it is for" is inferred from the file (people who use `find`). The excerpt has no explicit audience statement.
