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
