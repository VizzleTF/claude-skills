Working on `--help` text and error messages for `vendle publish`. This is CLI documentation for developers who either need to learn the command or debug a publishing failure.

**Step 1:** Reader is a developer working with the publish command, either learning it or fixing a failed publish.

**Step 2:** Type is CLI help and error messages. Read type file, style guide, and LLM patterns ✓

**Step 3:** Skeleton from type file:
- Help: usage line, description, arguments/options, examples, where to find more
- Errors: cause, invalid input, requirements, how to fix, example (when helpful)

**Step 4–5:** Draft and edit for concision, consistency, and clarity.

**Step 7:** Type checklist:
- Help starts with usage line ✓, has examples ✓, option descriptions consistent ✓
- Each error names cause ✓, says how to fix (imperative) ✓, includes example where helpful ✓
- Forbidden patterns clear (no vague messages, no stack traces, no internal codes) ✓

**Step 8:** Cold reader test passed—a developer could understand what to do from each message.

---

## `vendle publish` help text and errors

### Help text

```
Usage: vendle publish [OPTIONS] <PACKAGE_DIR>

Publish a package to a registry.

Arguments:
  <PACKAGE_DIR>        Directory containing the package

Options:
  --registry URL       Registry to publish to [default: https://registry.vendle.example]
  --tag TAG            Distribution tag [default: latest]
  --dry-run            Check and pack without uploading
  --otp CODE           One-time password for two-factor authentication

Examples:
  vendle publish .
  vendle publish my-pkg --tag beta --otp 123456
```

### Error messages

**1. Missing vendle.toml**
```
Error: vendle.toml not found in <PACKAGE_DIR>. Create vendle.toml in the package directory.
```

**2. Version already published**
```
Error: version <VERSION> is already on the registry. Versions can only be published once. Bump the version in vendle.toml and publish again.
```

**3. Two-factor authentication required**
```
Error: your account requires two-factor authentication. Pass --otp with your one-time password, for example vendle publish . --otp 123456.
```
