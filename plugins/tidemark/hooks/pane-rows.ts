// Pure rows for the /tidemark pane: the sections the config lists, in its order, from the snapshot.
// Forecast formula after WeekToken / ccOverhead (MIT, shengyy).
import type { TidemarkEffort, TidemarkLimit, TidemarkSectionId, TidemarkSnapshot as Snapshot } from '../types'
import type { PaneRow } from './draw'
import { WIDGETS } from './widgets'
import type { Span, WidgetInput } from './widgets'
import { bar, dur, kshort, ktok, pctTier, quota, quotaWindow, spaced } from './widgets/kit'

// When a quota window runs out at its average pace so far, and the share used by its reset. None for a
// window of unknown length or reset, a reading older than 15 min (or 5% of the window), the window's first
// minutes, a passed reset, and 0% or 100% used.
export function quotaForecast(limit: TidemarkLimit, observedAt: number | null, now: number, model: string | null = null): { exhaustsAt: number; percentAtReset: number; resetFirst: boolean } | undefined {
  const window = quotaWindow(limit.kind, model).ms
  if (!window || !limit.resetsAt || observedAt === null || observedAt > now || now - observedAt > Math.max(15 * 60_000, window * 0.05)) return undefined
  const reset = Date.parse(limit.resetsAt)
  const elapsed = window - (reset - now)
  const used = limit.percentUsed / 100
  if (!Number.isFinite(reset) || elapsed <= Math.max(5 * 60_000, window * 0.001) || elapsed >= window || !(used > 0 && used < 1)) return undefined
  const exhaustsAt = now + Math.round((elapsed * (1 - used)) / used)
  return { exhaustsAt, percentAtReset: Math.round(((used * window) / elapsed) * 1000) / 10, resetFirst: exhaustsAt >= reset }
}

type SectionId = TidemarkSectionId
const SERVERS = 5
const dim = (text: string): Span => ({ text, role: 'dim' })
const row = (label: string, ...spans: (Span | false | undefined)[]): PaneRow => ({ label, spans: spaced(spans) })
const effortOf = (e: TidemarkEffort | null | undefined) => (e === null || e === undefined ? false : dim(`· effort ${e}`))
const input = (snap: Snapshot, now: number, options: Record<string, unknown> = {}): WidgetInput =>
  ({ snap, probes: {}, options, label: null, icons: 'text', now, env: {} })

const SECTIONS: Record<SectionId, { head: string; rows(s: Snapshot, now: number): PaneRow[] }> = {
  context: { head: 'Context', rows: context },
  cacheQuota: { head: 'Cache & quota', rows: cacheQuota },
  agents: { head: 'Session & agents', rows: agents },
}

// The enabled sections in the config's order, each a heading and its rows, or `no data yet`.
export function paneRows(snap: Snapshot, sections: { id: SectionId; enabled: boolean }[], now: number): PaneRow[] {
  return sections.filter(s => s.enabled).flatMap(({ id }) => {
    const rows = SECTIONS[id].rows(snap, now)
    return [{ head: SECTIONS[id].head }, ...(rows.length > 0 ? rows : [row('', dim('no data yet'))])]
  })
}

// The fill, the auto-compaction threshold and the tokens to go, /context's categories and the costliest MCP servers.
function context(s: Snapshot): PaneRow[] {
  const ctx = s.ctx
  if (!ctx || ctx.window <= 0) return []
  const out: PaneRow[] = []
  const used = ctx.tokens ?? ctx.estimate
  if (ctx.tokens !== undefined) {
    const pc = Math.trunc(ctx.percent ?? (ctx.tokens * 100) / ctx.window)
    out.push(row('window', { text: bar(pc, 10), tier: pctTier(pc), bar: { percent: pc } }, { text: `${pc}%`, tier: pctTier(pc) }, dim(`${ktok(ctx.tokens)} of ${ktok(ctx.window)}`)))
  } else if (ctx.estimate !== undefined) {
    const pc = Math.trunc((ctx.estimate * 100) / ctx.window)
    out.push(row('window', { text: bar(pc, 10), role: 'dim', bar: { percent: pc, dim: true } }, dim(`~${pc}% ~${ktok(ctx.estimate)} of ${ktok(ctx.window)}, estimated`)))
  }
  const at = ctx.compactAt
  if (at !== undefined && at > 0 && at < ctx.window) {
    out.push(row('compacts', dim(`at ${kshort(at)}`), used !== undefined && { text: `· ${kshort(Math.max(at - used, 0))} to go`, tier: pctTier((used * 100) / at) }))
  } else if (s.breakdown && !s.breakdown.autoCompact) out.push(row('compacts', dim('never: auto-compaction is off')))
  const b = s.breakdown
  if (b && b.rows.length > 0) {
    const total = b.rows.reduce((n, r) => n + r.tokens, 0)
    for (const r of [...b.rows].sort((x, y) => y.tokens - x.tokens)) {
      out.push(row('', { text: ktok(r.tokens), tier: pctTier((r.tokens * 100) / ctx.window) }, dim(`${Math.round((r.tokens * 100) / total)}%`), { text: r.name }))
    }
  }
  // The servers by their loaded tools, whatever /context calls their category.
  if (b && b.mcp.length > 0) {
    out.push(row('MCP', dim('servers')))
    for (const m of [...b.mcp].sort((x, y) => y.tokens - x.tokens).slice(0, SERVERS)) out.push(row('', dim(`  ${ktok(m.tokens)} ${m.server}`)))
    if (b.mcp.length > SERVERS) out.push(row('', dim(`  and ${b.mcp.length - SERVERS} more servers`)))
  }
  return out
}

// The cache's state and hit rate, the main conversation's tokens, every open quota window with its forecast.
function cacheQuota(s: Snapshot, now: number): PaneRow[] {
  const out: PaneRow[] = []
  const state = WIDGETS.cache.render(input(s, now))[0]
  if (state) out.push({ label: 'state', spans: state })
  const { input: uncached, output, read, write } = s.cacheStats
  const total = uncached + read + write
  if (total > 0) {
    const hit = Math.trunc((read * 100) / total)
    out.push(row('hit rate', { text: `${hit}%`, tier: pctTier(100 - hit) }, dim(`· read ${kshort(read)} · written ${kshort(write)} · uncached ${kshort(uncached)}`)))
  }
  if (total > 0 || output > 0) out.push(row('tokens', { text: `${kshort(total)} in · ${kshort(output)} out` }))
  for (const l of s.limits) {
    const spans = quota(WIDGETS.quota5h, input(s, now, { bar: true, showReset: true, mode: 'used' }), l)[0]
    if (!spans) continue
    out.push({ label: quotaWindow(l.kind, s.model).label, spans })
    const f = s.limitsLive ? quotaForecast(l, s.limitsAt, now, s.model) : undefined
    if (f) out.push(row('', dim(`≈${Math.round(f.percentAtReset)}% by reset · ${f.resetFirst ? 'reset first' : `limit in ≈${dur(f.exhaustsAt - now)}`}`)))
  }
  return out
}

// The session, then the last subagents, the latest first.
function agents(s: Snapshot): PaneRow[] {
  const out: PaneRow[] = []
  if (s.sessionId) out.push(row('session ID', dim(s.sessionId)))
  if (s.model) out.push(row('model', { text: s.model }, effortOf(s.effort)))
  const { input: uncached, output, read, write } = s.cacheStats
  if (uncached + read + write + output > 0) out.push(row('tokens', { text: `${kshort(uncached + read + write)} in · ${kshort(output)} out` }))
  for (const a of [...s.agents].reverse()) {
    out.push(
      row(a.label ?? 'agent', a.description?.trim() && { text: a.description.replace(/\s+/g, ' ').trim() }),
      row('agent ID', dim(a.id)),
      row('model', { text: a.model }, effortOf(a.effort)),
      row('tokens', { text: `${kshort(a.usage.input)} in · ${kshort(a.usage.output)} out` }, dim(`· ${kshort(a.usage.read)} cache read`)),
    )
  }
  return out
}
