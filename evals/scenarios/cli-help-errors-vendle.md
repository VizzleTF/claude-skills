id: cli-help-errors-vendle
lang: en
kind: create
expect: cli-help-errors
core: true
facts:
- The command is vendle publish <PACKAGE_DIR>; it publishes a package to a Vendle registry
- --registry URL sets the registry; default https://registry.vendle.example
- --tag TAG sets the distribution tag; default latest
- --dry-run checks and packs the package without uploading it
- --otp CODE passes a one-time password; it is required when the account has two-factor authentication enabled
- Exit codes: 0 success, 1 publish failed, 2 usage error
- Error 1: vendle.toml is missing in PACKAGE_DIR
- Error 2: the version from vendle.toml already exists on the registry (HTTP 409); published versions cannot be overwritten, so the fix is to bump the version
- Error 3: the account has two-factor authentication and --otp was not given

Write the `--help` text for `vendle publish` and the error messages for three failure cases. Vendle is our package manager.

`vendle publish <PACKAGE_DIR>` publishes the package in PACKAGE_DIR to a registry.

Options:
- `--registry URL`: registry to publish to. Default `https://registry.vendle.example`.
- `--tag TAG`: distribution tag. Default `latest`.
- `--dry-run`: check and pack, don't upload.
- `--otp CODE`: one-time password. Required if the account has two-factor authentication.

Exit codes: 0 on success, 1 when publishing failed, 2 on a usage error.

Errors I need messages for:
1. There is no `vendle.toml` in PACKAGE_DIR.
2. The version in `vendle.toml` is already on the registry (the registry answers HTTP 409). Published versions can't be overwritten; the user has to bump the version.
3. The account has two-factor authentication and `--otp` wasn't passed.
