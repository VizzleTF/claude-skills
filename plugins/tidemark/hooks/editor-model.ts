// The config editor's edits as pure functions on a draft config: move, toggle, remove and add widgets,
// set an item's fields and options from typed text, style, pane sections and alerts. An edit that cannot
// apply returns `{ error }` and leaves the draft as it was.
import type { TidemarkConfig, TidemarkWidgetId, TidemarkWidgetItem } from '../types'
import { ALERT_MAX, MAX_LINES, WIDGET_OPTIONS } from './config'
import type { OptionSpec } from './config'

export type Config = TidemarkConfig
export type Selection = { line: number; index: number }
export type Edit = { config: Config; selected?: Selection | null } | { error: string }

const itemAt = (c: Config, s: Selection | null): TidemarkWidgetItem | undefined => s ? c.lines[s.line]?.[s.index] : undefined

const withLines = (c: Config, lines: TidemarkWidgetItem[][]): Config => ({ ...c, lines })

// Moves the selected widget left or right in its line, or to the end of the line above or below; moving
// below the last line starts a new one (up to three). Emptied lines are dropped.
export function moveItem(c: Config, s: Selection, dir: 'left' | 'right' | 'up' | 'down'): Edit {
  const item = itemAt(c, s)
  if (!item) return { error: 'no widget selected' }
  const lines = c.lines.map(l => [...l])
  if (dir === 'left' || dir === 'right') {
    const to = s.index + (dir === 'left' ? -1 : 1)
    const line = lines[s.line]!
    if (to < 0 || to >= line.length) return { config: c, selected: s }
    line.splice(s.index, 1)
    line.splice(to, 0, item)
    return { config: withLines(c, lines), selected: { line: s.line, index: to } }
  }
  const to = s.line + (dir === 'up' ? -1 : 1)
  if (to < 0 || to >= MAX_LINES || (to === lines.length && lines[s.line]!.length === 1)) return { config: c, selected: s }
  if (to === lines.length) lines.push([])
  lines[s.line]!.splice(s.index, 1)
  lines[to]!.push(item)
  const kept = lines.filter(l => l.length > 0)
  const line = kept.indexOf(lines[to]!)
  return { config: withLines(c, kept), selected: { line, index: kept[line]!.length - 1 } }
}

export function removeItem(c: Config, s: Selection): Edit {
  if (!itemAt(c, s)) return { error: 'no widget selected' }
  if (c.lines.flat().length === 1) return { error: 'the band needs one widget' }
  const lines = c.lines.map((l, i) => (i === s.line ? l.filter((_, j) => j !== s.index) : l)).filter(l => l.length > 0)
  return { config: withLines(c, lines), selected: null }
}

// Adds a widget at the end of a line (the last one when the line does not exist).
export function addItem(c: Config, widget: TidemarkWidgetId, line: number): Edit {
  if (!Object.hasOwn(WIDGET_OPTIONS, widget)) return { error: `unknown widget ${widget}` }
  const at = Math.min(Math.max(line, 0), c.lines.length - 1)
  const lines = c.lines.map((l, i) => (i === at ? [...l, { widget }] : l))
  return { config: withLines(c, lines), selected: { line: at, index: lines[at]!.length - 1 } }
}

function patchItem(c: Config, s: Selection, patch: (item: TidemarkWidgetItem) => TidemarkWidgetItem): Edit {
  if (!itemAt(c, s)) return { error: 'no widget selected' }
  const lines = c.lines.map((l, i) => (i === s.line ? l.map((it, j) => (j === s.index ? patch(it) : it)) : l))
  return { config: withLines(c, lines), selected: s }
}

const without = <T extends object, K extends keyof T>(o: T, key: K): Omit<T, K> => {
  const { [key]: _, ...rest } = o
  return rest
}

export const toggleItem = (c: Config, s: Selection): Edit =>
  patchItem(c, s, it => (it.enabled === false ? without(it, 'enabled') : { ...it, enabled: false }))

// Text to a whole number in a range, or an error for the field.
export function toInt(text: string, min: number, max: number): number | { error: string } {
  const t = text.trim()
  const n = /^-?\d+$/.test(t) ? Number(t) : NaN
  if (!Number.isSafeInteger(n) || n < min || n > max) return { error: `a whole number from ${min} to ${max}` }
  return n
}

// Empty text restores the default priority.
export function setPriority(c: Config, s: Selection, text: string): Edit {
  if (text.trim() === '') return patchItem(c, s, it => without(it, 'priority'))
  const n = toInt(text, 0, 1000)
  return typeof n === 'number' ? patchItem(c, s, it => ({ ...it, priority: n })) : n
}

// `own`: the widget's own label; `none`: no label; text: that label.
export function setLabel(c: Config, s: Selection, label: string | null | undefined): Edit {
  return patchItem(c, s, it => (label === undefined ? without(it, 'label') : { ...it, label }))
}

// An option from the text a field holds or the value a picker chose, checked against its spec. A value equal
// to the default is dropped from the item.
export function setOption(c: Config, s: Selection, name: string, text: string): Edit {
  const item = itemAt(c, s)
  if (!item) return { error: 'no widget selected' }
  const specs = WIDGET_OPTIONS[item.widget]
  const spec: OptionSpec | undefined = Object.hasOwn(specs, name) ? specs[name] : undefined
  if (!spec) return { error: `unknown option ${name}` }
  let value: unknown
  switch (spec.kind) {
    case 'bool':
      if (text !== 'on' && text !== 'off') return { error: 'on or off' }
      value = text === 'on'
      break
    case 'enum':
      if (!spec.values.includes(text)) return { error: `one of ${spec.values.join(', ')}` }
      value = text
      break
    case 'int': {
      const n = toInt(text, spec.min, spec.max)
      if (typeof n !== 'number') return n
      value = n
      break
    }
    case 'string':
      value = text
      break
    case 'strings':
      value = text.split(',').map(t => t.trim()).filter(t => t !== '')
      break
  }
  return patchItem(c, s, it => {
    const options = { ...it.options, [name]: value }
    if (JSON.stringify(value) === JSON.stringify(spec.default)) delete options[name]
    return Object.keys(options).length > 0 ? { ...it, options } : without(it, 'options')
  })
}

// The value an option's field shows: the item's own, else the default.
export function optionText(spec: OptionSpec, value: unknown): string {
  const v = value === undefined ? spec.default : value
  if (spec.kind === 'bool') return v ? 'on' : 'off'
  if (spec.kind === 'strings') return (v as readonly string[]).join(', ')
  return String(v)
}

export function setStyle(c: Config, patch: Partial<Config['style']>): Edit {
  return { config: { ...c, style: { ...c.style, ...patch } } }
}

export function toggleSection(c: Config, id: string): Edit {
  return { config: { ...c, pane: { sections: c.pane.sections.map(s => (s.id === id ? { ...s, enabled: !s.enabled } : s)) } } }
}

// Moves a pane section one place up (the first goes last).
export function raiseSection(c: Config, id: string): Edit {
  const list = [...c.pane.sections]
  const i = list.findIndex(s => s.id === id)
  if (i < 0) return { error: `unknown section ${id}` }
  const [s] = list.splice(i, 1)
  list.splice(i === 0 ? list.length : i - 1, 0, s!)
  return { config: { ...c, pane: { sections: list } } }
}

// An alert threshold from typed text: percentages 0..100, the cache warning 0..3600 seconds.
export function setCompactAt(c: Config, text: string): Edit {
  const n = toInt(text, 1, 100)
  return typeof n === 'number' ? { config: { ...c, compact: { ...c.compact, at: n } } } : n
}

export function setAlert(c: Config, key: keyof typeof ALERT_MAX, text: string): Edit {
  const n = toInt(text, 0, ALERT_MAX[key])
  return typeof n === 'number' ? { config: { ...c, alerts: { ...c.alerts, [key]: n } } } : n
}
