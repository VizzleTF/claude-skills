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

// The levels when `/effort` does not say its own.
export const EFFORTS: readonly string[] = ['low', 'medium', 'high', 'xhigh', 'max']

// The levels `/effort` lists, in its argument hint (`<low|medium|…|auto|ultracode [on|off]>`, or in square
// brackets), its usage line or its answer to a wrong argument (`Valid options are: low, medium, …, auto, ultracode [on|off]`): `auto`
// and a switch with arguments are no level. Empty when the text lists none.
export function parseEfforts(text: string): string[] {
  const list = /<([^>]*)>/.exec(text)?.[1] ?? /^\s*\[(.*)\]\s*$/.exec(text)?.[1] ?? /valid options are:\s*(.*)$/im.exec(text)?.[1]
  if (!list) return []
  const switches = [...list.matchAll(/([a-z]+)\s*\[[^\]]*\]/g)].map(m => m[1])
  return list.replace(/\s*\[[^\]]*\]/g, '').split(/[|,]/).map(s => s.trim().replace(/\.$/, ''))
    .filter(s => /^[a-z]+$/.test(s) && s !== 'auto' && !switches.includes(s))
}

// The effort after `current` in a press's cycle through `levels`, back to the first after the last; from
// a number or none, `medium`, else the middle level.
export function nextEffort(current: string | number | null, levels: readonly string[] = EFFORTS): string {
  const i = levels.indexOf(current as never)
  if (i >= 0) return levels[(i + 1) % levels.length]!
  return levels.includes('medium') ? 'medium' : levels[Math.floor((levels.length - 1) / 2)]!
}

// The model after `current` in `cycle` (aliases as `/model` takes them: `opus[1m]`, `sonnet`): the entry
// whose family and window suffix match the running model is the current one; none matching, the first.
export function nextModel(current: string | null, cycle: readonly string[]): string | undefined {
  if (cycle.length === 0) return undefined
  const id = (current ?? '').toLowerCase()
  const suffix = /\[[^\]]*\]$/.exec(id)?.[0] ?? ''
  const at = (strict: boolean) => cycle.findIndex(m => {
    const family = baseModel(m.toLowerCase()).replace(/^claude-/, '').split('-')[0]!
    return id.includes(family) && (!strict || (/\[[^\]]*\]$/.exec(m.toLowerCase())?.[0] ?? '') === suffix)
  })
  const i = at(true) >= 0 ? at(true) : at(false)
  return cycle[(i + 1) % cycle.length]
}

// The models Claude Code offers (the `/config` model row's options) as a cycle: without the settings that
// name no one model (`default`, `best`, `opusplan`), and on the running model's side of the 1M window:
// a family's `[1m]` alias in place of its plain one while the running model has it, the plain ones otherwise.
export function autoCycle(offered: readonly string[], current: string | null): string[] {
  const named = offered.filter(m => !['default', 'best', 'opusplan'].includes(m))
  const long = /\[1m\]$/i.test(current ?? '')
  return named.filter(m => {
    const isLong = /\[1m\]$/i.test(m)
    return long ? isLong || !named.includes(`${m}[1m]`) : !isLong
  })
}

// What requests showed of each model's effort levels, for one Claude Code version: the levels asked for
// that a model sent lower, by its base id.
export type EffortSupport = { version: string; skip: Record<string, string[]> }

// The record after a main request: `asked` the level `/effort` set, `sent` what the request carried. A level
// sent as asked is taken off the model's skip list, one sent as another level put on it; a record of
// another version starts over.
export function learnEffort(saved: EffortSupport | undefined, version: string, model: string, asked: string, sent: string | number | undefined): EffortSupport {
  const base = saved?.version === version ? saved : { version, skip: {} }
  if (typeof sent !== 'string' || !/^[a-z]+$/.test(asked) || asked === 'auto') return base
  const id = baseModel(model)
  const skip = (base.skip[id] ?? []).filter(l => l !== asked)
  if (sent !== asked) skip.push(asked)
  return { version, skip: { ...base.skip, [id]: skip } }
}

// The levels a press steps through on `model`: `levels` without the ones its requests sent lower.
export const usableEfforts = (levels: readonly string[], saved: EffortSupport | undefined, version: string, model: string | null) => {
  const skip = saved?.version === version ? (saved.skip[baseModel(model)] ?? []) : []
  const usable = levels.filter(l => !skip.includes(l))
  return usable.length > 0 ? usable : levels
}
