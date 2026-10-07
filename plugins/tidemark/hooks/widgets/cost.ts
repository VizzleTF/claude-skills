// The session's cost and the current turn's share of it.
import { validCost as valid } from '../model-utils'
import type { Span } from './kit'
import { distinct, labelled, spaced, widget } from './kit'

const usd = (v: number) => `$${v.toFixed(2)}`

export const cost = widget('cost', {
  title: 'Cost',
  labels: { text: null, nerd: '' },
  render(input) {
    const { cost: c, turnCost } = input.snap
    if (!valid(c)) return []
    const total: Span = { text: `≈${usd(c)}`, role: 'money' }
    const turn: Span | false = valid(turnCost) && { text: `(+${usd(turnCost)})`, role: 'dim' }
    return distinct([spaced([total, turn]), [total]].map(v => labelled(cost, input, v)))
  },
})
