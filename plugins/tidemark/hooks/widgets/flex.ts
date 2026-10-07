// Flex: not a figure but a place. Widgets after it in a line are pushed to the right edge; the layout
// handles it, so its render shows nothing.
import { widget } from './kit'

export const flex = widget('flex', {
  title: 'Flex: push the rest right',
  labels: { text: null, nerd: null },
  render: () => [],
})
