// The band above the prompt: the config's lines drawn from the snapshot and the probes, with whatever the
// engine and the plugins beneath draw (`next(e)`) kept below it.
import { atom, read } from 'claude-code'
import type { On } from 'claude-code'

import type { TidemarkConfigState } from '../types'
import { effectiveConfig } from './config'
import { drawBand } from './draw'
import { buildLines } from './layout'
import { EMPTY_PROBES } from './probes'
import { EMPTY_SNAPSHOT } from './snapshot'

// The engine lists the values a module reads from atoms declared in that same file.
const snapshotState = atom({ plugin: 'tidemark', key: 'snapshot' } as const, EMPTY_SNAPSHOT)
const configState = atom({ plugin: 'tidemark', key: 'config' } as const, null as TidemarkConfigState | null)
const probesState = atom({ plugin: 'tidemark', key: 'probes' } as const, EMPTY_PROBES)

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
      if (lines.length > 0) drawn = drawBand(els, e.surface, lines, config.style, snap.theme)
    } catch {
      // A band that cannot be drawn is left out; what is drawn below stays.
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
