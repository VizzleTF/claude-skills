// Claude's status page: `● ok` or the indicator (`minor`, `major`, `critical`) in its severity's colour,
// from the `claudeStatus` probe (statuspage summary). A failed check puts a dim `?` before the last known one.
import { labelled, spaced, widget } from './kit'
import type { Span } from './kit'

const INDICATOR: Record<string, Span> = {
  none: { text: '● ok', tier: 2 },
  minor: { text: '● minor', tier: 5 },
  major: { text: '● major', tier: 7 },
  critical: { text: '● critical', tier: 9 },
}

function indicator(text: string | undefined): Span | undefined {
  try {
    return INDICATOR[JSON.parse(text ?? '')?.status?.indicator]
  } catch {
    return undefined
  }
}

export const claudeStatus = widget('claudeStatus', {
  title: 'Claude status',
  defaultPriority: 20,
  labels: { text: null, nerd: '' },
  render(input) {
    const p = input.probes.claudeStatus
    if (!p) return []
    const known = indicator(p.text)
    const unknown: Span | undefined = p.error || !known ? { text: '?', role: 'dim' } : undefined
    return [labelled(claudeStatus, input, spaced([unknown, known]))]
  },
})
