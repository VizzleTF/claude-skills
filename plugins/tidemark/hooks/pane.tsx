// The /tidemark details pane: the sections `pane.sections` lists, in its order, drawn like the band.
import { atom, read } from 'claude-code'
import type { On } from 'claude-code'

import type { TidemarkConfigState } from '../types'
import { effectiveConfig } from './config-model'
import { drawPaneLines } from './draw'
import { paneRows } from './pane-rows'
import { EMPTY_SNAPSHOT } from './snapshot'

export const PANE = 'tidemark'
// The snapshot's fields as `name: <json>` rows. No command opens it: it is the snapshot's test seam (a test
// cannot read `$.state`, and the pane shows only part of the snapshot, formatted) and a debugging view.
export const RAW_PANE = 'tidemark-raw'

// The engine lists the values a module reads from atoms declared in that same file.
const snapshotState = atom({ plugin: 'tidemark', key: 'snapshot' } as const, EMPTY_SNAPSHOT)
const configState = atom({ plugin: 'tidemark', key: 'config' } as const, null as TidemarkConfigState | null)

export function registerPane(on: On): void {
  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const snap = await read($, snapshotState)
    const { config } = effectiveConfig(await read($, configState))
    return drawPaneLines($.ui.resolve(e), e.surface, paneRows(snap, config.pane.sections, await $.clock.now()), snap.theme)
  })

  on('ui.render', { component: 'Pane', requestId: RAW_PANE }, async ($, e) => {
    const { Box, Text } = $.ui.resolve(e)
    const snap = await read($, snapshotState)
    return (
      <Box flexDirection="column">
        {Object.entries(snap).map(([k, v]) => <Text>{`${k}: ${JSON.stringify(v)}`}</Text>)}
      </Box>
    )
  })
}
