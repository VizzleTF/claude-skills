// The session snapshot: every figure the band, the pane and the alerts draw from, written to `$.state` by
// the engine's events and only read by everything else. Ideas and cache/growth rules after ccOverhead
// (MIT, shengyy); the code is tidemark's own.
import { atom, read, update } from 'claude-code'
import type { EngineInterface, On, SessionContextBreakdown, SessionContextUsage, SessionRateLimit, Timer } from 'claude-code'

import type { TidemarkCacheStats, TidemarkConfigState, TidemarkSnapshot, TidemarkTrack } from '../types'
import { EMPTY_ALERT_MEMORY, evaluateAlerts } from './alerts'
import { effectiveConfig } from './config-model'
import { LONG_TTL_MS as CACHE_TTL_MS, SHORT_TTL_MS, baseModel, defaultTtl, learnEffort, validCost } from './model-utils'
import type { EffortSupport } from './model-utils'
import { EMPTY_PROBES, applyProbeResult, planProbes } from './probes'
import type { ProbeOutcome, ProbeRequest } from './probes'
import { addAgentStep, pick, reduceCompact, reduceContext, reduceModelSwitch, reduceResumed, reduceStep, themeOf } from './snapshot-reducers'

export type Snapshot = TidemarkSnapshot

// Prompt-cache lifetimes: the short one, and the hour main conversations were seen to get.
export { SHORT_TTL_MS, LONG_TTL_MS as CACHE_TTL_MS } from './model-utils'
const TICK_MS = 30_000
const STORE_LIMITS = 'limits'
// What requests showed of each model's effort levels (EffortSupport); the band reads it under the same key.
export const STORE_EFFORTS = 'effortSupport'
// Commands that set the band's goal (this session) and project note (kept in the session directory).
export const GOAL = 'tidemark-goal'
export const PROJECT = 'tidemark-project'

const NO_STATS: TidemarkCacheStats = { input: 0, output: 0, read: 0, write: 0, last: 0 }
export const EMPTY_SNAPSHOT: Snapshot = {
  ctx: null, history: [], compactions: 0, compactionLog: [], breakdown: null, limits: [], limitsLive: false,
  limitsAt: null, cache: null, cacheTtl: null, ttlDefault: null, cacheStats: NO_STATS, model: null, effort: null, agents: [],
  activeAgents: 0, cost: null, turnCost: null, sessionId: null, startedAt: null, speed: null, theme: 'dark',
  goal: null, project: null,
}
const NO_TRACK: TidemarkTrack = { turnCostBase: null, turnStartedAt: null, turnOutput: 0 }

// Another module reads the snapshot through its own `atom({ plugin: 'tidemark', key: 'snapshot' }, EMPTY_SNAPSHOT)`:
// the engine wants atoms declared in the reading file and `$` never passed across an import.
const snapshotState = atom({ plugin: 'tidemark', key: 'snapshot' } as const, EMPTY_SNAPSHOT)
const track = atom({ plugin: 'tidemark', key: 'track' } as const, NO_TRACK)
const configState = atom({ plugin: 'tidemark', key: 'config' } as const, null as TidemarkConfigState | null)
const probesState = atom({ plugin: 'tidemark', key: 'probes' } as const, EMPTY_PROBES)
const alertsState = atom({ plugin: 'tidemark', key: 'alerts' } as const, EMPTY_ALERT_MEMORY)

// The snapshot as it stands; read while drawing, it redraws on every change.
export async function readSnapshot($: EngineInterface): Promise<Snapshot> {
  return read($, snapshotState)
}

const set = ($: EngineInterface, fn: (s: Snapshot) => Partial<Snapshot>) => update($, snapshotState, s => ({ ...s, ...fn(s) }))
const setTrack = ($: EngineInterface, fn: (t: TidemarkTrack) => Partial<TidemarkTrack>) => update($, track, t => ({ ...t, ...fn(t) }))

// Bumped by a conversation reset, so reads that started before it are dropped.
let revision = 0
let tick: Timer | undefined
let settling: Timer | undefined

async function readTheme($: EngineInterface) {
  const rows = await $.config.list().catch(() => [])
  const theme = themeOf(rows.find(row => row.key === 'theme')?.value)
  await set($, () => ({ theme }))
}

// A new conversation (/clear, /resume, /branch, another session id): its figures start over, the
// account's quota and the theme stay.
async function resetConversation($: EngineInterface, startedAt: number | null) {
  revision++
  await set($, s => ({ ...EMPTY_SNAPSHOT, limits: s.limits, theme: s.theme, sessionId: s.sessionId, model: s.model, startedAt, goal: s.goal, project: s.project }))
  await update($, track, () => NO_TRACK)
}

async function syncSession($: EngineInterface): Promise<boolean> {
  const r = revision
  const id = await $.session.id().catch(() => null)
  if (r !== revision || id === null) return false
  const previous = (await read($, snapshotState)).sessionId
  await set($, () => ({ sessionId: id }))
  const changed = previous !== null && previous !== id
  if (changed) await resetConversation($, await $.clock.now())
  return changed
}

async function setModel($: EngineInterface, id: string) {
  const at = await $.clock.now()
  await set($, s => reduceModelSwitch(s, id, at))
}

async function readModel($: EngineInterface) {
  const r = revision
  const id = await $.session.model().catch(() => null)
  if (r === revision && id) await setModel($, id)
}

async function takeCost($: EngineInterface, value: number | undefined) {
  const s = await read($, snapshotState)
  const previous = s.cost
  await set($, () => ({ cost: validCost(value) ? value : null }))
  if (!validCost(value) || (previous !== null && value < previous)) {
    await set($, () => ({ turnCost: null }))
    if (validCost(value)) await setTrack($, () => ({ turnCostBase: null }))
    return
  }
  const base = (await read($, track)).turnCostBase
  if (base !== null) await set($, () => ({ turnCost: value >= base ? value - base : null }))
}

// The session's own quota reading; shared through `$.store` only when its own figure changed, so an idle
// session never overwrites a newer one. `withdrawn`: an empty reading means the windows went away.
async function takeLimits($: EngineInterface, rateLimits: SessionRateLimit[] | undefined, withdrawn: boolean) {
  const live = pick(rateLimits)
  if (live.length === 0 && !withdrawn) return
  const s = await read($, snapshotState)
  const changed = !s.limitsLive || JSON.stringify(live) !== JSON.stringify(s.limits)
  // `limitsAt` is the last reading, changed or not: a figure that holds still is still fresh.
  const at = await $.clock.now()
  await set($, () => ({ limits: live, limitsLive: true, limitsAt: at }))
  if (changed) await $.store.set(STORE_LIMITS, live).catch(() => undefined)
}

async function localBreakdown($: EngineInterface): Promise<SessionContextBreakdown | undefined> {
  try {
    return (await $.session.usage({ breakdown: 'summary' })).context.breakdown
  } catch {
    return undefined
  }
}

async function takeContext($: EngineInterface, context: SessionContextUsage | undefined, recordGrowth: boolean, r: number) {
  const b = await localBreakdown($)
  if (r !== revision) return
  await set($, s => reduceContext(s, context, recordGrowth, b))
}

// The engine's figures now; quota from `$.store` until this session has its own.
async function load($: EngineInterface, recordGrowth = false) {
  await syncSession($)
  const r = revision
  const usage = await $.session.usage().catch(() => undefined)
  if (!usage || r !== revision) return
  await readModel($)
  if (r !== revision) return
  if (usage.startedAt > 0 && (await read($, snapshotState)).startedAt === null) await set($, () => ({ startedAt: usage.startedAt }))
  await takeCost($, usage.cost?.usd)
  await takeContext($, usage.context, recordGrowth, r)
  if (r !== revision) return
  await takeLimits($, usage.rateLimits, false)
  await readTtlDefault($, pick(usage.rateLimits))
  if (pick(usage.rateLimits).length === 0 && !(await read($, snapshotState)).limitsLive) {
    const saved = await $.store.get(STORE_LIMITS).catch(() => undefined)
    if (r === revision && Array.isArray(saved)) await set($, () => ({ limits: saved as TidemarkLimit[] }))
  }
}

// What Claude Code asks for by its environment, settings and account; read on every load, cheap.
async function readTtlDefault($: EngineInterface, limits: TidemarkLimit[]) {
  const env = {
    force5m: await $.env.get('FORCE_PROMPT_CACHING_5M').catch(() => undefined),
    ttl: await $.env.get('CLAUDE_CODE_PROMPT_CACHE_TTL').catch(() => undefined),
    enable1h: await $.env.get('ENABLE_PROMPT_CACHING_1H').catch(() => undefined),
  }
  const settings = await $.settings.read().catch(() => ({}) as Record<string, unknown>)
  const ttlDefault = defaultTtl(env, (settings as Record<string, unknown>).promptCacheTtl, limits)
  if ((await read($, snapshotState)).ttlDefault !== ttlDefault) await set($, () => ({ ttlDefault }))
}

async function readActiveAgents($: EngineInterface) {
  const r = revision
  const list = await $.agent.list().catch(() => [])
  if (r !== revision) return
  const count = list.filter(a => a.status === 'running').length
  await set($, s => ({
    activeAgents: count,
    agents: s.agents.map(agent => {
      const info = list.find(a => a.id === agent.id)
      return info ? { ...agent, label: info.type, ...(info.description !== undefined && { description: info.description }) } : agent
    }),
  }))
}

// The engine installs readings after the hook returns; one coalesced read picks them up.
function refreshSoon($: EngineInterface) {
  settling?.cancel()
  settling = $.clock.after(100, async () => {
    await readActiveAgents($)
    await load($).catch(logTo($, 'load'))
  })
}

async function resumed($: EngineInterface, e: { context_tokens?: number; seconds_since_last_response?: number; prompt_cache_likely_expired?: boolean }) {
  const { context_tokens: tokens, seconds_since_last_response: age, prompt_cache_likely_expired: expired } = e
  const at = age !== undefined ? (await $.clock.now()) - age * 1000 : undefined
  await set($, s => reduceResumed(s, { tokens, age, expired, at }))
}

// What a request sent against the level asked for, kept per Claude Code version in the plugin store.
async function learnEfforts($: EngineInterface, model: string, asked: string, sent: string | number | undefined) {
  const version = (await $.session.version()).version
  const saved = await $.store.get(STORE_EFFORTS) as EffortSupport | undefined
  const next = learnEffort(saved, version, model, asked, sent)
  if (JSON.stringify(next) !== JSON.stringify(saved)) await $.store.set(STORE_EFFORTS, next)
}

// Probe keys with a request in flight: a key never runs twice at once.
const running = new Set<string>()

// A failure the band survives goes to the debug log (`claude --debug`), led by the plugin's name.
const logTo = ($: EngineInterface, where: string) => (err: unknown) =>
  $.ui.log(`${where}: ${err instanceof Error ? err.message : String(err)}`, { to: 'debug' })

async function runProbe($: EngineInterface, req: ProbeRequest, cwd: string): Promise<ProbeOutcome> {
  try {
    if (req.kind === 'process') {
      const r = await $.process.run(req.argv, { cwd, timeoutMs: req.timeoutMs, ...(req.stdin !== undefined && { stdin: req.stdin }), ...(req.env && { env: req.env }) })
      return r.exitCode === 0 ? { ok: true, stdout: r.stdout } : { ok: false, error: r.stderr.trim() || `exit ${r.exitCode}` }
    }
    let timer: Timer | undefined
    const timeout = new Promise<never>((_, reject) => { timer = $.clock.after(req.timeoutMs, () => reject(new Error('timeout'))) })
    try {
      const r = await Promise.race([$.http.fetch(req.url), timeout])
      return { ok: true, text: r.text, status: r.status }
    } finally {
      timer?.cancel()
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}

// Runs what the probes module plans, without holding the caller: each result lands in the `probes` atom.
async function probe($: EngineInterface, trigger: 'tick' | 'turn') {
  const { config } = effectiveConfig(await read($, configState))
  const cwd = await $.session.cwd().catch(() => '')
  const now = await $.clock.now()
  const plan = planProbes(config, await read($, probesState), await read($, snapshotState), cwd, now, trigger)
  for (const req of plan) {
    if (running.has(req.key)) continue
    running.add(req.key)
    void runProbe($, req, cwd).then(async outcome => {
      const at = await $.clock.now()
      await update($, probesState, p => applyProbeResult(p, req.key, outcome, at))
    }).catch(logTo($, `probe ${req.key}`)).finally(() => running.delete(req.key))
  }
}

// Threshold toasts from the alerts module; its memory kept in the `alerts` atom.
async function alert($: EngineInterface) {
  const { config } = effectiveConfig(await read($, configState))
  const now = await $.clock.now()
  const { toasts, memory } = evaluateAlerts(await read($, snapshotState), config, await read($, alertsState), now)
  await update($, alertsState, () => memory)
  for (const text of toasts) $.ui.toast(text)
}

// The project note, kept in the session directory so it outlives the session.
async function projectFile($: EngineInterface): Promise<string | null> {
  const cwd = await $.session.cwd().catch(() => null)
  return cwd ? `${cwd.replace(/\/$/, '')}/.claude/tidemark-project.txt` : null
}

async function snapshotStart($: EngineInterface): Promise<void> {
    tick?.cancel()
    tick = $.clock.every(TICK_MS, async () => {
      await load($).catch(logTo($, 'tick load'))
      await readActiveAgents($).catch(logTo($, 'tick agents'))
      await probe($, 'tick').catch(logTo($, 'tick probe'))
      await alert($).catch(logTo($, 'tick alert'))
      $.ui.invalidate('ui.render')
    })
    if ((await read($, snapshotState)).startedAt === null) {
      const now = await $.clock.now()
      await set($, () => ({ startedAt: now }))
    }
    const file = await projectFile($)
    const note = file ? (await $.fs.read(file).catch(() => '')).trim() : ''
    if (note) await set($, () => ({ project: note }))
    await readTheme($)
    await readActiveAgents($)
    await load($)
}

async function snapshotTurnStart($: EngineInterface): Promise<void> {
    await syncSession($)
    const r = revision
    const reading = await $.session.usage().catch(() => undefined)
    const now = await $.clock.now()
    if (r !== revision) return
    await setTrack($, () => ({ turnCostBase: validCost(reading?.cost?.usd) ? reading.cost.usd : null, turnStartedAt: now, turnOutput: 0 }))
    await set($, () => ({ turnCost: null }))
}

async function snapshotTurnComplete($: EngineInterface): Promise<void> {
    const r = revision
    await readActiveAgents($)
    refreshSoon($)
    const ledger = await $.session.usage().catch(() => undefined)
    if (r === revision) await takeCost($, ledger?.cost?.usd)
    await probe($, 'turn').catch(logTo($, 'turn probe'))
}

// The snapshot owns session.start, turn.start and turn.complete: the engine takes one hook per event per
// plugin. `commands` are registered at session start for the modules that answer them.
export function registerSnapshot(on: On, commands: { name: string; description: string }[]): void {
  on('session.start', async ($, e, next) => {
    const result = await next(e)
    // Session state outlives a reload of the mod: a snapshot an older version stored gets the newer fields.
    await set($, s => ({ ...EMPTY_SNAPSHOT, ...s })).catch(logTo($, 'session.start state'))
    await snapshotStart($).catch(logTo($, 'session.start'))
    // A host that registers no commands still draws the band.
    for (const command of commands) await $.command.register(command).catch(logTo($, `register /${command.name}`))
    return result
  })

  on('turn.start', async ($, e, next) => {
    await snapshotTurnStart($).catch(logTo($, 'turn.start'))
    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    const result = await next(e)
    await snapshotTurnComplete($).catch(logTo($, 'turn.complete'))
    return result
  })

  // /clear, /resume and /branch start another conversation with no new session.start.
  on('classic.SessionStart', { source: ['clear', 'resume', 'fork'] }, async ($, e, next) => {
    try {
      return await next(e)
    } finally {
      await resetConversation($, await $.clock.now())
      await load($)
      if (e.source !== 'clear') await resumed($, e)
    }
  })

  // After each main turn and when a quota window moves.
  on('session.measure', async ($, e, next) => {
    const r = revision
    const result = await next(e)
    if (r !== revision) return result
    await syncSession($)
    if (r !== revision) return result
    await readModel($)
    await takeCost($, e.cost?.usd)
    await takeContext($, e.context, true, r)
    if (r === revision) await takeLimits($, e.rateLimits, e.changed.includes('rateLimits'))
    await alert($).catch(logTo($, 'alert'))
    return result
  })

  // A main compaction: counted, growth starts over, the next request writes a new conversation.
  on('session.compact', async ($, e, next) => {
    const result = await next(e)
    if (e.agentId === undefined && e.trigger !== 'precompute' && result.skip === undefined) {
      await set($, s => reduceCompact(s, result.tokensBefore, result.tokensAfter))
      refreshSoon($)
    }
    return result
  })

  on('classic.PostModelSwitch', async ($, e, next) => {
    const result = await next(e)
    await setModel($, e.to_model)
    await set($, () => ({ cacheTtl: e.cache_ttl === '5m' ? SHORT_TTL_MS : CACHE_TTL_MS }))
    refreshSoon($)
    return result
  })

  on('agent.spawn', async ($, e, next) => {
    const result = await next(e)
    await readActiveAgents($)
    refreshSoon($)
    return result
  })

  // Each request: main ones feed the cache, effort and speed; a subagent's feed its own entry.
  on('turn.step', async function* ($, e, next) {
    const r = revision
    const started = await $.clock.now()
    const result = yield* next(e)
    if (r !== revision) return result
    const u = result.usage
    if (!u) return result
    const effort = baseModel(e.model) === baseModel(u.model) ? e.effort : undefined
    if (e.agentId === undefined) {
      await syncSession($)
      if (r !== revision) return result
      await setModel($, u.model)
      const now = await $.clock.now()
      const t = await read($, track)
      const output = t.turnOutput + (u.output_tokens ?? 0)
      await setTrack($, () => ({ turnOutput: output, effortAsked: null }))
      if (t.effortAsked) await learnEfforts($, u.model, t.effortAsked, effort).catch(logTo($, 'effort support'))
      const seconds = t.turnStartedAt !== null ? (now - t.turnStartedAt) / 1000 : 0
      await set($, s => reduceStep(s, u, e.turnId, started, effort ?? null, output, seconds))
      refreshSoon($)
    } else {
      const id = e.agentId
      await set($, s => ({ agents: addAgentStep(s.agents, id, u.model, u, effort) }))
    }
    await readActiveAgents($)
    return result
  })

  on('command.run', { command: ['clear', 'resume', 'branch', 'model', 'autocompact', 'theme', 'effort'] }, async ($, e, next) => {
    const result = await next(e)
    // The level asked for, held until the next main request shows what the model was sent.
    if (e.command === 'effort') await setTrack($, () => ({ effortAsked: e.args.trim() || null }))
    if (e.command === 'theme') await readTheme($)
    refreshSoon($)
    return result
  })

  // No text: a command's text is a transcript row the model reads too. Blank args clear the note.
  on('command.run', { command: [GOAL, PROJECT] }, async ($, e) => {
    const text = e.args.trim() || null
    if (e.command === GOAL) {
      await set($, () => ({ goal: text }))
      return {}
    }
    await set($, () => ({ project: text }))
    const file = await projectFile($)
    if (file) await $.fs.write(file, text ?? '').catch(logTo($, 'project note'))
    return {}
  })

  on('config.set', { key: ['theme', 'autoCompact'] }, async ($, e, next) => {
    const result = await next(e)
    if (result.deny === undefined) {
      if (e.key === 'theme') await set($, () => ({ theme: themeOf(result.value) }))
      else refreshSoon($)
    }
    return result
  })
}
