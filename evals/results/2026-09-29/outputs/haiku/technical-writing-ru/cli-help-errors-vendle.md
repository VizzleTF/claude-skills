Here's the complete `vendle publish` CLI documentation:

```
Usage: vendle publish <PACKAGE_DIR> [OPTIONS]

Publish a package to a registry.

ARGUMENTS:
  <PACKAGE_DIR>         Directory containing the package to publish

OPTIONS:
      --registry <URL>  Registry to publish to
                        [default: https://registry.vendle.example]
      --tag <TAG>       Distribution tag
                        [default: latest]
      --dry-run         Check and pack the package without uploading
      --otp <CODE>      One-time password (required if 2FA is enabled)
  -h, --help            Print help
```

**Error messages:**

1. **Missing vendle.toml** (exit code 2)
```
error: vendle.toml not found in package directory
```

2. **Version already published** (exit code 1)
```
error: version 1.2.3 is already published to the registry

hint: bump the version in vendle.toml and try again
```

3. **2FA without OTP** (exit code 2)
```
error: this account requires two-factor authentication

hint: pass --otp <CODE> with your one-time password to continue
```
