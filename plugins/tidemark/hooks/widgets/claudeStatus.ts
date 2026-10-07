// Claude's status page: `● ok` or the indicator (`minor`, `major`, `critical`) in its severity's colour,
// from the `claudeStatus` probe (statuspage summary). A failed check puts a dim `?` before the last known one.
import { labelled, spaced, widget } from './kit'
import type { Span } from './kit'

const PAGE = 'https://status.claude.com'
const INDICATOR: Record<string, [string, number]> = { none: ['ok', 2], minor: ['minor', 5], major: ['major', 7], critical: ['critical', 9] }

// The dot in the severity's colour, the word a link to the status page.
function indicator(text: string | undefined): Span[] | undefined {
  let found: [string, number] | undefined
  try {
    found = INDICATOR[JSON.parse(text ?? '')?.status?.indicator]
  } catch {
    return undefined
  }
  return found && [{ text: '●', tier: found[1] }, { text: found[0], tier: found[1], href: PAGE }]
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
    return [labelled(claudeStatus, input, spaced([unknown, ...(known ?? [])]))]
  },
})
