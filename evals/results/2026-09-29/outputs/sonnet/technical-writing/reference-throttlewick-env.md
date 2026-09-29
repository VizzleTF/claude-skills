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
