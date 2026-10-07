// The band above the prompt: the config's lines drawn from the snapshot and the probes, with whatever the
// engine and the plugins beneath draw (`next(e)`) kept below it.
import { atom, read, update } from 'claude-code'
import type { EngineInterface, On } from 'claude-code'

import type { TidemarkConfig, TidemarkConfigState, TidemarkTrack } from '../types'
import { effectiveConfig } from './config-model'
import { EFFORTS, autoCycle, nextEffort, nextModel, parseEfforts, usableEfforts } from './model-utils'
import type { EffortSupport } from './model-utils'
import { WIDGETS } from './widgets'
import { opt } from './widgets/kit'
import type { Press } from './widgets'
import { drawBand } from './draw'
import { buildLines } from './layout'
import { EMPTY_PROBES } from './probes'
import { EMPTY_SNAPSHOT, STORE_EFFORTS } from './snapshot'
import { PANE } from './pane'
import { EDITOR } from './editor'

// The engine lists the values a module reads from atoms declared in that same file.
const snapshotState = atom({ plugin: 'tidemark', key: 'snapshot' } as const, EMPTY_SNAPSHOT)
const configState = atom({ plugin: 'tidemark', key: 'config' } as const, null as TidemarkConfigState | null)
const probesState = atom({ plugin: 'tidemark', key: 'probes' } as const, EMPTY_PROBES)

// Compacts the main conversation as `/compact` does; the engine compacts only between turns.
function compact($: EngineInterface) {
  void $.session.compact().then(
    r => { if (r.skip) void $.ui.toast(`tidemark: compact skipped: ${r.skip}`) },
    () => { void $.ui.toast('tidemark: compact runs between turns') },
  )
}

const trackState = atom({ plugin: 'tidemark', key: 'track' } as const, { turnCostBase: null, turnStartedAt: null, turnOutput: 0 } as TidemarkTrack)

// The levels `/effort` takes, read from the argument hint Claude Code describes it with
// (`<low|medium|high|xhigh|max|auto|ultracode [on|off]>`); `$.command.list()` has the engine describe it.
let effortHint: string | undefined

async function effortLevels($: EngineInterface): Promise<readonly string[]> {
  if (effortHint === undefined) await $.command.list().catch(() => undefined)
  const levels = parseEfforts(effortHint ?? '')
  return levels.length > 0 ? levels : EFFORTS
}

// A press on the band: `context` and `usage` run that command, `cache` opens the details pane, `effort` and `model` step through their cycle with the command the person would
// type, and show the new value before the next request does. Effort skips the levels a model's requests
// were sent lower. In an interactive session Claude Code keeps an effort set this way as that model's own,
// so a model switch brings back the level last set for the new model.
async function press($: EngineInterface, what: Press, config: TidemarkConfig): Promise<void> {
  if (what === 'context' || what === 'usage') {
    await $.command.run({ command: what })
    return
  }
  if (what === 'cache') {
    await $.ui.open({ id: PANE, title: 'tidemark', rows: 24 })
    return
  }
  if (what === 'config') {
    await $.ui.open({ id: EDITOR, title: 'tidemark config', rows: 30 })
    return
  }
  if (what === 'compact') {
    compact($)
    return
  }
  const snap = await read($, snapshotState)
  if (what === 'effort') {
    const version = (await $.session.version().catch(() => undefined))?.version ?? ''
    const support = await $.store.get(STORE_EFFORTS).catch(() => undefined) as EffortSupport | undefined
    const effort = nextEffort(snap.effort, usableEfforts(await effortLevels($), support, version, snap.model))
    await $.command.run({ command: 'effort', args: effort })
    // The plugin's own command.run hooks skip this run, so the snapshot learns of it here.
    await update($, trackState, t => ({ ...t, effortAsked: effort }))
    await update($, snapshotState, s => ({ ...s, effort }))
    return
  }
  const item = config.lines.flat().find(i => i.widget === 'model')
  // An empty `cycle` takes the models Claude Code offers, so a new family joins without a config change.
  let cycle = opt<string[]>(WIDGETS.model, item ?? {}, 'cycle')
  if (cycle.length === 0) {
    const row = (await $.config.list()).find(r => r.key === 'model')
    cycle = autoCycle(row?.options ?? [], snap.model)
  }
  const target = nextModel(snap.model, cycle)
  if (!target) return
  const { text } = await $.command.run({ command: 'model', args: target })
  const id = await $.session.model()
  if (id === snap.model) $.ui.toast(`tidemark: ${text ?? `no switch to ${target}`}`)
  // The new model's effort shows with its first request.
  else await update($, snapshotState, s => ({ ...s, model: id, effort: null }))
}

export function registerBand(on: On): void {
  on('command.describe', { command: 'effort' }, async ($, e, next) => {
    effortHint = e.argumentHint ?? effortHint
    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) return next(e)
    const snap = await read($, snapshotState)
    const { config, error } = effectiveConfig(await read($, configState))
    const probes = await read($, probesState)
    const env = {
      cwd: await $.session.cwd().catch(() => undefined),
      home: await $.env.get('HOME').catch(() => undefined),
      agentId: e.props.view.agentId,
      configError: error !== undefined,
    }
    const now = await $.clock.now()
    const els = $.ui.resolve(e)
    let drawn: ReturnType<typeof drawBand> | undefined
    try {
      // The band's own padding takes a cell at each side.
      const lines = buildLines(config, snap, probes, e.props.bodyColumns - 2, now, env)
      const act = (what: Press) => { void press($, what, config).catch((err: unknown) => $.ui.toast(`tidemark: ${err instanceof Error ? err.message : String(err)}`)) }
      if (lines.length > 0) drawn = drawBand(els, e.surface, lines, config.style, snap.theme, config.style.buttons === false ? undefined : act)
    } catch (err) {
      // A band that cannot be drawn is left out; what is drawn below stays.
      $.ui.log(`band: ${err instanceof Error ? err.message : String(err)}`, { to: 'debug' })
      drawn = undefined
    }
    // From `compact.at` percent of the main conversation's window, offer `/compact`; the engine compacts
    // only between turns, so the button waits while one runs.
    const pct = snap.ctx?.percent
    const offer = config.compact.enabled && !env.agentId && !e.props.isWorking && pct !== undefined && pct >= config.compact.at
    const button = offer && (
      <els.Box flexDirection="row" paddingX={1}>
        <els.Button
          key="tidemark-compact"
          label={`/compact · context ${Math.round(pct)}%`}
          hotkey="c"
          variant="primary"
          onPress={() => compact($)}
        />
      </els.Box>
    )
    const below = await next(e)
    if (drawn === undefined && !button) return below
    return <els.Box flexDirection="column">{drawn}{button}{below}</els.Box>
  })
}
