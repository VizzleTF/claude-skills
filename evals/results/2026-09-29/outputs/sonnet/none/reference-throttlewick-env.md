# Throttlewick Environment Variables

Reference for Throttlewick v1.8. Each request-time value below is validated at startup — if any variable is invalid, Throttlewick exits immediately with status code **2** and logs which variable failed validation.

---

## `TW_LISTEN_ADDR`

- **Type:** string
- **Default:** `0.0.0.0:8080`

Address the proxy listens on.

---

## `TW_RATE_PER_SEC`

- **Type:** integer
- **Default:** `100`
- **Range:** `1`–`100000`

Sustained number of requests allowed per second, per client key.

---

## `TW_BURST`

- **Type:** integer
- **Default:** `200`
- **Range:** `0`–`1000000`

Maximum burst size above the sustained rate. Set to `0` to disable bursting.

---

## `TW_KEY_HEADER`

- **Type:** string
- **Default:** `X-Api-Key`

Header used to identify the client for rate-limiting purposes. If a request does not include this header, the client's IP address is used as the key instead.

---

## `TW_STORE`

- **Type:** enum — `memory` | `redis`
- **Default:** `memory`

Backend used to track rate-limit state.

---

## `TW_REDIS_URL`

- **Type:** string
- **Default:** none — **required when `TW_STORE=redis`**
- **Example:** `redis://localhost:6379/0`

Connection URL for the Redis store. Ignored when `TW_STORE=memory`.

---

## `TW_LOG_LEVEL`

- **Type:** enum — `debug` | `info` | `warn` | `error`
- **Default:** `info`

Minimum severity of log messages emitted.
