// Context fill: bar, percentage, tokens, growth sparkline and the last gain; a subagent's while its
// transcript is on screen.
import type { Span, Variant } from './kit'
import { baseModel } from '../model-utils'
import { bar, distinct, gainTier, gains, kshort, ktok, labelled, opt, pctTier, spaced, sparkline, widget } from './kit'

const FALLBACK_WINDOW = 1_000_000

export const context = widget('context', {
  title: 'Context',
  defaultPriority: 100,
  labels: { text: 'ctx', nerd: '' },
  press: 'context',
  render(input) {
    const { snap, env } = input
    const width = opt<number>(context, input, 'barWidth')
    const left = opt<string>(context, input, 'mode') === 'left'
    const showTokens = opt<boolean>(context, input, 'showTokens')
    const viewing = env.agentId !== undefined
    const own = viewing ? { ...input, label: input.label === null ? null : 'agent' } : input
    const out = (vs: Span[][]): Variant[] => distinct(vs.map(v => labelled(context, own, v)))

    let tokens: number | undefined
    let window: number | undefined
    let history: number[]
    if (viewing) {
      const agent = snap.agents.find(a => a.id === env.agentId)
      tokens = agent?.totals.at(-1)
      if (tokens === undefined) return out([[{ text: '--', role: 'dim' }]])
      const ctx = snap.ctx
      window = ctx?.model && baseModel(agent!.model) === baseModel(ctx.model) ? ctx.window : undefined
      history = agent!.totals
    } else {
      const ctx = snap.ctx
      if (!ctx?.window) return []
      window = ctx.window
      history = snap.history
      if (ctx.tokens === undefined || ctx.tokens <= 0) {
        if (!ctx.estimate) return out([[{ text: `--/${ktok(window)}`, role: 'dim' }]])
        // Before the window's first response: /context's estimate, dim and marked ~.
        const p = Math.trunc((ctx.estimate * 100) / window)
        const shown = left ? 100 - p : p
        const b: Span = { text: bar(shown, width), role: 'dim', bar: { percent: shown, dim: true } }
        const pct: Span = { text: `~${shown}%${left ? ' left' : ''}`, role: 'dim' }
        const tok: Span | false = showTokens && { text: `~${ktok(ctx.estimate)}/${ktok(window)}`, role: 'dim' }
        return out([spaced([b, pct, tok]), spaced([b, pct]), [pct]])
      }
      tokens = ctx.tokens
      if (ctx.percent !== undefined) {
        const p = Math.trunc(ctx.percent)
        return out(figures(p, tokens, window, history))
      }
    }

    function figures(p: number, t: number, w: number | undefined, h: number[]): Span[][] {
      const shown = left ? 100 - p : p
      const tier = pctTier(p)
      const core: Span[] = w === undefined
        ? [{ text: ktok(t) }]
        : [{ text: bar(shown, width), tier, bar: { percent: shown } }, { text: `${shown}%${left ? ' left' : ''}`, tier }]
      const tok: Span | false = w !== undefined && showTokens && { text: `${ktok(t)}/${ktok(w)}`, role: 'dim' }
      const growth: Span[] = []
      if (h.length >= 2) {
        const gs = gains(h)
        const base = w ?? snap.ctx?.window ?? FALLBACK_WINDOW
        if (opt<boolean>(context, input, 'showGrowth')) growth.push({ text: sparkline(gs), spark: { values: gs, tiers: gs.map(g => gainTier(g, base)) } })
        if (opt<boolean>(context, input, 'showLast')) growth.push({ text: `↑${kshort(gs.at(-1)!)}`, role: 'dim' })
      }
      return [spaced([...core, tok, ...growth]), spaced([...core, tok]), spaced(core), [core.at(-1)!]]
    }

    const p = window ? Math.trunc((tokens * 100) / window) : 0
    return out(figures(p, tokens, window, history))
  },
})
