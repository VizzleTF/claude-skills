// The band above the prompt: the config's lines drawn from the snapshot and the probes, with whatever the
// engine and the plugins beneath draw (`next(e)`) kept below it.
import { atom, read, update } from 'claude-code'
import type { EngineInterface, On } from 'claude-code'

import type { TidemarkConfig, TidemarkConfigState } from '../types'
import { effectiveConfig } from './config'
import { EFFORTS, autoCycle, nextEffort, nextModel, parseEfforts, usableEfforts } from './model-utils'
import type { EffortSupport } from './model-utils'
import { WIDGETS } from './widgets'
import { opt } from './widgets/kit'
import type { Press } from './widgets'
import { drawBand } from './draw'
import { buildLines } from './layout'
import { EMPTY_PROBES } from './probes'
import { EMPTY_SNAPSHOT, STORE_EFFORTS } from './snapshot'

// The engine lists the values a module reads from atoms declared in that same file.
const snapshotState = atom({ plugin: 'tidemark', key: 'snapshot' } as const, EMPTY_SNAPSHOT)
const configState = atom({ plugin: 'tidemark', key: 'config' } as const, null as TidemarkConfigState | null)
const probesState = atom({ plugin: 'tidemark', key: 'probes' } as const, EMPTY_PROBES)

const EFFORT_KEY = 'effortLevels'

// The effort levels this Claude Code takes, from what `/effort` answers a wrong argument (run bare it may
// open its picker instead); kept in the plugin store per version, so the line shows once per release.
async function effortLevels($: EngineInterface): Promise<readonly string[]> {
  const version = (await $.session.version().catch(() => undefined))?.version ?? ''
  const saved = await $.store.get(EFFORT_KEY).catch(() => undefined) as { version: string; levels: string[] } | undefined
  if (saved && saved.version === version && saved.levels.length > 0) return saved.levels
  const { text } = await $.command.run({ command: 'effort', args: 'tidemark-levels' })
  const levels = parseEfforts(text ?? '')
  if (levels.length === 0) return EFFORTS
  await $.store.set(EFFORT_KEY, { version, levels }).catch(() => undefined)
  return levels
}
// A press on the band: `effort` and `model` step the session's setting through their cycle with the same
// command the person would type (this session only), and show the new value before the next request does.
// Effort skips the levels a model's requests were sent lower; a model switch resets effort to `auto`.
async function press($: EngineInterface, what: Press, config: TidemarkConfig): Promise<void> {
  const snap = await read($, snapshotState)
  if (what === 'effort') {
    const version = (await $.session.version().catch(() => undefined))?.version ?? ''
    const support = await $.store.get(STORE_EFFORTS).catch(() => undefined) as EffortSupport | undefined
    const effort = nextEffort(snap.effort, usableEfforts(await effortLevels($), support, version, snap.model))
    await $.command.run({ command: 'effort', args: effort })
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
  if (id === snap.model) {
    $.ui.toast(`tidemark: ${text ?? `no switch to ${target}`}`)
    return
  }
  // The effort set for the last model carries over; `auto` hands the new one its own default.
  await $.command.run({ command: 'effort', args: 'auto' })
  await update($, snapshotState, s => ({ ...s, model: id, effort: 'auto' }))
}

export function registerBand(on: On): void {
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
      if (lines.length > 0) drawn = drawBand(els, e.surface, lines, config.style, snap.theme, act)
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
          onPress={() => {
            void $.session.compact().then(
              r => { if (r.skip) void $.ui.toast(`tidemark: compact skipped: ${r.skip}`) },
              () => { void $.ui.toast('tidemark: compact runs between turns') },
            )
          }}
        />
      </els.Box>
    )
    const below = await next(e)
    if (drawn === undefined && !button) return below
    return <els.Box flexDirection="column">{drawn}{button}{below}</els.Box>
  })
}
