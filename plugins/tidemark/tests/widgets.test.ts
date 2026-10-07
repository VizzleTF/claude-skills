// Each widget's render on Snapshot fixtures: what it shows, in what colour tier, and its narrower variants.
import { expect, test } from 'claude-code/testing'

import type { TidemarkSnapshot } from '../types'
import { EMPTY_SNAPSHOT } from '../hooks/snapshot'
import { WIDGETS } from '../hooks/widgets'
import type { Span, WidgetInput } from '../hooks/widgets'

const NOW = Date.parse('2026-10-03T15:00:00Z')
const MIN = 60_000
const HOUR = 60 * MIN
const iso = (ms: number) => new Date(NOW + ms).toISOString()
const MODEL = 'claude-opus-5-5[1m]'

// Gains 1k, 2k, 12k, 40k, 3k, 35k, 3.4k up to 271k of a 1M window.
const HISTORY = [174_600, 175_600, 177_600, 189_600, 229_600, 232_600, 267_600, 271_000]

const snap = (over: Partial<TidemarkSnapshot> = {}): TidemarkSnapshot => ({
  ...EMPTY_SNAPSHOT,
  ctx: { tokens: 271_000, window: 1_000_000, percent: 27, model: MODEL },
  history: HISTORY,
  model: MODEL,
  ...over,
})

const run = (id: string, s: TidemarkSnapshot, over: Partial<WidgetInput> = {}) =>
  (WIDGETS as Record<string, { render(i: WidgetInput): Span[][] }>)[id]!.render({
    snap: s, probes: {}, options: {}, label: undefined, icons: 'text', now: NOW, env: {}, ...over,
  })
const text = (v: Span[] | undefined) => (v ?? []).map(s => s.text).join('')
const full = (id: string, s: TidemarkSnapshot, over: Partial<WidgetInput> = {}) => text(run(id, s, over)[0])
const spanOf = (v: Span[] | undefined, re: RegExp) => (v ?? []).find(s => re.test(s.text))

test('context: bar, percentage, tokens, growth sparkline and the last gain', () => {
  const v = run('context', snap())
  expect(text(v[0])).toBe('ctx ■■■□□□□□□□ 27% 271k/1M ▁▁▃█▁▇▁ ↑3.4k')
  // 27% used: tier 2; each growth bar by its gain's share of the window.
  expect(spanOf(v[0], /27%/)?.tier).toBe(2)
  expect(v[0]!.find(s => s.spark)?.spark?.tiers).toEqual([1, 2, 4, 6, 2, 6, 2])
  expect(v[0]!.find(s => s.bar)?.bar?.percent).toBe(27)
  // Narrower variants drop growth, then tokens, then the bar.
  expect(v.map(text)).toEqual([
    'ctx ■■■□□□□□□□ 27% 271k/1M ▁▁▃█▁▇▁ ↑3.4k',
    'ctx ■■■□□□□□□□ 27% 271k/1M',
    'ctx ■■■□□□□□□□ 27%',
    'ctx 27%',
  ])
})

test('context options: mode, barWidth, showTokens, showGrowth, showLast, label null', () => {
  expect(full('context', snap(), { options: { mode: 'left' } })).toBe('ctx ■■■■■■■□□□ 73% left 271k/1M ▁▁▃█▁▇▁ ↑3.4k')
  // `left` keeps the tier of the share used.
  expect(spanOf(run('context', snap(), { options: { mode: 'left' } })[0], /73%/)?.tier).toBe(2)
  expect(full('context', snap(), { options: { barWidth: 4 } })).toBe('ctx ■□□□ 27% 271k/1M ▁▁▃█▁▇▁ ↑3.4k')
  expect(full('context', snap(), { options: { showTokens: false } })).toBe('ctx ■■■□□□□□□□ 27% ▁▁▃█▁▇▁ ↑3.4k')
  expect(full('context', snap(), { options: { showGrowth: false } })).toBe('ctx ■■■□□□□□□□ 27% 271k/1M ↑3.4k')
  expect(full('context', snap(), { options: { showLast: false } })).toBe('ctx ■■■□□□□□□□ 27% 271k/1M ▁▁▃█▁▇▁')
  expect(full('context', snap(), { label: null })).toBe('■■■□□□□□□□ 27% 271k/1M ▁▁▃█▁▇▁ ↑3.4k')
  expect(full('context', snap(), { label: 'C' })).toBe('C ■■■□□□□□□□ 27% 271k/1M ▁▁▃█▁▇▁ ↑3.4k')
  // Fewer than two totals: no graph.
  expect(full('context', snap({ history: [271_000] }))).toBe('ctx ■■■□□□□□□□ 27% 271k/1M')
})

test('context before the first response: the dim estimate marked ~, else --', () => {
  const est = run('context', snap({ ctx: { window: 1_000_000, estimate: 13_689 }, history: [] }))[0]
  expect(text(est)).toBe('ctx □□□□□□□□□□ ~1% ~13k/1M')
  expect(spanOf(est, /~1%/)?.role).toBe('dim')
  expect(full('context', snap({ ctx: { window: 1_000_000 }, history: [] }))).toBe('ctx --/1M')
  expect(run('context', snap({ ctx: null }))).toEqual([])
})

test('context shows the subagent on screen as agent', () => {
  const agent = { id: 'a1', model: 'claude-opus-5-5', totals: [10_000, 50_000], usage: { input: 0, output: 0, read: 0 } }
  expect(full('context', snap({ agents: [agent] }), { env: { agentId: 'a1' } })).toBe('agent ■□□□□□□□□□ 5% 50k/1M █ ↑40k')
  expect(full('context', snap(), { env: { agentId: 'zz' } })).toBe('agent --')
})

test('cache: warm minutes by the share of the lifetime gone, cold, unknown lifetime, rewrote', () => {
  const warm = snap({ cache: { at: NOW - 22 * MIN, warm: true }, cacheTtl: HOUR })
  const v = run('cache', warm)
  expect(text(v[0])).toBe('cache warm 38m')
  expect(spanOf(v[0], /warm/)?.tier).toBe(3)
  expect(full('cache', snap({ cache: { at: NOW, warm: false }, cacheTtl: HOUR }))).toBe('cache cold')
  expect(full('cache', snap({ cache: { at: NOW - 61 * MIN, warm: true }, cacheTtl: HOUR }))).toBe('cache cold')
  // An unknown lifetime: plain `warm`, no minutes to count.
  expect(full('cache', snap({ cache: { at: NOW, warm: true } }))).toBe('cache warm')
  // A pinned `ttl` counts down even when the session never reported one.
  const unknown = snap({ cache: { at: NOW - 22 * MIN, warm: true } })
  expect(full('cache', unknown, { options: { ttl: '1h' } })).toBe('cache warm 38m')
  expect(full('cache', unknown, { options: { ttl: '5m' } })).toBe('cache cold')
  // What Claude Code asks for counts down until a pause proves otherwise.
  expect(full('cache', snap({ cache: { at: NOW - 22 * MIN, warm: true }, ttlDefault: HOUR }))).toBe('cache warm 38m')
  expect(full('cache', snap({ cache: { at: NOW - 2 * MIN, warm: true }, cacheTtl: 5 * MIN, ttlDefault: HOUR }))).toBe('cache warm 3m')
  // A pin wins over what the session knows.
  expect(full('cache', snap({ cache: { at: NOW - 2 * MIN, warm: true }, cacheTtl: HOUR }), { options: { ttl: '5m' } })).toBe('cache warm 3m')
  const rewrote = snap({ cache: { at: NOW - 22 * MIN, warm: true }, cacheTtl: HOUR, cacheStats: { ...EMPTY_SNAPSHOT.cacheStats, rewrite: { tokens: 45_000, turnId: 't' } } })
  expect(full('cache', rewrote)).toBe('cache warm 38m rewrote 45k')
  expect(full('cache', rewrote, { options: { showRewrite: false } })).toBe('cache warm 38m')
  expect(full('cache', rewrote, { options: { showMinutes: false } })).toBe('cache warm rewrote 45k')
  expect(run('cache', rewrote).map(text)).toEqual(['cache warm 38m rewrote 45k', 'cache warm 38m', 'cache warm'])
  expect(run('cache', snap())).toEqual([])
})

const FIVE = { kind: 'five_hour', percentUsed: 42, resetsAt: iso(2 * HOUR + 34 * MIN) }
const WEEK = { kind: 'seven_day', percentUsed: 63, resetsAt: iso(55 * HOUR) }

test('quota5h: percent, reset, mode, showReset, bar; a passed window is hidden', () => {
  const s = snap({ limits: [FIVE], limitsLive: true })
  const v = run('quota5h', s)
  expect(text(v[0])).toBe('5h 42% ↻ 2h34m')
  expect(spanOf(v[0], /42%/)?.tier).toBe(4)
  expect(full('quota5h', s, { options: { mode: 'left' } })).toBe('5h 58% left ↻ 2h34m')
  expect(spanOf(run('quota5h', s, { options: { mode: 'left' } })[0], /58%/)?.tier).toBe(4)
  expect(full('quota5h', s, { options: { showReset: false } })).toBe('5h 42%')
  expect(full('quota5h', s, { options: { bar: true } })).toBe('5h ■■□□□ 42% ↻ 2h34m')
  expect(run('quota5h', snap({ limits: [{ ...FIVE, resetsAt: iso(-MIN) }], limitsLive: true }))).toEqual([])
  // A window that reports no reset is shown without one.
  expect(full('quota5h', snap({ limits: [{ kind: 'five_hour', percentUsed: 42 }], limitsLive: true }))).toBe('5h 42%')
  // A figure from the store, not this session's: dim.
  expect(spanOf(run('quota5h', snap({ limits: [FIVE] }))[0], /42%/)?.role).toBe('dim')
})

test('quota7d: the all-models week, or the model\'s own week when reported (7d fable)', () => {
  expect(full('quota7d', snap({ limits: [FIVE, WEEK], limitsLive: true }))).toBe('7d 63% ↻ 2d7h')
  const fable = 'claude-fable-5-1'
  const own = { kind: 'seven_day_fable', percentUsed: 80, resetsAt: iso(30 * HOUR) }
  expect(full('quota7d', snap({ model: fable, limits: [WEEK, own], limitsLive: true }))).toBe('7d fable 80% ↻ 1d6h')
  const scoped = { kind: 'weekly_scoped', percentUsed: 81, resetsAt: iso(30 * HOUR) }
  expect(full('quota7d', snap({ model: fable, limits: [WEEK, scoped], limitsLive: true }))).toBe('7d fable 81% ↻ 1d6h')
  // Another model's own week is not this one's.
  expect(full('quota7d', snap({ limits: [WEEK, own], limitsLive: true }))).toBe('7d 63% ↻ 2d7h')
})

test('cost and agents: hidden without data', () => {
  const v = run('cost', snap({ cost: 1.84, turnCost: 0.12 }))
  expect(text(v[0])).toBe('≈$1.84 (+$0.12)')
  expect(spanOf(v[0], /≈/)?.role).toBe('money')
  expect(text(v.at(-1))).toBe('≈$1.84')
  expect(run('cost', snap())).toEqual([])
  const a = run('agents', snap({ activeAgents: 5 }))[0]!
  expect(a.map(s => s.text).join('')).toMatch(/^[⠀-⣿]{3}\+2$/)
  expect(a[0]!.role).toBe('activity')
  expect(run('agents', snap())).toEqual([])
})

test('model: short family and version with effort, full id, effort hidden when unknown', () => {
  expect(full('model', snap({ effort: 'high' }))).toBe('opus 5.5 · high')
  expect(full('model', snap({ effort: 'high' }), { options: { showEffort: false } })).toBe('opus 5.5')
  expect(full('model', snap({ effort: 'high' }), { options: { format: 'full' } })).toBe('claude-opus-5-5 · high')
  expect(full('model', snap())).toBe('opus 5.5')
  expect(run('model', snap({ model: null }))).toEqual([])
})

test('cwd styles: project, basename, short, full', () => {
  const env = { cwd: '/u/dev/x/y/a/b', home: '/u/dev' }
  expect(full('cwd', snap(), { env })).toBe('b')
  expect(full('cwd', snap(), { env, probes: { gitRoot: { at: NOW, stdout: '/u/dev/x\n' } } })).toBe('x')
  expect(full('cwd', snap(), { env, options: { style: 'basename' } })).toBe('b')
  expect(full('cwd', snap(), { env, options: { style: 'short' } })).toBe('~/…/a/b')
  expect(full('cwd', snap(), { env: { ...env, cwd: '/u/dev/a/b' }, options: { style: 'short' } })).toBe('~/a/b')
  expect(full('cwd', snap(), { env, options: { style: 'full' } })).toBe('/u/dev/x/y/a/b')
  expect(run('cwd', snap())).toEqual([])
})

test('session time, compactions, token speed', () => {
  expect(full('sessionTime', snap({ startedAt: NOW - 72 * MIN }))).toBe('⏱ 1h12m')
  expect(run('sessionTime', snap())).toEqual([])
  expect(full('compactions', snap({ compactions: 2 }))).toBe('⇣2')
  expect(run('compactions', snap())).toEqual([])
  expect(full('compactions', snap(), { options: { hideZero: false } })).toBe('⇣0')
  expect(full('tokenSpeed', snap({ speed: 42.4 }))).toBe('42 t/s')
  expect(run('tokenSpeed', snap())).toEqual([])
})

test('nerd icons replace the text labels; the probe widgets are hidden until filled', () => {
  expect(full('context', snap(), { icons: 'nerd' })).toMatch(/^[-] ■■■/)
  expect(full('quota5h', snap({ limits: [FIVE], limitsLive: true }), { icons: 'nerd' })).toMatch(/^[-] 5h 42%/)
  // The calendar glyph (nf-fa-calendar, U+F073) before 7d, for the all-models week and the model's own.
  expect(full('quota7d', snap({ limits: [WEEK], limitsLive: true }), { icons: 'nerd' })).toBe('\uf073 7d 63% ↻ 2d7h')
  const own = { kind: 'seven_day_opus', percentUsed: 80, resetsAt: iso(30 * HOUR) }
  expect(full('quota7d', snap({ limits: [WEEK, own], limitsLive: true }), { icons: 'nerd' })).toBe('\uf073 7d opus 80% ↻ 1d6h')
  for (const id of ['git', 'gitPr', 'command', 'claudeStatus']) expect(run(id, snap())).toEqual([])
  expect(Object.keys(WIDGETS).length).toBe(17)
})

test('actions: compact and config buttons, each switchable; compact hidden on a subagent; none before data', () => {
  const s = snap({ model: 'claude-opus-5-5' })
  const presses = (v: ReturnType<typeof run>) => v[0]?.map(sp => sp.press) ?? []
  expect(presses(run('actions', s))).toEqual(['compact', 'config'])
  expect(presses(run('actions', s, { options: { compact: false } }))).toEqual(['config'])
  expect(run('actions', s, { options: { compact: false, config: false } })).toEqual([])
  expect(presses(run('actions', s, { env: { agentId: 'a1' } }))).toEqual(['config'])
  expect(run('actions', snap({ model: null, ctx: null }))).toEqual([])
})
