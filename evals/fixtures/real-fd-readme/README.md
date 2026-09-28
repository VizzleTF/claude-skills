# fd

[![CICD](https://github.com/sharkdp/fd/actions/workflows/CICD.yml/badge.svg)](https://github.com/sharkdp/fd/actions/workflows/CICD.yml)
[![Version info](https://img.shields.io/crates/v/fd-find.svg)](https://crates.io/crates/fd-find)
[[中文](https://github.com/cha0ran/fd-zh)]
[[한국어](https://github.com/spearkkk/fd-kor)]

`fd` is a program to find entries in your filesystem.
It is a simple, fast and user-friendly alternative to [`find`](https://www.gnu.org/software/findutils/).
While it does not aim to support all of `find`'s powerful functionality, it provides sensible
(opinionated) defaults for a majority of use cases.

[Installation](#installation) • [How to use](#how-to-use) • [Troubleshooting](#troubleshooting)

## Features

* Intuitive syntax: `fd PATTERN` instead of `find -iname '*PATTERN*'`.
* Regular expression (default) and glob-based patterns.
* [Very fast](#benchmark) due to parallelized directory traversal.
* Uses colors to highlight different file types (same as `ls`).
* Supports [parallel command execution](#command-execution)
* Smart case: the search is case-insensitive by default. It switches to
  case-sensitive if the pattern contains an uppercase
  character[\*](http://vimdoc.sourceforge.net/htmldoc/options.html#'smartcase').
* Ignores hidden directories and files, by default.
* Ignores patterns from your `.gitignore`, by default.
* The command name is *50%* shorter[\*](https://github.com/ggreer/the_silver_searcher) than
  `find` :-).

## Demo

![Demo](doc/screencast.svg)

## How to use

First, to get an overview of all available command line options, you can either run
[`fd -h`](#command-line-options) for a concise help message or `fd --help` for a more detailed
version.

### Simple search

*fd* is designed to find entries in your filesystem. The most basic search you can perform is to
run *fd* with a single argument: the search pattern. For example, assume that you want to find an
old script of yours (the name included `netflix`):
``` bash
> fd netfl
Software/python/imdb-ratings/netflix-details.py
```
If called with just a single argument like this, *fd* searches the current directory recursively
for any entries that *contain* the pattern `netfl`.

### Regular expression search

The search pattern is treated as a regular expression. Here, we search for entries that start
with `x` and end with `rc`:
``` bash
> cd /etc
> fd '^x.*rc$'
X11/xinit/xinitrc
X11/xinit/xserverrc
```

The regular expression syntax used by `fd` is [documented here](https://docs.rs/regex/latest/regex/#syntax).

### Specifying the root directory

If we want to search a specific directory, it can be given as a second argument to *fd*:
``` bash
> fd passwd /etc
/etc/default/passwd
/etc/pam.d/passwd
/etc/passwd
```

### List all files, recursively

*fd* can be called with no arguments. This is very useful to get a quick overview of all entries
in the current directory, recursively (similar to `ls -R`):
``` bash
> cd fd/tests
> fd
testenv
testenv/mod.rs
tests.rs
```

If you want to use this functionality to list all files in a given directory, you have to use
a catch-all pattern such as `.` or `^`:
``` bash
> fd . fd/tests/
testenv
testenv/mod.rs
tests.rs
```

### Searching for a particular file extension

Often, we are interested in all files of a particular type. This can be done with the `-e` (or
`--extension`) option. Here, we search for all Markdown files in the fd repository:
``` bash
> cd fd
> fd -e md
CONTRIBUTING.md
README.md
```

The `-e` option can be used in combination with a search pattern:
``` bash
> fd -e rs mod
src/fshelper/mod.rs
src/lscolors/mod.rs
tests/testenv/mod.rs
```

### Searching for a particular file name

 To find files with exactly the provided search pattern, use the `-g` (or `--glob`) option:
``` bash
> fd -g libc.so /usr
/usr/lib32/libc.so
/usr/lib/libc.so
```

## Installation

[![Packaging status](https://repology.org/badge/vertical-allrepos/fd-find.svg)](https://repology.org/project/fd-find/versions)

### On Ubuntu
*... and other Debian-based Linux distributions.*

If you run Ubuntu 19.04 (Disco Dingo) or newer, you can install the
[officially maintained package](https://packages.ubuntu.com/fd-find):
```
apt install fd-find
```
Note that the binary is called `fdfind` as the binary name `fd` is already used by another package.
It is recommended that after installation, you add a link to `fd` by executing command
`ln -s $(which fdfind) ~/.local/bin/fd`, in order to use `fd` in the same way as in this documentation.
Make sure that `$HOME/.local/bin` is in your `$PATH`.

If you use an older version of Ubuntu, you can download the latest `.deb` package from the
[release page](https://github.com/sharkdp/fd/releases) and install it via:
``` bash
dpkg -i fd_9.0.0_amd64.deb # adapt version number and architecture
```

Note that the .deb packages on the release page for this project still name the executable `fd`.

### On Debian

If you run Debian Buster or newer, you can install the
[officially maintained Debian package](https://tracker.debian.org/pkg/rust-fd-find):
```
apt-get install fd-find
```
Note that the binary is called `fdfind` as the binary name `fd` is already used by another package.
It is recommended that after installation, you add a link to `fd` by executing command
`ln -s $(which fdfind) ~/.local/bin/fd`, in order to use `fd` in the same way as in this documentation.
Make sure that `$HOME/.local/bin` is in your `$PATH`.

Note that the .deb packages on the release page for this project still name the executable `fd`.

### On Fedora

Starting with Fedora 28, you can install `fd` from the official package sources:
``` bash
dnf install fd-find
```

### On Alpine Linux

You can install [the fd package](https://pkgs.alpinelinux.org/packages?name=fd)
from the official sources, provided you have the appropriate repository enabled:
```
apk add fd
```

### On Arch Linux

You can install [the fd package](https://www.archlinux.org/packages/extra/x86_64/fd/) from the official repos:
```
pacman -S fd
```
You can also install fd [from the AUR](https://aur.archlinux.org/packages/fd-git).

### On Gentoo Linux

You can use [the fd ebuild](https://packages.gentoo.org/packages/sys-apps/fd) from the official repo:
```
emerge -av fd
```

### On openSUSE Linux

You can install [the fd package](https://software.opensuse.org/package/fd) from the official repo:
```
zypper in fd
```

### On Void Linux

You can install `fd` via xbps-install:
```
xbps-install -S fd
```

### On ALT Linux

You can install [the fd package](https://packages.altlinux.org/en/sisyphus/srpms/fd/) from the official repo:
```
apt-get install fd
```

### On Solus

You can install [the fd package](https://github.com/getsolus/packages/tree/main/packages/f/fd) from the official repo:
```
eopkg install fd
```

### On RedHat Enterprise Linux (RHEL) 8/9/10, Almalinux 8/9/10, EuroLinux 8/9 or Rocky Linux 8/9/10

You can install [the `fd` package](https://copr.fedorainfracloud.org/coprs/tkbcopr/fd/) from Fedora Copr.

```bash
dnf copr enable tkbcopr/fd
dnf install fd
```

A different version using the [slower](https://github.com/sharkdp/fd/pull/481#issuecomment-534494592) malloc [instead of jemalloc](https://bugzilla.redhat.com/show_bug.cgi?id=2216193#c1) is also available from the EPEL8/9 repo as the package `fd-find`.

### On macOS

You can install `fd` with [Homebrew](https://formulae.brew.sh/formula/fd):
```
brew install fd
```

… or with MacPorts:
```
port install fd
```

### On Windows

You can download pre-built binaries from the [release page](https://github.com/sharkdp/fd/releases).

Alternatively, you can install `fd` via [Scoop](http://scoop.sh):
```
scoop install fd
```

Or via [Chocolatey](https://chocolatey.org):
```
choco install fd
```

Or via [Winget](https://learn.microsoft.com/en-us/windows/package-manager/):
```
winget install sharkdp.fd
```

### On GuixOS

You can install [the fd package](https://guix.gnu.org/en/packages/fd-8.1.1/) from the official repo:
```
guix install fd
```

### On Mise

You can use [mise](https://github.com/jdx/mise) to install `fd` with a command like this:
```
mise use -g fd@latest
```

### On NixOS / via Nix

You can use the [Nix package manager](https://nixos.org/nix/) to install `fd`:
```
nix-env -i fd
```

### Via Flox

You can use [Flox](https://flox.dev) to install `fd` into a Flox environment:
```
flox install fd
```

### On FreeBSD

You can install [the fd-find package](https://www.freshports.org/sysutils/fd) from the official repo:
```
pkg install fd-find
```

### From npm

On Linux and macOS, you can install the [fd-find](https://npm.im/fd-find) package:

```
npm install -g fd-find
```

### From source

With Rust's package manager [cargo](https://github.com/rust-lang/cargo), you can install *fd* via:
```
cargo install fd-find
```
Note that rust version *1.90.0* or later is required.

`make` is also needed for the build.

### From binaries

The [release page](https://github.com/sharkdp/fd/releases) includes precompiled binaries for Linux, macOS and Windows. Statically-linked binaries are also available: look for archives with `musl` in the file name.

## Maintainers

- [sharkdp](https://github.com/sharkdp)
- [tmccombs](https://github.com/tmccombs)
- [tavianator](https://github.com/tavianator)

## License

`fd` is distributed under the terms of both the MIT License and the Apache License 2.0.

See the [LICENSE-APACHE](LICENSE-APACHE) and [LICENSE-MIT](LICENSE-MIT) files for license details.
