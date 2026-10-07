// The session snapshot through the engine's events. Seam: `Pane tidemark-raw` lists each snapshot field as
// `name: <json>` (a test cannot read `$.state`; the /tidemark pane shows only part of it, formatted, and its
// own tests drive it through the same events).
import { expect, mock, test } from 'claude-code/testing'
import type { On, SessionContextBreakdown, SessionRateLimit, SessionUsage, TurnStepResult } from 'claude-code'

const NOW = Date.parse('2026-10-03T15:00:00Z')
const MIN = 60_000
const WINDOW = 1_000_000
const MODEL = 'claude-opus-5-5'

const BREAKDOWN = (totalTokens: number): SessionContextBreakdown => ({
  categories: [], totalTokens, maxTokens: WINDOW, rawMaxTokens: WINDOW, autocompactSource: 'model-default',
  percentage: 1, gridRows: [], model: MODEL, memoryFiles: [], mcpTools: [], agents: [],
  isAutoCompactEnabled: true, apiUsage: null,
})

const fill = (tokens: number) => ({ tokens, window: WINDOW, percent: Math.round(tokens / 10_000) })

// What the fake host answers; tests change the fields between events.
type World = { id: string; tokens?: number; estimate: number; limits: SessionRateLimit[]; startedAt: number; model: string; step?: TurnStepResult; settings?: Record<string, unknown> }

function host(on: On, world: World, store: Record<string, unknown> = {}) {
  const writes: unknown[] = []
  const saved = new Map(Object.entries(store))
  on('session.start', ($, e) => ({ cwd: e.cwd }))
  on('session.id', () => ({ value: world.id }))
  on('session.model', () => ({ value: world.model }))
  on('session.usage', ($, e) => {
    const value: SessionUsage = {
      startedAt: world.startedAt,
      rateLimits: world.limits,
      context: {
        ...(world.tokens === undefined ? { window: WINDOW } : fill(world.tokens)),
        ...(e.breakdown && { breakdown: BREAKDOWN(world.estimate) }),
      },
    }
    return { value }
  })
  on('session.measure', ($, e) => ({ changed: e.changed }))
  on('session.compact', ($, e) => ({ messages: e.messages, tokensBefore: 400_000, tokensAfter: 30_000 }))
  on('turn.step', async function* () { return world.step! })
  on('turn.start', ($, e) => ({ turnId: e.turnId }))
  on('turn.complete', () => ({ text: '' }))
  on('classic.SessionStart', () => ({}))
  on('classic.PostModelSwitch', () => ({}))
  on('agent.list', () => ({ value: [] }))
  on('config.list', () => ({ value: [] }))
  on('settings.read', () => ({ value: world.settings ?? {} }))
  on('store.get', ($, e) => ({ value: saved.get(e.key) }))
  on('store.set', ($, e) => {
    saved.set(e.key, e.value)
    writes.push(e.value)
    return { value: undefined }
  })
  return { writes }
}

const MSG = [{ role: 'user', text: 'summary', toolUses: [] }]
const world = (over: Partial<World> = {}): World => ({ id: 's1', estimate: 13_689, limits: [], startedAt: 0, model: MODEL, ...over })

async function start($: any, on: On, w: World, store?: Record<string, unknown>) {
  const h = host(on, w, store)
  const clock = mock.clock(on, { now: NOW })
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/u/dev/proj' })
  const pane = await $.ui.mount({
    plugin: 'tidemark', surface: 'terminal', component: 'Pane', requestId: 'tidemark-raw',
    props: { title: 'tidemark-raw', isFocused: false, bodyColumns: 200, placement: 'inline', scroll: { offset: 0, bodyRows: 60 }, view: {} },
  })
  // One snapshot field from the raw pane.
  const field = async (name: string) => {
    const el = await pane.find({ type: 'Text', text: new RegExp(`^${name}: `) })
    return JSON.parse((el!.text as string).slice(name.length + 2))
  }
  return { ...h, clock, field }
}

const measure = ($: any, tokens: number, rateLimits: SessionRateLimit[] = [], changed = ['context']) =>
  $.session.measure({ context: fill(tokens), rateLimits, changed })

const step = (usage: Partial<TurnStepResult['usage']> & { model?: string }, turnId = 't'): TurnStepResult => ({
  turnId, index: 0, answer: '', toolUses: [], stopReason: 'end_turn',
  usage: { model: MODEL, input_tokens: 1, output_tokens: 1, cache_read_input_tokens: 0, cache_creation_input_tokens: 0, ...usage } as TurnStepResult['usage'],
})

async function runStep($: any, w: World, result: TurnStepResult, input: Record<string, unknown> = {}) {
  w.step = result
  for await (const _ of $.turn.step({ turnId: result.turnId, index: 0, model: MODEL, messageCount: 3, ...input })) { /* drain */ }
}

test('before the first response the context is the /context estimate, without tokens', async ($, on) => {
  const s = await start($, on, world())
  expect(await s.field('ctx')).toEqual({ window: WINDOW, model: MODEL, estimate: 13_689 })
  // The conversation starts with the session.
  expect(await s.field('startedAt')).toBe(NOW)
})

test('growth keeps the last 8 totals and restarts on a compaction, /clear and an unannounced drop', async ($, on) => {
  const w = world()
  const s = await start($, on, w)
  for (let k = 1; k <= 10; k++) await measure($, k * 10_000)
  expect(await s.field('history')).toEqual([30_000, 40_000, 50_000, 60_000, 70_000, 80_000, 90_000, 100_000])
  expect((await s.field('ctx')).tokens).toBe(100_000)
  // A drop nothing announced.
  await measure($, 60_000)
  expect(await s.field('history')).toEqual([60_000])
  await measure($, 70_000)
  // A main compaction: counted, growth empty, the next figure is the estimate again.
  await $.session.compact({ trigger: 'auto', messages: MSG })
  expect(await s.field('history')).toEqual([])
  expect(await s.field('compactions')).toBe(1)
  expect(await s.field('compactionLog')).toEqual([{ before: 400_000, after: 30_000 }])
  await s.clock.advance(100)
  expect(await s.field('ctx')).toEqual({ window: WINDOW, model: MODEL, estimate: 13_689 })
  // A subagent's compaction and a precompute are not counted.
  await $.session.compact({ trigger: 'auto', agentId: 'a1', messages: MSG })
  await $.session.compact({ trigger: 'precompute', messages: MSG })
  expect(await s.field('compactions')).toBe(1)
  await measure($, 40_000)
  await measure($, 50_000)
  expect(await s.field('history')).toEqual([40_000, 50_000])
  // /clear: a new conversation, its figures start over, it starts now.
  await s.clock.advance(5 * MIN)
  w.tokens = undefined
  w.estimate = 9_000
  await $.classic.SessionStart({ source: 'clear' })
  expect(await s.field('history')).toEqual([])
  expect(await s.field('compactions')).toBe(0)
  expect(await s.field('startedAt')).toBe(NOW + 5 * MIN + 100)
  expect(await s.field('ctx')).toEqual({ window: WINDOW, model: MODEL, estimate: 9_000 })
})

test('quota: the stored figure, not live, until the session has its own; stored only when it changes', async ($, on) => {
  const old = [{ kind: 'five_hour', percentUsed: 30, resetsAt: '2026-10-03T17:00:00.000Z' }]
  const s = await start($, on, world(), { limits: old })
  expect(await s.field('limits')).toEqual(old)
  expect(await s.field('limitsLive')).toBe(false)
  expect(s.writes).toEqual([])
  const own = [{ kind: 'five_hour', percentUsed: 42, resetsAt: '2026-10-03T17:00:00.000Z' }]
  await measure($, 20_000, own, ['rateLimits'])
  expect(await s.field('limits')).toEqual(own)
  expect(await s.field('limitsLive')).toBe(true)
  // The same figure again: nothing written.
  await measure($, 30_000, own, ['context'])
  await s.clock.advance(30_000)
  expect(s.writes).toEqual([own])
})

test('cache: warm on a read, rewrite when less than half came back, cold on a model switch', async ($, on) => {
  const w = world()
  const s = await start($, on, w)
  await runStep($, w, step({ cache_creation_input_tokens: 50_000 }))
  expect(await s.field('cache')).toEqual({ at: NOW, warm: true })
  // The first write of a conversation is no rewrite.
  expect((await s.field('cacheStats')).rewrite).toBeUndefined()
  await s.clock.advance(MIN)
  await runStep($, w, step({ cache_read_input_tokens: 50_000, cache_creation_input_tokens: 2_000 }))
  expect((await s.field('cacheStats')).rewrite).toBeUndefined()
  await runStep($, w, step({ cache_read_input_tokens: 10_000, cache_creation_input_tokens: 45_000 }, 'u'))
  const stats = await s.field('cacheStats')
  expect(stats.rewrite).toEqual({ tokens: 45_000, turnId: 'u' })
  expect(stats.read).toBe(60_000)
  expect(stats.write).toBe(97_000)
  // A request that touched no cache: cold.
  await runStep($, w, step({}, 'v'))
  expect((await s.field('cache')).warm).toBe(false)
  await runStep($, w, step({ cache_read_input_tokens: 90_000 }, 'v'))
  expect((await s.field('cache')).warm).toBe(true)
  await s.clock.advance(MIN)
  await $.classic.PostModelSwitch({ from_model: MODEL, to_model: 'claude-sonnet-5', cache_ttl: '5m' })
  expect(await s.field('cache')).toEqual({ at: NOW + 2 * MIN, warm: false })
  expect(await s.field('cacheTtl')).toBe(5 * MIN)
  expect(await s.field('model')).toBe('claude-sonnet-5')
})

test('cache lifetime: learnt from the pause before a request, kept once known', async ($, on) => {
  const w = world()
  const s = await start($, on, w)
  await runStep($, w, step({ cache_creation_input_tokens: 50_000 }))
  expect(await s.field('cacheTtl')).toBe(null)
  // A read within five minutes proves nothing.
  await s.clock.advance(4 * MIN)
  await runStep($, w, step({ cache_read_input_tokens: 50_000, cache_creation_input_tokens: 1_000 }))
  expect(await s.field('cacheTtl')).toBe(null)
  // Read back after twenty minutes: the cache lives an hour.
  await s.clock.advance(20 * MIN)
  await runStep($, w, step({ cache_read_input_tokens: 51_000, cache_creation_input_tokens: 1_000 }))
  expect(await s.field('cacheTtl')).toBe(60 * MIN)
})

test('cache lifetime: a rewrite after a pause of five minutes to an hour proves five minutes', async ($, on) => {
  const w = world()
  const s = await start($, on, w)
  await runStep($, w, step({ cache_creation_input_tokens: 50_000 }))
  await s.clock.advance(10 * MIN)
  await runStep($, w, step({ cache_creation_input_tokens: 51_000 }, 'u'))
  expect(await s.field('cacheTtl')).toBe(5 * MIN)
})

test('cache lifetime by default: an hour on a subscription, the promptCacheTtl setting over it', async ($, on) => {
  const resets = new Date(NOW + 3_600_000).toISOString()
  const sub = world({ limits: [{ kind: 'five_hour', percentUsed: 42, resetsAt: resets }] })
  const s = await start($, on, sub)
  expect(await s.field('ttlDefault')).toBe(60 * MIN)
  sub.settings = { promptCacheTtl: '5m' }
  await s.clock.advance(30_000)
  expect(await s.field('ttlDefault')).toBe(5 * MIN)
})

test('speed: output tokens of the main turn over the time since it started', async ($, on) => {
  const w = world()
  const s = await start($, on, w)
  expect(await s.field('speed')).toBe(null)
  await $.turn.start({ turnId: 't', text: '' })
  await s.clock.advance(4_000)
  await runStep($, w, step({ output_tokens: 120 }))
  await s.clock.advance(6_000)
  await runStep($, w, step({ output_tokens: 300 }))
  // A subagent's output is not the main turn's.
  await runStep($, w, step({ output_tokens: 5_000 }), { agentId: 'a1' })
  expect(await s.field('speed')).toBe(42)
})

test('a config with no external widgets runs no process and fetches nothing', async ($, on) => {
  const config = JSON.stringify({ version: 1, lines: [['context', 'cache', 'quota5h']] })
  const calls: string[] = []
  mock.env(on, { HOME: '/u/dev' })
  on('session.cwd', () => ({ value: '/u/dev/proj' }))
  on('fs.exists', ($, e) => ({ value: e.path === '/u/dev/.config/tidemark/config.json' }))
  on('fs.read', ($, e) => ({ value: config }))
  on('fs.stat', () => ({ value: { kind: 'file', size: config.length, mtimeMs: 1, isLink: false } }))
  on('process.run', ($, e) => { calls.push(e.argv.join(' ')); return { value: { exitCode: 0, stdout: '', stderr: '', isStdoutTruncated: false, isStderrTruncated: false } } })
  on('http.fetch', ($, e) => { calls.push(e.url); return { value: { status: 200, ok: true, headers: {}, text: '' } } })
  const w = world()
  const s = await start($, on, w)
  await $.classic.SessionStart({ source: 'startup' })
  await $.turn.start({ turnId: 't', text: '' })
  await runStep($, w, step({ cache_read_input_tokens: 1_000 }))
  await $.turn.complete({ turnId: 't', answer: '', durationMs: 1, isAborted: false, reason: 'answer' })
  await measure($, 20_000)
  await s.clock.advance(65_000)
  expect(calls).toEqual([])
})

test('a failure the band survives goes to the debug log', async ($, on) => {
  const logs: { text: string; to?: string }[] = []
  // The fake host implements no command.register, so registering /tidemark fails.
  on('ui.log', ($, e) => {
    logs.push({ text: e.text, to: e.to })
    return { value: undefined }
  })
  await start($, on, world())
  expect(logs).toContainEqual({ text: 'register /tidemark: no implementation for command.register', to: 'debug' })
})
