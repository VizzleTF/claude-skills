// tidemark's state contract: every value the mod keeps in `$.state`, under `PluginState['tidemark']`.

export type TidemarkWidgetId =
  | 'context' | 'cache' | 'quota5h' | 'quota7d' | 'cost' | 'agents' | 'model' | 'git' | 'cwd'
  | 'sessionTime' | 'compactions' | 'tokenSpeed' | 'command' | 'claudeStatus' | 'gitPr' | 'flex'

export type TidemarkWidgetItem = {
  widget: TidemarkWidgetId
  enabled?: boolean
  // `null`: no label at all; absent: the widget's own label.
  label?: string | null
  priority?: number
  options?: Record<string, unknown>
}

export type TidemarkSectionId = 'context' | 'cacheQuota' | 'agents'

// Config schema v1.
export type TidemarkConfig = {
  version: 1
  lines: TidemarkWidgetItem[][]
  style: { separator: 'pipe' | 'space' | 'dot' | 'powerline' | 'custom'; custom?: string; icons: 'text' | 'nerd' }
  pane: { sections: { id: TidemarkSectionId; enabled: boolean }[] }
  alerts: { enabled: boolean; context: number; quota5h: number; quota7d: number; cacheSeconds: number }
  // The `/compact` button under the band: shown from `at` percent of the context window.
  compact: { enabled: boolean; at: number }
}

// The config in effect: what loaded, what was dropped, a file that could not be read, the files used, and
// the files' modification stamp the last load saw.
export type TidemarkConfigState = {
  config: TidemarkConfig
  warnings: string[]
  error?: string
  sources: string[]
  stamp: string
}

// Context fill as of the latest main response. `tokens`/`percent` are absent before the first one, when
// `estimate` may hold /context's local count. `compactAt` is the auto-compaction total, `model` the main
// model when the window was read.
export type TidemarkCtx = { tokens?: number; window: number; percent?: number; estimate?: number; compactAt?: number; model?: string }
export type TidemarkCompaction = { before?: number; after?: number }
export type TidemarkLimit = { kind: string; percentUsed: number; resetsAt?: string }
export type TidemarkEffort = 'low' | 'medium' | 'high' | 'xhigh' | 'max' | number
export type TidemarkTheme = 'dark' | 'light'
// The main conversation's last request: when it started and whether it touched the cache.
export type TidemarkCache = { at: number; warm: boolean }
// Main-conversation token counts since the conversation started; `last` is the last request's input total;
// `rewrite` the last request that rewrote the cache instead of reading it.
export type TidemarkCacheStats = { input: number; output: number; read: number; write: number; last: number; rewrite?: { tokens: number; turnId: string } }
export type TidemarkAgent = {
  id: string
  model: string
  effort?: TidemarkEffort
  totals: number[]
  usage: { input: number; output: number; read: number }
  label?: string
  description?: string
}
export type TidemarkBreakdown = {
  autoCompact: boolean
  rows: { name: string; tokens: number }[]
  deferred: number
  mcp: { server: string; tokens: number }[]
}

// Everything the session knows, as data. Written by the snapshot module only.
export type TidemarkSnapshot = {
  ctx: TidemarkCtx | null
  // Last 8 context totals of the main conversation since its last compaction or reset.
  history: number[]
  // Compactions of the main conversation in this conversation, and the last three of them.
  compactions: number
  compactionLog: TidemarkCompaction[]
  breakdown: TidemarkBreakdown | null
  limits: TidemarkLimit[]
  // True once this session has its own quota reading; false while `limits` came from `$.store`.
  limitsLive: boolean
  // When the quota was last read, changed or not.
  limitsAt: number | null
  cache: TidemarkCache | null
  // Prompt-cache lifetime in ms when known (a model switch, a resume or a pause proved it).
  cacheTtl: number | null
  // The lifetime Claude Code asks for by its settings and the account, used while `cacheTtl` is unknown.
  ttlDefault: number | null
  cacheStats: TidemarkCacheStats
  model: string | null
  effort: TidemarkEffort | null
  // Last 8 subagents, the most recently active last; `activeAgents` counts the running ones.
  agents: TidemarkAgent[]
  activeAgents: number
  cost: number | null
  turnCost: number | null
  sessionId: string | null
  // When the current conversation started (ms); `/clear` starts it over.
  startedAt: number | null
  // Output tokens per second of the last main turn.
  speed: number | null
  theme: TidemarkTheme
}

// Bookkeeping the snapshot module keeps between events; not part of the snapshot.
export type TidemarkTrack = {
  turnCostBase: number | null
  turnStartedAt: number | null
  turnOutput: number
}

// External probe results by request key: when the last one finished, its output, and the last failure.
export type TidemarkProbeResult = { at: number; stdout?: string; text?: string; status?: number; error?: string }
export type TidemarkProbes = Record<string, TidemarkProbeResult>

// What the alerts remember between evaluations: which thresholds are currently crossed (a toast fired and
// the figure has not fallen back below the threshold minus the margin), and the cache window already warned.
export type TidemarkAlertMemory = { crossed: Record<string, boolean>; cacheWindow: number | null }

// The config editor's own state: the draft (null until the first edit: the config in effect stands for it),
// the selected widget, where Save writes, input errors by field key, a pending Save over a broken file, and
// the last Save's outcome.
export type TidemarkEditor = {
  draft: TidemarkConfig | null
  selected: { line: number; index: number } | null
  target: 'global' | 'project'
  errors: Record<string, string>
  confirm: boolean
  notice: string | null
}

declare module 'claude-code' {
  interface PluginState {
    'tidemark': {
      snapshot: TidemarkSnapshot
      track: TidemarkTrack
      config: TidemarkConfigState | null
      probes: TidemarkProbes
      alerts: TidemarkAlertMemory
      editor: TidemarkEditor
    }
  }
}
