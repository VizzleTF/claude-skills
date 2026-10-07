import { expect, mock, test } from 'claude-code/testing'
import type { On } from 'claude-code'
import { DEFAULT_CONFIG, PRESETS, SCHEMA_URL, effectiveConfig, validate } from '../hooks/config'

const HOME = '/u/dev'
const CWD = '/u/dev/proj'
const GLOBAL = '/u/dev/.config/tidemark/config.json'
const PROJECT = '/u/dev/proj/.claude/tidemark.json'

// A file system in memory beneath the plugin: reads, stats and writes of the files given.
function files(on: On, initial: Record<string, string>, env: Record<string, string> = { HOME }) {
  const disk = new Map(Object.entries(initial))
  const writes: string[] = []
  mock.env(on, env)
  mock.clock(on, { now: 0 })
  on('classic.SessionStart', () => ({}))
  on('session.cwd', () => ({ value: CWD }))
  on('fs.read', ($, e) => {
    const text = disk.get(e.path)
    if (text === undefined) throw new Error(`ENOENT: ${e.path}`)
    return { value: text }
  })
  on('fs.exists', ($, e) => ({ value: disk.has(e.path) }))
  on('fs.stat', ($, e) => {
    if (!disk.has(e.path)) throw new Error(`ENOENT: ${e.path}`)
    return { value: { kind: 'file', size: disk.get(e.path)!.length, mtimeMs: 1, isLink: false } }
  })
  on('fs.write', ($, e) => {
    disk.set(e.path, e.text)
    writes.push(e.path)
    return { value: undefined }
  })
  return { disk, writes }
}

// The plugin loads its config when the process starts; the editor pane shows what loaded.
async function startup($: any) {
  await $.classic.SessionStart({ source: 'startup' })
  const ui = await $.ui.mount({
    plugin: 'tidemark', surface: 'terminal', component: 'Pane', requestId: 'tidemark-config',
    props: { title: 'tidemark config', isFocused: false, bodyColumns: 100, placement: 'inline', scroll: { offset: 0, bodyRows: 60 }, view: {} },
  })
  const text = async (key: string) => ((await ui.find({ type: 'Text', text: new RegExp(`^${key}: `) }))?.text as string | undefined)?.slice(key.length + 2)
  const sources = (await text('sources'))!
  // The editor's widget buttons, `w-<line>-<index>`, labelled by widget id.
  const lines: string[][] = []
  for (const b of await ui.findAll({ type: 'Button' })) {
    const m = /^w-(\d+)-(\d+)$/.exec(b.key ?? '')
    if (m) (lines[Number(m[1])] ??= [])[Number(m[2])] = String(b.props.label)
  }
  return {
    lines,
    sources: sources === 'default' ? [] : sources.split(' + '),
    error: await text('error'),
  }
}

const ids = (lines: { widget: string }[][]) => lines.map(line => line.map(item => item.widget))

test('default config is one line: context, cache, quota5h, quota7d, model, git, then the buttons at the right edge', async () => {
  expect(ids(DEFAULT_CONFIG.lines)).toEqual([['context', 'cache', 'quota5h', 'quota7d', 'model', 'git', 'flex', 'actions']])
  expect(PRESETS.default).toEqual(DEFAULT_CONFIG)
})

test('every preset validates without warnings', async () => {
  expect(Object.keys(PRESETS).sort()).toEqual(['classic', 'default', 'full', 'minimal', 'powerline'])
  for (const [name, preset] of Object.entries(PRESETS)) {
    const { config, warnings } = validate(JSON.parse(JSON.stringify(preset)))
    expect(warnings, name).toEqual([])
    expect(config, name).toEqual(preset)
  }
  expect(ids(PRESETS.minimal!.lines)).toEqual([['context', 'quota5h']])
  expect(ids(PRESETS.classic!.lines)).toEqual([['context', 'cache', 'quota5h', 'quota7d']])
  expect(ids(PRESETS.full!.lines)).toEqual([
    ['context', 'cache', 'quota5h', 'quota7d', 'cost'],
    ['model', 'cwd', 'git', 'sessionTime', 'compactions', 'tokenSpeed', 'agents'],
  ])
  expect(PRESETS.powerline!.style).toEqual({ separator: 'powerline', icons: 'nerd' })
  expect(ids(PRESETS.powerline!.lines)).toEqual(ids(DEFAULT_CONFIG.lines))
})

test('unknown widgets and options are dropped with a warning, the rest kept', async () => {
  const { config, warnings } = validate({
    version: 1,
    lines: [[
      { widget: 'context', options: { barWidth: 6, sparkle: true }, label: null, priority: 7 },
      { widget: 'weather' },
      'git',
      { widget: 'cwd', options: { style: 'sideways' } },
    ]],
  })
  expect(config.lines).toEqual([[
    { widget: 'context', options: { barWidth: 6 }, label: null, priority: 7 },
    { widget: 'git' },
    { widget: 'cwd' },
  ]])
  expect(warnings.length).toBe(3)
  expect(warnings.some(w => w.includes('weather'))).toBe(true)
  expect(warnings.some(w => w.includes('sparkle'))).toBe(true)
  expect(warnings.some(w => w.includes('style'))).toBe(true)
  expect(config.style).toEqual(DEFAULT_CONFIG.style)
  expect(config.alerts).toEqual(DEFAULT_CONFIG.alerts)
})

test('out-of-range numbers and too many lines are refused with a warning', async () => {
  const { config, warnings } = validate({
    lines: [[{ widget: 'context', options: { barWidth: 40 } }], ['cache'], ['model'], ['git']],
    alerts: { enabled: true, context: 150 },
  })
  expect(ids(config.lines)).toEqual([['context'], ['cache'], ['model']])
  expect(config.lines[0]![0]).toEqual({ widget: 'context' })
  expect(config.alerts).toEqual({ ...DEFAULT_CONFIG.alerts, enabled: true })
  expect(warnings.length).toBe(3)
})

test('no files: the default, nothing written', async ($, on) => {
  const { writes } = files(on, {})
  const loaded = await startup($)
  expect(loaded.lines).toEqual(ids(DEFAULT_CONFIG.lines))
  expect(loaded.error).toBeUndefined()
  expect(loaded.sources).toEqual([])
  expect(writes).toEqual([])
})

test('broken JSON: the default and an error naming the file, the file untouched', async ($, on) => {
  const { disk, writes } = files(on, { [GLOBAL]: '{ "lines": [' })
  const loaded = await startup($)
  expect(loaded.lines).toEqual(ids(DEFAULT_CONFIG.lines))
  expect(loaded.error).toContain(GLOBAL)
  expect(disk.get(GLOBAL)).toBe('{ "lines": [')
  expect(writes).toEqual([])
})

test('a wrong schema version is an error, the default applies', async ($, on) => {
  files(on, { [GLOBAL]: JSON.stringify({ version: 2, lines: [['git']] }) })
  const loaded = await startup($)
  expect(loaded.lines).toEqual(ids(DEFAULT_CONFIG.lines))
  expect(loaded.error).toContain('version')
})

test('the project file replaces the top-level keys it has', async ($, on) => {
  files(on, {
    [GLOBAL]: JSON.stringify({ version: 1, lines: [['context']], style: { separator: 'dot', icons: 'nerd' } }),
    [PROJECT]: JSON.stringify({ lines: [['git', 'cwd']] }),
  })
  const loaded = await startup($)
  expect(loaded.lines).toEqual([['git', 'cwd']])
  expect(loaded.sources).toEqual([GLOBAL, PROJECT])
  expect(loaded.error).toBeUndefined()
})

test('XDG_CONFIG_HOME moves the global file', async ($, on) => {
  files(on, { '/u/xdg/tidemark/config.json': JSON.stringify({ lines: [['model']] }) }, { HOME, XDG_CONFIG_HOME: '/u/xdg' })
  const loaded = await startup($)
  expect(loaded.lines).toEqual([['model']])
  expect(loaded.sources).toEqual(['/u/xdg/tidemark/config.json'])
})

test('compact: on at 70% by default; `at` takes 1 to 100, anything else is dropped with a warning', () => {
  expect(validate({ version: 1 }).config.compact).toEqual({ enabled: true, at: 70 })
  expect(validate({ version: 1, compact: { enabled: false, at: 85 } }).config.compact).toEqual({ enabled: false, at: 85 })
  const bad = validate({ version: 1, compact: { at: 0, extra: 1 } })
  expect(bad.config.compact).toEqual({ enabled: true, at: 70 })
  expect(bad.warnings.length).toBe(2)
})

test('a config stored by an older version, without newer keys, gets their defaults', () => {
  const { compact: _, ...old } = DEFAULT_CONFIG
  const loaded = effectiveConfig({ config: old as any, warnings: [], sources: [], stamp: '' })
  expect(loaded.config.compact).toEqual({ enabled: true, at: 70 })
})

test('a $schema key is accepted', () => {
  expect(validate({ $schema: SCHEMA_URL, version: 1 }).warnings).toEqual([])
})
