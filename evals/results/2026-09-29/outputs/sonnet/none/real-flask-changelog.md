# Upgrading Flask apps from 3.1 to 3.2.0

The changelog marks 3.2.0 as **Unreleased**, so these notes may change before release. They use only what the 3.2.0 changelog says.

## Things that can break your app

1. **Python 3.9 is no longer supported.** Your app needs a newer Python before it can move to 3.2. (:pr:`5730`)

2. **`flask.__version__` is removed.** It was previously deprecated. Any code that reads it will fail. (:pr:`5648`)

3. **`redirect` now returns `303` instead of `302` by default.**
   - A `303` tells the client to always switch to `GET`. A `302` only switched `POST` to `GET`.
   - The changelog says this preserves the current behavior of `GET` and `POST` redirects.
   - Check any code or tests that assert a `302` status, or that depend on the old default. To keep the old status, you would need to pass it explicitly. The changelog doesn't say this, so confirm it against the released API. (:issue:`5895`)

4. **`RequestContext` is merged into `AppContext`.**
   - `RequestContext` still exists as a deprecated alias, so existing references should keep working but will warn.
   - Behavior change: if an app context is already pushed, it is **not reused** when a request is dispatched. Code that pushes an app context before dispatching a request, such as tests or CLI helpers, may see different context behavior. (:issue:`5639`)

5. **All teardown callbacks now run, even if one raises.** Previously, an error in one teardown callback could stop the rest from running. If your teardown handlers depended on that, review them. (:pr:`5928`)

6. **`Flask.select_jinja_autoescape` now compares file extensions case-insensitively.** Previously only lowercase extensions matched. Templates with uppercase or mixed-case extensions may now be handled differently. (:pr:`6012`)

## Deprecations to fix now

These still work in 3.2.0 but warn.

- **Overridden `Flask` request-dispatch methods.**
  - Many of these methods now take the current `AppContext` as their first parameter, instead of using the proxy objects.
  - If a `Flask` subclass overrides them, the old signature is detected, shows a deprecation warning, and keeps working during the deprecation period.
  - Update your overrides to the new signature. (:issue:`5815`)
- **`should_ignore_error`.** Handle errors in teardown handlers instead. (:issue:`5816`)
- **`RequestContext`.** Use `AppContext` (see item 4 above). (:issue:`5639`)

## Changes that shouldn't break anything

- `template_filter`, `template_test`, and `template_global` can now be used as decorators without parentheses. (:issue:`5729`)
- `provide_automatic_options=True` now enables automatic options for a view when the config disables it. Previously only disabling worked. (:issue:`5916`)
- IPv6 addresses with a port are now parsed correctly in `run` and the test client. (:pr:`6096`)
- New `app.query` route decorator for the HTTP QUERY method.

## Upgrade checklist

- [ ] Run on a supported Python version (not 3.9).
- [ ] Remove any use of `__version__`.
- [ ] Check redirect status assertions and clients that expect `302`.
- [ ] Review tests and code that push an app context before dispatching a request.
- [ ] Review teardown handlers that relied on an earlier error stopping later callbacks.
- [ ] Check templates whose file extensions aren't lowercase.
- [ ] Update any `Flask` subclass overrides of dispatch methods to take the `AppContext` parameter.
- [ ] Replace `should_ignore_error` and `RequestContext` usage.
- [ ] Run your test suite with deprecation warnings enabled.
