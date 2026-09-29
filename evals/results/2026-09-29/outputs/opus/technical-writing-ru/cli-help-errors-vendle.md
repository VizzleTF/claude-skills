The style guide I used is written for Russian text, so I skipped its Russian-language rules and applied only the general ones.

# `vendle publish`: help text and error messages

## `vendle publish --help`

```
Usage: vendle publish [OPTIONS] <PACKAGE_DIR>

Publish the package in PACKAGE_DIR to a registry.

Arguments:
  <PACKAGE_DIR>    Package directory. Must contain vendle.toml.

Options:
  --registry URL   Publish to the registry at URL.
                   Default: https://registry.vendle.example
  --tag TAG        Publish under the distribution tag TAG. Default: latest
  --dry-run        Check and pack the package without uploading it.
  --otp CODE       Send the one-time password CODE. Required if your
                   account has two-factor authentication.
  --help           Print this help.

Exit codes:
  0  Success.
  1  Publishing failed.
  2  Usage error.

Examples:
  vendle publish .
  vendle publish --dry-run ./my-package
  vendle publish --tag beta ./my-package

Documentation: <DOCS_URL>
```

## Error messages

Values in braces are filled in when the error happens.

### 1. `vendle.toml` is missing from PACKAGE_DIR

Exit code 2.

```
error: no vendle.toml in "{package_dir}".
PACKAGE_DIR must be the package directory, the one that contains vendle.toml.
Check the path, or run the command from the package directory: vendle publish .
```

### 2. The version is already on the registry (HTTP 409)

Exit code 1.

```
error: {name}@{version} is already published on {registry} (HTTP 409 Conflict).
Published versions can't be overwritten. Increase "version" in {package_dir}/vendle.toml, then publish again.
```

### 3. Two-factor authentication is on and `--otp` wasn't passed

Exit code 1.

```
error: {registry} requires a one-time password because your account has two-factor authentication.
Run the command again with your current code: vendle publish --otp <CODE> {package_dir}
```

---

- What documentation URL should replace `<DOCS_URL>`?
- I used exit code 2 for a missing `vendle.toml` because the PACKAGE_DIR argument is wrong. Should it be 1 instead?
