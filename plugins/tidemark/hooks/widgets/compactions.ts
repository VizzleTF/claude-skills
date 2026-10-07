// Compactions of the main conversation.
import { labelled, opt, widget } from './kit'

export const compactions = widget('compactions', {
  title: 'Compactions',
  labels: { text: '⇣', nerd: '' },
  render(input) {
    const n = input.snap.compactions
    if (n === 0 && opt<boolean>(compactions, input, 'hideZero')) return []
    return [labelled(compactions, input, [{ text: String(n) }], true)]
  },
})
