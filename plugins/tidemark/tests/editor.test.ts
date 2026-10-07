// The /tidemark-config editor through the engine, on the terminal and the desktop: edits go to a draft,
// Save writes the chosen file and the band takes the new config at once, Revert drops the draft, bad input
// stays at its field, and a broken file is only overwritten on a second Save.
import { expect, mock, test } from 'claude-code/testing'
import type { On } from 'claude-code'

import { DEFAULT_CONFIG, PRESETS, SCHEMA_URL } from '../hooks/config-model'

const HOME = '/u/dev'
const CWD = '/u/dev/proj'
const GLOBAL = '/u/dev/.config/tidemark/config.json'
const PROJECT = '/u/dev/proj/.claude/tidemark.json'

// A file system in memory, the session's directory, and the engine's own band beneath (`below`).
function host(on: On, initial: Record<string, string> = {}) {
  const disk = new Map(Object.entries(initial))
  const writes: string[] = []
  mock.env(on, { HOME })
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
  on('ui.render', { component: 'AbovePrompt' }, ($, e) => $.ui.resolve(e).Text({ children: 'below' }))
  return { disk, writes }
}

type Surface = 'terminal' | 'desktop'

async function open($: any, surface: Surface) {
  await $.classic.SessionStart({ source: 'startup' })
  return $.ui.mount({
    plugin: 'tidemark', surface, component: 'Pane', requestId: 'tidemark-config',
    props: { title: 'tidemark config', isFocused: true, bodyColumns: 100, placement: 'inline', scroll: { offset: 0, bodyRows: 80 }, view: {} },
  })
}

const band = (surface: Surface) => ({
  plugin: 'tidemark', surface, component: 'AbovePrompt' as const,
  props: { hasSurvey: false, isWorking: false, maxRows: 10, bodyColumns: 160, scroll: { offset: 0, bodyRows: 9 }, view: {} },
})

// The draft's lines as the widget buttons show them (`w-<line>-<index>`, labelled by widget id).
async function lines(ui: any): Promise<string[][]> {
  const out: string[][] = []
  for (const b of await ui.findAll({ type: 'Button' })) {
    const m = /^w-(\d+)-(\d+)$/.exec(b.key ?? '')
    if (m) (out[Number(m[1])] ??= [])[Number(m[2])] = String(b.props.label)
  }
  return out
}

const ids = (c: { lines: { widget: string }[][] }) => c.lines.map(l => l.map(i => i.widget))
const DEFAULT_IDS = ids(DEFAULT_CONFIG)

for (const surface of ['terminal', 'desktop'] as const) {
  test(`add, move, move to another line, option, remove, preset, revert (${surface})`, async ($, on) => {
    const { writes } = host(on)
    const ui = await open($, surface)
    expect(await lines(ui)).toEqual(DEFAULT_IDS)

    await ui.press({ key: 'w-0-0' })
    await ui.press({ key: 'right' })
    expect((await lines(ui))[0]!.slice(0, 2)).toEqual(['cache', 'context'])
    await ui.press({ key: 'down' })
    expect(await lines(ui)).toEqual([['cache', 'quota5h', 'quota7d', 'model', 'git', 'flex', 'compact', 'actions'], ['context']])

    await ui.select({ key: 'add', value: 'cwd' })
    expect(await lines(ui)).toEqual([['cache', 'quota5h', 'quota7d', 'model', 'git', 'flex', 'compact', 'actions'], ['context', 'cwd']])
    await ui.select({ key: 'opt-style', value: 'full' })
    expect((await ui.find({ key: 'opt-style' }))?.props.value).toBe('full')
    await ui.press({ key: 'toggle' })
    expect((await ui.find({ key: 'w-1-1' }))?.text).toContain('off')

    await ui.press({ key: 'remove' })
    expect(await lines(ui)).toEqual([['cache', 'quota5h', 'quota7d', 'model', 'git', 'flex', 'compact', 'actions'], ['context']])

    await ui.select({ key: 'preset', value: 'full' })
    expect(await lines(ui)).toEqual(ids(PRESETS.full!))

    await ui.press({ key: 'revert' })
    expect(await lines(ui)).toEqual(DEFAULT_IDS)
    expect(writes).toEqual([])
  })

  test(`a bad number stays at its field and leaves the draft as it was (${surface})`, async ($, on) => {
    host(on)
    const ui = await open($, surface)
    await ui.input({ key: 'alerts-context', text: '150' })
    expect((await ui.find({ key: 'err-alerts-context' }))?.text).toMatch(/0 to 100/)
    expect((await ui.find({ key: 'alerts-context' }))?.props.value).toBe('80')

    await ui.press({ key: 'w-0-0' })
    await ui.input({ key: 'priority', text: 'lots' })
    expect((await ui.find({ key: 'err-priority' }))?.text).toMatch(/whole number/)
    await ui.input({ key: 'opt-barWidth', text: '99' })
    expect((await ui.find({ key: 'err-opt-barWidth' }))?.text).toMatch(/4 to 20/)
    expect((await ui.find({ key: 'opt-barWidth' }))?.props.value).toBe('10')

    // A good value clears the error.
    await ui.input({ key: 'alerts-context', text: '70' })
    expect(await ui.find({ key: 'err-alerts-context' })).toBeUndefined()
    expect((await ui.find({ key: 'alerts-context' }))?.props.value).toBe('70')
  })

  test(`Save writes the global file, then the project file, and the band takes it at once (${surface})`, async ($, on) => {
    const { disk, writes } = host(on)
    const ui = await open($, surface)
    const shown = await $.ui.mount(band(surface))
    expect(await shown.find({ type: 'Text', text: /\/u\/dev\/proj/ })).toBeUndefined()

    await ui.select({ key: 'preset', value: 'minimal' })
    await ui.select({ key: 'add', value: 'cwd' })
    await ui.select({ key: 'opt-style', value: 'full' })
    await ui.press({ key: 'save' })
    expect(writes).toEqual([GLOBAL])
    const saved = JSON.parse(disk.get(GLOBAL)!)
    expect(ids(saved)).toEqual([['context', 'quota5h', 'cwd']])
    expect(saved.lines[0][2]).toEqual({ widget: 'cwd', options: { style: 'full' } })
    expect(await shown.find({ type: 'Text', text: /\/u\/dev\/proj/ })).toBeDefined()
    expect((await ui.find({ type: 'Text', text: /^sources: / }))?.text).toBe(`sources: ${GLOBAL}`)

    await ui.select({ key: 'target', value: 'project' })
    await ui.select({ key: 'separator', value: 'dot' })
    await ui.press({ key: 'save' })
    expect(writes).toEqual([GLOBAL, PROJECT])
    // Only what differs from the global file goes to the project file.
    expect(JSON.parse(disk.get(PROJECT)!)).toEqual({ $schema: SCHEMA_URL, version: 1, style: { separator: 'dot', icons: 'text' } })
    expect((await ui.find({ type: 'Text', text: /^sources: / }))?.text).toBe(`sources: ${GLOBAL} + ${PROJECT}`)
  })

  test(`two files: Save keeps each file to its own keys, the preview the merge (${surface})`, async ($, on) => {
    const { disk } = host(on, {
      [GLOBAL]: JSON.stringify({ version: 1, lines: [['context', 'cwd']], style: { separator: 'dot', icons: 'text' } }),
      [PROJECT]: JSON.stringify({ lines: [['model']] }),
    })
    const ui = await open($, surface)
    expect(await lines(ui)).toEqual([['model']])

    // A style change saved globally: the project's lines stay out of the global file.
    await ui.select({ key: 'separator', value: 'space' })
    await ui.press({ key: 'save' })
    const global = JSON.parse(disk.get(GLOBAL)!)
    expect(ids(global)).toEqual([['context', 'cwd']])
    expect(global.style.separator).toBe('space')
    expect(JSON.parse(disk.get(PROJECT)!)).toEqual({ lines: [['model']] })
    expect(await lines(ui)).toEqual([['model']])

    // An alert change saved to the project: its own lines kept, the alerts added, the global style left out.
    await ui.select({ key: 'target', value: 'project' })
    await ui.input({ key: 'alerts-context', text: '70' })
    await ui.press({ key: 'save' })
    const project = JSON.parse(disk.get(PROJECT)!)
    expect(Object.keys(project).sort()).toEqual(['$schema', 'alerts', 'lines', 'version'])
    expect(ids(project)).toEqual([['model']])
    expect(project.alerts.context).toBe(70)
    expect(JSON.parse(disk.get(GLOBAL)!)).toEqual(global)
    expect((await ui.find({ key: 'alerts-context' }))?.props.value).toBe('70')
  })

  test(`a hand edit since the session loaded the file survives Save; with a draft, Save asks twice (${surface})`, async ($, on) => {
    const { disk } = host(on, { [GLOBAL]: JSON.stringify({ version: 1, lines: [['context']] }) })
    const ui = await open($, surface)
    // Edited by hand after the session loaded it, before any timer or prompt picked the edit up.
    disk.set(GLOBAL, JSON.stringify({ version: 1, lines: [['context', 'actions']] }))
    await ui.press({ key: 'save' })
    expect(ids(JSON.parse(disk.get(GLOBAL)!))).toEqual([['context', 'actions']])

    disk.set(GLOBAL, JSON.stringify({ version: 1, lines: [['model']] }))
    await ui.select({ key: 'separator', value: 'dot' })
    await ui.press({ key: 'save' })
    expect(JSON.parse(disk.get(GLOBAL)!).lines).toEqual([['model']])
    expect((await ui.find({ type: 'Text', text: /changed since the editor loaded/ }))).toBeDefined()
    await ui.press({ key: 'save' })
    expect(JSON.parse(disk.get(GLOBAL)!).style.separator).toBe('dot')
  })

  test(`a broken file: its path and error shown, Save over it asks twice (${surface})`, async ($, on) => {
    const { disk, writes } = host(on, { [GLOBAL]: '{ broken' })
    const ui = await open($, surface)
    expect((await ui.find({ type: 'Text', text: /^error: / }))?.text).toContain(GLOBAL)

    await ui.press({ key: 'save' })
    expect(writes).toEqual([])
    expect(disk.get(GLOBAL)).toBe('{ broken')
    expect(await ui.find({ type: 'Text', text: /overwrite/ })).toBeDefined()

    await ui.press({ key: 'save' })
    expect(writes).toEqual([GLOBAL])
    expect(ids(JSON.parse(disk.get(GLOBAL)!))).toEqual(DEFAULT_IDS)
    expect(await ui.find({ type: 'Text', text: /^error: / })).toBeUndefined()
  })
}
