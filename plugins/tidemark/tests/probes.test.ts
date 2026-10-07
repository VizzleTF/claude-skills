// External probes: what `planProbes` asks to run for which widgets and when, how `applyProbeResult` keeps
// results, and how the git, PR, command and status widgets read them.
import { expect, mock, test } from 'claude-code/testing'
import type { On } from 'claude-code'

import type { TidemarkProbes, TidemarkSnapshot } from '../types'
import { validate } from '../hooks/config'
import { EMPTY_PROBES, applyProbeResult, planProbes } from '../hooks/probes'
import type { ProbeRequest } from '../hooks/probes'
import { EMPTY_SNAPSHOT } from '../hooks/snapshot'
import { WIDGETS } from '../hooks/widgets'
import type { Span, WidgetInput } from '../hooks/widgets'

const NOW = Date.parse('2026-10-07T12:00:00Z')
const CWD = '/u/dev/proj'
const SNAP: TidemarkSnapshot = { ...EMPTY_SNAPSHOT, sessionId: 's1', model: 'claude-opus-5-5', ctx: { window: 200_000, percent: 42 } }

const cfg = (...items: unknown[]) => validate({ version: 1, lines: [items] }).config
const plan = (config: ReturnType<typeof cfg>, probes: TidemarkProbes = EMPTY_PROBES, trigger: 'tick' | 'turn' = 'tick', now = NOW) =>
  planProbes(config, probes, SNAP, CWD, now, trigger)
const argv = (reqs: ProbeRequest[]) => reqs.map(r => (r.kind === 'process' ? r.argv.join(' ') : r.url))
const done = (stdout: string, at = NOW): TidemarkProbes[string] => ({ at, stdout })

test('no external widget enabled: nothing to run', () => {
  expect(plan(cfg('context', 'cache', 'quota5h', 'model', { widget: 'cwd', options: { style: 'basename' } }))).toEqual([])
  expect(plan(cfg({ widget: 'git', enabled: false }, { widget: 'claudeStatus', enabled: false }))).toEqual([])
})

test('no context figure yet (ctx null): command and git still planned', () => {
  const reqs = planProbes(cfg('git', { widget: 'command', options: { command: 'x' } }), EMPTY_PROBES, { ...SNAP, ctx: null }, CWD, NOW, 'tick')
  expect(reqs.map(r => r.key)).toEqual(['gitStatus', 'gitFetch', 'gitDiff', 'command:x'])
  expect(JSON.parse((reqs[3] as { stdin: string }).stdin).contextPercent).toBe(null)
})

test('cwd as the project name asks for the git root', () => {
  expect(argv(plan(cfg('cwd')))).toEqual(['git rev-parse --show-toplevel'])
})

test('git: status and diff with a 2 s timeout; diff only when shown', () => {
  const reqs = plan(cfg({ widget: 'git', options: { fetch: 0 } }))
  expect(argv(reqs)).toEqual(['git --no-optional-locks status --porcelain=v2 --branch', 'git --no-optional-locks diff --numstat HEAD'])
  expect(reqs.every(r => r.timeoutMs === 2000)).toBe(true)
  expect(argv(plan(cfg({ widget: 'git', options: { showDiff: false, fetch: 0 } })))).toEqual(['git --no-optional-locks status --porcelain=v2 --branch'])
})

test('git: a fetch every `fetch` seconds without credential prompts, off at 0 or without showSync; a landed fetch makes the status due', () => {
  const fetch = plan(cfg('git')).find(r => r.key === 'gitFetch')!
  expect(argv([fetch])).toEqual(['git --no-optional-locks fetch --quiet --no-tags'])
  expect(fetch).toMatchObject({ timeoutMs: 15_000, env: { GIT_TERMINAL_PROMPT: '0' } })
  expect(plan(cfg({ widget: 'git', options: { showSync: false } })).some(r => r.key === 'gitFetch')).toBe(false)
  const fresh = { gitStatus: done('', NOW - 3_000), gitDiff: done('', NOW - 3_000), gitFetch: done('', NOW - 60_000) }
  expect(plan(cfg('git'), fresh)).toEqual([])
  expect(plan(cfg('git'), fresh, 'tick', NOW + 241_000).map(r => r.key)).toContain('gitFetch')
  const landed = { ...fresh, gitFetch: done('', NOW - 1_000) }
  expect(plan(cfg('git'), landed).map(r => r.key)).toEqual(['gitStatus'])
})

test('git: fresh within its TTL on a tick, refreshed on turn.complete', () => {
  const probes = { gitStatus: done('', NOW - 3_000), gitDiff: done('', NOW - 3_000), gitFetch: done('', NOW - 3_000) }
  expect(plan(cfg('git'), probes)).toEqual([])
  expect(plan(cfg('git'), probes, 'turn')).toHaveLength(2)
  expect(plan(cfg('git'), probes, 'tick', NOW + 2_000)).toHaveLength(2)
})

test('gitPr: the remote first, then gh for github.com and listed hosts, glab otherwise', () => {
  expect(argv(plan(cfg('gitPr')))).toEqual(['git --no-optional-locks status --porcelain=v2 --branch', 'git remote get-url origin'])
  const pr = (url: string, options = {}) => argv(plan(cfg({ widget: 'gitPr', options }), { gitRemote: done(`${url}\n`) }).filter(r => r.key === 'gitPr'))
  expect(pr('git@github.com:o/r.git')).toEqual(['gh pr view --json number,state,statusCheckRollup,headRefName,url'])
  expect(pr('https://gitlab.com/o/r.git')).toEqual(['glab mr view -F json'])
  expect(pr('ssh://git@ghe.corp:22/o/r', { githubHosts: ['ghe.corp'] })).toEqual(['gh pr view --json number,state,statusCheckRollup,headRefName,url'])
})

test('gitPr: within its two-minute TTL the PR is not asked again, even on a turn; the branch is', () => {
  const probes = { gitRemote: done('git@github.com:o/r.git', NOW - 60_000), gitPr: done('{}', NOW - 60_000), gitStatus: done('', NOW - 1_000) }
  expect(plan(cfg('gitPr'), probes, 'turn').map(r => r.key)).toEqual(['gitStatus'])
  expect(plan(cfg('gitPr'), probes, 'tick').map(r => r.key)).toEqual([])
  expect(plan(cfg('gitPr'), probes, 'tick', NOW + 61_000).map(r => r.key)).toEqual(['gitStatus', 'gitRemote', 'gitPr'])
})

test('command: sh -c with the session as JSON on stdin, its timeout, its TTL', () => {
  const config = cfg({ widget: 'command', options: { command: 'echo hi', timeout: 500 } })
  const [req] = plan(config)
  expect(req).toEqual({
    key: 'command:echo hi', kind: 'process', argv: ['sh', '-c', 'echo hi'], timeoutMs: 500,
    stdin: JSON.stringify({ sessionId: 's1', model: 'claude-opus-5-5', cwd: CWD, contextPercent: 42 }),
  })
  expect(plan(config, { 'command:echo hi': done('hi', NOW - 9_000) })).toEqual([])
  expect(plan(config, { 'command:echo hi': done('hi', NOW - 10_000) })).toHaveLength(1)
  expect(plan(cfg('command'))).toEqual([])
})

test('claudeStatus: the status page summary every five minutes', () => {
  expect(plan(cfg('claudeStatus'))).toEqual([{ key: 'claudeStatus', kind: 'http', url: 'https://status.claude.com/api/v2/summary.json', timeoutMs: 5000 }])
  expect(plan(cfg('claudeStatus'), { claudeStatus: { at: NOW - 299_000, text: '{}' } })).toEqual([])
})

test('a failure keeps the last result and records the error; a success clears it', () => {
  const failed = applyProbeResult({ gitStatus: done('old', 1) }, 'gitStatus', { ok: false, error: 'timeout' }, NOW)
  expect(failed.gitStatus).toEqual({ at: NOW, stdout: 'old', error: 'timeout' })
  expect(applyProbeResult(failed, 'gitStatus', { ok: true, stdout: 'new' }, NOW + 1).gitStatus).toEqual({ at: NOW + 1, stdout: 'new' })
  expect(applyProbeResult({}, 'claudeStatus', { ok: true, text: '{}', status: 200 }, NOW).claudeStatus).toEqual({ at: NOW, text: '{}', status: 200 })
  const down = applyProbeResult({ claudeStatus: { at: 1, text: 'ok' } }, 'claudeStatus', { ok: true, text: 'oops', status: 503 }, NOW)
  expect(down.claudeStatus).toEqual({ at: NOW, text: 'ok', error: 'http 503' })
})

const render = (id: string, probes: TidemarkProbes, options: Record<string, unknown> = {}) =>
  (WIDGETS as Record<string, { render(i: WidgetInput): Span[][] }>)[id]!.render({
    snap: SNAP, probes, options, label: undefined, icons: 'text', now: NOW, env: { cwd: CWD },
  })
const text = (v: Span[] | undefined) => (v ?? []).map(s => s.text).join('')
const texts = (vs: Span[][]) => vs.map(text)

const STATUS = (head: string, oid = 'a1b2c3d4e5f60718293a4b5c6d7e8f9012345678', changes = '') =>
  `# branch.oid ${oid}\n# branch.head ${head}\n${changes}`

test('git: branch, dirty mark and +/- from the diff, narrower without them', () => {
  const probes = {
    gitStatus: done(STATUS('main', undefined, '1 .M N... 100644 100644 100644 abc abc src/a.ts\n? new.txt\n')),
    gitDiff: done('10\t2\tsrc/a.ts\n2\t1\tsrc/b.ts\n-\t-\timg.png\n'),
  }
  expect(texts(render('git', probes))).toEqual(['main* +12 −3', 'main*', 'main'])
  expect(texts(render('git', probes, { showDirty: false, showDiff: false }))).toEqual(['main'])
})

test('git: a clean tree has no mark and no diff; detached HEAD shows the short SHA', () => {
  expect(texts(render('git', { gitStatus: done(STATUS('feature')), gitDiff: done('') }))).toEqual(['feature'])
  expect(texts(render('git', { gitStatus: done(STATUS('(detached)')) }))).toEqual(['a1b2c3d'])
})

test('git: sync with the upstream: behind red, ahead teal, both red, a deleted upstream red, a failed fetch dim', () => {
  const up = (ab: string | null) => `# branch.upstream origin/main\n${ab === null ? '' : `# branch.ab ${ab}\n`}`
  const at = (ab: string | null, extra = {}) => render('git', { gitStatus: done(STATUS('main', undefined, up(ab))), gitDiff: done(''), ...extra })
  const sync = (vs: Span[][]) => vs[0]!.slice(1).map(s => [s.text.trim(), s.tier ?? s.role])
  expect(texts(at('+0 -0'))).toEqual(['main'])
  expect(sync(at('+0 -3'))).toEqual([['⇣3', 9]])
  expect(sync(at('+2 -0'))).toEqual([['⇡2', 4]])
  expect(sync(at('+2 -3'))).toEqual([['⇣3', 9], ['⇡2', 9]])
  expect(sync(at(null))).toEqual([['gone', 9]])
  expect(sync(at('+0 -3', { gitFetch: { at: NOW, error: 'Could not read from remote repository.' } }))).toEqual([['⇣3', 9], ['?', 'dim']])
  // No upstream, or switched off: no mark.
  expect(texts(render('git', { gitStatus: done(STATUS('main')) }))).toEqual(['main'])
  expect(texts(render('git', { gitStatus: done(STATUS('main', undefined, up('+0 -3'))) }, { showSync: false }))).toEqual(['main'])
})

test('git: a long branch is cut to maxLength with an ellipsis', () => {
  expect(text(render('git', { gitStatus: done(STATUS('feature/very-long-branch-name')) }, { maxLength: 10 })[0])).toBe('feature/v…')
})

test('git: outside a repo hidden; a timed-out refresh keeps the last result', () => {
  const failed = applyProbeResult({}, 'gitStatus', { ok: false, error: 'fatal: not a git repository' }, NOW)
  expect(render('git', failed)).toEqual([])
  const stale = applyProbeResult({ gitStatus: done(STATUS('main')) }, 'gitStatus', { ok: false, error: 'timeout' }, NOW)
  expect(texts(render('git', stale))).toEqual(['main'])
})

const gh = (checks: unknown[], state = 'OPEN') => done(JSON.stringify({ number: 123, state, statusCheckRollup: checks }))
const run_ = (conclusion: string | null, status = 'COMPLETED') => ({ __typename: 'CheckRun', status, conclusion })

test('gitPr from gh: number and CI as ✓ / ✗ / …, none without checks, the state when not open', () => {
  expect(texts(render('gitPr', { gitPr: gh([run_('SUCCESS'), { __typename: 'StatusContext', state: 'SUCCESS' }, run_('SKIPPED')]) }))).toEqual(['#123 ✓'])
  expect(texts(render('gitPr', { gitPr: gh([run_('SUCCESS'), run_('FAILURE')]) }))).toEqual(['#123 ✗'])
  expect(texts(render('gitPr', { gitPr: gh([run_('SUCCESS'), run_(null, 'IN_PROGRESS')]) }))).toEqual(['#123 …'])
  expect(texts(render('gitPr', { gitPr: gh([{ __typename: 'StatusContext', state: 'PENDING' }]) }))).toEqual(['#123 …'])
  expect(texts(render('gitPr', { gitPr: gh([]) }))).toEqual(['#123'])
  expect(texts(render('gitPr', { gitPr: gh([run_('SUCCESS')], 'MERGED') }))).toEqual(['#123 ✓ merged'])
  expect(render('gitPr', { gitPr: gh([run_('FAILURE')]) })[0]!.find(s => s.text.includes('✗'))?.tier).toBe(9)
})

test('gitPr from glab: the MR iid and its pipeline', () => {
  const mr = (status: string | null) => ({ gitPr: done(JSON.stringify({ iid: 45, state: 'opened', head_pipeline: status && { status } })) })
  expect(texts(render('gitPr', mr('success')))).toEqual(['#45 ✓'])
  expect(texts(render('gitPr', mr('failed')))).toEqual(['#45 ✗'])
  expect(texts(render('gitPr', mr('running')))).toEqual(['#45 …'])
  expect(texts(render('gitPr', mr(null)))).toEqual(['#45'])
})

test('gitPr: a failed refresh keeps the last PR; no CLI, no PR or another branch hides it', () => {
  const ok = { gitPr: gh([run_('SUCCESS')]) }
  expect(texts(render('gitPr', applyProbeResult(ok, 'gitPr', { ok: false, error: 'timeout' }, NOW)))).toEqual(['#123 ✓'])
  expect(texts(render('gitPr', applyProbeResult(ok, 'gitPr', { ok: false, error: 'HTTP 502: Bad Gateway' }, NOW)))).toEqual(['#123 ✓'])
  expect(render('gitPr', applyProbeResult(ok, 'gitPr', { ok: false, error: 'no pull requests found for branch "x"' }, NOW))).toEqual([])
  expect(render('gitPr', applyProbeResult(ok, 'gitPr', { ok: false, error: 'no open merge request available for "x"' }, NOW))).toEqual([])
  expect(render('gitPr', applyProbeResult({}, 'gitPr', { ok: false, error: 'executable file not found' }, NOW))).toEqual([])
  const onBranch = (b: string) => ({ gitPr: done(JSON.stringify({ number: 5, state: 'OPEN', headRefName: 'feat', statusCheckRollup: [] })), gitStatus: done(STATUS(b)) })
  expect(texts(render('gitPr', onBranch('feat')))).toEqual(['#5'])
  expect(render('gitPr', onBranch('main'))).toEqual([])
  expect(render('gitPr', { gitPr: done(JSON.stringify({ iid: 9, source_branch: 'feat' })), gitStatus: done(STATUS('main')) })).toEqual([])
  expect(render('gitPr', { gitPr: done('not json') })).toEqual([])
})

test('command: the first line of its output without ANSI codes, cut to maxWidth', () => {
  const out = (stdout: string, options: Record<string, unknown> = {}) =>
    texts(render('command', { 'command:./status.sh': done(stdout) }, { command: './status.sh', ...options }))
  expect(out('\x1b[32mbuild ok\x1b[0m\nsecond line\n')).toEqual(['build ok'])
  expect(out('\x1b]8;;https://x.test\x07link\x1b]8;;\x07 done')).toEqual(['link done'])
  expect(out('abcdefghijkl', { maxWidth: 6 })).toEqual(['abcde…'])
  expect(out('\n')).toEqual([])
  expect(render('command', {}, {})).toEqual([])
})

test('command: a failure or timeout shows a dim ?', () => {
  const probes = applyProbeResult({ 'command:x': done('old') }, 'command:x', { ok: false, error: 'timeout' }, NOW)
  const [v] = render('command', probes, { command: 'x' })
  expect(v).toEqual([{ text: '?', role: 'dim' }])
})

const summary = (indicator: string) => ({ at: NOW, text: JSON.stringify({ status: { indicator, description: 'x' }, components: [] }), status: 200 })

test('claudeStatus: the four indicators, coloured by severity', () => {
  const show = (indicator: string) => render('claudeStatus', { claudeStatus: summary(indicator) })[0]!
  expect(['none', 'minor', 'major', 'critical'].map(i => text(show(i)))).toEqual(['● ok', '● minor', '● major', '● critical'])
  expect(['none', 'minor', 'major', 'critical'].map(i => show(i)[0]!.tier)).toEqual([2, 5, 7, 9])
  expect(render('claudeStatus', {})).toEqual([])
})

test('claudeStatus: a failed check shows a dim ? beside the last known status', () => {
  const failed = applyProbeResult({ claudeStatus: summary('minor') }, 'claudeStatus', { ok: false, error: 'timeout' }, NOW)
  const [v] = render('claudeStatus', failed)
  expect(text(v)).toBe('? ● minor')
  expect(v![0]).toEqual({ text: '?', role: 'dim' })
  expect(render('claudeStatus', applyProbeResult({}, 'claudeStatus', { ok: false, error: 'offline' }, NOW))).toEqual([[{ text: '?', role: 'dim' }]])
})

// Through the engine: a config with git, the PR and the status page; the probes run on turn.complete
// against mocked processes and HTTP, and the band shows their results.
const CONFIG = '/u/dev/.config/tidemark/config.json'
const OUTPUT: Record<string, string> = {
  'git --no-optional-locks status --porcelain=v2 --branch': STATUS('main', undefined, '? x\n'),
  'git --no-optional-locks diff --numstat HEAD': '4\t1\ta.ts\n',
  'git remote get-url origin': 'git@github.com:o/r.git\n',
  'gh pr view --json number,state,statusCheckRollup,headRefName,url': JSON.stringify({ number: 7, state: 'OPEN', statusCheckRollup: [run_('SUCCESS')] }),
}

function host(on: On, calls: string[]) {
  const config = JSON.stringify({ version: 1, lines: [['git', 'gitPr', 'claudeStatus']] })
  mock.env(on, { HOME: '/u/dev' })
  mock.clock(on, { now: NOW })
  on('session.start', ($, e) => ({ cwd: e.cwd }))
  on('session.id', () => ({ value: 's1' }))
  on('session.cwd', () => ({ value: CWD }))
  on('session.model', () => ({ value: 'claude-opus-5-5' }))
  on('session.usage', () => ({ value: { startedAt: NOW, rateLimits: [], context: { tokens: 1_000, window: 200_000, percent: 1 } } }))
  on('classic.SessionStart', () => ({}))
  on('agent.list', () => ({ value: [] }))
  on('turn.complete', () => ({ text: '' }))
  on('config.list', () => ({ value: [] }))
  on('store.get', () => ({ value: undefined }))
  on('store.set', () => ({ value: undefined }))
  on('fs.exists', ($, e) => ({ value: e.path === CONFIG }))
  on('fs.read', () => ({ value: config }))
  on('fs.stat', () => ({ value: { kind: 'file', size: config.length, mtimeMs: 1, isLink: false } }))
  on('process.run', ($, e) => {
    const cmd = e.argv.join(' ')
    calls.push(cmd)
    return { value: { exitCode: cmd in OUTPUT ? 0 : 1, stdout: OUTPUT[cmd] ?? '', stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }
  })
  on('http.fetch', ($, e) => {
    calls.push(e.url)
    return { value: { status: 200, ok: true, headers: {}, text: JSON.stringify({ status: { indicator: 'major' } }) } }
  })
  on('ui.render', { component: 'AbovePrompt' }, ($, e) => $.ui.resolve(e).Text({ children: 'below' }))
}

test('engine: enabled probes run on turn.complete and the band shows git, the PR and the status', async ($, on) => {
  const calls: string[] = []
  host(on, calls)
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: CWD })
  await $.classic.SessionStart({ source: 'startup' })
  await $.turn.complete({ turnId: 't', answer: '', durationMs: 1, isAborted: false, reason: 'answer' })
  await $.turn.complete({ turnId: 't2', answer: '', durationMs: 1, isAborted: false, reason: 'answer' })
  // The PR waits for the remote, so it runs on the second turn; a third gives its unawaited result time to land.
  await $.turn.complete({ turnId: 't3', answer: '', durationMs: 1, isAborted: false, reason: 'answer' })
  expect(calls).toContain('git --no-optional-locks status --porcelain=v2 --branch')
  expect(calls).toContain('gh pr view --json number,state,statusCheckRollup,headRefName,url')
  expect(calls).toContain('https://status.claude.com/api/v2/summary.json')
  const ui = await $.ui.mount({
    plugin: 'tidemark', surface: 'terminal', component: 'AbovePrompt',
    props: { hasSurvey: false, isWorking: false, maxRows: 10, bodyColumns: 160, scroll: { offset: 0, bodyRows: 9 }, view: {} },
  })
  expect(await ui.find({ type: 'Text', text: /main\*/ })).toBeDefined()
  // The PR number and the status word are links when the band takes presses.
  const links = await ui.findAll({ type: 'Link' })
  expect(links.map(l => l.props.label)).toContain('major')
  expect(links.some(l => l.props.label === '#7') || !!(await ui.find({ type: 'Text', text: /#7/ }))).toBe(true)
})
