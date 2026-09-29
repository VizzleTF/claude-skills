I'll write the help text and error messages for `vendle publish`:

```
USAGE:
    vendle publish [OPTIONS] <PACKAGE_DIR>

DESCRIPTION:
    Publish a package to a registry.

ARGUMENTS:
    <PACKAGE_DIR>    Path to the package directory to publish

OPTIONS:
    --registry URL   Registry URL to publish to
                     (default: https://registry.vendle.example)
    --tag TAG        Distribution tag
                     (default: latest)
    --dry-run        Check and pack without uploading
    --otp CODE       One-time password (required if account has
                     two-factor authentication enabled)
    -h, --help       Print help

EXIT CODES:
    0                Success
    1                Publishing failed
    2                Usage error


ERROR MESSAGES
==============

1. Missing vendle.toml

    error: no vendle.toml found in <PACKAGE_DIR>
    
    The package directory must contain a vendle.toml file.

    
2. Version already published

    error: version <VERSION> is already published to <REGISTRY>
    
    Published versions cannot be overwritten. Bump the version in
    vendle.toml and try again.

    
3. Two-factor authentication required

    error: your account requires two-factor authentication
    
    Use --otp to provide your one-time password.
```
