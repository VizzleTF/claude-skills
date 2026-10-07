// What every widget shares: the span and input types, the colour scale's tiers, number and time formats.
// Scale and formulas after ccOverhead (MIT, shengyy).
import type { TidemarkLimit, TidemarkProbes, TidemarkSnapshot, TidemarkWidgetId } from '../../types'
import { WIDGET_OPTIONS } from '../config'
import type { OptionSpec } from '../config'

export type Role = 'label' | 'dim' | 'money' | 'activity'

// One run of text. `tier` is its colour on the ten-tier scale (0–9); `bar` and `spark` mark a graphic the
// terminal draws as glyphs (`text`) and the desktop as an Svg.
export type Span = {
  text: string
  role?: Role
  tier?: number
  bar?: { percent: number; dim?: boolean }
  // Running agents: drawn as that many animated spinners (up to three), the text's `+N` after them.
  activity?: number
  spark?: { values: number[]; tiers: number[] }
}
// A widget drawn one way; a widget gives its variants from the fullest to the narrowest.
export type Variant = Span[]

// What the band knows beside the snapshot: the session directory, the home directory, the subagent on screen.
export type BandEnv = { cwd?: string; home?: string; agentId?: string }

export type WidgetInput = {
  snap: TidemarkSnapshot
  probes: TidemarkProbes
  options: Record<string, unknown>
  // Absent: the widget's own label (text or nerd icon); null: no label.
  label: string | null | undefined
  icons: 'text' | 'nerd'
  now: number
  env: BandEnv
}

export type WidgetDef = {
  id: TidemarkWidgetId
  title: string
  defaultPriority: number
  options: Record<string, OptionSpec>
  // Labels by icon style; null where the widget has none.
  labels: { text: string | null; nerd: string | null }
  render(input: WidgetInput): Variant[]
}

// A widget definition with its options from the config schema.
export const widget = (id: TidemarkWidgetId, def: Omit<WidgetDef, 'id' | 'options' | 'defaultPriority'> & { defaultPriority?: number }): WidgetDef =>
  ({ id, options: WIDGET_OPTIONS[id], defaultPriority: 20, ...def })

// An option's value, its default when absent. Takes a widget or a config item with its widget's options.
export function opt<T>(def: { options: Record<string, OptionSpec> }, input: { options?: Record<string, unknown> }, name: string): T {
  return (input.options?.[name] ?? def.options[name]?.default) as T
}

// The label in effect, as the first span; `glue` sets it right before the value without a space.
export function labelled(def: WidgetDef, input: WidgetInput, spans: Span[], glue = false, override?: string): Span[] {
  const label = input.label === undefined ? (override ?? def.labels[input.icons]) : input.label
  if (!label || spans.length === 0) return spans
  const [first, ...rest] = spans
  return [{ text: label, role: 'label' }, { ...first!, text: `${glue ? '' : ' '}${first!.text}` }, ...rest]
}

// Variants without the repeats a dropped detail that was not there leaves behind.
export function distinct(vs: Variant[]): Variant[] {
  const key = (v: Variant) => JSON.stringify(v)
  return vs.filter((v, i) => v.length > 0 && (i === 0 || key(v) !== key(vs[i - 1]!)))
}

// A gain's tier: 0 below 0.1% of the window, one more per doubling, 9 from 25.6%.
export function gainTier(gain: number, window: number): number {
  let t = 0
  while (t < 9 && gain * 1000 >= window * 2 ** t) t++
  return t
}

// A used percentage's tier: 2 below 30%, one per 10% after, 9 from 90%.
export const pctTier = (p: number) => Math.min(Math.max(Math.floor(p / 10), 2), 9)

// Countdown: 2d7h, 2h34m, 41m (floored, never negative).
export function dur(ms: number): string {
  const s = Math.max(Math.floor(ms / 1000), 0)
  if (s >= 86_400) return `${Math.floor(s / 86_400)}d${Math.floor((s % 86_400) / 3_600)}h`
  if (s >= 3_600) return `${Math.floor(s / 3_600)}h${Math.floor((s % 3_600) / 60)}m`
  return `${Math.floor(s / 60)}m`
}

// Whole k/M, floored: 271k, 1M.
export function ktok(t: number): string {
  if (t >= 1_000_000) return `${Math.floor(t / 1_000_000)}M`
  if (t >= 1_000) return `${Math.floor(t / 1_000)}k`
  return String(Math.floor(t))
}

// One decimal for deltas: 3.4k, 40k, 1.2M.
export function kshort(t: number): string {
  const [x, u] = t >= 1_000_000 ? [Math.round(t / 100_000), 'M'] : t >= 1_000 ? [Math.round(t / 100), 'k'] : [t, '']
  if (!u) return String(Math.floor(x))
  return x % 10 === 0 ? `${x / 10}${u}` : `${Math.floor(x / 10)}.${x % 10}${u}`
}

// `width` cells filled to the nearest one: ■■■□□□□□□□.
export function bar(p: number, width: number): string {
  const filled = Math.max(Math.min(Math.floor((p * width) / 100 + 0.5), width), 0)
  return '■'.repeat(filled) + '□'.repeat(width - filled)
}

export const gains = (history: number[]) => history.slice(1).map((t, i) => Math.max(t - history[i]!, 0))

export function sparkline(values: number[]): string {
  const top = Math.max(...values, 1)
  return values.map(v => '▁▂▃▄▅▆▇█'[Math.min(Math.floor((v * 7) / top), 7)]).join('')
}

// A quota window still open: its reset is ahead, or it reports none.
export function openWindow(l: TidemarkLimit | undefined, now: number): { limit: TidemarkLimit; resets?: number } | undefined {
  if (!l) return undefined
  if (l.resetsAt === undefined) return { limit: l }
  const resets = Date.parse(l.resetsAt)
  return resets > now ? { limit: l, resets } : undefined
}

// At most `n` characters, the last one an ellipsis when cut.
export const cut = (s: string, n: number) => ([...s].length > n ? `${[...s].slice(0, Math.max(n - 1, 0)).join('')}…` : s)

// Spans one space apart.
export const spaced = (spans: (Span | undefined | false)[]): Span[] =>
  spans.filter((s): s is Span => !!s).map((s, i) => (i === 0 ? s : { ...s, text: ` ${s.text}` }))

const FAMILIES = ['fable', 'opus', 'sonnet', 'haiku']

// The family a model id names (`claude-fable-5-1` → `fable`).
export const modelFamily = (model: string | null) => FAMILIES.find(f => (model ?? '').toLowerCase().includes(f))

const HOUR = 3_600_000

// A quota window by its kind: its label, its length when known, and `own`, the model's family when it is
// that model's own week (a kind naming the family; for Fable a `scoped` one too, after ccOverhead). A week
// naming another family is labelled by that family (`7d opus`).
export function quotaWindow(kind: string, model: string | null): { label: string; ms?: number; own?: string } {
  if (kind === 'five_hour') return { label: '5h', ms: 5 * HOUR }
  if (kind === 'seven_day') return { label: '7d', ms: 7 * 24 * HOUR }
  const k = kind.toLowerCase()
  const family = modelFamily(model)
  if (family !== undefined && (k.includes(family) || (family === 'fable' && k.includes('scoped')))) return { label: `7d ${family}`, ms: 7 * 24 * HOUR, own: family }
  const named = FAMILIES.find(f => k.includes(f))
  if (named !== undefined) return { label: `7d ${named}`, ms: 7 * 24 * HOUR }
  return k.startsWith('seven_day') || k.includes('weekly') ? { label: kind, ms: 7 * 24 * HOUR } : { label: kind }
}

// The weekly window the band and the alerts follow: the model's own week (one naming the family wins over
// Fable's `scoped` one), else the all-models week.
export function weekLimit(limits: TidemarkLimit[], model: string | null): TidemarkLimit | undefined {
  const family = modelFamily(model)
  const owns = limits.filter(l => quotaWindow(l.kind, model).own)
  return owns.find(l => l.kind.toLowerCase().includes(family!)) ?? owns[0] ?? limits.find(l => l.kind === 'seven_day')
}

// A quota window as a widget: percent (used or left, tier always by the share used), reset, a short bar.
// A window whose reset passed is hidden, one without a reset shows none; a figure not yet this session's own is dim.
export function quota(def: WidgetDef, input: WidgetInput, l: TidemarkLimit | undefined, label?: string): Variant[] {
  const w = openWindow(l, input.now)
  if (!w) return []
  const p = Math.trunc(w.limit.percentUsed)
  const left = opt<string>(def, input, 'mode') === 'left'
  const shown = left ? 100 - p : p
  const live = input.snap.limitsLive
  const ink: Partial<Span> = live ? { tier: pctTier(p) } : { role: 'dim' }
  const pct: Span = { text: `${shown}%${left ? ' left' : ''}`, ...ink }
  const barSpan: Span | false = opt<boolean>(def, input, 'bar') && { text: bar(shown, 5), ...ink, bar: { percent: shown, ...(!live && { dim: true }) } }
  const reset: Span | false = w.resets !== undefined && opt<boolean>(def, input, 'showReset') && { text: `↻ ${dur(w.resets - input.now)}`, role: 'dim' }
  return distinct([spaced([barSpan, pct, reset]), spaced([barSpan, pct]), [pct]].map(v => labelled(def, input, v, false, label)))
}
