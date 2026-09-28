id: real-fd-readme
lang: en
kind: update
expect: readme
core: false
fixtures: real-fd-readme/
expect_notes:
- The rework keeps facts from the source and does not invent new commands, flags or platforms
facts:
- fd is a program to find entries in the filesystem, a simple, fast and user-friendly alternative to find
- fd's defaults are opinionated and it does not aim to support all of find's functionality
- Install commands in the source include apt install fd-find (Ubuntu and Debian, binary named fdfind), brew install fd (macOS), winget install sharkdp.fd (Windows) and cargo install fd-find
- On Debian and Ubuntu the binary is called fdfind because the name fd is taken by another package
- By default fd ignores hidden files and directories and patterns from .gitignore, and uses smart case
- The fixture is an excerpt; the full usage, benchmark and troubleshooting sections were cut for the eval

The attached `README.md` is an excerpt of the README of fd, an open-source file finder. It is long and most of it is an install matrix for 20 platforms.

Rework it into a README that fits on one screen for someone who lands on the repository for the first time: what fd is, who it is for, how to install it on the common platforms, a minimal example, and links to the rest. Keep only facts that are in the file. Parts I cut out of this excerpt (full usage guide, benchmark, troubleshooting) can be linked as separate pages.
