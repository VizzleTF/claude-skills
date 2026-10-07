// Threshold toasts as a pure function: off by default, one toast per upward crossing, again only after the
// figure falls 5 points below the threshold, and the cache warning once per cache window.
import { expect, test } from 'claude-code/testing'

import type { TidemarkConfig, TidemarkSnapshot } from '../types'
import { EMPTY_ALERT_MEMORY, evaluateAlerts } from '../hooks/alerts'
import type { AlertMemory } from '../hooks/alerts'
import { DEFAULT_CONFIG } from '../hooks/config-model'
import { EMPTY_SNAPSHOT } from '../hooks/snapshot'

const NOW = Date.parse('2026-10-07T12:00:00Z')
const MIN = 60_000
const ON: TidemarkConfig = { ...DEFAULT_CONFIG, alerts: { ...DEFAULT_CONFIG.alerts, enabled: true } }

const snap = (over: Partial<TidemarkSnapshot>): TidemarkSnapshot => ({ ...EMPTY_SNAPSHOT, ...over })
const ctx = (percent: number) => snap({ ctx: { tokens: percent * 10_000, window: 1_000_000, percent } })

// Feeds the snapshots in order, carrying the memory, and returns the toasts each step raised.
function run(snaps: TidemarkSnapshot[], config = ON, now = (_: number) => NOW): string[][] {
  let memory: AlertMemory = EMPTY_ALERT_MEMORY
  return snaps.map((s, i) => {
    const out = evaluateAlerts(s, config, memory, now(i))
    memory = out.memory
    return out.toasts
  })
}

test('off by default: nothing even far above every threshold', () => {
  expect(DEFAULT_CONFIG.alerts.enabled).toBe(false)
  const hot = snap({
    ctx: { tokens: 990_000, window: 1_000_000, percent: 99 },
    limits: [{ kind: 'five_hour', percentUsed: 99 }, { kind: 'seven_day', percentUsed: 99 }],
    cache: { at: NOW - 59 * MIN, warm: true },
    cacheTtl: 60 * MIN,
  })
  expect(run([hot], DEFAULT_CONFIG)).toEqual([[]])
})

test('context: one toast on the upward crossing, none while it stays above', () => {
  const toasts = run([ctx(70), ctx(80), ctx(85), ctx(79), ctx(90)])
  expect(toasts.map(t => t.length)).toEqual([0, 1, 0, 0, 0])
  expect(toasts[1]![0]).toContain('80%')
})

test('context: again only after falling below the threshold minus 5', () => {
  const toasts = run([ctx(81), ctx(76), ctx(82), ctx(74), ctx(80)])
  expect(toasts.map(t => t.length)).toEqual([1, 0, 0, 0, 1])
})

test('quotas: 5h and 7d each at 90% by default, each once', () => {
  const q = (h5: number, d7: number) => snap({ limitsLive: true, limits: [{ kind: 'five_hour', percentUsed: h5 }, { kind: 'seven_day', percentUsed: d7 }] })
  const toasts = run([q(89, 50), q(90, 50), q(95, 91), q(95, 95)])
  expect(toasts.map(t => t.length)).toEqual([0, 1, 1, 0])
  expect(toasts[1]![0]).toContain('5h')
  expect(toasts[2]![0]).toContain('7d')
})

test('quotas: no toast on a stored figure, only once the session has its own', () => {
  const limits = [{ kind: 'five_hour', percentUsed: 95 }, { kind: 'seven_day', percentUsed: 95 }]
  const toasts = run([snap({ limits, limitsLive: false }), snap({ limits, limitsLive: true })])
  expect(toasts.map(t => t.length)).toEqual([0, 2])
})

test('7d: the model\'s own week when reported (Fable: weekly_scoped), with the widget\'s label', () => {
  const week = (own: number) => snap({
    model: 'claude-fable-5-1', limitsLive: true,
    limits: [{ kind: 'seven_day', percentUsed: 40 }, { kind: 'weekly_scoped', percentUsed: own }],
  })
  const toasts = run([week(85), week(92)])
  expect(toasts.map(t => t.length)).toEqual([0, 1])
  expect(toasts[1]![0]).toContain('7d fable at 92%')
})

test('cache: one warning once it has 60 s or less left, once per cache window', () => {
  const at = NOW - 10 * MIN
  const warm = (start: number) => snap({ cache: { at: start, warm: true }, cacheTtl: 5 * MIN })
  // Minutes 10..: the window ends at at + 5 min; check at 3:30, 4:10, 4:30 into it, then a new window.
  const times = [at + 3.5 * MIN, at + 4 * MIN + 10_000, at + 4.5 * MIN, at + 6 * MIN + 4.5 * MIN]
  const toasts = run([warm(at), warm(at), warm(at), warm(at + 6 * MIN)], ON, i => times[i]!)
  expect(toasts.map(t => t.length)).toEqual([0, 1, 0, 1])
  expect(toasts[1]![0]).toContain('cache')
})

test('cache: nothing when cold, expired or the lifetime unknown', () => {
  const at = NOW - 4.5 * MIN
  expect(run([
    snap({ cache: { at, warm: false }, cacheTtl: 5 * MIN }),
    snap({ cache: { at, warm: true }, cacheTtl: null }),
    snap({ cache: { at: NOW - 6 * MIN, warm: true }, cacheTtl: 5 * MIN }),
  ])).toEqual([[], [], []])
})
