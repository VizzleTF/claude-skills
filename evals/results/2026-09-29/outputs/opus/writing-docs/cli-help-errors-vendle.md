Here are the help text and the three error messages. I made two choices you didn't specify, listed after the document.

---

## `vendle publish --help`

```
Publish a package to a registry.

Usage: vendle publish [OPTIONS] <PACKAGE_DIR>

Arguments:
  <PACKAGE_DIR>  Package root: the directory that contains vendle.toml

Options:
  --registry <URL>  Registry to publish to
                    [default: https://registry.vendle.example]
  --tag <TAG>       Distribution tag to point at this version [default: latest]
  --dry-run         Check and pack the package, but don't upload it
  --otp <CODE>      One-time password from your authenticator app.
                    Required if your account uses two-factor authentication.
  --help            Print this help

Exit status:
  0  Published. With --dry-run: checked and packed.
  1  Publishing failed
  2  Usage error

Examples:
  vendle publish .
  vendle publish ./mypkg --dry-run
  vendle publish ./mypkg --tag beta --otp 123456
```

## Error messages

Each message goes to stderr. The first line says what went wrong. The indented lines say what to do next.

### 1. No `vendle.toml` in PACKAGE_DIR (exit 2)

```
error: no vendle.toml in ./mypkg
  PACKAGE_DIR must be the package root, the directory that contains vendle.toml.
  Check the path, or run `vendle publish` from the package root: vendle publish .
```

### 2. Version already on the registry, HTTP 409 (exit 1)

```
error: mypkg 1.4.0 is already published on https://registry.vendle.example (HTTP 409)
  Published versions can't be overwritten.
  Bump `version` in ./mypkg/vendle.toml, then publish again.
```

### 3. Two-factor authentication on, `--otp` missing (exit 1)

```
error: your account uses two-factor authentication, so a one-time password is required
  Nothing was published. Run the command again with the code from your authenticator app:
  vendle publish ./mypkg --otp <CODE>
```

---

**Two choices to confirm:**

- **Exit codes for the errors.** I used 2 for a missing `vendle.toml` because the argument doesn't point to a package, so it's a usage error. I used 1 for the 409 and the missing OTP because vendle only finds out about those from the registry. If you count a missing `--otp` as a usage error, change case 3 to exit 2.
- **Values in the messages.** `./mypkg`, `mypkg 1.4.0` and the registry URL are example values. Replace them with the real path, package name, version and `--registry` value. Showing the registry URL in case 2 tells users which registry already has that version when they didn't use the default.
