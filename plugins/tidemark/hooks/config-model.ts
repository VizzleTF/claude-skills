// The config model, pure: schema v1, the default, the presets, validation, merging the files' texts and
// what Save writes. Loading, hand-edit checks and the atom live in the config hooks.
import type { TidemarkConfig, TidemarkConfigState, TidemarkSectionId, TidemarkWidgetId, TidemarkWidgetItem } from '../types'

export type Config = TidemarkConfig
export type WidgetId = TidemarkWidgetId
export type WidgetItem = TidemarkWidgetItem
export type LoadedConfig = { config: Config; warnings: string[]; error?: string; sources: string[] }

// What an option takes; `default` is what a widget uses when the option is absent.
export type OptionSpec =
  | { kind: 'bool'; default: boolean }
  | { kind: 'enum'; values: readonly string[]; default: string }
  | { kind: 'int'; min: number; max: number; default: number }
  | { kind: 'string'; default: string }
  | { kind: 'strings'; default: readonly string[] }

const bool = (d: boolean): OptionSpec => ({ kind: 'bool', default: d })
const int = (min: number, max: number, d: number): OptionSpec => ({ kind: 'int', min, max, default: d })
const choice = (values: readonly string[], d: string): OptionSpec => ({ kind: 'enum', values, default: d })
const MODE = choice(['used', 'left'], 'used')
const QUOTA = { mode: MODE, showReset: bool(true), showPace: bool(true), bar: bool(false) }

// Each widget's own options. TTLs are in seconds, timeouts in milliseconds.
export const WIDGET_OPTIONS: Record<WidgetId, Record<string, OptionSpec>> = {
  context: { mode: MODE, barWidth: int(4, 20, 10), showTokens: bool(true), showGrowth: bool(true), showLast: bool(true) },
  cache: { showRewrite: bool(true), showMinutes: bool(true), ttl: choice(['auto', '5m', '1h'], 'auto') },
  quota5h: QUOTA,
  quota7d: QUOTA,
  cost: {},
  agents: {},
  goal: {},
  project: {},
  model: { showEffort: bool(true), format: choice(['short', 'full'], 'short'), cycle: { kind: 'strings', default: [] } },
  git: { showDirty: bool(true), showDiff: bool(true), showSync: bool(true), maxLength: int(4, 200, 24), ttl: int(1, 3600, 5), fetch: int(0, 86_400, 300) },
  cwd: { style: choice(['project', 'basename', 'short', 'full'], 'project') },
  sessionTime: {},
  compactions: { hideZero: bool(true) },
  tokenSpeed: {},
  command: { command: { kind: 'string', default: '' }, maxWidth: int(4, 200, 40), timeout: int(100, 30_000, 2000), ttl: int(1, 3600, 10) },
  claudeStatus: { ttl: int(30, 3600, 300) },
  gitPr: { githubHosts: { kind: 'strings', default: [] }, gitlabHosts: { kind: 'strings', default: [] }, ttl: int(10, 3600, 120) },
  flex: {},
  compact: {},
  actions: { config: bool(true) },
}

export const WIDGET_IDS = Object.keys(WIDGET_OPTIONS) as WidgetId[]
const SECTION_IDS: TidemarkSectionId[] = ['context', 'cacheQuota', 'agents']
export const SEPARATORS = ['pipe', 'space', 'dot', 'powerline', 'custom'] as const
export const ICONS = ['text', 'nerd'] as const
export const MAX_LINES = 3
// The keys a `desktop` section may hold: what the desktop app's band and pane draw.
export const SURFACE_KEYS = ['lines', 'style', 'pane', 'compact'] as const
// The keys a config file holds besides `$schema` and `version`.
export const CONFIG_KEYS = ['lines', 'style', 'pane', 'alerts', 'compact', 'desktop'] as const
// The highest value of each alert threshold: percentages, and the cache warning in seconds.
export const ALERT_MAX = { context: 100, quota5h: 100, quota7d: 100, cacheSeconds: 3600 } as const
// The context share from which the band offers `/compact`: a heuristic, not a documented figure:
// answers degrade as the window fills and auto-compaction waits until it is nearly full (967k of 1M).
export const COMPACT_AT = 70

// Where editors fetch `config.schema.json`, the JSON Schema of a config file; Save writes it as `$schema`.
export const SCHEMA_URL = 'https://raw.githubusercontent.com/VizzleTF/claude-skills/main/plugins/tidemark/config.schema.json'

const items = (...ids: WidgetId[]): WidgetItem[] => ids.map(widget => ({ widget }))

export const DEFAULT_CONFIG: Config = {
  version: 1,
  lines: [items('project', 'context', 'compact', 'cache', 'flex', 'quota5h', 'quota7d', 'flex', 'sessionTime', 'git', 'model', 'cwd', 'actions')],
  style: { separator: 'space', icons: 'nerd' },
  pane: { sections: SECTION_IDS.map(id => ({ id, enabled: true })) },
  alerts: { enabled: false, context: 80, quota5h: 90, quota7d: 90, cacheSeconds: 60 },
  compact: { enabled: true, at: COMPACT_AT },
}

const preset = (lines: WidgetItem[][], style: Config['style'] = DEFAULT_CONFIG.style): Config => ({ ...DEFAULT_CONFIG, lines, style })

export const PRESETS: Record<string, Config> = {
  minimal: preset([items('context', 'quota5h')]),
  classic: preset([items('context', 'cache', 'quota5h', 'quota7d')]),
  default: DEFAULT_CONFIG,
  full: preset([
    items('project', 'goal', 'context', 'cache', 'quota5h', 'quota7d', 'cost'),
    items('model', 'cwd', 'git', 'sessionTime', 'compactions', 'tokenSpeed', 'agents'),
  ]),
  powerline: preset(DEFAULT_CONFIG.lines, { separator: 'powerline', icons: 'nerd' }),
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

function optionOk(spec: OptionSpec, v: unknown): boolean {
  switch (spec.kind) {
    case 'bool': return typeof v === 'boolean'
    case 'enum': return typeof v === 'string' && spec.values.includes(v)
    case 'int': return Number.isInteger(v) && (v as number) >= spec.min && (v as number) <= spec.max
    case 'string': return typeof v === 'string'
    case 'strings': return Array.isArray(v) && v.every(s => typeof s === 'string')
  }
}

function validItem(raw: unknown, where: string, warn: (m: string) => void): WidgetItem | undefined {
  const obj = typeof raw === 'string' ? { widget: raw } : raw
  if (!isObject(obj) || typeof obj.widget !== 'string' || !Object.hasOwn(WIDGET_OPTIONS, obj.widget)) {
    warn(`${where}: unknown widget ${JSON.stringify(isObject(obj) ? obj.widget : obj)}`)
    return undefined
  }
  const widget = obj.widget as WidgetId
  const item: WidgetItem = { widget }
  for (const [key, v] of Object.entries(obj)) {
    if (key === 'widget') continue
    if (key === 'enabled' && typeof v === 'boolean') item.enabled = v
    else if (key === 'label' && (typeof v === 'string' || v === null)) item.label = v
    else if (key === 'priority' && Number.isInteger(v) && (v as number) >= 0 && (v as number) <= 1000) item.priority = v as number
    else if (key === 'options' && isObject(v)) {
      const specs = WIDGET_OPTIONS[widget]
      const options: Record<string, unknown> = {}
      for (const [name, value] of Object.entries(v)) {
        const spec = Object.hasOwn(specs, name) ? specs[name] : undefined
        if (!spec) warn(`${where} ${widget}: unknown option ${name}`)
        else if (!optionOk(spec, value)) warn(`${where} ${widget}: invalid ${name} ${JSON.stringify(value)}`)
        else options[name] = value
      }
      if (Object.keys(options).length > 0) item.options = options
    } else warn(`${where} ${widget}: invalid ${key} ${JSON.stringify(v)}`)
  }
  return item
}

// A raw value (parsed JSON) to a config: anything unknown or invalid is dropped with a warning and the
// default stands in its place.
export function validate(raw: unknown): { config: Config; warnings: string[] } {
  const warnings: string[] = []
  const warn = (m: string) => warnings.push(m)
  const src = isObject(raw) ? raw : {}
  if (!isObject(raw)) warn('config is not an object')
  if (src.version !== undefined && src.version !== 1) warn(`unsupported version ${JSON.stringify(src.version)}`)

  let lines = DEFAULT_CONFIG.lines
  if (src.lines !== undefined) {
    if (!Array.isArray(src.lines)) warn('lines: not a list')
    else {
      if (src.lines.length > MAX_LINES) warn(`lines: only the first ${MAX_LINES} are used`)
      const got = src.lines.slice(0, MAX_LINES).map((line, i) => {
        if (!Array.isArray(line)) {
          warn(`line ${i + 1}: not a list`)
          return []
        }
        return line.map(item => validItem(item, `line ${i + 1}`, warn)).filter(item => item !== undefined)
      }).filter(line => line.length > 0)
      if (got.length > 0) lines = got
      else warn('lines: no widgets, the default is used')
    }
  }

  const style = { ...DEFAULT_CONFIG.style }
  if (src.style !== undefined) {
    const s = isObject(src.style) ? src.style : {}
    if (!isObject(src.style)) warn('style: not an object')
    for (const [key, v] of Object.entries(s)) {
      if (key === 'separator' && SEPARATORS.includes(v as never)) style.separator = v as Config['style']['separator']
      else if (key === 'icons' && ICONS.includes(v as never)) style.icons = v as Config['style']['icons']
      else if (key === 'custom' && typeof v === 'string') style.custom = v
      else if (key === 'buttons' && typeof v === 'boolean') style.buttons = v
      else warn(`style: invalid ${key} ${JSON.stringify(v)}`)
    }
  }

  let pane = DEFAULT_CONFIG.pane
  if (src.pane !== undefined) {
    const sections = isObject(src.pane) && Array.isArray(src.pane.sections) ? src.pane.sections : undefined
    if (!sections) warn('pane: sections must be a list')
    else {
      const seen = new Set<string>()
      const got: Config['pane']['sections'] = []
      for (const s of sections) {
        if (isObject(s) && SECTION_IDS.includes(s.id as never) && !seen.has(s.id as string)) {
          seen.add(s.id as string)
          got.push({ id: s.id as TidemarkSectionId, enabled: s.enabled !== false })
        } else warn(`pane: invalid section ${JSON.stringify(s)}`)
      }
      // A section the file does not list, such as one a later version adds, is shown after the listed ones.
      pane = { sections: [...got, ...SECTION_IDS.filter(id => !seen.has(id)).map(id => ({ id, enabled: true }))] }
    }
  }

  const alerts = { ...DEFAULT_CONFIG.alerts }
  if (src.alerts !== undefined) {
    const a = isObject(src.alerts) ? src.alerts : {}
    if (!isObject(src.alerts)) warn('alerts: not an object')
    for (const [key, v] of Object.entries(a)) {
      const max = ALERT_MAX[key as keyof typeof ALERT_MAX]
      if (key === 'enabled' && typeof v === 'boolean') alerts.enabled = v
      else if (key !== 'enabled' && Object.hasOwn(alerts, key) && typeof v === 'number' && v >= 0 && v <= max) (alerts as Record<string, unknown>)[key] = v
      else warn(`alerts: invalid ${key} ${JSON.stringify(v)}`)
    }
  }

  const compact = { ...DEFAULT_CONFIG.compact }
  if (src.compact !== undefined) {
    const c = isObject(src.compact) ? src.compact : {}
    if (!isObject(src.compact)) warn('compact: not an object')
    for (const [key, v] of Object.entries(c)) {
      if (key === 'enabled' && typeof v === 'boolean') compact.enabled = v
      else if (key === 'at' && Number.isInteger(v) && (v as number) >= 1 && (v as number) <= 100) compact.at = v as number
      else warn(`compact: invalid ${key} ${JSON.stringify(v)}`)
    }
  }

  let desktop: Config['desktop']
  if (src.desktop !== undefined) {
    if (!isObject(src.desktop)) warn('desktop: not an object')
    else {
      const own = Object.fromEntries(Object.entries(src.desktop).filter(([k]) => SURFACE_KEYS.includes(k as never)))
      for (const k of Object.keys(src.desktop)) if (!Object.hasOwn(own, k)) warn(`desktop: unknown key ${k}`)
      const r = validate(own)
      warnings.push(...r.warnings.map(w => `desktop: ${w}`))
      desktop = Object.fromEntries(Object.keys(own).map(k => [k, r.config[k as keyof Config]]))
    }
  }

  for (const key of Object.keys(src)) {
    if (key !== '$schema' && key !== 'version' && !CONFIG_KEYS.includes(key as never)) warn(`unknown key ${key}`)
  }
  return { config: { version: 1, lines, style, pane, alerts, compact, ...(desktop && { desktop }) }, warnings }
}

// The config a surface draws: on the desktop app, its `desktop` section over the shared keys.
export function forSurface(c: Config, surface: string): Config {
  const { desktop, ...shared } = c
  return surface === 'desktop' && desktop ? { ...shared, ...desktop } : c
}

// An edit of `forSurface(c, surface)` back into `c`. On the desktop app it goes to the `desktop` section,
// which then holds every key it may, so later terminal edits leave the desktop app's band as it is.
export function fromSurface(c: Config, surface: string, view: Config): Config {
  const { desktop: _, ...rest } = view
  if (surface !== 'desktop') return c.desktop ? { ...rest, desktop: c.desktop } : rest
  return { ...c, alerts: rest.alerts, desktop: { lines: rest.lines, style: rest.style, pane: rest.pane, compact: rest.compact } }
}

// Where the files are: `$XDG_CONFIG_HOME/tidemark/config.json` (else `$HOME/.config/...`) and the session
// directory's `.claude/tidemark.json`. Null where the place cannot be known.
export function configPathsFrom(env: { xdg?: string; home?: string; cwd?: string }): ConfigPaths {
  const { xdg, home, cwd } = env
  const base = xdg ? xdg : home ? `${home.replace(/\/$/, '')}/.config` : undefined
  return {
    global: base ? `${base.replace(/\/$/, '')}/tidemark/config.json` : null,
    project: cwd ? `${cwd.replace(/\/$/, '')}/.claude/tidemark.json` : null,
  }
}

export type ConfigPaths = { global: string | null; project: string | null }

// Options a project file may not set: it comes with the repository, so it could run a program or send a
// gh/glab login to a host of its choosing. These come only from the global file.
const GLOBAL_ONLY: Partial<Record<string, string[]>> = { command: ['command'], gitPr: ['githubHosts', 'gitlabHosts'] }

function dropGlobalOnly(raw: Record<string, unknown>, path: string, warnings: string[]) {
  for (const lines of [raw.lines, isObject(raw.desktop) ? raw.desktop.lines : undefined]) {
    if (!Array.isArray(lines)) continue
    for (const item of lines.flat()) {
      if (!isObject(item) || !isObject(item.options)) continue
      for (const k of GLOBAL_ONLY[String(item.widget)] ?? []) {
        if (!(k in item.options)) continue
        delete item.options[k]
        warnings.push(`${path}: ${String(item.widget)}.${k} is read only from the global config`)
      }
    }
  }
}

// The files' texts (global first, a missing file left out) to the config in effect: the project file's
// top-level keys over the global's, validated. A file that does not parse is skipped and named in `error`.
export function loadFromTexts(files: ({ path: string; text: string; project?: boolean } | { path: string; error: string })[]): LoadedConfig {
  let merged: Record<string, unknown> = {}
  const sources: string[] = []
  const errors: string[] = []
  const dropped: string[] = []
  for (const file of files) {
    const { path } = file
    let raw: unknown
    try {
      if ('error' in file) throw new Error(file.error)
      raw = JSON.parse(file.text)
    } catch (err) {
      errors.push(`${path}: ${err instanceof Error ? err.message : String(err)}`)
      continue
    }
    if (!isObject(raw)) {
      errors.push(`${path}: not a JSON object`)
      continue
    }
    if (raw.version !== undefined && raw.version !== 1) {
      errors.push(`${path}: unsupported version ${JSON.stringify(raw.version)}`)
      continue
    }
    if ('project' in file && file.project) dropGlobalOnly(raw, path, dropped)
    merged = { ...merged, ...raw }
    sources.push(path)
  }
  const { config, warnings } = validate(merged)
  return { config, warnings: [...dropped, ...warnings], sources, ...(errors.length > 0 && { error: errors.join('; ') }) }
}

// What Save writes to `target`, so each file keeps to its own keys (the project file's over the global's):
// to the global file, a top-level key the project file overrides and the draft left as loaded keeps the
// global file's value; to the project file, only the keys it already has and those where the draft differs
// from the global file. `globalOnly` is the global file alone, validated.
export function saveContent(draft: Config, loaded: Config, globalOnly: Config, projectKeys: string[], target: 'global' | 'project'): Record<string, unknown> {
  const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)
  const out: Record<string, unknown> = { $schema: SCHEMA_URL, version: 1 }
  for (const k of CONFIG_KEYS) {
    if (target === 'global') out[k] = projectKeys.includes(k) && same(draft[k], loaded[k]) ? globalOnly[k] : draft[k]
    else if (projectKeys.includes(k) || !same(draft[k], globalOnly[k])) out[k] = draft[k]
  }
  return out
}

// What a saved file holds.
export const configText = (config: Config | Record<string, unknown>) => `${JSON.stringify(config, null, 2)}\n`

// The config a `configState` value stands for: the default until the first load.
export function effectiveConfig(s: TidemarkConfigState | null): LoadedConfig {
  if (!s) return { config: DEFAULT_CONFIG, warnings: [], sources: [] }
  const { stamp: _, ...loaded } = s
  // Session state outlives a reload of the mod, so a config an older version stored lacks newer keys, at
  // the top level or inside `style`, `alerts` and `compact`.
  const c = loaded.config
  return { ...loaded, config: { ...DEFAULT_CONFIG, ...c, style: { ...DEFAULT_CONFIG.style, ...c.style }, alerts: { ...DEFAULT_CONFIG.alerts, ...c.alerts }, compact: { ...DEFAULT_CONFIG.compact, ...c.compact } } }
}
