```
Usage: vendle publish [OPTIONS] <PACKAGE_DIR>

Publish the package in PACKAGE_DIR to a registry.

Arguments:
  <PACKAGE_DIR>     Directory that contains vendle.toml

Options:
  --registry URL    Publish to this registry [default: https://registry.vendle.example]
  --tag TAG         Set the distribution tag [default: latest]
  --dry-run         Check and pack the package, but do not upload it
  --otp CODE        Send a one-time password (required if the account uses
                    two-factor authentication)

Exit codes:
  0  Published
  1  Publishing failed
  2  Usage error

Examples:
  vendle publish ./my-package
  vendle publish --dry-run --tag beta ./my-package

More: <DOCS_URL>
```

**Error: no `vendle.toml`**

```
Error: no vendle.toml found in "<PACKAGE_DIR>".
Pass the directory that contains vendle.toml, for example: vendle publish ./my-package
```

**Error: version already published (HTTP 409)**

```
Error: version <VERSION> of "<PACKAGE_NAME>" is already published on <REGISTRY_URL>. A published version cannot be overwritten.
Increase "version" in vendle.toml, then run vendle publish again.
```

**Error: two-factor authentication, no `--otp`**

```
Error: this account uses two-factor authentication, but --otp was not passed.
Run the command again with a one-time password: vendle publish --otp <CODE> <PACKAGE_DIR>
```

Questions:
- What is the documentation URL or `vendle help` topic for the last line of `--help` (`<DOCS_URL>`)?
- Should the missing `vendle.toml` and missing `--otp` errors exit with 1 (publishing failed) or 2 (usage error)?
