// A small button that opens the config editor (`/tidemark-config`).
import { opt, widget } from './kit'

const ICONS = { text: '⚙', nerd: '' }

export const actions = widget('actions', {
  title: 'Button: config',
  defaultPriority: 10,
  labels: { text: null, nerd: null },
  render(input) {
    // Before the session reports anything the band stays empty, buttons included.
    if (!input.snap.model && !input.snap.ctx) return []
    return opt<boolean>(actions, input, 'config') ? [[{ text: ICONS[input.icons], role: 'dim', press: 'config' }]] : []
  },
})
