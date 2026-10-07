// Git: the branch (a detached HEAD's short SHA), a `*` when the tree is dirty, the sync with the upstream
// (`⇣3` red when the remote is ahead, `⇡2` when only the local branch is, `gone` red when the upstream was
// deleted, a dim `?` when the last fetch failed), the diff against HEAD as `+12 −3`. Read from the `gitStatus` and `gitDiff` probes; hidden outside a repo. A failed refresh keeps
// the last result.
import { cut, distinct, labelled, opt, spaced, widget } from './kit'
import type { Span } from './kit'

export const git = widget('git', {
  title: 'Git',
  defaultPriority: 40,
  labels: { text: null, nerd: '' },
  render(input) {
    const status = input.probes.gitStatus?.stdout
    if (!status) return []
    const lines = status.split('\n')
    const field = (name: string) => lines.find(l => l.startsWith(`# ${name} `))?.slice(name.length + 3).trim()
    const head = field('branch.head')
    const name = head === '(detached)' ? field('branch.oid')?.slice(0, 7) : head
    if (!name) return []
    const dirty = opt<boolean>(git, input, 'showDirty') && lines.some(l => l && !l.startsWith('#'))
    const branch: Span = { text: cut(name, opt(git, input, 'maxLength')) + (dirty ? '*' : '') }
    const sync: Span[] = []
    if (opt<boolean>(git, input, 'showSync') && field('branch.upstream')) {
      const ab = field('branch.ab')?.match(/^\+(\d+) -(\d+)$/)
      if (!ab) sync.push({ text: 'gone', tier: 9 })
      else {
        const [ahead, behind] = [Number(ab[1]), Number(ab[2])]
        if (behind > 0) sync.push({ text: `⇣${behind}`, tier: 9 })
        if (ahead > 0) sync.push({ text: `⇡${ahead}`, tier: behind > 0 ? 9 : 4 })
      }
      if (input.probes.gitFetch?.error) sync.push({ text: '?', role: 'dim' })
    }
    let diff: Span[] = []
    const numstat = input.probes.gitDiff?.stdout
    if (opt<boolean>(git, input, 'showDiff') && numstat) {
      let add = 0, del = 0
      for (const [a, d] of numstat.split('\n').map(l => l.split('\t'))) {
        add += Number(a) || 0
        del += Number(d) || 0
      }
      diff = [add > 0 && { text: `+${add}`, tier: 2 }, del > 0 && { text: `−${del}`, tier: 8 }].filter((s): s is Span => !!s)
    }
    return distinct([spaced([branch, ...sync, ...diff]), spaced([branch, ...sync]), [branch], [{ text: branch.text.replace(/\*$/, '') }]].map(v => labelled(git, input, v)))
  },
})
