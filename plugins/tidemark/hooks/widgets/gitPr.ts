// Pull request of the current branch and its CI: `#123 ✓` / `✗` / `…`, from `gh pr view` (GitHub) or
// `glab mr view` (GitLab) in the `gitPr` probe. Hidden when the CLI or the PR is missing, or the PR is of
// another branch than `gitStatus` shows; any other failed refresh keeps the last PR.
import { labelled, spaced, widget } from './kit'
import type { Span } from './kit'

type Ci = 'pass' | 'fail' | 'wait'
const MARK: Record<Ci, Span> = { pass: { text: '✓', tier: 2 }, fail: { text: '✗', tier: 9 }, wait: { text: '…', tier: 5 } }

// Failures that mean there is nothing to show (no PR for the branch, no CLI), not a refresh that failed.
const GONE = /no (open )?(pull|merge) requests?|not found|no such file|enoent|cannot start|could not start/i

const GH_FAIL = ['FAILURE', 'ERROR', 'CANCELLED', 'TIMED_OUT', 'ACTION_REQUIRED', 'STARTUP_FAILURE']
const GH_PASS = ['SUCCESS', 'NEUTRAL', 'SKIPPED']

// gh's statusCheckRollup: check runs (`status`, `conclusion`) and commit statuses (`state`).
function ghCi(checks: { status?: string; conclusion?: string | null; state?: string }[]): Ci | undefined {
  if (checks.length === 0) return undefined
  const each = checks.map((c): Ci => {
    const v = c.state ?? (c.status === 'COMPLETED' ? c.conclusion ?? '' : 'PENDING')
    return GH_FAIL.includes(v) ? 'fail' : GH_PASS.includes(v) ? 'pass' : 'wait'
  })
  return each.includes('fail') ? 'fail' : each.includes('wait') ? 'wait' : 'pass'
}

// GitLab pipeline statuses.
function glabCi(status: string | undefined): Ci | undefined {
  if (!status) return undefined
  if (status === 'success') return 'pass'
  return ['failed', 'canceled'].includes(status) ? 'fail' : 'wait'
}

export const gitPr = widget('gitPr', {
  title: 'Pull request',
  defaultPriority: 20,
  labels: { text: null, nerd: '' },
  render(input) {
    const p = input.probes.gitPr
    if (!p?.stdout || (p.error && GONE.test(p.error))) return []
    let pr: any
    try { pr = JSON.parse(p.stdout) } catch { return [] }
    const number = pr?.number ?? pr?.iid
    if (typeof number !== 'number') return []
    const branch = /^# branch\.head (.+)$/m.exec(input.probes.gitStatus?.stdout ?? '')?.[1]?.trim()
    const prBranch = pr.headRefName ?? pr.source_branch
    if (branch && prBranch && branch !== prBranch) return []
    const ci = Array.isArray(pr.statusCheckRollup) ? ghCi(pr.statusCheckRollup) : glabCi((pr.head_pipeline ?? pr.pipeline)?.status)
    const state = String(pr.state ?? '').toLowerCase()
    const closed = state && state !== 'open' && state !== 'opened' ? { text: state, role: 'dim' as const } : undefined
    return [labelled(gitPr, input, spaced([{ text: `#${number}` }, ci && MARK[ci], closed]))]
  },
})
