// External probes (git, gh/glab, a command, the Claude status page) as pure planning: the snapshot module
// runs what `planProbes` asks for and folds each outcome back with `applyProbeResult`. Nothing here calls
// `$`; the engine only lets the hook's own file do that.
import type { TidemarkConfig, TidemarkProbes, TidemarkSnapshot, TidemarkWidgetId, TidemarkWidgetItem } from '../types'
import { WIDGET_OPTIONS } from './config-model'
import { opt as optionOf } from './widgets/kit'

export type ProbesState = TidemarkProbes

export type ProbeRequest =
  | { key: string; kind: 'process'; argv: string[]; stdin?: string; timeoutMs: number; env?: Record<string, string> }
  | { key: string; kind: 'status'; timeoutMs: number }

export type ProbeOutcome = { ok: true; stdout?: string; text?: string; status?: number } | { ok: false; error: string }

export const EMPTY_PROBES: ProbesState = {}

// Fixed limits the config has no option for.
const GIT_TIMEOUT_MS = 5_000
const FETCH_TIMEOUT_MS = 15_000
const GIT_ROOT_TTL_S = 60
const PR_TIMEOUT_MS = 10_000
const STATUS_TIMEOUT_MS = 5_000

// A repository's own `.git/config` could otherwise run a program on every refresh: an fsmonitor command or a hook.
const GIT = ['git', '--no-optional-locks', '-c', 'core.fsmonitor=false', '-c', 'core.hooksPath=/dev/null']

// The host of a remote URL: `git@host:o/r`, `https://host/o/r`, `ssh://git@host:22/o/r`.
const remoteHost = (url: string) => /^(?:[a-z][a-z0-9+.-]*:\/\/)?(?:[^@/]+@)?([^/:]+)/i.exec(url.trim())?.[1]?.toLowerCase() ?? ''

// The key a command's result lives under.
export const commandKey = (command: string) => `command:${command}`

// The requests due now: only for enabled widgets (of any surface) that need them, each when its result is older than its TTL.
// git refreshes on every completed turn as well.
export function planProbes(
  config: TidemarkConfig, probes: ProbesState, snap: TidemarkSnapshot, cwd: string, now: number, trigger: 'tick' | 'turn',
): ProbeRequest[] {
  // The desktop app's own lines need their probes as well.
  const items = [...config.lines, ...(config.desktop?.lines ?? [])].flat().filter(i => i.enabled !== false)
  const first = (id: TidemarkWidgetId) => items.find(i => i.widget === id)
  const opt = <T>(item: TidemarkWidgetItem, name: string) => optionOf<T>({ options: WIDGET_OPTIONS[item.widget] }, item, name)
  const due = (key: string, ttlS: number) => now - (probes[key]?.at ?? -Infinity) >= ttlS * 1000
  const out: ProbeRequest[] = []
  const run = (key: string, ttlS: number, argv: string[], timeoutMs: number, stdin?: string, env?: Record<string, string>) => {
    if (due(key, ttlS) && !out.some(r => r.key === key)) out.push({ key, kind: 'process', argv, timeoutMs, ...(stdin !== undefined && { stdin }), ...(env && { env }) })
  }

  const dir = items.find(i => i.widget === 'cwd' && opt(i, 'style') === 'project')
  if (dir) run('gitRoot', GIT_ROOT_TTL_S, [...GIT, 'rev-parse', '--show-toplevel'], GIT_TIMEOUT_MS)

  // The PR widget needs the branch too, to drop a PR of the branch left.
  // The terminal's and the desktop's git widgets may differ: each probe serves the most demanding of them.
  const gits = items.filter(i => i.widget === 'git')
  const git = gits.length > 0
  const pr = first('gitPr')
  if (git || pr) {
    const ttl = trigger === 'turn' ? 0 : git ? Math.min(...gits.map(g => opt<number>(g, 'ttl'))) : (WIDGET_OPTIONS.git.ttl!.default as number)
    // A fetch that landed since the last status makes the status due: it holds the new ahead/behind.
    const fetched = (probes.gitFetch?.at ?? -Infinity) > (probes.gitStatus?.at ?? -Infinity)
    run('gitStatus', fetched ? 0 : ttl, [...GIT, 'status', '--porcelain=v2', '--branch'], GIT_TIMEOUT_MS)
    // The remote's side of ahead/behind is only as fresh as the last fetch; a credential prompt fails instead of waiting.
    const fetches = gits.filter(g => opt(g, 'showSync')).map(g => opt<number>(g, 'fetch')).filter(n => n > 0)
    const every = fetches.length > 0 ? Math.min(...fetches) : 0
    if (every > 0) run('gitFetch', every, [...GIT, '-c', 'gc.auto=0', '-c', 'maintenance.auto=false', 'fetch', '--quiet', '--no-tags', '--no-recurse-submodules'], FETCH_TIMEOUT_MS, undefined, { GIT_TERMINAL_PROMPT: '0' })
    if (gits.some(g => opt(g, 'showDiff'))) run('gitDiff', ttl, [...GIT, 'diff', '--numstat', 'HEAD'], GIT_TIMEOUT_MS)
  }

  if (pr) {
    const ttl = opt<number>(pr, 'ttl')
    run('gitRemote', ttl, [...GIT, 'remote', 'get-url', 'origin'], GIT_TIMEOUT_MS)
    const remote = probes.gitRemote?.stdout
    if (remote) {
      const host = remoteHost(remote)
      // gh and glab send their login to the host; the remote URL comes with the repository, so only listed hosts get a call.
      const listed = (name: string, own: string) => host === own || opt<string[]>(pr, name).some(h => h.toLowerCase() === host)
      if (listed('githubHosts', 'github.com')) run('gitPr', ttl, ['gh', 'pr', 'view', '--json', 'number,state,statusCheckRollup,headRefName,url'], PR_TIMEOUT_MS)
      else if (listed('gitlabHosts', 'gitlab.com')) run('gitPr', ttl, ['glab', 'mr', 'view', '-F', 'json'], PR_TIMEOUT_MS)
    }
  }

  for (const item of items.filter(i => i.widget === 'command')) {
    const command = opt<string>(item, 'command').trim()
    if (!command) continue
    const stdin = JSON.stringify({ sessionId: snap.sessionId, model: snap.model, cwd, contextPercent: snap.ctx?.percent ?? null })
    run(commandKey(command), opt(item, 'ttl'), ['sh', '-c', command], opt(item, 'timeout'), stdin)
  }

  const status = first('claudeStatus')
  if (status && due('claudeStatus', opt(status, 'ttl'))) out.push({ key: 'claudeStatus', kind: 'status', timeoutMs: STATUS_TIMEOUT_MS })
  return out
}

// What of a program's output the widgets read, so a diff of thousands of files is not kept in state and
// summed again on every draw: the diff as its totals, a command's first line.
function kept(key: string, stdout: string): string {
  if (key === 'gitDiff') {
    let add = 0, del = 0
    for (const [a, d] of stdout.split('\n').map(l => l.split('\t'))) {
      add += Number(a) || 0
      del += Number(d) || 0
    }
    return add + del > 0 ? `${add}\t${del}\t*\n` : ''
  }
  if (key.startsWith('command:')) return stdout.split('\n')[0]!
  return stdout
}

// One finished request folded into the state. A failure (an HTTP error status included) keeps the last
// result beside the error; a success replaces both.
export function applyProbeResult(probes: ProbesState, key: string, outcome: ProbeOutcome, now: number): ProbesState {
  if (outcome.ok && !(outcome.status !== undefined && outcome.status >= 400)) {
    const { ok: _, ...result } = outcome
    if (result.stdout !== undefined) result.stdout = kept(key, result.stdout)
    return { ...probes, [key]: { at: now, ...result } }
  }
  const error = outcome.ok ? `http ${outcome.status}` : outcome.error
  const { error: _, at: __, ...last } = probes[key] ?? { at: now }
  return { ...probes, [key]: { at: now, ...last, error } }
}
