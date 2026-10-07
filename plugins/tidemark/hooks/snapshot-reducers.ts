// Pure snapshot updates: each takes the snapshot (and what an event reported) and returns the fields to
// change. snapshot.ts reads the engine and applies them in one `set`.
import type { SessionContextBreakdown, SessionContextUsage, SessionRateLimit } from 'claude-code'

import type { TidemarkAgent, TidemarkCacheStats, TidemarkCtx, TidemarkEffort, TidemarkLimit, TidemarkSnapshot, TidemarkTheme } from '../types'
import { LONG_TTL_MS, SHORT_TTL_MS, baseModel, inferTtl } from './model-utils'

type Patch = Partial<TidemarkSnapshot>

const HISTORY = 8
const AGENTS = 8
const COMPACTION_LOG = 3

export type StepUsage = { input_tokens: number; output_tokens: number; cache_read_input_tokens: number; cache_creation_input_tokens: number }

// A new context total: appended when it changed, restarted on a drop, the last HISTORY kept.
export function addSample(history: number[], tokens: number): number[] {
  const last = history.at(-1)
  if (last === tokens) return history
  if (last !== undefined && tokens < last) return [tokens]
  return [...history, tokens].slice(-HISTORY)
}

// A main request added to the counts. It rewrote the cache when it read back less than half of what the
// request before it sent; the first request after a compaction (`last` 0) never counts. The mark stays
// until a request of a later turn reads the cache.
export function addStep(stats: TidemarkCacheStats, u: StepUsage, turnId: string): TidemarkCacheStats {
  const input = u.input_tokens ?? 0
  const readTokens = u.cache_read_input_tokens ?? 0
  const write = u.cache_creation_input_tokens ?? 0
  const next: TidemarkCacheStats = {
    input: stats.input + input, output: stats.output + (u.output_tokens ?? 0), read: stats.read + readTokens,
    write: stats.write + write, last: input + readTokens + write,
  }
  if (stats.last > 0 && write > 0 && readTokens * 2 < stats.last) next.rewrite = { tokens: write, turnId }
  else if (stats.rewrite && (stats.rewrite.turnId === turnId || readTokens === 0)) next.rewrite = stats.rewrite
  return next
}

const withoutRewrite = ({ rewrite: _, ...rest }: TidemarkCacheStats): TidemarkCacheStats => rest

export function addAgentStep(agents: TidemarkAgent[], id: string, model: string, u: StepUsage, effort?: TidemarkEffort): TidemarkAgent[] {
  const total = (u.input_tokens ?? 0) + (u.cache_read_input_tokens ?? 0) + (u.cache_creation_input_tokens ?? 0)
  const before = agents.find(a => a.id === id)
  const agent: TidemarkAgent = {
    ...before, id, model, totals: addSample(before?.totals ?? [], total),
    usage: {
      input: (before?.usage.input ?? 0) + total,
      output: (before?.usage.output ?? 0) + (u.output_tokens ?? 0),
      read: (before?.usage.read ?? 0) + (u.cache_read_input_tokens ?? 0),
    },
  }
  if (effort !== undefined) agent.effort = effort
  else delete agent.effort
  return [...agents.filter(a => a.id !== id), agent].slice(-AGENTS)
}

// Every reported window; a reset time that does not parse is none.
export const pick = (rateLimits: SessionRateLimit[] | undefined): TidemarkLimit[] =>
  (rateLimits ?? []).map(({ kind, percentUsed, resetsAt }) => ({
    kind, percentUsed, ...(resetsAt !== undefined && !Number.isNaN(Date.parse(resetsAt)) && { resetsAt }),
  }))

function slim(b: SessionContextBreakdown): NonNullable<TidemarkSnapshot['breakdown']> {
  const servers = new Map<string, number>()
  for (const t of b.mcpTools ?? []) if (t.isLoaded) servers.set(t.serverName, (servers.get(t.serverName) ?? 0) + t.tokens)
  return {
    autoCompact: b.isAutoCompactEnabled,
    rows: (b.categories ?? []).filter(c => c.kind === 'used' && c.tokens > 0).map(c => ({ name: c.name, tokens: c.tokens })),
    deferred: (b.categories ?? []).filter(c => c.kind === 'deferred').reduce((n, c) => n + c.tokens, 0),
    mcp: [...servers].map(([server, tokens]) => ({ server, tokens })),
  }
}

// A theme whose name has `light` in it takes the scale's light palette; any other, the dark one.
export const themeOf = (v: unknown): TidemarkTheme => (typeof v === 'string' && /light/i.test(v) ? 'light' : 'dark')

// The context window's reading and the local breakdown (`/context`), when there is one.
export function reduceContext(s: TidemarkSnapshot, context: SessionContextUsage | undefined, recordGrowth: boolean, b: SessionContextBreakdown | undefined): Patch {
  const breakdown = b ? slim(b) : null
  if (!context?.window) return { breakdown }
  const m = s.model
  const ctx: TidemarkCtx = { window: context.window, ...(m && { model: m }) }
  const kept = s.ctx?.model !== undefined && baseModel(s.ctx.model) === baseModel(m) ? s.ctx.compactAt : undefined
  const compactAt = b ? (b.isAutoCompactEnabled ? (b.autoCompactThreshold ?? undefined) : undefined) : kept
  if (compactAt) ctx.compactAt = compactAt
  const t = context.tokens
  if (t === undefined || t <= 0) {
    // No response in this window yet (new, cleared or just compacted): /context's local estimate.
    if (b?.totalTokens) ctx.estimate = b.totalTokens
    return { breakdown, ctx }
  }
  ctx.tokens = t
  if (context.percent !== undefined) ctx.percent = context.percent
  if (!recordGrowth) return { breakdown, ctx }
  // A drop no compaction announced restarts growth; only a rewrite mark goes with it.
  const before = s.history.at(-1)
  return {
    breakdown, ctx, history: addSample(s.history, t),
    ...(before !== undefined && t < before && { cacheStats: withoutRewrite(s.cacheStats) }),
  }
}

// A main compaction: counted, growth starts over, the next request writes a new conversation.
export function reduceCompact(s: TidemarkSnapshot, tokensBefore?: number, tokensAfter?: number): Patch {
  return {
    compactions: s.compactions + 1,
    compactionLog: [...s.compactionLog, { before: tokensBefore ?? s.history.at(-1), after: tokensAfter }].slice(-COMPACTION_LOG),
    history: [],
    cacheStats: { ...withoutRewrite(s.cacheStats), last: 0 },
    cache: null,
    breakdown: null,
    ctx: s.ctx ? { window: s.ctx.window, ...(s.ctx.compactAt !== undefined && { compactAt: s.ctx.compactAt }), ...(s.ctx.model !== undefined && { model: s.ctx.model }) } : null,
  }
}

// A resumed conversation: its size, and the cache as old as the last response (`at`, when it was).
export function reduceResumed(s: TidemarkSnapshot, e: { tokens?: number; age?: number; expired?: boolean; at?: number }): Patch {
  const { tokens, age, expired, at } = e
  const patch: Patch = {}
  if (tokens !== undefined && tokens > 0) patch.cacheStats = { ...s.cacheStats, last: tokens }
  if (age === undefined || expired === undefined || at === undefined) return patch
  patch.cache = { at, warm: !expired }
  // An age between the two lifetimes tells which one the cache has.
  if (age * 1000 > SHORT_TTL_MS && age * 1000 < LONG_TTL_MS) patch.cacheTtl = expired ? SHORT_TTL_MS : LONG_TTL_MS
  return patch
}

// A main request that `started` then: the cache it touched, its effort, and the turn's output speed.
export function reduceStep(s: TidemarkSnapshot, u: StepUsage, turnId: string, started: number, effort: TidemarkEffort | null, output: number, seconds: number): Patch {
  const touched = (u.cache_read_input_tokens ?? 0) + (u.cache_creation_input_tokens ?? 0)
  return {
    effort,
    ...(s.cacheTtl === null && s.cache && {
      cacheTtl: inferTtl(started - s.cache.at, s.cacheStats.last, u.cache_read_input_tokens ?? 0, u.cache_creation_input_tokens ?? 0),
    }),
    cache: { at: started, warm: touched > 0 },
    cacheStats: addStep(s.cacheStats, u, turnId),
    ...(seconds > 0 && { speed: output / seconds }),
  }
}

// Each model has its own cache: a switch makes it cold; the old window and breakdown no longer apply.
export function reduceModelSwitch(s: TidemarkSnapshot, model: string, at: number): Patch {
  if (!s.model || baseModel(s.model) === baseModel(model)) return { model }
  return { model, effort: null, cache: s.cache ? { at, warm: false } : null, cacheTtl: null, breakdown: null, ctx: null }
}

const GOALS = 50

// Where the project note lives: the session directory's `.claude/tidemark-project.txt`.
export const notePath = (cwd: string) => `${cwd.replace(/\/$/, '')}/.claude/tidemark-project.txt`

// The goals kept per session id, this one's set (or dropped when null), the last GOALS sessions kept.
export function withGoal(goals: Record<string, string> | undefined, id: string, text: string | null): Record<string, string> {
  const { [id]: _, ...rest } = goals ?? {}
  const next = text === null ? rest : { ...rest, [id]: text }
  return Object.fromEntries(Object.entries(next).slice(-GOALS))
}
