// External probes (git, gh/glab, a command, the Claude status page) as pure planning: the snapshot module
// runs what `planProbes` asks for and folds each outcome back with `applyProbeResult`. Nothing here calls
// `$`; the engine only lets the hook's own file do that.
import type { TidemarkConfig, TidemarkProbes, TidemarkSnapshot, TidemarkWidgetId, TidemarkWidgetItem } from '../types'
import { WIDGET_OPTIONS } from './config'
import { opt as optionOf } from './widgets/kit'

export type ProbesState = TidemarkProbes

export type ProbeRequest =
  | { key: string; kind: 'process'; argv: string[]; stdin?: string; timeoutMs: number; env?: Record<string, string> }
  | { key: string; kind: 'http'; url: string; timeoutMs: number }

export type ProbeOutcome = { ok: true; stdout?: string; text?: string; status?: number } | { ok: false; error: string }

export const EMPTY_PROBES: ProbesState = {}

// Fixed limits the config has no option for.
const GIT_TIMEOUT_MS = 2_000
const FETCH_TIMEOUT_MS = 15_000
const GIT_ROOT_TTL_S = 60
const PR_TIMEOUT_MS = 10_000
const STATUS_TIMEOUT_MS = 5_000
const STATUS_URL = 'https://status.claude.com/api/v2/summary.json'

const GIT = ['git', '--no-optional-locks']

// The host of a remote URL: `git@host:o/r`, `https://host/o/r`, `ssh://git@host:22/o/r`.
const remoteHost = (url: string) => /^(?:[a-z][a-z0-9+.-]*:\/\/)?(?:[^@/]+@)?([^/:]+)/i.exec(url.trim())?.[1]?.toLowerCase() ?? ''

// The key a command's result lives under.
export const commandKey = (command: string) => `command:${command}`

// The requests due now: only for enabled widgets that need them, each when its result is older than its TTL.
// git refreshes on every completed turn as well.
export function planProbes(
  config: TidemarkConfig, probes: ProbesState, snap: TidemarkSnapshot, cwd: string, now: number, trigger: 'tick' | 'turn',
): ProbeRequest[] {
  const items = config.lines.flat().filter(i => i.enabled !== false)
  const first = (id: TidemarkWidgetId) => items.find(i => i.widget === id)
  const opt = <T>(item: TidemarkWidgetItem, name: string) => optionOf<T>({ options: WIDGET_OPTIONS[item.widget] }, item, name)
  const due = (key: string, ttlS: number) => now - (probes[key]?.at ?? -Infinity) >= ttlS * 1000
  const out: ProbeRequest[] = []
  const run = (key: string, ttlS: number, argv: string[], timeoutMs: number, stdin?: string, env?: Record<string, string>) => {
    if (due(key, ttlS) && !out.some(r => r.key === key)) out.push({ key, kind: 'process', argv, timeoutMs, ...(stdin !== undefined && { stdin }), ...(env && { env }) })
  }

  const dir = items.find(i => i.widget === 'cwd' && opt(i, 'style') === 'project')
  if (dir) run('gitRoot', GIT_ROOT_TTL_S, ['git', 'rev-parse', '--show-toplevel'], GIT_TIMEOUT_MS)

  // The PR widget needs the branch too, to drop a PR of the branch left.
  const git = first('git')
  const pr = first('gitPr')
  if (git || pr) {
    const ttl = trigger === 'turn' ? 0 : git ? opt<number>(git, 'ttl') : (WIDGET_OPTIONS.git.ttl!.default as number)
    // A fetch that landed since the last status makes the status due: it holds the new ahead/behind.
    const fetched = (probes.gitFetch?.at ?? -Infinity) > (probes.gitStatus?.at ?? -Infinity)
    run('gitStatus', fetched ? 0 : ttl, [...GIT, 'status', '--porcelain=v2', '--branch'], GIT_TIMEOUT_MS)
    // The remote's side of ahead/behind is only as fresh as the last fetch; a credential prompt fails instead of waiting.
    const every = git ? opt<number>(git, 'fetch') : 0
    if (git && every > 0 && opt(git, 'showSync')) run('gitFetch', every, [...GIT, 'fetch', '--quiet', '--no-tags'], FETCH_TIMEOUT_MS, undefined, { GIT_TERMINAL_PROMPT: '0' })
    if (git && opt(git, 'showDiff')) run('gitDiff', ttl, [...GIT, 'diff', '--numstat', 'HEAD'], GIT_TIMEOUT_MS)
  }

  if (pr) {
    const ttl = opt<number>(pr, 'ttl')
    run('gitRemote', ttl, ['git', 'remote', 'get-url', 'origin'], GIT_TIMEOUT_MS)
    const remote = probes.gitRemote?.stdout
    if (remote) {
      const host = remoteHost(remote)
      const github = host === 'github.com' || opt<string[]>(pr, 'githubHosts').some(h => h.toLowerCase() === host)
      run('gitPr', ttl, github ? ['gh', 'pr', 'view', '--json', 'number,state,statusCheckRollup,headRefName'] : ['glab', 'mr', 'view', '-F', 'json'], PR_TIMEOUT_MS)
    }
  }

  for (const item of items.filter(i => i.widget === 'command')) {
    const command = opt<string>(item, 'command').trim()
    if (!command) continue
    const stdin = JSON.stringify({ sessionId: snap.sessionId, model: snap.model, cwd, contextPercent: snap.ctx?.percent ?? null })
    run(commandKey(command), opt(item, 'ttl'), ['sh', '-c', command], opt(item, 'timeout'), stdin)
  }

  const status = first('claudeStatus')
  if (status && due('claudeStatus', opt(status, 'ttl'))) out.push({ key: 'claudeStatus', kind: 'http', url: STATUS_URL, timeoutMs: STATUS_TIMEOUT_MS })
  return out
}

// One finished request folded into the state. A failure (an HTTP error status included) keeps the last
// result beside the error; a success replaces both.
export function applyProbeResult(probes: ProbesState, key: string, outcome: ProbeOutcome, now: number): ProbesState {
  if (outcome.ok && !(outcome.status !== undefined && outcome.status >= 400)) {
    const { ok: _, ...result } = outcome
    return { ...probes, [key]: { at: now, ...result } }
  }
  const error = outcome.ok ? `http ${outcome.status}` : outcome.error
  const { error: _, at: __, ...last } = probes[key] ?? { at: now }
  return { ...probes, [key]: { at: now, ...last, error } }
}
