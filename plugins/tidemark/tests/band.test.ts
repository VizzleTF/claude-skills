// The band above the prompt through the engine: drawn on the terminal and the desktop from the snapshot
// and the config, with the engine's own band kept below it.
import { expect, mock, test } from 'claude-code/testing'
import type { On, SessionMeasureInput, SessionRateLimit, SessionUsage } from 'claude-code'

const NOW = Date.parse('2026-10-03T15:00:00Z')
const WINDOW = 1_000_000
const GLOBAL = '/u/dev/.config/tidemark/config.json'
const LIMITS: SessionRateLimit[] = [{ kind: 'five_hour', percentUsed: 42, resetsAt: new Date(NOW + 3_600_000).toISOString() }]

// The running model; a test that switches it sets it before `start`.
const world = { model: 'claude-opus-5-5' }

// The fake host: a session at 27% of a 1M window, a config file when given, a downstream band `below`.
function host(on: On, configText?: string, theme?: string, running = 0, onBelow?: () => void) {
  mock.env(on, { HOME: '/u/dev' })
  mock.clock(on, { now: NOW })
  on('session.start', ($, e) => ({ cwd: e.cwd }))
  on('session.id', () => ({ value: 's1' }))
  on('session.cwd', () => ({ value: '/u/dev/proj' }))
  on('session.model', () => ({ value: world.model }))
  on('ui.log', () => ({ value: undefined }))
  on('session.usage', () => {
    const value: SessionUsage = { startedAt: NOW, rateLimits: LIMITS, context: { tokens: 271_000, window: WINDOW, percent: 27 } }
    return { value }
  })
  on('session.measure', ($, e) => ({ changed: e.changed }))
  on('classic.SessionStart', () => ({}))
  on('agent.list', () => ({ value: Array.from({ length: running }, (_, i) => ({ id: `a${i}`, type: 'general', status: 'running' })) as any }))
  const row = (key: string, value: string, options?: string[]) => ({ key, value, label: key, kind: 'choice', options, provider: { plugin: 'engine', tier: 'core' }, isLocked: false })
  on('config.list', () => ({
    value: [
      ...(theme === undefined ? [] : [row('theme', theme)]),
      row('model', 'opus[1m]', ['default', 'opus', 'sonnet', 'haiku', 'opus[1m]', 'sonnet[1m]', 'opusplan']),
    ] as any,
  }))
  on('store.get', () => ({ value: undefined }))
  on('store.set', () => ({ value: undefined }))
  on('fs.exists', ($, e) => ({ value: configText !== undefined && e.path === GLOBAL }))
  on('fs.read', ($, e) => {
    if (configText === undefined || e.path !== GLOBAL) throw new Error(`ENOENT: ${e.path}`)
    return { value: configText }
  })
  on('fs.stat', ($, e) => {
    if (configText === undefined || e.path !== GLOBAL) throw new Error(`ENOENT: ${e.path}`)
    return { value: { kind: 'file', size: configText.length, mtimeMs: 1, isLink: false } }
  })
  on('ui.render', { component: 'AbovePrompt' }, ($, e) => {
    onBelow?.()
    return $.ui.resolve(e).Text({ children: 'below' })
  })
}

const band = (surface: 'terminal' | 'desktop', view: { agentId?: string } = {}, isWorking = false) => ({
  plugin: 'tidemark', surface, component: 'AbovePrompt' as const,
  props: { hasSurvey: false, isWorking, maxRows: 10, bodyColumns: 160, scroll: { offset: 0, bodyRows: 9 }, view },
})

async function start($: any, on: On, configText?: string, theme?: string, running = 0, onBelow?: () => void) {
  host(on, configText, theme, running, onBelow)
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/u/dev/proj' })
  await $.classic.SessionStart({ source: 'startup' })
  await $.session.measure({ context: { tokens: 271_000, window: WINDOW, percent: 27 }, rateLimits: LIMITS, changed: ['context', 'rateLimits'] })
}

for (const surface of ['terminal', 'desktop'] as const) {
  test(`the band draws context and quota above the engine's band (${surface})`, async ($, on) => {
    await start($, on)
    const ui = await $.ui.mount(band(surface))
    expect(await ui.find({ type: 'Text', text: /27%/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /42%/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: 'below' })).toBeDefined()
    const svgs = await ui.findAll({ type: 'Svg' })
    if (surface === 'desktop') expect(svgs.some(s => /context 27% used/.test(String(s.props.alt)))).toBe(true)
    else expect(svgs.length).toBe(0)
  })

  test(`a blank row separates the band from the transcript on the terminal only (${surface})`, async ($, on) => {
    await start($, on)
    const ui = await $.ui.mount(band(surface))
    const boxes = await ui.findAll({ type: 'Box' })
    expect(boxes.some(b => b.props.marginTop === 1)).toBe(surface === 'terminal')
  })

  test(`no /compact button under compact.at, 70% by default (${surface})`, async ($, on) => {
    // The fixture's context is at 27%.
    await start($, on)
    const ui = await $.ui.mount(band(surface))
    expect(await ui.find({ key: 'tidemark-compact' })).toBeUndefined()
  })

  test(`a /compact button from compact.at percent of the context, and a press compacts (${surface})`, async ($, on) => {
    let compacts = 0
    on('session.compact', () => { compacts++; return { skip: 'test' } })
    const toasts: string[] = []
    on('ui.toast', ($, e) => { toasts.push(String((e as any).text ?? e)); return { value: undefined } })
    await start($, on, JSON.stringify({ version: 1, compact: { at: 20 } }))
    const ui = await $.ui.mount(band(surface))
    expect(await ui.find({ key: 'tidemark-compact' })).toBeDefined()
    await ui.press({ key: 'tidemark-compact' })
    expect(compacts).toBe(1)
    // A hook that vetoes the compaction is named in a toast.
    expect(toasts.some(t => t.includes('compact skipped: test'))).toBe(true)
    // Not while a turn runs, not on a subagent's transcript.
    expect(await (await $.ui.mount(band(surface, {}, true))).find({ key: 'tidemark-compact' })).toBeUndefined()
    expect(await (await $.ui.mount(band(surface, { agentId: 'a1' }))).find({ key: 'tidemark-compact' })).toBeUndefined()
  })

  test(`compact.enabled false hides the button (${surface})`, async ($, on) => {
    await start($, on, JSON.stringify({ version: 1, compact: { enabled: false, at: 20 } }))
    const ui = await $.ui.mount(band(surface))
    expect(await ui.find({ key: 'tidemark-compact' })).toBeUndefined()
  })

  test(`flex pushes what follows it to the right edge (${surface})`, async ($, on) => {
    await start($, on, JSON.stringify({ version: 1, lines: [['context', 'flex', 'quota5h']] }))
    const ui = await $.ui.mount(band(surface))
    const rows = await ui.findAll({ type: 'Box' })
    expect(rows.some(b => b.props.justifyContent === 'space-between')).toBe(true)
    expect(await ui.find({ type: 'Text', text: /27%/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /42%/ })).toBeDefined()
  })

  test(`two flex spread three groups: left, middle, right (${surface})`, async ($, on) => {
    await start($, on, JSON.stringify({ version: 1, lines: [['context', 'flex', 'model', 'flex', 'quota5h']] }))
    const ui = await $.ui.mount(band(surface))
    const rows = (await ui.findAll({ type: 'Box' })).filter(b => b.props.justifyContent === 'space-between')
    expect(rows.length).toBe(1)
    for (const t of [/27%/, /42%/]) expect(await ui.find({ type: 'Text', text: t })).toBeDefined()
    expect((await ui.find({ key: 'tidemark-model-model' }))?.props.label).toBe('opus 5.5')
  })

  test(`model and effort are buttons that step through their cycles (${surface})`, async ($, on) => {
    const runs: string[] = []
    world.model = 'claude-opus-5-5[1m]'
    on('command.run', ($, e) => {
      runs.push(`/${e.command} ${e.args}`)
      if (e.command === 'model') world.model = 'claude-sonnet-5-5[1m]'
      return { text: 'ok' }
    })
    on('turn.step', async function* () {
      return { turnId: 't', index: 0, answer: '', toolUses: [], stopReason: 'end_turn', usage: { model: world.model, input_tokens: 1, output_tokens: 1, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 } } as any
    })
    await start($, on)
    const model = world.model
    for await (const _ of $.turn.step({ turnId: 't', index: 0, model, effort: 'high', messageCount: 1 })) { /* drain */ }
    const ui = await $.ui.mount(band(surface))
    expect((await ui.find({ key: 'tidemark-model-effort' }))?.props.label).toBe('high')

    await ui.press({ key: 'tidemark-model-effort' })
    expect(runs).toEqual(['/effort xhigh'])
    expect((await ui.find({ key: 'tidemark-model-effort' }))?.props.label).toBe('xhigh')

    await ui.press({ key: 'tidemark-model-model' })
    // The new model's effort shows with its first request.
    expect(runs).toEqual(['/effort xhigh', '/model sonnet[1m]'])
    expect((await ui.find({ key: 'tidemark-model-model' }))?.props.label).toBe('sonnet 5.5')
    expect(await ui.find({ key: 'tidemark-model-effort' })).toBeUndefined()
    world.model = 'claude-opus-5-5'
  })

  test(`widget labels run /context and /usage and open the pane (${surface})`, async ($, on) => {
    const runs: string[] = []
    const opened: string[] = []
    let compacted = 0
    on('session.compact', ($, e) => {
      compacted++
      return { skip: 'test' } as any
    })
    on('command.run', ($, e) => {
      runs.push(`/${e.command}`)
      return { text: '' }
    })
    on('ui.open', ($, e) => {
      opened.push(e.id)
      return { value: { isPlaced: true } }
    })
    on('turn.step', async function* () {
      return { turnId: 't', index: 0, answer: '', toolUses: [], stopReason: 'end_turn', usage: { model: world.model, input_tokens: 1, output_tokens: 1, cache_read_input_tokens: 5000, cache_creation_input_tokens: 0 } } as any
    })
    await start($, on)
    for await (const _ of $.turn.step({ turnId: 't', index: 0, model: world.model, messageCount: 1 })) { /* drain */ }
    const ui = await $.ui.mount(band(surface))
    await ui.press({ key: 'tidemark-context-context' })
    await ui.press({ key: 'tidemark-quota5h-usage' })
    await ui.press({ key: 'tidemark-cache-cache' })
    expect(runs).toEqual(['/context', '/usage'])
    expect(opened).toEqual(['tidemark'])
    // The small buttons at the right edge: config opens the editor, compact compacts.
    await ui.press({ key: 'tidemark-actions-config' })
    expect(opened).toEqual(['tidemark', 'tidemark-config'])
    await ui.press({ key: 'tidemark-compact-compact' })
    expect(compacted).toBe(1)
  })

  test(`buttons: false draws every press as text (${surface})`, async ($, on) => {
    await start($, on, JSON.stringify({ version: 1, style: { separator: 'pipe', icons: 'text', buttons: false } }))
    const ui = await $.ui.mount(band(surface))
    expect(await ui.findAll({ type: 'Button' })).toEqual([])
    expect(await ui.find({ type: 'Text', text: /ctx/ })).toBeDefined()
  })

  test(`an empty snapshot draws nothing of its own (${surface})`, async ($, on) => {
    host(on)
    const ui = await $.ui.mount(band(surface))
    expect(await ui.find({ type: 'Text', text: 'below' })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /ctx|5h/ })).toBeUndefined()
  })

  test(`a config that does not load: the default band and a dim ⚠ config (${surface})`, async ($, on) => {
    await start($, on, '{ broken')
    const ui = await $.ui.mount(band(surface))
    expect(await ui.find({ type: 'Text', text: /27%/ })).toBeDefined()
    expect((await ui.find({ type: 'Text', text: /^⚠ config$/ }))?.props.dimColor).toBe(true)
  })

  test(`a failure while drawing leaves the engine's band below in place (${surface})`, async ($, on) => {
    let calls = 0
    await start($, on, undefined, undefined, 0, () => calls++)
    // A quota figure that is not a number gets no tier on the colour scale, and drawing its colour throws.
    await $.session.measure({ rateLimits: [{ kind: 'five_hour', percentUsed: 'many' as any, resetsAt: new Date(NOW + 3_600_000).toISOString() }], changed: ['rateLimits'] } as SessionMeasureInput)
    calls = 0
    const ui = await $.ui.mount(band(surface))
    expect(await ui.find({ type: 'Text', text: /27%/ })).toBeUndefined()
    expect(await ui.find({ type: 'Text', text: 'below' })).toBeDefined()
    expect(calls).toBe(1)
  })

  test(`a subagent's transcript on screen: context shows agent (${surface})`, async ($, on) => {
    await start($, on)
    const ui = await $.ui.mount(band(surface, { agentId: 'a1' }))
    expect((await ui.find({ key: 'tidemark-context-context' }))?.props.label).toBe('agent')
  })

  test(`powerline with nerd icons: segments on their colours (${surface})`, async ($, on) => {
    await start($, on, JSON.stringify({ style: { separator: 'powerline', icons: 'nerd' } }))
    const ui = await $.ui.mount(band(surface))
    expect(await ui.find({ type: 'Text', text: // })).toBeDefined()
    if (surface === 'terminal') expect(await ui.find({ type: 'Text', text: '' })).toBeDefined()
    else expect((await ui.findAll({ type: 'Box' })).some(b => b.props.backgroundColor !== undefined)).toBe(true)
  })
}

test('powerline with text icons uses ▶; dot and custom separators', async ($, on) => {
  await start($, on, JSON.stringify({ style: { separator: 'powerline', icons: 'text' } }))
  expect(await (await $.ui.mount(band('terminal'))).find({ type: 'Text', text: '▶' })).toBeDefined()
})

test('the dot separator', async ($, on) => {
  await start($, on, JSON.stringify({ style: { separator: 'dot' } }))
  expect(await (await $.ui.mount(band('terminal'))).find({ type: 'Text', text: ' · ' })).toBeDefined()
})

test('a custom separator', async ($, on) => {
  await start($, on, JSON.stringify({ style: { separator: 'custom', custom: ' // ' } }))
  expect(await (await $.ui.mount(band('terminal'))).find({ type: 'Text', text: ' // ' })).toBeDefined()
  expect(await (await $.ui.mount(band('desktop'))).find({ type: 'Text', text: '//' })).toBeDefined()
})

test('tiers come from the fixed scale: dark, light, and dark for an unknown or missing theme', async ($, on) => {
  const color = async () => {
    const ui = await $.ui.mount(band('terminal'))
    return (await ui.find({ type: 'Text', text: /^ ?27%$/ }))?.props.color
  }
  await start($, on, undefined, 'light')
  expect(await color()).toBe('#0076a8')
})

for (const theme of ['dark', 'monokai', undefined]) {
  test(`tier colour with theme ${theme}`, async ($, on) => {
    await start($, on, undefined, theme)
    expect((await (await $.ui.mount(band('terminal'))).find({ type: 'Text', text: /^ ?27%$/ }))?.props.color).toBe('#37aae3')
  })
}

for (const surface of ['terminal', 'desktop'] as const) {
  test(`running agents animate: at most 3 spinners and +N (${surface})`, async ($, on) => {
    await start($, on, JSON.stringify({ lines: [['context', 'agents']] }), 'dark', 5)
    const ui = await $.ui.mount(band(surface))
    expect(await ui.find({ type: 'Text', text: /^ ?\+2$/ })).toBeDefined()
    if (surface === 'terminal') {
      const clients = await ui.findAll({ type: 'Client' })
      expect(clients.length).toBe(1)
      expect((clients[0]!.props.props as { count: number }).count).toBe(3)
    } else {
      const svg = (await ui.findAll({ type: 'Svg' })).find(s => /running agents/.test(String(s.props.alt)))
      expect(svg?.props.isInteractive).toBe(true)
      expect(String(svg?.props.source)).toContain('<animate')
      expect((String(svg?.props.source).match(/<g class="k moving">(.*?)<\/g>/)?.[1]?.match(/<circle/g) ?? []).length).toBe(3 * 8)
    }
  })
}

test('a theme whose name has light in it takes the light palette', async ($, on) => {
  await start($, on, undefined, 'light-daltonized')
  expect((await (await $.ui.mount(band('terminal'))).find({ type: 'Text', text: /^ ?27%$/ }))?.props.color).toBe('#0076a8')
})
