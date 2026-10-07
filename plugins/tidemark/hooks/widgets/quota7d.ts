// The weekly quota: the main model's own week when the engine reports one (`7d fable`, see `weekLimit`),
// else the all-models week.
import { quota, quotaWindow, weekLimit, widget } from './kit'

export const quota7d = widget('quota7d', {
  title: '7-day quota',
  defaultPriority: 60,
  labels: { text: '7d', nerd: ' 7d' },
  press: 'usage',
  render(input) {
    const { limits, model } = input.snap
    const week = weekLimit(limits, model)
    const own = week && quotaWindow(week.kind, model).own
    return quota(quota7d, input, week, own ? `${quota7d.labels[input.icons]} ${own}` : undefined)
  },
})
