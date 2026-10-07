// The session directory: the project's name (the git root's, else the directory's), its basename, a
// short `~/…/a/b`, or the full path. The git root comes from the `gitRoot` probe when it ran.
import { distinct, labelled, opt, widget } from './kit'

const name = (p: string) => p.split('/').filter(Boolean).at(-1) ?? p

export const cwd = widget('cwd', {
  title: 'Directory',
  labels: { text: null, nerd: '' },
  render(input) {
    const { cwd: dir, home } = input.env
    if (!dir) return []
    const path = dir.replace(/\/+$/, '') || '/'
    let text: string
    switch (opt<string>(cwd, input, 'style')) {
      case 'basename': text = name(path); break
      case 'full': text = path; break
      case 'short': {
        const h = home?.replace(/\/+$/, '')
        const p = h && (path === h || path.startsWith(`${h}/`)) ? `~${path.slice(h.length)}` : path
        const parts = p.split('/')
        text = parts.length > 4 ? [parts[0], '…', ...parts.slice(-2)].join('/') : p
        break
      }
      default: text = name(input.probes.gitRoot?.stdout?.trim() || path)
    }
    return distinct([[{ text }], [{ text: name(path) }]].map(v => labelled(cwd, input, v)))
  },
})
