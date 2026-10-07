// Threshold toasts as a pure function: the snapshot module calls `evaluateAlerts` after each measure and on
// its tick, shows the toasts and keeps the memory. Nothing here calls `$`.
import { quotaWindow, weekLimit } from './widgets/kit'
import { effectiveTtl } from './model-utils'
import type { TidemarkAlertMemory, TidemarkConfig, TidemarkSnapshot } from '../types'

export type AlertMemory = TidemarkAlertMemory

export const EMPTY_ALERT_MEMORY: AlertMemory = { crossed: {}, cacheWindow: null }

// A crossed threshold toasts again only after the figure falls this many points below it.
const MARGIN = 5

// One toast per upward crossing of each threshold (context, 5h, 7d), re-armed below the threshold minus the
// margin; the cache warning once per cache window (keyed by the window's start) when it has
// `cacheSeconds` or less left. Off unless `alerts.enabled`.
export function evaluateAlerts(snap: TidemarkSnapshot, config: TidemarkConfig, memory: AlertMemory, now: number): { toasts: string[]; memory: AlertMemory } {
  const a = config.alerts
  if (!a.enabled) return { toasts: [], memory }
  const toasts: string[] = []
  const crossed = { ...memory.crossed }
  // A quota figure counts only once this session has its own reading, not the one stored from before.
  const live = snap.limitsLive ? snap.limits : []
  // The weekly window as the quota7d widget picks it, named by its widget label (`7d fable`).
  const week = weekLimit(live, snap.model)
  const fiveHour = live.find(l => l.kind === 'five_hour')
  const figures: [string, number | undefined, number, string][] = [
    ['context', snap.ctx?.percent, a.context, 'context'],
    ['quota5h', fiveHour?.percentUsed, a.quota5h, '5h quota'],
    ['quota7d', week?.percentUsed, a.quota7d, week ? quotaWindow(week.kind, snap.model).label : '7d'],
  ]
  for (const [key, value, threshold, name] of figures) {
    if (value === undefined) continue
    if (value >= threshold && !crossed[key]) {
      crossed[key] = true
      toasts.push(`tidemark: ${name} at ${Math.trunc(value)}% (alert at ${threshold}%)`)
    } else if (value < threshold - MARGIN) crossed[key] = false
  }

  let cacheWindow = memory.cacheWindow
  const c = snap.cache
  const pinned = config.lines.flat().find(w => w.widget === 'cache' && w.enabled !== false)?.options?.ttl
  const ttl = effectiveTtl(snap.cacheTtl ?? snap.ttlDefault, pinned)
  if (c?.warm && ttl !== null) {
    const left = c.at + ttl - now
    if (left > 0 && left <= a.cacheSeconds * 1000 && cacheWindow !== c.at) {
      cacheWindow = c.at
      toasts.push(`tidemark: prompt cache goes cold in ${Math.ceil(left / 1000)}s`)
    }
  }
  return { toasts, memory: { crossed, cacheWindow } }
}
