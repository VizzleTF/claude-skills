// The /tidemark-config editor: a preview of the band at the pane's width, then the draft's lines, the
// selected widget's fields, Add widget, Style, Pane sections, Alerts, Presets, and Save/Revert. Edits go
// to a draft in `$.state`; Save writes the chosen file and loads the config into the session at once.
// The edits themselves are the pure functions of `editor-model`.
import { atom, read, update } from 'claude-code'
import type { EngineInterface, On } from 'claude-code'

import type { TidemarkConfig, TidemarkConfigState, TidemarkEditor, TidemarkWidgetId } from '../types'
import { ICONS, PRESETS, SEPARATORS, WIDGET_IDS, WIDGET_OPTIONS, configPathsFrom, configText, effectiveConfig, loadFromTexts, saveContent } from './config'
import { drawBand } from './draw'
import {
  addItem, moveItem, optionText, raiseSection, removeItem, setAlert, setCompactAt, setLabel, setOption, setPriority, setStyle,
  toggleItem, toggleSection,
} from './editor-model'
import type { Edit, Selection } from './editor-model'
import { buildLines } from './layout'
import { EMPTY_PROBES } from './probes'
import { EMPTY_SNAPSHOT } from './snapshot'
import { WIDGETS } from './widgets'

export const EDITOR = 'tidemark-config'

const EMPTY_EDITOR: TidemarkEditor = { draft: null, selected: null, target: 'global', errors: {}, confirm: false, notice: null }

// The engine lists the values a module reads from atoms declared in that same file.
const editorState = atom({ plugin: 'tidemark', key: 'editor' } as const, EMPTY_EDITOR)
const configState = atom({ plugin: 'tidemark', key: 'config' } as const, null as TidemarkConfigState | null)
const snapshotState = atom({ plugin: 'tidemark', key: 'snapshot' } as const, EMPTY_SNAPSHOT)
const probesState = atom({ plugin: 'tidemark', key: 'probes' } as const, EMPTY_PROBES)

const onOff = [{ value: 'on' }, { value: 'off' }]

// Applies an edit to the draft (the config in effect until the first one). A refused edit leaves the draft
// and puts its error under `field`; an applied one clears it.
async function edit($: EngineInterface, field: string, fn: (c: TidemarkConfig, s: Selection | null) => Edit) {
  const base = effectiveConfig(await read($, configState)).config
  await update($, editorState, s => {
    const { [field]: _, ...errors } = s.errors
    const r = fn(s.draft ?? base, s.selected)
    if ('error' in r) return { ...s, errors: { ...errors, [field]: r.error } }
    return { ...s, draft: r.config, selected: r.selected === undefined ? s.selected : r.selected, errors, confirm: false, notice: null }
  })
}

const selected = (fn: (c: TidemarkConfig, s: Selection) => Edit) =>
  (c: TidemarkConfig, s: Selection | null): Edit => (s ? fn(c, s) : { error: 'no widget selected' })

async function paths($: EngineInterface) {
  return configPathsFrom({
    xdg: await $.env.get('XDG_CONFIG_HOME').catch(() => undefined),
    home: await $.env.get('HOME').catch(() => undefined),
    cwd: await $.session.cwd().catch(() => undefined),
  })
}

type Files = Parameters<typeof loadFromTexts>[0]

async function readFiles($: EngineInterface, list: (string | null)[]): Promise<Files> {
  const files: Files = []
  for (const p of list) {
    if (!p || !(await $.fs.exists(p).catch(() => false))) continue
    files.push(await $.fs.read(p).then(text => ({ path: p, text }), (err: unknown) => ({ path: p, error: String(err) })))
  }
  return files
}

// Writes the draft's share of the target file (`saveContent`), then loads both files into the session so
// the band redraws with them. A target that does not load now is overwritten only on a second Save.
async function save($: EngineInterface) {
  const s = await read($, editorState)
  const loaded = effectiveConfig(await read($, configState))
  const { global, project } = await paths($)
  const path = s.target === 'global' ? global : project
  const note = (notice: string, confirm = false) => update($, editorState, e => ({ ...e, notice, confirm }))
  if (!path) return note(`no ${s.target} config path`)
  if (loaded.error?.includes(`${path}: `) && !s.confirm) return note(`${path} does not load; Save again to overwrite it`, true)
  const before = await readFiles($, [global, project])
  const globalOnly = loadFromTexts(before.filter(f => f.path === global)).config
  const projectFile = before.find(f => f.path === project)
  let projectKeys: string[] = []
  try {
    const raw: unknown = projectFile && 'text' in projectFile ? JSON.parse(projectFile.text) : undefined
    if (typeof raw === 'object' && raw !== null && !Array.isArray(raw)) projectKeys = Object.keys(raw)
  } catch {
    // A project file that does not parse overrides nothing.
  }
  try {
    await $.fs.write(path, configText(saveContent(s.draft ?? loaded.config, loaded.config, globalOnly, projectKeys, s.target)))
  } catch (err) {
    return note(`save failed: ${err instanceof Error ? err.message : String(err)}`)
  }
  // An empty stamp: the config module's next check reloads the same files and records their times.
  const next = loadFromTexts(await readFiles($, [global, project]))
  await update($, configState, () => ({ ...next, stamp: '' }))
  await update($, editorState, e => ({ ...EMPTY_EDITOR, target: e.target, notice: `saved to ${path}` }))
}

export function registerEditor(on: On): void {
  on('ui.render', { component: 'Pane', requestId: EDITOR }, async ($, e) => {
    const els = $.ui.resolve(e)
    const { Box, Text, Button, Input, Select } = els
    const loaded = effectiveConfig(await read($, configState))
    const ed = await read($, editorState)
    const draft = ed.draft ?? loaded.config
    const snap = await read($, snapshotState)
    const preview = buildLines(draft, snap, await read($, probesState), e.props.bodyColumns - 2, await $.clock.now(), {
      cwd: await $.session.cwd().catch(() => undefined),
      home: await $.env.get('HOME').catch(() => undefined),
    })
    const sel = ed.selected
    const item = sel ? draft.lines[sel.line]?.[sel.index] : undefined

    const err = (field: string) => ed.errors[field] !== undefined && <Box key={`err-${field}`}><Text color="red">{`  ${ed.errors[field]}`}</Text></Box>
    const head = (text: string) => <Box marginTop={1}><Text bold>{text}</Text></Box>
    const field = (key: string, label: string, value: string, fn: (c: TidemarkConfig, s: Selection | null, text: string) => Edit) => (
      <Box flexDirection="column">
        <Input key={key} label={label} value={value} submitLabel="set" onSubmit={text => edit($, key, (c, s) => fn(c, s, text))} />
        {err(key)}
      </Box>
    )
    const pick = (key: string, label: string, value: string | undefined, options: { value: string; label?: string }[], fn: (v: string) => unknown) => (
      <Box flexDirection="column">
        <Select key={key} label={label} options={options} {...(value !== undefined && { value })} onSelect={v => fn(v)} />
        {err(key)}
      </Box>
    )

    return (
      <Box flexDirection="column">
        <Text dimColor>Preview</Text>
        {preview.length > 0 ? drawBand(els, e.surface, preview, draft.style, snap.theme) : <Text dimColor>  (nothing to show yet)</Text>}
        <Text dimColor>{`sources: ${loaded.sources.length > 0 ? loaded.sources.join(' + ') : 'default'}`}</Text>
        {loaded.error !== undefined && <Text color="red">{`error: ${loaded.error}`}</Text>}
        {loaded.warnings.map(w => <Text dimColor>{`warning: ${w}`}</Text>)}

        {head('Lines')}
        {draft.lines.map((line, l) => (
          <Box flexDirection="row" flexWrap="wrap" gap={1}>
            <Text dimColor>{`${l + 1}`}</Text>
            {line.map((it, i) => (
              <Button
                key={`w-${l}-${i}`}
                label={it.enabled === false ? `${it.widget} (off)` : it.widget}
                dimColor={it.enabled === false}
                {...(sel?.line === l && sel.index === i && { variant: 'primary' as const })}
                onPress={() => update($, editorState, s => ({ ...s, selected: { line: l, index: i } }))}
              />
            ))}
          </Box>
        ))}
        {err('lines')}
        {item && sel && (
          <Box flexDirection="column">
            <Text>{`${WIDGETS[item.widget].title} (${item.widget})`}</Text>
            <Box flexDirection="row" flexWrap="wrap" gap={1}>
              <Button key="left" label="←" onPress={() => edit($, 'lines', selected((c, s) => moveItem(c, s, 'left')))} />
              <Button key="right" label="→" onPress={() => edit($, 'lines', selected((c, s) => moveItem(c, s, 'right')))} />
              <Button key="up" label="line up" onPress={() => edit($, 'lines', selected((c, s) => moveItem(c, s, 'up')))} />
              <Button key="down" label="line down" onPress={() => edit($, 'lines', selected((c, s) => moveItem(c, s, 'down')))} />
              <Button key="toggle" label={item.enabled === false ? 'enable' : 'disable'} onPress={() => edit($, 'lines', selected(toggleItem))} />
              <Button key="remove" label="remove" onPress={() => edit($, 'lines', selected(removeItem))} />
              <Button key="label-none" label="no label" onPress={() => edit($, 'label', selected((c, s) => setLabel(c, s, null)))} />
            </Box>
            {field('priority', 'priority', String(item.priority ?? WIDGETS[item.widget].defaultPriority), selected2(setPriority))}
            {field('label', item.label === null ? 'label (none)' : 'label', item.label ?? '', selected2((c, s, t) => setLabel(c, s, t === '' ? undefined : t)))}
            {Object.entries(WIDGET_OPTIONS[item.widget]).map(([name, spec]) => {
              const key = `opt-${name}`
              const value = optionText(spec, item.options?.[name])
              const set = selected2((c, s, t) => setOption(c, s, name, t))
              if (spec.kind === 'bool') return pick(key, name, value, onOff, v => edit($, key, (c, s) => set(c, s, v)))
              if (spec.kind === 'enum') return pick(key, name, value, spec.values.map(v => ({ value: v })), v => edit($, key, (c, s) => set(c, s, v)))
              return field(key, name, value, set)
            })}
          </Box>
        )}

        {head('Add widget')}
        {pick('add', 'add', undefined, WIDGET_IDS.map(id => ({ value: id, label: WIDGETS[id].title })), v =>
          edit($, 'add', (c, s) => addItem(c, v as TidemarkWidgetId, s?.line ?? c.lines.length - 1)))}

        {head('Style')}
        {pick('separator', 'separator', draft.style.separator, SEPARATORS.map(value => ({ value })), v =>
          edit($, 'separator', c => setStyle(c, { separator: v as TidemarkConfig['style']['separator'] })))}
        {draft.style.separator === 'custom' && field('custom', 'custom separator', draft.style.custom ?? '', (c, _s, t) => setStyle(c, { custom: t }))}
        {pick('icons', 'icons', draft.style.icons, ICONS.map(value => ({ value, ...(value === 'nerd' && { label: 'nerd font' }) })), v =>
          edit($, 'icons', c => setStyle(c, { icons: v as TidemarkConfig['style']['icons'] })))}
        {pick('buttons', 'buttons', draft.style.buttons === false ? 'off' : 'on', [{ value: 'on' }, { value: 'off' }], v =>
          edit($, 'buttons', c => setStyle(c, { buttons: v === 'on' })))}

        {head('Pane sections')}
        {draft.pane.sections.map(s => (
          <Box flexDirection="row" gap={1}>
            <Text>{s.id}</Text>
            <Button key={`sec-${s.id}`} label={s.enabled ? 'on' : 'off'} onPress={() => edit($, 'sections', c => toggleSection(c, s.id))} />
            <Button key={`sec-${s.id}-up`} label="↑" onPress={() => edit($, 'sections', c => raiseSection(c, s.id))} />
          </Box>
        ))}

        {head('Alerts')}
        {pick('alerts-enabled', 'toasts', draft.alerts.enabled ? 'on' : 'off', onOff, v =>
          edit($, 'alerts-enabled', c => ({ config: { ...c, alerts: { ...c.alerts, enabled: v === 'on' } } })))}
        {([['context', 'context %'], ['quota5h', '5h quota %'], ['quota7d', '7d quota %'], ['cacheSeconds', 'cache cold in, s']] as const).map(([k, label]) =>
          field(`alerts-${k}`, label, String(draft.alerts[k]), (c, _s, t) => setAlert(c, k, t)))}

        {head('Compact button')}
        {pick('compact-enabled', 'button', draft.compact.enabled ? 'on' : 'off', onOff, v =>
          edit($, 'compact-enabled', c => ({ config: { ...c, compact: { ...c.compact, enabled: v === 'on' } } })))}
        {field('compact-at', 'from context %', String(draft.compact.at), (c, _s, t) => setCompactAt(c, t))}

        {head('Presets')}
        {pick('preset', 'preset', undefined, Object.keys(PRESETS).map(value => ({ value })), v =>
          edit($, 'preset', () => (PRESETS[v] ? { config: PRESETS[v]!, selected: null } : { error: `unknown preset ${v}` })))}

        {head('Save')}
        {pick('target', 'save to', ed.target, [{ value: 'global' }, { value: 'project' }], v =>
          update($, editorState, s => ({ ...s, target: v === 'project' ? 'project' : 'global', confirm: false })))}
        <Box flexDirection="row" gap={1}>
          <Button key="save" label={ed.confirm ? 'Save (overwrite)' : 'Save'} variant="primary" onPress={() => save($)} />
          <Button key="revert" label="Revert" onPress={() => update($, editorState, s => ({ ...EMPTY_EDITOR, target: s.target }))} />
        </Box>
        {ed.draft !== null && <Text dimColor>unsaved changes</Text>}
        {ed.notice !== null && <Text>{ed.notice}</Text>}
      </Box>
    )
  })
}

// A field edit that needs the selected widget.
function selected2(fn: (c: TidemarkConfig, s: Selection, text: string) => Edit) {
  return (c: TidemarkConfig, s: Selection | null, text: string): Edit => (s ? fn(c, s, text) : { error: 'no widget selected' })
}
