# Пара real-flask-changelog

Язык: en. Вид: update.

Запрос:

> The attached `CHANGES.rst` is Flask's changelog. Turn the 3.2.0 section into upgrade notes for people who maintain Flask apps on 3.1 and want to know what will break when they upgrade. Things that can break an app go first. Use only what the changelog says.

Факты:

- The source is Flask's CHANGES.rst; version 3.2.0 is marked Unreleased
- 3.2.0 drops support for Python 3.9
- 3.2.0 removes the previously deprecated __version__ attribute
- RequestContext is merged with AppContext and RequestContext becomes a deprecated alias
- Flask methods involved in request dispatch take the current AppContext as the first parameter; overriding subclasses with the old signature get a deprecation warning and keep working during the deprecation period
- redirect returns 303 by default instead of 302
- All teardown callbacks are called even if some raise an error
- should_ignore_error is deprecated

Ожидания к ответу:

- The notes do not invent a release date for 3.2.0
- The notes keep the issue and PR references from the source and do not invent changes

---

## X

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

---

## Y

# Upgrading Flask from 3.1 to 3.2.0

Flask 3.2.0 is unreleased, so this list may change before release. Items are ordered by how likely they are to break an app.

## Can break your app

| Change | Who is affected | What to do |
|---|---|---|
| Python 3.9 is no longer supported (#5730) | Apps running on Python 3.9 | Move to a newer Python before upgrading. |
| `__version__` is removed (#5648) | Code that reads `__version__` | Remove that use. |
| `redirect` returns `303` instead of `302` by default (#5895) | Apps that depend on the redirect status code, for example in tests or clients | Check them. Clients now always switch to `GET`, not only `POST`. Flask says `GET` and `POST` redirects behave as before. |
| An already-pushed app context is no longer reused when dispatching a request (#5639) | Code that pushes an app context and relies on a request reusing it | Test this code. `RequestContext` and `AppContext` are merged. |
| All teardown callbacks now run, even if one raises (#5928) | Apps whose teardown handlers assume an earlier handler succeeded | Check teardown handlers for that assumption. |

## Behavior changes to check

- **`provide_automatic_options=True`** now enables automatic options for a view when config disables it. Before, only disabling worked. Look for views that pass `True` while config disables automatic options (#5916).
- **`Flask.select_jinja_autoescape`** now compares file extensions case-insensitively. Before, it matched only lower-case extensions. Check templates whose extensions contain upper-case letters (#6012).

## Deprecated: still works, plan to migrate

- **`RequestContext`** is now a deprecated alias of `AppContext` (#5639).
- **`should_ignore_error`** is deprecated. Handle errors in teardown handlers instead (#5816).
- **Overridden request-dispatch methods.** Many `Flask` methods involved in request dispatch now take the current `AppContext` as their first parameter, instead of using the proxy objects. If you subclass `Flask` and override any of them, the old signature is detected, shows a deprecation warning, and keeps working during the deprecation period (#5815).

## Fixes and additions, no action needed

- `template_filter`, `template_test`, and `template_global` can be used without parentheses (#5729).
- IPv6 addresses with a port now parse correctly in `run` and the test client (#6096).
- New `app.query` route decorator for the HTTP QUERY method.
