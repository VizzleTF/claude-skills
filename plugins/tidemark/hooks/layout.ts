// The band's lines: each configured line's enabled widgets rendered, then narrowed to the width (`fit`).
// Pure, so the band and the editor's preview draw the same lines.
import type { TidemarkConfig, TidemarkProbes, TidemarkSnapshot, TidemarkWidgetId } from '../types'
import { WIDGETS } from './widgets'
import type { BandEnv, Span, Variant } from './widgets'

// `config` is the trailing `⚠ config` mark of a config that did not load.
export type Segment = { widget: TidemarkWidgetId | 'config'; spans: Span[] }
export type Line = Segment[]
export type Style = TidemarkConfig['style']

// The text between two segments; powerline draws none but pads each segment and adds its arrow.
export function separatorText(style: Style): string {
  switch (style.separator) {
    case 'space': return '  '
    case 'dot': return ' · '
    case 'custom': return style.custom ?? ' │ '
    case 'powerline': return ''
    default: return ' │ '
  }
}

// ponytail: one cell per code point; wide glyphs (emoji, CJK) count as one.
const cells = (s: string) => [...s].length
const spansWidth = (spans: Span[]) => spans.reduce((n, s) => n + cells(s.text), 0)

export function lineWidth(segments: Span[][], style: Style): number {
  const extra = style.separator === 'powerline' ? 3 * segments.length : cells(separatorText(style)) * Math.max(segments.length - 1, 0)
  return segments.reduce((n, s) => n + spansWidth(s), 0) + extra
}

// The spans cut to `width` cells, the last of them ending in `…`; a cut graphic becomes plain text.
function truncate(spans: Span[], width: number): Span[] {
  const out: Span[] = []
  let left = Math.max(width - 1, 0)
  for (const s of spans) {
    const glyphs = [...s.text]
    if (glyphs.length <= left) {
      out.push(s)
      left -= glyphs.length
      continue
    }
    const { bar: _b, spark: _s, ...plain } = s
    out.push({ ...plain, text: glyphs.slice(0, left).join('') })
    break
  }
  out.push({ text: '…', role: 'dim' })
  return out.filter(s => s.text)
}

type Entry = { widget: Segment['widget']; priority: number; variants: Variant[]; at: number }

// What goes last whatever the priorities: the config button, then `flex` and the `⚠ config` mark.
const keep = (e: Entry) => (e.widget === 'actions' ? 2 : e.priority === Infinity ? 1 : 0)

// Narrows one line to `width`: while it is too wide, the visible widget with the lowest priority (the
// rightmost on a tie) moves to its next variant, or goes when it has none; the last one left is cut.
// The config button outlasts every other widget, so the editor stays one press away.
function fit(entries: Entry[], width: number, style: Style): Line {
  const shown = () => entries.map(e => e.variants[e.at]!)
  while (entries.length > 0 && lineWidth(shown(), style) > width) {
    let k = 0
    entries.forEach((e, i) => {
      const a = keep(e), b = keep(entries[k]!)
      if (a < b || (a === b && e.priority <= entries[k]!.priority)) k = i
    })
    const e = entries[k]!
    if (e.at + 1 < e.variants.length) e.at++
    else if (entries.length > 1) entries.splice(k, 1)
    else {
      const pad = style.separator === 'powerline' ? 3 : 0
      return [{ widget: e.widget, spans: truncate(e.variants[e.at]!, width - pad) }]
    }
  }
  return entries.map(e => ({ widget: e.widget, spans: e.variants[e.at]! }))
}

const CONFIG_MARK: Variant = [{ text: '⚠ config', role: 'dim' }]

// The lines to draw at `width` cells; lines with nothing to show are left out. `configError` marks the
// end of the first line with a dim `⚠ config`. A line's first two `flex` stay as empty segments that
// split it into left, (middle,) right; each is reserved as one cell and never narrowed away.
export function buildLines(
  config: TidemarkConfig, snap: TidemarkSnapshot, probes: TidemarkProbes, width: number, now: number,
  env: BandEnv & { configError?: boolean } = {},
): Line[] {
  const lines = config.lines.map(items => items.flatMap((item): Entry[] => {
    if (item.enabled === false) return []
    if (item.widget === 'flex') return [{ widget: 'flex', priority: Infinity, variants: [[{ text: ' ' }]], at: 0 }]
    const def = WIDGETS[item.widget]
    const variants = def.render({
      snap, probes, now, env, icons: config.style.icons, options: item.options ?? {}, label: item.label,
    }).filter(v => v.length > 0)
    return variants.length > 0 ? [{ widget: item.widget, priority: item.priority ?? def.defaultPriority, variants, at: 0 }] : []
  })).map(entries => entries.filter((e, i) => e.widget !== 'flex' || entries.slice(0, i).filter(x => x.widget === 'flex').length < 2))
    .filter(entries => entries.some(e => e.widget !== 'flex'))
  if (env.configError && lines.length > 0) lines[0]!.push({ widget: 'config', priority: Infinity, variants: [CONFIG_MARK], at: 0 })
  return lines.map(entries => fit(entries, width, config.style)).map(line => line.map(seg => (seg.widget === 'flex' ? { ...seg, spans: [] } : seg)))
}
