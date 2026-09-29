# Upgrade notes: Flask 3.1 to 3.2.0

Flask 3.2.0 is marked "Unreleased" in the changelog, so these notes may change before release. They cover only what the changelog says.

## Things that can break your app

**1. Python 3.9 is no longer supported.**
If you run on Python 3.9, move to a newer Python before you upgrade Flask.

**2. `flask.__version__` is removed.**
It was deprecated earlier and is now gone. Any code that reads `flask.__version__` will fail. The changelog doesn't name a replacement.

**3. `redirect` now returns 303 instead of 302.**
A 303 tells the client to always switch to `GET`. A 302 switched only `POST` to `GET`. The changelog says this preserves the current behavior of `GET` and `POST` redirects. Check anything that depends on the exact status code, such as tests asserting `302`, or clients and proxies that match on it. Redirects from other methods, such as `PUT` or `DELETE`, will now switch to `GET` where before they didn't.

**4. Teardown callbacks all run, even if one raises.**
Previously an error in one teardown callback could stop the others. Now every callback is called. If your teardown handlers depend on an earlier one having succeeded, review them.

**5. `RequestContext` is merged into `AppContext`.**
- `RequestContext` still works as a deprecated alias, so expect deprecation warnings if you use it.
- If an app context is already pushed, Flask no longer reuses it when it dispatches a request. Code that relies on the old reuse, such as code that pushes an app context before making requests, may behave differently.

**6. Subclasses that override request-dispatch methods.**
Many `Flask` methods involved in request dispatch now take the current `AppContext` as their first parameter, instead of using the proxy objects. If you subclass `Flask` and override any of these methods, your old signature is detected and still works, but it emits a deprecation warning. Update the overrides to accept the new first parameter, because the old signature works only during the deprecation period.

**7. Template autoescape now ignores case in file extensions.**
`Flask.select_jinja_autoescape` used to compare only lower-case extensions. It now compares case-insensitively. If you have templates with upper-case extensions, such as `.HTML`, check how they are handled. If you override this method, check it too.

**8. `provide_automatic_options=True` now takes effect for a view.**
Previously it had no effect when automatic options were disabled in config, and only disabling worked. Now it enables automatic options for that view. If you set it to `True` on a view while the config disables automatic options, that view's behavior changes.

## Deprecations to clean up

- **`should_ignore_error`** is deprecated. Handle errors in teardown handlers instead.
- **`RequestContext`** is a deprecated alias of `AppContext`. See item 5.
- **Old signatures of overridden dispatch methods** warn. See item 6.

## Fixes and additions that don't require changes

- `template_filter`, `template_test` and `template_global` can be used as decorators without parentheses.
- Parsing of IPv6 addresses with a port is fixed in `run` and in the test client.
- There is a new `app.query` route decorator for the HTTP `QUERY` method.

## Upgrade checklist

1. Confirm you run Python 3.10 or newer. The changelog says only that 3.9 is dropped.
2. Search your code for `__version__`, `RequestContext` and `should_ignore_error`.
3. Look for tests and clients that assert or depend on a `302` redirect.
4. Review `Flask` subclasses that override request-dispatch methods.
5. Review teardown handlers, templates with upper-case extensions, and views that use `provide_automatic_options`.
6. Run your test suite with deprecation warnings visible.
