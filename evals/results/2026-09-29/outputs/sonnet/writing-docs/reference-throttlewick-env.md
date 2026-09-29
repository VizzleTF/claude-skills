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
