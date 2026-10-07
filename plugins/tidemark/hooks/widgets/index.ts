// The widget catalogue: every widget id to its definition. Each render is pure (snapshot and probes in,
// variants out), so the band, the editor's preview and the tests share it.
import type { TidemarkWidgetId } from '../../types'
import type { WidgetDef } from './kit'
import { agents } from './agents'
import { cache } from './cache'
import { claudeStatus } from './claudeStatus'
import { command } from './command'
import { compactions } from './compactions'
import { context } from './context'
import { cost } from './cost'
import { cwd } from './cwd'
import { flex } from './flex'
import { git } from './git'
import { gitPr } from './gitPr'
import { model } from './model'
import { quota5h } from './quota5h'
import { quota7d } from './quota7d'
import { sessionTime } from './sessionTime'
import { tokenSpeed } from './tokenSpeed'

export type { BandEnv, Role, Span, Variant, WidgetDef, WidgetInput } from './kit'
export { gainTier, pctTier } from './kit'

export const WIDGETS: Record<TidemarkWidgetId, WidgetDef> = {
  context, cache, quota5h, quota7d, cost, agents, model, git, cwd, sessionTime, compactions, tokenSpeed, command, claudeStatus, gitPr, flex,
}
