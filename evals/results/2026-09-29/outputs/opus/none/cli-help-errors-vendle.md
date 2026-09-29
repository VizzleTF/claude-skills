# `vendle publish`: help text and error messages

## `--help` output

```
Usage: vendle publish [OPTIONS] <PACKAGE_DIR>

Publish the package in PACKAGE_DIR to a registry.

PACKAGE_DIR must contain a vendle.toml file. Once a version is on the
registry, you can't overwrite it. To publish changes, increase the version
in vendle.toml.

Arguments:
  <PACKAGE_DIR>     Directory that contains the package's vendle.toml

Options:
  --registry URL    Registry to publish to
                    [default: https://registry.vendle.example]
  --tag TAG         Distribution tag to point at this version
                    [default: latest]
  --dry-run         Check and pack the package, but don't upload it
  --otp CODE        One-time password from your authenticator app.
                    Required if your account has two-factor authentication.
  -h, --help        Show this help and exit

Exit status:
  0   The package was published, or the --dry-run passed
  1   Publishing failed
  2   Usage error, such as a missing argument or an unknown option

Examples:
  vendle publish .
  vendle publish ./my-pkg --tag beta
  vendle publish ./my-pkg --dry-run
  vendle publish ./my-pkg --otp 123456
```

## Error messages

Placeholders are in `{braces}`. Each message is written to stderr.

### 1. No `vendle.toml` in PACKAGE_DIR

```
error: no vendle.toml found in {PACKAGE_DIR}

vendle publish needs a directory that contains a vendle.toml file.
Check the path, or run the command from your package's root directory.
```

Exit code: **1**

### 2. Version already on the registry (HTTP 409)

```
error: {package}@{version} is already on {registry}

You can't overwrite a version after it's published.
Increase the version in {PACKAGE_DIR}/vendle.toml, then publish again.
```

Exit code: **1**

### 3. Two-factor authentication is on and `--otp` wasn't passed

```
error: your account requires a one-time password to publish

Two-factor authentication is on for your account. Run the command again
with the current code from your authenticator app:

  vendle publish {PACKAGE_DIR} --otp <CODE>
```

Exit code: **1**

---

**Decision for you on case 1:** I used exit code 1 because the arguments parsed correctly and the failure came from the contents of the directory. If you count "PACKAGE_DIR isn't a package" as a usage error, change it to 2. Whichever you choose, make it consistent with how other commands handle a bad path.
