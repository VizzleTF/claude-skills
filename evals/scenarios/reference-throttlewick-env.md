id: reference-throttlewick-env
lang: en
kind: create
expect: reference
core: false
facts:
- The page documents environment variables of Throttlewick 1.8, a rate-limiting proxy
- TW_LISTEN_ADDR is a string, default 0.0.0.0:8080, the address the proxy listens on
- TW_RATE_PER_SEC is an integer, default 100, allowed range 1 to 100000; it is the sustained number of requests per second per client key
- TW_BURST is an integer, default 200, allowed range 0 to 1000000; 0 disables bursting
- TW_KEY_HEADER is a string, default X-Api-Key; when the header is absent the client IP address is used as the key
- TW_STORE is an enum with values memory and redis, default memory
- TW_REDIS_URL is a string with no default; it is required when TW_STORE=redis; example redis://localhost:6379/0
- TW_LOG_LEVEL is an enum with values debug, info, warn, error, default info
- An invalid value makes the process exit with code 2 at startup and log the variable name

Write the reference page for Throttlewick's environment variables. Throttlewick is our rate-limiting proxy, version 1.8. People open this page to look up one variable.

Variables:

- `TW_LISTEN_ADDR`: string, default `0.0.0.0:8080`. Listen address.
- `TW_RATE_PER_SEC`: integer, default `100`, 1 to 100000. Sustained requests per second per client key.
- `TW_BURST`: integer, default `200`, 0 to 1000000. `0` turns bursting off.
- `TW_KEY_HEADER`: string, default `X-Api-Key`. Header that identifies the client. If a request doesn't have it, the client IP is the key.
- `TW_STORE`: `memory` or `redis`, default `memory`.
- `TW_REDIS_URL`: string, no default. Required when `TW_STORE=redis`. Example: `redis://localhost:6379/0`.
- `TW_LOG_LEVEL`: `debug`, `info`, `warn` or `error`, default `info`.

If any value is invalid, Throttlewick exits at startup with code 2 and logs which variable was wrong.
