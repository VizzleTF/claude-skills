// The user's own command: the first line it printed, ANSI codes stripped, cut to `maxWidth`; a dim `?`
// when it failed or timed out. Read from the `command:<command>` probe.
import { commandKey } from '../probes'
import { clean, cut, labelled, opt, widget } from './kit'

export const command = widget('command', {
  title: 'Command',
  defaultPriority: 20,
  labels: { text: null, nerd: '' },
  render(input) {
    const cmd = opt<string>(command, input, 'command').trim()
    const p = cmd ? input.probes[commandKey(cmd)] : undefined
    if (!p) return []
    if (p.error) return [labelled(command, input, [{ text: '?', role: 'dim' }])]
    const line = clean((p.stdout ?? '').split('\n')[0]!).trim()
    return line ? [labelled(command, input, [{ text: cut(line, opt(command, input, 'maxWidth')) }])] : []
  },
})
