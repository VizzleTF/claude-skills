// The user's own command: the first line it printed, ANSI codes stripped, cut to `maxWidth`; a dim `?`
// when it failed or timed out. Read from the `command:<command>` probe.
import { commandKey } from '../probes'
import { cut, labelled, opt, widget } from './kit'

// CSI sequences (colours, cursor) and OSC sequences (hyperlinks, titles).
const ANSI = /\x1b\[[0-?]*[ -/]*[@-~]|\x1b\][^\x07\x1b]*(?:\x07|\x1b\\)|\x1b[@-Z\\-_]/g

export const command = widget('command', {
  title: 'Command',
  defaultPriority: 20,
  labels: { text: null, nerd: '' },
  render(input) {
    const cmd = opt<string>(command, input, 'command').trim()
    const p = cmd ? input.probes[commandKey(cmd)] : undefined
    if (!p) return []
    if (p.error) return [labelled(command, input, [{ text: '?', role: 'dim' }])]
    const line = (p.stdout ?? '').replace(ANSI, '').split('\n')[0]!.replace(/[\x00-\x1f\x7f]/g, '').trim()
    return line ? [labelled(command, input, [{ text: cut(line, opt(command, input, 'maxWidth')) }])] : []
  },
})
