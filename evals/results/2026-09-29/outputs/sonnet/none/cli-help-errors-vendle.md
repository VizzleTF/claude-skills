Publishing help text and error messages for a package manager CLI — straightforward writing task, no tools needed.

## `--help` text

```
Usage: vendle publish [OPTIONS] <PACKAGE_DIR>

Publish the package in PACKAGE_DIR to a registry.

Arguments:
  <PACKAGE_DIR>      Path to the package directory (must contain vendle.toml)

Options:
      --registry URL   Registry to publish to
                        [default: https://registry.vendle.example]
      --tag TAG        Distribution tag to publish under
                        [default: latest]
      --dry-run        Check and pack the package, but don't upload it
      --otp CODE       One-time password; required if the account has
                        two-factor authentication enabled
  -h, --help           Print help

Exit codes:
  0    published successfully
  1    publish failed
  2    usage error
```

## Error messages

**1. Missing `vendle.toml`**
```
error: no vendle.toml found in `PACKAGE_DIR`

Expected a package manifest at PACKAGE_DIR/vendle.toml.
Run `vendle init` in that directory to create one.
```
Exit code: 2

**2. Version already published (HTTP 409)**
```
error: failed to publish package@1.2.3

Registry rejected the upload: version 1.2.3 already exists on
https://registry.vendle.example and cannot be overwritten.

Bump the version in vendle.toml and try again.
```
Exit code: 1

**3. Missing OTP for 2FA account**
```
error: failed to publish package@1.2.3

This account has two-factor authentication enabled. Provide a
one-time password with --otp <CODE> and try again.
```
Exit code: 1

Note: replace `package` with the actual package name and `PACKAGE_DIR`/`1.2.3` with the real path and version at runtime.
