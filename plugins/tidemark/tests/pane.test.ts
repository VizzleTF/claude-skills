// The /tidemark pane: the quota forecast as a pure function, the sections from Snapshot fixtures, and the
// pane through the engine on every surface.
import { expect, mock, test } from 'claude-code/testing'
import type { CommandRunInput, On, SessionUsage } from 'claude-code'

import type { TidemarkSnapshot } from '../types'
import type { PaneRow } from '../hooks/draw'
import { paneRows, quotaForecast } from '../hooks/pane-rows'
import { EMPTY_SNAPSHOT } from '../hooks/snapshot'

const NOW = Date.parse('2026-10-03T15:00:00Z')
const MIN = 60_000
const HOUR = 60 * MIN
const iso = (ms: number) => new Date(NOW + ms).toISOString()

test('forecast: remaining = elapsed × (1 − share) / share, and the share by reset at this pace', () => {
  // 5h window resetting in 3h: 2h elapsed. Half used: the other half in 2h, before the reset; 125% by then.
  expect(quotaForecast({ kind: 'five_hour', percentUsed: 50, resetsAt: iso(3 * HOUR) }, NOW, NOW))
    .toEqual({ exhaustsAt: NOW + 2 * HOUR, percentAtReset: 125, resetFirst: false })
  // A fifth used in 2h: 8h to go, the reset comes first at 50%.
  expect(quotaForecast({ kind: 'five_hour', percentUsed: 20, resetsAt: iso(3 * HOUR) }, NOW, NOW))
    .toEqual({ exhaustsAt: NOW + 8 * HOUR, percentAtReset: 50, resetFirst: true })
  // A 7-day window resetting in 5 days: 2 days elapsed at 20% a day → 3 days to go, 140% by the reset.
  const week = quotaForecast({ kind: 'seven_day', percentUsed: 40, resetsAt: iso(5 * 24 * HOUR) }, NOW - MIN, NOW)
  expect(week).toEqual({ exhaustsAt: NOW + 3 * 24 * HOUR, percentAtReset: 140, resetFirst: false })
})

test('forecast: none for an early, expired, 0%, 100%, stale or unknown reading', () => {
  const at = (percentUsed: number, resetIn: number, observedAt: number | null = NOW, kind = 'five_hour') =>
    quotaForecast({ kind, percentUsed, resetsAt: iso(resetIn) }, observedAt, NOW)
  // Four minutes into the window: too early.
  expect(at(10, 5 * HOUR - 4 * MIN)).toBeUndefined()
  // The reset passed.
  expect(at(10, -MIN)).toBeUndefined()
  expect(at(0, 3 * HOUR)).toBeUndefined()
  expect(at(100, 3 * HOUR)).toBeUndefined()
  // Read 16 minutes ago (more than 15 minutes and 5% of the window), or never.
  expect(at(50, 3 * HOUR, NOW - 16 * MIN)).toBeUndefined()
  expect(at(50, 3 * HOUR, null)).toBeUndefined()
  // No reset, or a window of unknown length.
  expect(quotaForecast({ kind: 'five_hour', percentUsed: 50 }, NOW, NOW)).toBeUndefined()
  expect(at(50, 3 * HOUR, NOW, 'spend_limit')).toBeUndefined()
})

const ALL = [{ id: 'context', enabled: true }, { id: 'cacheQuota', enabled: true }, { id: 'agents', enabled: true }] as const
const FULL: TidemarkSnapshot = {
  ...EMPTY_SNAPSHOT,
  ctx: { tokens: 271_000, window: 1_000_000, percent: 27, compactAt: 800_000 },
  breakdown: {
    autoCompact: true, deferred: 0,
    rows: [{ name: 'System prompt', tokens: 9_000 }, { name: 'Messages', tokens: 200_000 }, { name: 'MCP tools', tokens: 62_000 }],
    mcp: ['a', 'b', 'c', 'd', 'e', 'f', 'g'].map((server, i) => ({ server, tokens: (i + 1) * 1_000 })),
  },
  cache: { at: NOW - MIN, warm: true }, cacheTtl: 5 * MIN,
  cacheStats: { input: 10_000, output: 4_000, read: 150_000, write: 40_000, last: 0 },
  limits: [{ kind: 'five_hour', percentUsed: 50, resetsAt: iso(3 * HOUR) }], limitsLive: true, limitsAt: NOW,
  sessionId: 'sess-1', model: 'claude-opus-5-5', effort: 'high',
  agents: [{ id: 'ag-1', model: 'claude-sonnet-5', effort: 'low', totals: [5_000], usage: { input: 12_000, output: 800, read: 9_000 }, label: 'Explore', description: 'find the parser' }],
}
const text = (r: PaneRow) => ('head' in r ? `# ${r.head}` : `${r.label}|${r.spans.map(s => s.text).join('')}`)
const rows = (snap: TidemarkSnapshot, sections: readonly { id: 'context' | 'cacheQuota' | 'agents'; enabled: boolean }[] = ALL) =>
  paneRows(snap, [...sections], NOW).map(text)

test('sections: context, cache and quota, agents, with their figures', () => {
  const r = rows(FULL)
  expect(r.filter(t => t.startsWith('# '))).toEqual(['# Context', '# Cache & quota', '# Session & agents'])
  expect(r).toContain('compacts|at 800k · 529k to go')
  // /context's categories, largest first, with their share of what is in use; top 5 servers, then the rest.
  expect(r.indexOf('|200k 74% Messages')).toBeLessThan(r.indexOf('|62k 23% MCP tools'))
  expect(r).toContain('|  7k g')
  expect(r).not.toContain('|  2k b')
  expect(r).toContain('|  and 2 more servers')
  expect(r).toContain('state|warm 4m')
  // 150k of 200k input came from the cache.
  expect(r).toContain('hit rate|75% · read 150k · written 40k · uncached 10k')
  expect(r).toContain('tokens|200k in · 4k out')
  expect(r).toContain('5h|■■■□□ 50% ↻ 3h0m')
  expect(r).toContain('|≈125% by reset · limit in ≈2h0m')
  expect(r).toContain('session ID|sess-1')
  expect(r).toContain('model|claude-opus-5-5 · effort high')
  expect(r).toContain('Explore|find the parser')
  expect(r).toContain('agent ID|ag-1')
  expect(r).toContain('model|claude-sonnet-5 · effort low')
  expect(r).toContain('tokens|12k in · 800 out · 9k cache read')
})

test("the model's own week: labelled 7d <family>, with its forecast", () => {
  // 2 days into the week at 20% a day: 3 days to go, 140% by the reset.
  const week = (kind: string, model: string) => rows({
    ...EMPTY_SNAPSHOT, model, limitsLive: true, limitsAt: NOW,
    limits: [{ kind, percentUsed: 40, resetsAt: iso(5 * 24 * HOUR) }],
  })
  for (const [kind, model, label] of [['weekly_scoped', 'claude-fable-5-1', '7d fable'], ['seven_day_opus', 'claude-opus-5-5', '7d opus']]) {
    const r = week(kind!, model!)
    expect(r.some(t => t.startsWith(`${label}|`))).toBe(true)
    expect(r).toContain('|≈140% by reset · limit in ≈3d0h')
  }
})

test("another model's week is labelled 7d <its family>, not the raw kind", () => {
  const r = rows({
    ...EMPTY_SNAPSHOT, model: 'claude-sonnet-5', limitsLive: true, limitsAt: NOW,
    limits: [{ kind: 'seven_day', percentUsed: 10, resetsAt: iso(5 * 24 * HOUR) }, { kind: 'seven_day_opus', percentUsed: 30, resetsAt: iso(5 * 24 * HOUR) }],
  })
  expect(r.some(t => t.startsWith('7d opus|'))).toBe(true)
  expect(r.some(t => t.startsWith('7d|'))).toBe(true)
  expect(r.some(t => t.startsWith('seven_day_opus|'))).toBe(false)
})

test('MCP servers come from the breakdown whatever the category is called', () => {
  const b = FULL.breakdown!
  const r = rows({ ...FULL, breakdown: { ...b, rows: b.rows.map(x => (x.name === 'MCP tools' ? { ...x, name: 'Tool schemas (MCP)' } : x)) } })
  expect(r).toContain('|  7k g')
  expect(r).toContain('|  and 2 more servers')
})

test('sections: the config sets the order, a disabled one is not drawn, an empty one says so', () => {
  const r = rows(FULL, [{ id: 'agents', enabled: true }, { id: 'context', enabled: false }, { id: 'cacheQuota', enabled: true }])
  expect(r.filter(t => t.startsWith('# '))).toEqual(['# Session & agents', '# Cache & quota'])
  expect(rows(EMPTY_SNAPSHOT)).toEqual(['# Context', '|no data yet', '# Cache & quota', '|no data yet', '# Session & agents', '|no data yet'])
  expect(rows(EMPTY_SNAPSHOT, [])).toEqual([])
})

// Through the engine: a session at 27% of a 1M window with a 5h quota; a config file when given.
const GLOBAL = '/u/dev/.config/tidemark/config.json'
async function start($: any, on: On, configText?: string) {
  mock.env(on, { HOME: '/u/dev' })
  const clock = mock.clock(on, { now: NOW })
  const limits = [{ kind: 'five_hour', percentUsed: 42, resetsAt: iso(HOUR) }]
  on('session.start', ($, e) => ({ cwd: e.cwd }))
  on('session.id', () => ({ value: 'sess-9' }))
  on('session.cwd', () => ({ value: '/u/dev/proj' }))
  on('session.model', () => ({ value: 'claude-opus-5-5' }))
  on('session.usage', () => ({ value: { startedAt: NOW, rateLimits: limits, context: { tokens: 271_000, window: 1_000_000, percent: 27 } } satisfies SessionUsage }))
  on('session.measure', ($, e) => ({ changed: e.changed }))
  on('classic.SessionStart', () => ({}))
  on('agent.list', () => ({ value: [] }))
  on('config.list', () => ({ value: [] }))
  on('store.get', () => ({ value: undefined }))
  on('store.set', () => ({ value: undefined }))
  on('fs.exists', ($, e) => ({ value: configText !== undefined && e.path === GLOBAL }))
  on('fs.read', () => ({ value: configText! }))
  on('fs.stat', ($, e) => {
    if (configText === undefined) throw new Error(`ENOENT: ${e.path}`)
    return { value: { kind: 'file', size: configText.length, mtimeMs: 1, isLink: false } }
  })
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/u/dev/proj' })
  await $.classic.SessionStart({ source: 'startup' })
  const measure = () => $.session.measure({ context: { tokens: 271_000, window: 1_000_000, percent: 27 }, rateLimits: limits, changed: ['context', 'rateLimits'] })
  await measure()
  return { clock, measure }
}
const mountPane = ($: any, surface: string) => $.ui.mount({
  plugin: 'tidemark', surface, component: 'Pane', requestId: 'tidemark',
  props: { title: 'tidemark', isFocused: false, bodyColumns: 120, placement: 'inline', scroll: { offset: 0, bodyRows: 40 }, view: {} },
})

for (const surface of ['terminal', 'desktop', 'vscode', 'mobile'] as const) {
  test(`the pane draws every section from the session (${surface})`, async ($, on) => {
    await start($, on)
    const ui = await mountPane($, surface)
    for (const t of ['Context', 'Cache & quota', 'Session & agents', /27%/, /42%/, 'sess-9']) {
      expect(await ui.find({ type: 'Text', text: t })).toBeDefined()
    }
  })
}

test('the pane follows the config: agents first, context off', async ($, on) => {
  await start($, on, JSON.stringify({ version: 1, pane: { sections: [{ id: 'agents', enabled: true }, { id: 'context', enabled: false }, { id: 'cacheQuota', enabled: true }] } }))
  const ui = await mountPane($, 'terminal')
  const heads = (await ui.findAll({ type: 'Text' })).filter((t: any) => t.props.bold).map((t: any) => t.text)
  expect(heads).toEqual(['Session & agents', 'Cache & quota'])
  expect(await ui.find({ type: 'Text', text: 'Context' })).toBeUndefined()
})

test('/tidemark opens the pane and writes nothing to the conversation', async ($, on) => {
  const opened: string[] = []
  on('ui.open', ($, e) => { opened.push(e.id); return { value: { isPlaced: true } } })
  await start($, on)
  expect(await $.command.run({ command: 'tidemark' } as CommandRunInput)).toEqual({})
  expect(opened).toEqual(['tidemark'])
})

test('a quota that has not moved for 20 minutes of live readings keeps its forecast', async ($, on) => {
  const s = await start($, on)
  // 42% used 4h into a 5h window: the reset comes first.
  const ui = await mountPane($, 'terminal')
  expect(await ui.find({ type: 'Text', text: /reset first/ })).toBeDefined()
  await s.clock.advance(20 * MIN)
  await s.measure()
  expect(await ui.find({ type: 'Text', text: /reset first/ })).toBeDefined()
})
