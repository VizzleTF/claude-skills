# fd

`fd` finds entries in your filesystem. It is a simple, fast alternative to [`find`](https://www.gnu.org/software/findutils/) for people who search the filesystem from the command line. It does not aim to support all of `find`'s functionality, but its defaults cover most searches:

- The syntax is `fd PATTERN` instead of `find -iname '*PATTERN*'`.
- Patterns are regular expressions by default, or globs with `-g`.
- Directory traversal runs in parallel.
- Hidden files and patterns from your `.gitignore` are ignored.
- The search is case-insensitive unless the pattern contains an uppercase character.

## Install

| Platform | Command |
|---|---|
| macOS | `brew install fd` |
| Windows | `winget install sharkdp.fd` |
| Ubuntu 19.04+, Debian Buster+ | `apt install fd-find` |
| Fedora 28+ | `dnf install fd-find` |
| Arch Linux | `pacman -S fd` |
| Any, with Rust 1.90.0+ and `make` | `cargo install fd-find` |

On Ubuntu and Debian the binary is called `fdfind`. To run it as `fd`, link it and make sure `$HOME/.local/bin` is in your `$PATH`:

```bash
ln -s $(which fdfind) ~/.local/bin/fd
```

Other platforms and precompiled binaries: [installation](docs/installation.md).

## Try it

Search the current directory recursively for entries that contain `netfl`:

```bash
> fd netfl
Software/python/imdb-ratings/netflix-details.py
```

## More

- [Usage guide](docs/usage.md): regular expressions, file extensions, globs, command execution
- [Benchmark](docs/benchmark.md)
- [Troubleshooting](docs/troubleshooting.md)
- `fd -h` prints a short help message and `fd --help` a detailed one.
- License: MIT or Apache 2.0, see [LICENSE-MIT](LICENSE-MIT) and [LICENSE-APACHE](LICENSE-APACHE).
