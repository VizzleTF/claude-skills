I'll write professional, actionable help text and error messages for `vendle publish`:

```
vendle publish - Publish a package to a registry

USAGE:
    vendle publish <PACKAGE_DIR> [OPTIONS]

ARGUMENTS:
    <PACKAGE_DIR>    Path to the package directory to publish

OPTIONS:
    --registry URL   Registry URL to publish to
                     (default: https://registry.vendle.example)
    --tag TAG        Distribution tag to use
                     (default: latest)
    --dry-run        Check and pack the package without uploading
    --otp CODE       One-time password for two-factor authentication
    -h, --help       Print help information

EXIT CODES:
    0    Package published successfully
    1    Publishing failed
    2    Usage error


ERROR MESSAGES:

1. Missing vendle.toml:
   error: no 'vendle.toml' file found in '<PACKAGE_DIR>'

2. Version already published (HTTP 409):
   error: version <VERSION> is already published to <REGISTRY>
   hint: published versions cannot be overwritten; bump the version in vendle.toml

3. Two-factor authentication required:
   error: two-factor authentication is enabled for this account
   hint: provide your one-time password with --otp <CODE>
```
