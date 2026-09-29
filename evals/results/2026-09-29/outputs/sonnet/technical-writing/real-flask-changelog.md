# Upgrading from Flask 3.1 to 3.2.0

Flask 3.2.0 is marked Unreleased in the changelog, so it has no release date yet. This page is for maintainers of Flask apps on 3.1. It lists first what can break an app, then what is deprecated but still works, then what is new.

## Breaking changes

- **BREAKING:** Dropped support for Python 3.9. (:pr:`5730`)
- **BREAKING:** Removed the previously deprecated `__version__`. (:pr:`5648`)
- **BREAKING:** `redirect` returns status `303` by default instead of `302`. A `303` tells the client to always switch to `GET`. A `302` switched only `POST` to `GET`. The changelog says this preserves the current behavior of `GET` and `POST` redirects and is also correct for frontend libraries such as HTMX. (:issue:`5895`)
- **BREAKING:** `RequestContext` has merged with `AppContext`. If an app context is already pushed, Flask no longer reuses it when dispatching a request. (:issue:`5639`)
- **BREAKING:** Flask now calls all teardown callbacks, even if one of them raises an error. (:pr:`5928`)
- **BREAKING:** `Flask.select_jinja_autoescape` compares file extensions case-insensitively. It used to match only lower-case extensions. (:pr:`6012`)

## Deprecations

These still work in 3.2.0 and warn or will warn.

- `RequestContext` is now a deprecated alias of `AppContext`. (:issue:`5639`)
- Many `Flask` methods involved in request dispatch now take the current `AppContext` as the first parameter instead of using the proxy objects. If a subclass overrides these methods, Flask detects the old signature, shows a deprecation warning, and keeps the override working during the deprecation period. (:issue:`5815`)
- `should_ignore_error` is deprecated. Handle errors in teardown handlers instead. (:issue:`5816`)

## Other changes

- `template_filter`, `template_test` and `template_global` decorators work without parentheses. (:issue:`5729`)
- `provide_automatic_options=True` enables automatic options for a view when config disables it. Before, only disabling worked. (:issue:`5916`)
- Fixed parsing of IPv6 addresses with a port in `run` and in the test client. (:pr:`6096`)
- Added the `app.query` route decorator for the HTTP QUERY method.

## Checks before you upgrade

1. Confirm your apps run on Python 3.10 or later.
2. Search your code for `__version__` and `RequestContext`.
3. Check whether your `Flask` subclasses override request dispatch methods, and whether your code uses `should_ignore_error`.
4. Review tests and clients that depend on the `302` status of `redirect`.
5. Review teardown callbacks that relied on later callbacks not running after an error.
6. After upgrading, run your tests and look for deprecation warnings from overridden dispatch methods.
