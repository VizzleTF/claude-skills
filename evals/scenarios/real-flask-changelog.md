id: real-flask-changelog
lang: en
kind: update
expect: changelog
core: false
fixtures: real-flask-changelog/
expect_notes:
- The notes do not invent a release date for 3.2.0
- The notes keep the issue and PR references from the source and do not invent changes
facts:
- The source is Flask's CHANGES.rst; version 3.2.0 is marked Unreleased
- 3.2.0 drops support for Python 3.9
- 3.2.0 removes the previously deprecated __version__ attribute
- RequestContext is merged with AppContext and RequestContext becomes a deprecated alias
- Flask methods involved in request dispatch take the current AppContext as the first parameter; overriding subclasses with the old signature get a deprecation warning and keep working during the deprecation period
- redirect returns 303 by default instead of 302
- All teardown callbacks are called even if some raise an error
- should_ignore_error is deprecated

The attached `CHANGES.rst` is Flask's changelog. Turn the 3.2.0 section into upgrade notes for people who maintain Flask apps on 3.1 and want to know what will break when they upgrade. Things that can break an app go first. Use only what the changelog says.
