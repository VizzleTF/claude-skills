Here is the full text. The exit-code assignments in the last section are my assumption, so please check them.

## `vendle publish --help`

```
Publish a package to a registry.

Usage: vendle publish [OPTIONS] <PACKAGE_DIR>

Arguments:
  <PACKAGE_DIR>  Directory that contains vendle.toml

Options:
      --registry <URL>  Registry to publish to
                        [default: https://registry.vendle.example]
      --tag <TAG>       Distribution tag [default: latest]
      --dry-run         Check and pack the package, but don't upload it
      --otp <CODE>      One-time password. Required if the account uses
                        two-factor authentication
      --help            Print this help

Exit codes:
  0  Published
  1  Publishing failed
  2  Usage error

Examples:
  vendle publish ./my-package --dry-run
  vendle publish ./my-package --otp 123456
```

## Error messages

**1. No `vendle.toml` in PACKAGE_DIR**

```
error: no vendle.toml found in {PACKAGE_DIR}
  Pass the directory that contains vendle.toml: vendle publish <PACKAGE_DIR>
```

**2. Version already on the registry (HTTP 409)**

```
error: {NAME} {VERSION} is already published to {REGISTRY}
  Published versions can't be overwritten. Increase "version" in
  vendle.toml, then run vendle publish again.
```

**3. Two-factor authentication enabled, `--otp` not passed**

```
error: this account uses two-factor authentication, but no one-time password was given
  Pass the current code: vendle publish {PACKAGE_DIR} --otp <CODE>
```

Placeholders in `{BRACES}` are filled in at runtime. `<ANGLE>` placeholders are meant to be typed by the user.

## Exit codes

I assumed all three errors exit with code 1. The arguments were valid and the failure came from the directory contents or the registry's response, so I didn't treat them as usage errors. If you count a missing `--otp` as a usage error, that case would exit with 2.
