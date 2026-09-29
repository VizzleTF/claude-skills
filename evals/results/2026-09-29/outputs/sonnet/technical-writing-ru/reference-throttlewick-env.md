# Throttlewick environment variables

Throttlewick 1.8 reads its configuration from these environment variables. If any value is invalid, Throttlewick exits at startup with code 2 and logs which variable was wrong.

| Name | Type | Default | Limits | Description |
|---|---|---|---|---|
| `TW_BURST` | integer | `200` | 0 to 1000000 | Sets the burst size. `0` turns bursting off. |
| `TW_KEY_HEADER` | string | `X-Api-Key` | none | Names the request header that identifies the client. If a request lacks the header, the client IP is the key. |
| `TW_LISTEN_ADDR` | string | `0.0.0.0:8080` | none | Sets the address Throttlewick listens on. |
| `TW_LOG_LEVEL` | string | `info` | `debug`, `info`, `warn`, `error` | Sets the log level. |
| `TW_RATE_PER_SEC` | integer | `100` | 1 to 100000 | Sets the sustained rate in requests per second for each client key. |
| `TW_REDIS_URL` | string | none | none | Sets the Redis connection URL. Required when `TW_STORE=redis`. Example: `redis://localhost:6379/0`. |
| `TW_STORE` | string | `memory` | `memory`, `redis` | Selects where Throttlewick keeps rate-limit state. |
