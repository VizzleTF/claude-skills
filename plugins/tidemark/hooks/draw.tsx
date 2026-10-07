// Lines of spans as element trees. The terminal draws monospace text: glyph bars, each sparkline glyph in
// its own colour, powerline arrows. The desktop draws a proportional font: rows spaced by `gap`, bars and
// sparklines as Svg, powerline segments as coloured Boxes. Palette after ccOverhead (MIT, shengyy).
import type { Elements } from 'claude-code'

import type { TidemarkTheme } from '../types'
import type { Line, Segment, Style } from './layout'
import { separatorText } from './layout'
import type { Press, Span } from './widgets'
import { SPINNERS, spinnerSvg } from './draw-spinner'

type Ink = { dark: string; light: string }
type Term = Pick<Elements['terminal'], 'Box' | 'Text'> & Partial<Pick<Elements['terminal'], 'Client' | 'Button' | 'Link'>>
type Rich = Pick<Elements['desktop'], 'Box' | 'Text' | 'Svg'> & Partial<Pick<Elements['desktop'], 'Button' | 'Link'>>
// What a press on a span runs; absent, presses draw as plain text (the editor's preview).
export type OnPress = (press: Press) => void
export type Surface = 'terminal' | 'desktop' | 'vscode' | 'mobile'

// The ten-tier scale, cool (safe) to warm (warning).
export const TIERS: Ink[] = [
  { dark: '#5965cd', light: '#4c55bc' },
  { dark: '#4087de', light: '#266ec3' },
  { dark: '#37aae3', light: '#0076a8' },
  { dark: '#35c5db', light: '#007a8b' },
  { dark: '#49d6cc', light: '#007c74' },
  { dark: '#b8e45c', light: '#567a00' },
  { dark: '#f9e149', light: '#856d00' },
  { dark: '#fea92f', light: '#a05f00' },
  { dark: '#fd7933', light: '#bc4c00' },
  { dark: '#ed4b43', light: '#bb0916' },
]
export const MONEY: Ink = { dark: '#dfbc70', light: '#8a6215' }
const DIM: Ink = { dark: '#898781', light: '#6f6d68' }
const TRACK = 'rgba(137,135,129,0.3)'
const ACTIVITY_TIER = 5

// Powerline backgrounds of the widgets that have no tier, and the text on a tier's background.
const NEUTRAL: Record<string, Ink> = {
  model: { dark: '#3a3f4b', light: '#d9dde6' },
  git: { dark: '#2f4a3f', light: '#d3e6dc' },
  cwd: { dark: '#3d3a52', light: '#dedbef' },
  time: { dark: '#4a3d33', light: '#ecdfd3' },
}
const NEUTRAL_OF: Record<string, string> = { gitPr: 'git', sessionTime: 'time', compactions: 'time', tokenSpeed: 'time', command: 'time', claudeStatus: 'time' }
const ON_TIER = '#1a1a1a'

// The fixed scale's light palette for a light theme, the dark one for any other or none.
const mode = (theme: TidemarkTheme | string | undefined): keyof Ink => (/light/i.test(theme ?? '') ? 'light' : 'dark')

export const tierColor = (tier: number, theme: TidemarkTheme): string => TIERS[tier]![mode(theme)]

// A span's text colour; undefined for plain text.
export function colorOf(s: Span, theme: TidemarkTheme): string | undefined {
  if (s.role === 'money') return MONEY[mode(theme)]
  const tier = s.tier ?? (s.role === 'activity' ? ACTIVITY_TIER : undefined)
  return tier === undefined ? undefined : tierColor(tier, theme)
}

// A powerline segment's background: its figure's tier, else its widget's neutral colour; and its text colour.
function plaque(seg: Segment, theme: TidemarkTheme): { bg: string; fg?: string } {
  const tier = seg.spans.find(s => s.tier !== undefined && !s.spark)?.tier
  if (tier !== undefined) return { bg: TIERS[tier]![mode(theme)], fg: ON_TIER }
  return { bg: NEUTRAL[NEUTRAL_OF[seg.widget] ?? seg.widget]?.[mode(theme)] ?? NEUTRAL.model![mode(theme)] }
}

// The Svg's colours as classes, the light ones under the image's own media query.
function inks(classes: [string, Ink][]): string {
  const rules = (m: keyof Ink) => classes.map(([n, ink]) => `.${n}{fill:${ink[m]}}`).join('')
  return `<style>${rules('dark')}@media (prefers-color-scheme: light){${rules('light')}}</style>`
}
const svg = (w: number, h: number, style: string, body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${style}${body}</svg>`

// A bar as a 60×6 track filled to its percentage; a sparkline as 4 px columns on one baseline.
function graphic(s: Span, widget: string): { source: string; alt: string; width: number; height: number } | undefined {
  if (s.bar) {
    const ink = s.bar.dim ? DIM : (TIERS[s.tier ?? -1] ?? DIM)
    const w = Math.round((Math.min(Math.max(s.bar.percent, 0), 100) * 60) / 100)
    const body = `<rect x="0" y="0" width="60" height="6" rx="3" fill="${TRACK}"/>${w > 0 ? `<rect class="k" x="0" y="0" width="${w}" height="6" rx="3"/>` : ''}`
    return { source: svg(60, 6, inks([['k', ink]]), body), alt: `${widget} ${s.bar.percent}% used`, width: 60, height: 6 }
  }
  if (s.spark && s.spark.values.length > 0) {
    const { values, tiers } = s.spark
    const top = Math.max(...values, 1)
    const width = values.length * 6 - 2
    const cols = values.map((v, i) => {
      const h = Math.max(Math.round((v * 14) / top), 3)
      return `<rect class="t${tiers[i] ?? 0}" x="${i * 6}" y="${14 - h}" width="4" height="${h}" rx="1"/>`
    }).join('')
    return { source: svg(width, 14, inks(TIERS.map((ink, t) => [`t${t}`, ink])), cols), alt: `${widget} growth in each of the last ${values.length} changes`, width, height: 14 }
  }
  return undefined
}

// A span that does something as its element: a borderless Button for a press, a Link for a URL; undefined
// for plain text, or with no `act` (presses off, the editor's preview).
function control({ Button, Link }: { Button?: Elements['terminal']['Button']; Link?: Elements['terminal']['Link'] }, s: Span, widget: string, act?: OnPress) {
  if (!act) return undefined
  const label = s.text.trim()
  const press = s.press
  if (press && Button) return <Button key={`tidemark-${widget}-${press}`} label={label} plain dimColor={s.role === 'dim'} onPress={() => act(press)} />
  if (s.href && Link) return <Link href={s.href} label={label} />
  return undefined
}

// Spans as nested Text; a sparkline glyph by glyph in its tiers' colours. `fg` overrides every colour.
function textRun({ Text }: Term, spans: Span[], theme: TidemarkTheme, fg?: string) {
  return spans.filter(s => s.text).map(s => {
    if (s.spark && fg === undefined) {
      const glyphs = [...s.text]
      const lead = glyphs.length - s.spark.tiers.length
      return <Text>{glyphs.map((g, k) => <Text color={k < lead ? undefined : tierColor(s.spark!.tiers[k - lead] ?? 0, theme)}>{g}</Text>)}</Text>
    }
    return <Text color={fg ?? colorOf(s, theme)} dimColor={fg === undefined && s.role === 'dim'}>{s.text}</Text>
  })
}

// Spans as a row's items: text trimmed, bars and sparklines as Svg.
function itemRun(els: Rich, spans: Span[], widget: string, theme: TidemarkTheme, fg?: string, act?: OnPress) {
  const { Text, Svg } = els
  return spans.flatMap(s => {
    const c = control(els as never, s, widget, act)
    if (c) return [c]
    if (s.activity !== undefined) {
      const rest = [...s.text.trim()].slice(Math.min(s.activity, SPINNERS)).join('')
      const ink = TIERS[s.tier ?? 5]!
      return [<Svg {...spinnerSvg(s.activity, ink)} />, ...(rest ? [<Text color={fg ?? colorOf(s, theme)}>{rest}</Text>] : [])]
    }
    const g = graphic(s, widget)
    if (g) return [<Svg {...g} />]
    const text = s.text.trim()
    return text ? [<Text color={fg ?? colorOf(s, theme)} dimColor={fg === undefined && s.role === 'dim'}>{text}</Text>] : []
  })
}

type Part = { inline: unknown } | { block: unknown }

// Inline parts joined into one truncating Text; a line with a spinner Client (which a Text may not hold)
// becomes a row of them.
function joinParts({ Box, Text }: Term, parts: Part[]) {
  const groups: unknown[] = []
  let run: unknown[] = []
  const flush = () => { if (run.length) groups.push(<Text wrap="truncate-end">{run}</Text>); run = [] }
  for (const p of parts) {
    if ('inline' in p) run.push(p.inline)
    else { flush(); groups.push(p.block) }
  }
  flush()
  return groups.length === 1 ? groups[0] : <Box flexDirection="row">{groups}</Box>
}

// A segment's parts: its text, with an activity span's spinners as a Client and its `+N` as text.
function segmentParts(els: Term, spans: Span[], theme: TidemarkTheme, plaqueOf?: { bg: string; fg?: string }, act?: OnPress, widget = ''): Part[] {
  const { Text, Client } = els
  const parts: Part[] = []
  const text = (t: string) => { if (t) parts.push({ inline: <Text backgroundColor={plaqueOf!.bg} color={plaqueOf!.fg}>{t}</Text> }) }
  let pending = plaqueOf ? ' ' : ''
  for (const s of spans) {
    const n = s.activity
    if (n !== undefined && Client) {
      const glyphs = Math.min(n, SPINNERS)
      const lead = s.text.match(/^ */)![0]
      const rest = [...s.text.trimStart()].slice(glyphs).join('')
      const color = plaqueOf?.fg ?? colorOf(s, theme)
      if (plaqueOf) text(pending + lead)
      else if (lead) parts.push({ inline: <Text>{lead}</Text> })
      pending = ''
      parts.push({ block: <Client key="tidemark-spinner" module="./draw-activity.ts" width={glyphs} height={1}
        props={{ count: glyphs, ...(color !== undefined && { color }), ...(plaqueOf && { bg: plaqueOf.bg }) }} /> })
      if (plaqueOf) pending = rest
      else if (rest) parts.push({ inline: <Text color={color}>{rest}</Text> })
    } else if (plaqueOf) pending += s.text
    // ponytail: a Button takes no background, so on a powerline plaque a press stays plain text.
    else if (control(els, s, widget, act)) {
      const lead = s.text.match(/^ */)![0]
      if (lead) parts.push({ inline: <Text>{lead}</Text> })
      parts.push({ block: control(els, s, widget, act) })
    } else parts.push(...textRun(els, [s], theme).map(inline => ({ inline })))
  }
  if (plaqueOf) text(`${pending} `)
  return parts
}

function terminalLine(els: Term, line: Line, style: Style, theme: TidemarkTheme, act?: OnPress) {
  const { Text } = els
  const parts: Part[] = []
  if (style.separator === 'powerline') {
    const arrow = style.icons === 'nerd' ? '\ue0b0' : '▶'
    const plaques = line.map(seg => plaque(seg, theme))
    line.forEach((seg, i) => {
      parts.push(...segmentParts(els, seg.spans, theme, plaques[i]))
      parts.push({ inline: <Text color={plaques[i]!.bg} backgroundColor={plaques[i + 1]?.bg}>{arrow}</Text> })
    })
  } else {
    const sep = separatorText(style)
    line.forEach((seg, i) => {
      if (i > 0) parts.push({ inline: <Text dimColor>{sep}</Text> })
      parts.push(...segmentParts(els, seg.spans, theme, undefined, act, seg.widget))
    })
  }
  return joinParts(els, parts)
}

function richLine(els: Rich, line: Line, style: Style, theme: TidemarkTheme, act?: OnPress) {
  const { Box, Text } = els
  const power = style.separator === 'powerline'
  const sep = separatorText(style).trim()
  return (
    <Box flexDirection="row" alignItems="center" gap={1}>
      {line.flatMap((seg, i) => {
        const p = power ? plaque(seg, theme) : undefined
        return [
          ...(i > 0 && sep ? [<Text dimColor>{sep}</Text>] : []),
          <Box flexDirection="row" alignItems="center" gap={1} {...(p && { backgroundColor: p.bg, paddingX: 1 })}>
            {itemRun(els, seg.spans, seg.widget, theme, p?.fg, p ? undefined : act)}
          </Box>,
        ]
      })}
    </Box>
  )
}

// The band: one row per line. `els` is the surface's element table (`$.ui.resolve(e)`); branch on the
// surface, since the terminal's table answers for `Svg` with a placeholder.
export function drawBand(els: Term | Rich, surface: Surface, lines: Line[], style: Style, theme: TidemarkTheme, act?: OnPress) {
  const { Box } = els
  return (
    <Box flexDirection="column" paddingX={1} marginTop={surface === 'terminal' ? 1 : 0}>
      {lines.map(line => {
        const draw = (part: Line) => (surface === 'terminal' ? terminalLine(els as Term, part, style, theme, act) : richLine(els as Rich, part, style, theme, act))
        // `flex` segments split the line into groups spread across it: one flex puts what follows at the
        // right edge, two put the part between them in the middle, with equal gaps on both sides.
        const groups: Line[] = [[]]
        for (const seg of line) seg.widget === 'flex' ? groups.push([]) : groups[groups.length - 1]!.push(seg)
        if (groups.length === 1) return draw(line)
        return (
          <Box flexDirection="row" justifyContent="space-between">
            {groups.map(g => (g.length > 0 ? draw(g) : <Box />))}
          </Box>
        )
      })}
    </Box>
  )
}

// A pane row: a heading, or a label and its spans.
export type PaneRow = { head: string } | { label: string; spans: Span[] }
const LABEL = 14

// The pane's rows: bold headings; labels in a fixed-width column, then their spans.
export function drawPaneLines(els: Term | Rich, surface: Surface, rows: PaneRow[], theme: TidemarkTheme) {
  const { Box, Text } = els
  return (
    <Box flexDirection="column" paddingX={1}>
      {rows.map((r, i) => 'head' in r
        ? <Box marginTop={i > 0 ? 1 : 0}><Text bold>{r.head}</Text></Box>
        : (
          <Box flexDirection="row" gap={surface === 'terminal' ? 0 : 1}>
            <Box width={LABEL} flexShrink={0}><Text dimColor>{r.label}</Text></Box>
            {surface === 'terminal'
              ? <Text wrap="truncate-end">{textRun(els as Term, r.spans, theme)}</Text>
              : <Box flexDirection="row" alignItems="center" flexWrap="wrap" gap={1}>{itemRun(els as Rich, r.spans, r.label, theme)}</Box>}
          </Box>
        ))}
    </Box>
  )
}
