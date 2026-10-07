// A `/compact` button: compacts the main conversation as `/compact` does. Hidden while a subagent's
// transcript is on screen and before the session reports anything.
import { widget } from './kit'

export const compact = widget('compact', {
  title: 'Button: /compact',
  defaultPriority: 10,
  labels: { text: null, nerd: null },
  render(input) {
    if (input.env.agentId || (!input.snap.model && !input.snap.ctx)) return []
    return [[{ text: '/compact', role: 'dim', press: 'compact' }]]
  },
})
