// Free-text notes set by command: the session's goal (/tidemark-goal) and the project note
// (/tidemark-project). Full text, else cut short to fit.
import type { TidemarkSnapshot, TidemarkWidgetId } from '../../types'
import type { WidgetDef } from './kit'
import { cut, distinct, labelled, widget } from './kit'

const SHORT = 24

const note = (id: TidemarkWidgetId & keyof TidemarkSnapshot, title: string, nerd: string): WidgetDef => {
  const def: WidgetDef = widget(id, {
    title,
    labels: { text: id, nerd },
    render(input) {
      const text = input.snap[id]
      if (!text) return []
      return distinct([[{ text }], [{ text: cut(text, SHORT) }]].map(v => labelled(def, input, v)))
    },
  })
  return def
}

export const goal = note('goal', 'Goal', '')
export const project = note('project', 'Project note', '')
