// Prompt cache: warm and its minutes left coloured by the share of the lifetime gone (plain `warm` while
// the lifetime is unknown), cold,
// and the last request that rewrote the cache instead of reading it.
import type { Span } from './kit'
import { distinct, dur, gainTier, kshort, labelled, opt, pctTier, spaced, widget } from './kit'
import { effectiveTtl } from '../model-utils'

export const cache = widget('cache', {
  title: 'Cache',
  defaultPriority: 70,
  labels: { text: 'cache', nerd: '' },
  render(input) {
    const { cache: c, cacheStats, ctx } = input.snap
    const ttl = effectiveTtl(input.snap.cacheTtl ?? input.snap.ttlDefault, opt<string>(cache, input, 'ttl'))
    if (!c) return []
    const left = ttl === null ? 0 : c.at + ttl - input.now
    let status: Span
    let short: Span
    if (!c.warm || (ttl !== null && left <= 0)) status = short = { text: 'cold', role: 'dim' }
    else if (ttl === null) status = short = { text: 'warm', tier: pctTier(0) }
    else {
      const tier = pctTier(((ttl - left) * 100) / ttl)
      short = { text: 'warm', tier }
      status = opt<boolean>(cache, input, 'showMinutes') ? { text: `warm ${dur(left)}`, tier } : short
    }
    const tokens = cacheStats.rewrite?.tokens
    const rewrite: Span | false = !!tokens && opt<boolean>(cache, input, 'showRewrite') && {
      text: `rewrote ${kshort(tokens)}`, ...(ctx?.window ? { tier: gainTier(tokens, ctx.window) } : { role: 'dim' }),
    }
    return distinct([spaced([status, rewrite]), [status], [short]].map(v => labelled(cache, input, v)))
  },
})
