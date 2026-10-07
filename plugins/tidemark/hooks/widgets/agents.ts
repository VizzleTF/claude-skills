// Running subagents: a braille spinner each, up to three, then `+N`. The text is the still frame; the
// band draws the spinners animated.
import { labelled, widget } from './kit'

const GLYPH = '⢹'
const SHOWN = 3

export const agents = widget('agents', {
  title: 'Running agents',
  labels: { text: null, nerd: '' },
  render(input) {
    const n = input.snap.activeAgents
    if (n <= 0) return []
    const text = GLYPH.repeat(Math.min(n, SHOWN)) + (n > SHOWN ? `+${n - SHOWN}` : '')
    return [labelled(agents, input, [{ text, role: 'activity', tier: 5, activity: n }])]
  },
})
