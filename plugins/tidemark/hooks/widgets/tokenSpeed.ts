// Output tokens per second of the last main turn.
import { labelled, widget } from './kit'

export const tokenSpeed = widget('tokenSpeed', {
  title: 'Token speed',
  labels: { text: null, nerd: '' },
  render(input) {
    const s = input.snap.speed
    return s === null ? [] : [labelled(tokenSpeed, input, [{ text: `${Math.round(s)} t/s` }])]
  },
})
