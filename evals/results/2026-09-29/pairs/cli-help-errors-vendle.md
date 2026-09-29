# Пара cli-help-errors-vendle

Язык: en. Вид: create.

Запрос:

> Write the `--help` text for `vendle publish` and the error messages for three failure cases. Vendle is our package manager.
> 
> `vendle publish <PACKAGE_DIR>` publishes the package in PACKAGE_DIR to a registry.
> 
> Options:
> - `--registry URL`: registry to publish to. Default `https://registry.vendle.example`.
> - `--tag TAG`: distribution tag. Default `latest`.
> - `--dry-run`: check and pack, don't upload.
> - `--otp CODE`: one-time password. Required if the account has two-factor authentication.
> 
> Exit codes: 0 on success, 1 when publishing failed, 2 on a usage error.
> 
> Errors I need messages for:
> 1. There is no `vendle.toml` in PACKAGE_DIR.
> 2. The version in `vendle.toml` is already on the registry (the registry answers HTTP 409). Published versions can't be overwritten; the user has to bump the version.
> 3. The account has two-factor authentication and `--otp` wasn't passed.

Факты:

- The command is vendle publish <PACKAGE_DIR>; it publishes a package to a Vendle registry
- --registry URL sets the registry; default https://registry.vendle.example
- --tag TAG sets the distribution tag; default latest
- --dry-run checks and packs the package without uploading it
- --otp CODE passes a one-time password; it is required when the account has two-factor authentication enabled
- Exit codes: 0 success, 1 publish failed, 2 usage error
- Error 1: vendle.toml is missing in PACKAGE_DIR
- Error 2: the version from vendle.toml already exists on the registry (HTTP 409); published versions cannot be overwritten, so the fix is to bump the version
- Error 3: the account has two-factor authentication and --otp was not given

---

## X

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

---

## Y

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
