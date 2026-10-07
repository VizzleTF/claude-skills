// How long the current conversation has run.
import { dur, labelled, widget } from './kit'

export const sessionTime = widget('sessionTime', {
  title: 'Session time',
  labels: { text: '⏱', nerd: '' },
  render(input) {
    const at = input.snap.startedAt
    return at === null ? [] : [labelled(sessionTime, input, [{ text: dur(input.now - at) }])]
  },
})
