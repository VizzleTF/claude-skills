// tidemark: a configurable band above the Claude Code prompt, a details pane (/tidemark) and a config
// editor (/tidemark-config). This module only wires the others together; it never calls `$.ui.status` and
// never writes settings.
//
// Engine rules that shape the modules: one hook per event (without a matcher) per plugin, and `$` is passed
// only to functions declared in the same file as the hook. So each module registers its own hooks with the
// `$` work beside them, and modules share values through atoms, never through functions taking `$`.
import type { Register } from 'claude-code'

import { registerBand } from './band'
import { registerConfig } from './config'
import { EDITOR, registerEditor } from './editor'
import { PANE, registerPane } from './pane'
import { GOAL, PROJECT, registerSnapshot } from './snapshot'

export const register: Register = on => {
  registerSnapshot(on, [
    { name: PANE, description: 'Show tidemark details: context, cache, quota, agents' },
    { name: EDITOR, description: 'Edit the tidemark band: widgets, style, presets' },
    { name: GOAL, description: 'Set the goal the band shows for this session; no text clears it' },
    { name: PROJECT, description: 'Set the project note the band shows, kept in .claude/tidemark-project.txt; no text clears it' },
  ])
  registerConfig(on)
  registerBand(on)
  registerPane(on)
  registerEditor(on)

  // No text: a command's text is a transcript row the model reads too.
  on('command.run', { command: PANE }, async $ => {
    await $.ui.open({ id: PANE, title: 'tidemark', rows: 24 })
    return {}
  })

  on('command.run', { command: EDITOR }, async $ => {
    await $.ui.open({ id: EDITOR, title: 'tidemark config', rows: 30 })
    return {}
  })
}
