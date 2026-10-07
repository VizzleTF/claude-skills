// Pure helpers the snapshot and the widgets share. Nothing here calls `$`.

// A model id without the window suffix (`claude-opus-5-5[1m]`).
export const baseModel = (id: string | null | undefined) => (id ?? '').replace(/\[[^\]]*\]$/, '')

// A cost the engine reports that can be shown: a finite, non-negative number.
export const validCost = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0

// The two prompt-cache lifetimes the API offers.
export const SHORT_TTL_MS = 5 * 60_000
export const LONG_TTL_MS = 60 * 60_000

// The cache lifetime a main request proves, from the pause since the request before it: a cache read
// back after more than five minutes lives an hour; one rewritten after five minutes to an hour lived
// five. `prevLast` is what the request before sent (0 after a compaction, which proves nothing).
export function inferTtl(gapMs: number, prevLast: number, read: number, write: number): number | null {
  if (prevLast <= 0 || gapMs <= SHORT_TTL_MS) return null
  if (read * 2 >= prevLast) return LONG_TTL_MS
  if (write > 0 && gapMs < LONG_TTL_MS) return SHORT_TTL_MS
  return null
}

// The lifetime to count down from: the cache widget's `ttl` option when pinned, else what the session knows.
export const effectiveTtl = (known: number | null, option: unknown): number | null =>
  option === '5m' ? SHORT_TTL_MS : option === '1h' ? LONG_TTL_MS : known

const isOn = (v: string | undefined) => v !== undefined && v !== '' && v !== '0' && v.toLowerCase() !== 'false'
const asTtl = (v: unknown) => (v === '5m' ? SHORT_TTL_MS : v === '1h' ? LONG_TTL_MS : undefined)

// The lifetime Claude Code asks for when nothing else is known, by its documented order:
// FORCE_PROMPT_CACHING_5M, CLAUDE_CODE_PROMPT_CACHE_TTL, the promptCacheTtl setting,
// ENABLE_PROMPT_CACHING_1H, then the account: a subscription (it reports a 5-hour or weekly window)
// asks for an hour unless a window is spent and requests draw on usage credits; anything else, five minutes.
export function defaultTtl(
  env: { force5m?: string; ttl?: string; enable1h?: string },
  setting: unknown,
  limits: readonly { kind: string; percentUsed: number }[],
): number {
  if (isOn(env.force5m)) return SHORT_TTL_MS
  const pinned = asTtl(env.ttl) ?? asTtl(setting)
  if (pinned !== undefined) return pinned
  if (isOn(env.enable1h)) return LONG_TTL_MS
  const subscription = limits.some(l => l.kind === 'five_hour' || l.kind.startsWith('seven_day'))
  if (subscription && !limits.some(l => l.percentUsed >= 100)) return LONG_TTL_MS
  return SHORT_TTL_MS
}
