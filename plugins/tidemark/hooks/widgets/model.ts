// The main model, short (`opus 5.5`) or full, and the effort of the last main request.
import { baseModel } from '../model-utils'
import { distinct, labelled, opt, spaced, widget } from './kit'
import type { Span } from './kit'

// Family and version: `claude-opus-5-5` and `claude-3-5-sonnet-20241022` → `opus 5.5`, `sonnet 3.5`.
function shortName(id: string): string {
  const s = baseModel(id).replace(/^claude-/, '').replace(/-\d{8}$/, '')
  const a = /^([a-z]+)-(\d+)(?:-(\d+))?/.exec(s)
  if (a) return `${a[1]} ${a[2]}${a[3] ? `.${a[3]}` : ''}`
  const b = /^(\d+)(?:-(\d+))?-([a-z]+)/.exec(s)
  if (b) return `${b[3]} ${b[1]}${b[2] ? `.${b[2]}` : ''}`
  return s
}

export const model = widget('model', {
  title: 'Model',
  defaultPriority: 50,
  labels: { text: null, nerd: '' },
  render(input) {
    const { model: id, effort } = input.snap
    if (!id) return []
    const name: Span = { text: opt<string>(model, input, 'format') === 'full' ? baseModel(id) : shortName(id) }
    const eff: Span | false = effort !== null && opt<boolean>(model, input, 'showEffort') && { text: `· ${effort}`, role: 'dim' }
    return distinct([spaced([name, eff]), [name]].map(v => labelled(model, input, v)))
  },
})
