I drafted the `--help` text and the three error messages below. I didn't run them through the style checker, and nobody else has read them yet.

## `vendle publish --help`

```
Usage: vendle publish [OPTIONS] <PACKAGE_DIR>

Publish the package in PACKAGE_DIR to a registry.

Arguments:
  <PACKAGE_DIR>     Directory that contains vendle.toml

Options:
  --registry <URL>  Publish to this registry [default: https://registry.vendle.example]
  --tag <TAG>       Publish under this distribution tag [default: latest]
  --dry-run         Check and pack the package, but don't upload it
  --otp <CODE>      Send this one-time password. Required if your account has two-factor authentication
  -h, --help        Print this help

Exit codes:
  0  Success
  1  Publishing failed
  2  Usage error

Examples:
  vendle publish ./my-lib --dry-run
  vendle publish ./my-lib --tag beta --otp 123456

Documentation: <DOCS_URL>
```

## Error messages

The tool fills in the values in angle brackets when it prints the message.

**1. No `vendle.toml` in PACKAGE_DIR**

```
error: no vendle.toml in "<PACKAGE_DIR>".
Pass the directory that contains the package's vendle.toml, for example: vendle publish ./my-lib
```

**2. The version is already on the registry (HTTP 409)**

```
error: <NAME> <VERSION> is already on <REGISTRY> (HTTP 409 Conflict). Published versions can't be overwritten.
Increase the version in <PACKAGE_DIR>/vendle.toml, then publish again.
```

**3. Two-factor authentication is on and `--otp` is missing**

```
error: your account has two-factor authentication, so publishing needs a one-time password.
Run the command again with --otp, for example: vendle publish <PACKAGE_DIR> --otp <CODE>
```

Questions:
- What is the documentation URL for `<DOCS_URL>`?
- Should error 1 exit with code 2 (usage error) or code 1 (publishing failed)?
