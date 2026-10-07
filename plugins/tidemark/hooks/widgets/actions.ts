// Small buttons: compact the main conversation as `/compact` does, open the config editor
// (`/tidemark-config`). Compact is hidden while a subagent's transcript is on screen.
import { opt, spaced, widget } from './kit'
import type { Span } from './kit'

const ICONS = { text: { compact: '⇲', config: '⚙' }, nerd: { compact: '', config: '' } }

export const actions = widget('actions', {
  title: 'Buttons: compact, config',
  defaultPriority: 10,
  labels: { text: null, nerd: null },
  render(input) {
    // Before the session reports anything the band stays empty, buttons included.
    if (!input.snap.model && !input.snap.ctx) return []
    const icon = ICONS[input.icons]
    const compact: Span | false = opt<boolean>(actions, input, 'compact') && !input.env.agentId && { text: icon.compact, role: 'dim', press: 'compact' }
    const config: Span | false = opt<boolean>(actions, input, 'config') && { text: icon.config, role: 'dim', press: 'config' }
    const spans = spaced([compact, config])
    return spans.length > 0 ? [spans] : []
  },
})
