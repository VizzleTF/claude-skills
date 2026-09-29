# `vendle publish`

## `--help` text

```
Usage: vendle publish [OPTIONS] <PACKAGE_DIR>

Publish the package in PACKAGE_DIR to a registry.

Arguments:
  <PACKAGE_DIR>     Directory that contains vendle.toml

Options:
  --registry <URL>  Registry to publish to
                    [default: https://registry.vendle.example]
  --tag <TAG>       Distribution tag
                    [default: latest]
  --dry-run         Check and pack the package without uploading it
  --otp <CODE>      One-time password. Required if the account has
                    two-factor authentication

Exit codes:
  0  Success
  1  Publishing failed
  2  Usage error

Examples:
  vendle publish ./my-package
  vendle publish ./my-package --dry-run
  vendle publish ./my-package --tag beta --otp 123456

More: <DOCS_URL>
```

## Error messages

Each message is printed to stderr and exits with code 1.

**1. No `vendle.toml` in PACKAGE_DIR**

```
error: vendle.toml not found in "<PACKAGE_DIR>".
Pass a directory that contains vendle.toml, for example: vendle publish ./my-package
```

**2. Version already on the registry (HTTP 409)**

```
error: version <VERSION> of "<NAME>" is already published to <REGISTRY_URL>. A published version can't be overwritten.
Set a new version in vendle.toml and run vendle publish again.
```

**3. Two-factor authentication, `--otp` not passed**

```
error: the account requires a one-time password, but --otp was not passed.
Run the command again with --otp <CODE>, for example: vendle publish ./my-package --otp 123456
```

Questions:
1. What is the documentation URL for `<DOCS_URL>` in the `--help` footer?
2. Should a missing `--otp` exit with 1 (as written) or 2, since the user can fix it by changing the command line?
