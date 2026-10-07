// The five-hour quota window.
import { quota, widget } from './kit'

export const quota5h = widget('quota5h', {
  title: '5-hour quota',
  defaultPriority: 80,
  labels: { text: '5h', nerd: ' 5h' },
  press: 'usage',
  render: input => quota(quota5h, input, input.snap.limits.find(l => l.kind === 'five_hour')),
})
