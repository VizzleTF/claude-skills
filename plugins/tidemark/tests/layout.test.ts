// buildLines: the band's lines from the config and the snapshot, narrowed to a width by `fit`.
import { expect, test } from 'claude-code/testing'

import type { TidemarkSnapshot } from '../types'
import { DEFAULT_CONFIG, PRESETS } from '../hooks/config-model'
import { buildLines } from '../hooks/layout'
import type { Line } from '../hooks/layout'
import { EMPTY_SNAPSHOT } from '../hooks/snapshot'

const NOW = Date.parse('2026-10-03T15:00:00Z')
const MIN = 60_000
const iso = (ms: number) => new Date(NOW + ms).toISOString()

const SNAP: TidemarkSnapshot = {
  ...EMPTY_SNAPSHOT,
  ctx: { tokens: 271_000, window: 1_000_000, percent: 27, model: 'claude-opus-5-5' },
  history: [174_600, 175_600, 177_600, 189_600, 229_600, 232_600, 267_600, 271_000],
  cache: { at: NOW - 22 * MIN, warm: true },
  cacheTtl: 60 * MIN,
  limits: [
    { kind: 'five_hour', percentUsed: 42, resetsAt: iso(154 * MIN) },
    { kind: 'seven_day', percentUsed: 63, resetsAt: iso(55 * 60 * MIN) },
  ],
  limitsLive: true,
  model: 'claude-opus-5-5',
  effort: 'high',
  startedAt: NOW - 72 * MIN,
  speed: 42,
}

const texts = (lines: Line[]) => lines.map(l => l.map(s => s.spans.map(x => x.text).join('')).join(' │ '))

// Text labels and pipes, so the fit below reads plainly whatever the default style is.
const PLAIN = { ...DEFAULT_CONFIG, style: { separator: 'pipe' as const, icons: 'text' as const } }
const FIGURES = { ...PLAIN, lines: [(['context', 'cache', 'quota5h', 'quota7d', 'model'] as const).map(widget => ({ widget }))] }

test('the default config: one line in three groups, git, cwd and project hidden without data', () => {
  const [line] = buildLines(DEFAULT_CONFIG, SNAP, {}, 200, NOW)
  expect(line!.map(s => s.widget)).toEqual(['context', 'compact', 'cache', 'flex', 'quota5h', 'quota7d', 'flex', 'sessionTime', 'model', 'actions'])
  expect([line![1]!, line!.at(-1)!].flatMap(w => w.spans.map(s => s.press))).toEqual(['compact', 'config'])
  expect(texts(buildLines(FIGURES, SNAP, {}, 200, NOW))).toEqual(['ctx ■■■□□□□□□□ 27% 271k/1M ▁▁▃█▁▇▁ ↑3.4k │ cache warm 38m │ 5h 42% ↻ 2h34m │ 7d 63% ↻ 2d7h │ opus 5.5 · high'])
})

test('the full preset: two lines', () => {
  const lines = buildLines(PRESETS.full!, SNAP, {}, 200, NOW, { cwd: '/u/dev/proj' })
  expect(lines.length).toBe(2)
  expect(lines[1]!.map(s => s.widget)).toEqual(['model', 'cwd', 'sessionTime', 'tokenSpeed'])
})

test('fit: details go first, then widgets by priority, context last, then cut with …', () => {
  const seen: string[] = []
  for (let w = 200; w >= 5; w--) {
    const [t] = texts(buildLines(FIGURES, SNAP, {}, w, NOW))
    if ([...t!].length > w) throw new Error(`${t} is wider than ${w}`)
    if (seen.at(-1) !== t) seen.push(t!)
  }
  const ctx = 'ctx ■■■□□□□□□□ 27% 271k/1M ▁▁▃█▁▇▁ ↑3.4k'
  expect(seen.slice(0, 13)).toEqual([
    `${ctx} │ cache warm 38m │ 5h 42% ↻ 2h34m │ 7d 63% ↻ 2d7h │ opus 5.5 · high`,
    `${ctx} │ cache warm 38m │ 5h 42% ↻ 2h34m │ 7d 63% ↻ 2d7h │ opus 5.5`,
    `${ctx} │ cache warm 38m │ 5h 42% ↻ 2h34m │ 7d 63% ↻ 2d7h`,
    `${ctx} │ cache warm 38m │ 5h 42% ↻ 2h34m │ 7d 63%`,
    `${ctx} │ cache warm 38m │ 5h 42% ↻ 2h34m`,
    `${ctx} │ cache warm │ 5h 42% ↻ 2h34m`,
    `${ctx} │ 5h 42% ↻ 2h34m`,
    `${ctx} │ 5h 42%`,
    ctx,
    'ctx ■■■□□□□□□□ 27% 271k/1M',
    'ctx ■■■□□□□□□□ 27%',
    'ctx 27%',
    'ctx 2…',
  ])
  expect(seen.at(-1)).toBe('ctx …')
})

test('the config button stays at any width and whatever its priority', () => {
  const config = { ...PLAIN, lines: [[{ widget: 'context' as const, priority: 500 }, { widget: 'flex' as const }, { widget: 'actions' as const, priority: 0 }]] }
  for (let w = 120; w >= 1; w--) {
    const [line] = buildLines(config, SNAP, {}, w, NOW)
    expect(line!.at(-1)!.widget).toBe('actions')
  }
  expect(buildLines(config, SNAP, {}, 1, NOW)[0]!.map(s => s.widget)).toEqual(['actions'])
})

test('a priority keeps a widget longer', () => {
  const config = { ...PLAIN, lines: [[{ widget: 'context' as const }, { widget: 'model' as const, priority: 200 }]] }
  expect(texts(buildLines(config, SNAP, {}, 20, NOW))).toEqual(['opus 5.5 · high'])
})

test('a config error adds a dim ⚠ config at the end; an empty snapshot draws nothing', () => {
  const [line] = buildLines(DEFAULT_CONFIG, SNAP, {}, 200, NOW, { configError: true })
  expect(line!.at(-1)).toEqual({ widget: 'config', spans: [{ text: '⚠ config', role: 'dim' }] })
  expect(buildLines(DEFAULT_CONFIG, EMPTY_SNAPSHOT, {}, 200, NOW, { configError: true })).toEqual([])
  const off = { ...DEFAULT_CONFIG, lines: [[{ widget: 'context' as const, enabled: false }]] }
  expect(buildLines(off, SNAP, {}, 200, NOW)).toEqual([])
})

test('flex splits a line: empty segments in their place, kept while narrowing; a third flex or flex alone is dropped', () => {
  const cfg = (lines: unknown[][]) => ({ ...DEFAULT_CONFIG, lines: lines.map(l => l.map(w => (typeof w === 'string' ? { widget: w } : w))) }) as typeof DEFAULT_CONFIG
  const line = buildLines(cfg([['context', 'flex', 'quota5h', 'flex', 'cache', 'flex']]), SNAP, {}, 200, NOW)[0]!
  expect(line.map(s => s.widget)).toEqual(['context', 'flex', 'quota5h', 'flex', 'cache'])
  expect(line[1]!.spans).toEqual([])
  // Narrowed until context alone is left, the flex segment stays.
  expect(buildLines(cfg([['context', 'flex', 'quota5h']]), SNAP, {}, 40, NOW)[0]!.map(s => s.widget)).toEqual(['context', 'flex'])
  expect(buildLines(cfg([['flex']]), SNAP, {}, 200, NOW)).toEqual([])
})
