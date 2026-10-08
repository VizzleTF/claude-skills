// /tidemark-goal and /tidemark-project: the session's goal and the project note the band shows. With text
// the command sets it at once; without, it opens a small pane whose field holds the current text.
// The goal is kept per session id in the plugin store, the note in the session directory.
import { atom, read, update } from 'claude-code'
import type { EngineInterface, On, RenderInput } from 'claude-code'

import { EMPTY_SNAPSHOT, STORE_GOALS } from './snapshot'
import { notePath, withGoal } from './snapshot-reducers'
import { noFields } from './draw'

export const GOAL = 'tidemark-goal'
export const PROJECT = 'tidemark-project'

const snapshotState = atom({ plugin: 'tidemark', key: 'snapshot' } as const, EMPTY_SNAPSHOT)

const logTo = ($: EngineInterface, where: string) => (err: unknown) =>
  $.ui.log(`${where}: ${err instanceof Error ? err.message : String(err)}`, { to: 'debug' })

// Blank text clears; the note's file is emptied rather than left stale.
async function save($: EngineInterface, which: typeof GOAL | typeof PROJECT, raw: string) {
  const text = raw.trim() || null
  if (which === GOAL) {
    await update($, snapshotState, s => ({ ...s, goal: text }))
    const id = (await read($, snapshotState)).sessionId
    if (!id) return
    const goals = await $.store.get(STORE_GOALS).catch(() => undefined) as Record<string, string> | undefined
    await $.store.set(STORE_GOALS, withGoal(goals, id, text)).catch(logTo($, 'goal'))
    return
  }
  await update($, snapshotState, s => ({ ...s, project: text }))
  const cwd = await $.session.cwd().catch(() => null)
  if (cwd) await $.fs.write(notePath(cwd), text ?? '').catch(logTo($, 'project note'))
}

// The field pane of /tidemark-goal or /tidemark-project.
async function drawField($: EngineInterface, e: RenderInput<'Pane'>, which: typeof GOAL | typeof PROJECT) {
  if (e.surface === 'mobile') return noFields($.ui.resolve(e))
  const { Box, Input, Text } = $.ui.resolve(e)
  const snap = await read($, snapshotState)
  const goal = which === GOAL
  return (
    <Box flexDirection="column">
      <Input
        key="text" autoFocus label={goal ? 'goal' : 'project'} value={(goal ? snap.goal : snap.project) ?? ''} submitLabel="set"
        placeholder={goal ? 'what this session is for' : 'the project name, kept for this directory'}
        onSubmit={async text => {
          await save($, which, text)
          await $.ui.close({ id: which })
        }}
      />
      <Text dimColor>Enter sets it, an empty field clears it, Esc closes</Text>
    </Box>
  )
}

export function registerNotes(on: On): void {
  // No text: a command's text is a transcript row the model reads too.
  on('command.run', { command: ['tidemark-goal', 'tidemark-project'] }, async ($, e) => {
    const which = e.command === GOAL ? GOAL : PROJECT
    if (e.args.trim()) await save($, which, e.args)
    else await $.ui.open({ id: which, title: which === GOAL ? 'tidemark goal' : 'tidemark project', rows: 3, focus: true, closeOnEscape: true })
    return {}
  })

  on('ui.render', { component: 'Pane', requestId: 'tidemark-goal' }, ($, e) => drawField($, e, GOAL))
  on('ui.render', { component: 'Pane', requestId: 'tidemark-project' }, ($, e) => drawField($, e, PROJECT))
}
