# Пара reference-throttlewick-env

Язык: en. Вид: create.

Запрос:

> Write the reference page for Throttlewick's environment variables. Throttlewick is our rate-limiting proxy, version 1.8. People open this page to look up one variable.
> 
> Variables:
> 
> - `TW_LISTEN_ADDR`: string, default `0.0.0.0:8080`. Listen address.
> - `TW_RATE_PER_SEC`: integer, default `100`, 1 to 100000. Sustained requests per second per client key.
> - `TW_BURST`: integer, default `200`, 0 to 1000000. `0` turns bursting off.
> - `TW_KEY_HEADER`: string, default `X-Api-Key`. Header that identifies the client. If a request doesn't have it, the client IP is the key.
> - `TW_STORE`: `memory` or `redis`, default `memory`.
> - `TW_REDIS_URL`: string, no default. Required when `TW_STORE=redis`. Example: `redis://localhost:6379/0`.
> - `TW_LOG_LEVEL`: `debug`, `info`, `warn` or `error`, default `info`.
> 
> If any value is invalid, Throttlewick exits at startup with code 2 and logs which variable was wrong.

Факты:

- The page documents environment variables of Throttlewick 1.8, a rate-limiting proxy
- TW_LISTEN_ADDR is a string, default 0.0.0.0:8080, the address the proxy listens on
- TW_RATE_PER_SEC is an integer, default 100, allowed range 1 to 100000; it is the sustained number of requests per second per client key
- TW_BURST is an integer, default 200, allowed range 0 to 1000000; 0 disables bursting
- TW_KEY_HEADER is a string, default X-Api-Key; when the header is absent the client IP address is used as the key
- TW_STORE is an enum with values memory and redis, default memory
- TW_REDIS_URL is a string with no default; it is required when TW_STORE=redis; example redis://localhost:6379/0
- TW_LOG_LEVEL is an enum with values debug, info, warn, error, default info
- An invalid value makes the process exit with code 2 at startup and log the variable name

---

## X

# Throttlewick environment variables

Throttlewick 1.8 reads these variables at startup. If a value is invalid, Throttlewick exits with code 2 and logs the name of the variable that was wrong.

| Variable | Type | Default | Limits | Description |
|---|---|---|---|---|
| `TW_BURST` | integer | `200` | 0 to 1000000 | Sets the burst allowance. `0` turns bursting off. |
| `TW_KEY_HEADER` | string | `X-Api-Key` | none | Names the request header that identifies the client. If a request lacks the header, the client IP is the key. |
| `TW_LISTEN_ADDR` | string | `0.0.0.0:8080` | none | Sets the address Throttlewick listens on. |
| `TW_LOG_LEVEL` | string | `info` | `debug`, `info`, `warn`, `error` | Sets the log level. |
| `TW_RATE_PER_SEC` | integer | `100` | 1 to 100000 | Sets the sustained rate, in requests per second per client key. |
| `TW_REDIS_URL` | string | none; required when `TW_STORE=redis` | none | Sets the Redis connection URL. Example: `redis://localhost:6379/0`. |
| `TW_STORE` | string | `memory` | `memory`, `redis` | Selects where Throttlewick keeps rate-limit state. |

---

## Y

# Throttlewick environment variables

Reference for every environment variable Throttlewick 1.8 reads. Unset variables use the default shown.

| Variable | Type and allowed values | Default | Description |
|---|---|---|---|
| `TW_LISTEN_ADDR` | string | `0.0.0.0:8080` | Address Throttlewick listens on. |
| `TW_RATE_PER_SEC` | integer, 1 to 100000 | `100` | Sustained requests per second, per client key. |
| `TW_BURST` | integer, 0 to 1000000 | `200` | Burst allowance. `0` turns bursting off. |
| `TW_KEY_HEADER` | string | `X-Api-Key` | Request header that identifies the client. If a request lacks this header, the client IP is the key. |
| `TW_STORE` | `memory` or `redis` | `memory` | Where rate-limit state is stored. |
| `TW_REDIS_URL` | string | none | Redis connection URL. Required when `TW_STORE=redis`. Example: `redis://localhost:6379/0`. |
| `TW_LOG_LEVEL` | `debug`, `info`, `warn` or `error` | `info` | Log verbosity. |

## Invalid values

If any value is invalid, Throttlewick exits at startup with code 2 and logs which variable was wrong.
