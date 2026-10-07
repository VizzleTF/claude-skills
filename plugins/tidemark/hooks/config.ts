// The config's hooks: loading (global file, then the project's file over it) and picking up hand edits by
// modification time. The schema, presets, validation and merging are in config-model.ts.
import { atom, read, update } from 'claude-code'
import type { EngineInterface, On, Timer } from 'claude-code'

import type { TidemarkConfigState } from '../types'
import { configPathsFrom, loadFromTexts } from './config-model'
import type { ConfigPaths, LoadedConfig } from './config-model'

async function configPaths($: EngineInterface): Promise<ConfigPaths> {
  return configPathsFrom({
    xdg: await $.env.get('XDG_CONFIG_HOME').catch(() => undefined),
    home: await $.env.get('HOME').catch(() => undefined),
    cwd: await $.session.cwd().catch(() => undefined),
  })
}

const stat = ($: EngineInterface, path: string | null) =>
  path ? $.fs.stat(path).then(s => s.mtimeMs, () => 0) : Promise.resolve(0)

// The files' modification times, to tell whether a hand edit happened since the last load.
async function stampOf($: EngineInterface): Promise<string> {
  const { global, project } = await configPaths($)
  return `${await stat($, global)}:${await stat($, project)}`
}
// Missing files are skipped and nothing is written; a broken file is never rewritten here.
async function loadConfig($: EngineInterface): Promise<LoadedConfig> {
  const { global, project } = await configPaths($)
  const files: Parameters<typeof loadFromTexts>[0] = []
  for (const path of [global, project]) {
    if (!path || !(await $.fs.exists(path).catch(() => false))) continue
    files.push(await $.fs.read(path).then(text => ({ path, text }), (err: unknown) => ({ path, error: err instanceof Error ? err.message : String(err) })))
  }
  return loadFromTexts(files)
}

// The config in effect. Another module reads it through its own `atom({ plugin: 'tidemark', key: 'config' })`
// (the engine wants atoms declared in the reading file), then `effectiveConfig`.
const configState = atom({ plugin: 'tidemark', key: 'config' } as const, null as TidemarkConfigState | null)

// A failure the band survives goes to the debug log (`claude --debug`), led by the plugin's name.
const logTo = ($: EngineInterface, where: string) => (err: unknown) =>
  $.ui.log(`${where}: ${err instanceof Error ? err.message : String(err)}`, { to: 'debug' })

async function refresh($: EngineInterface): Promise<void> {
  const stamp = await stampOf($)
  const loaded = await loadConfig($)
  await update($, configState, () => ({ ...loaded, stamp }))
}

// Hand edits are picked up within this long, and at the start of each turn.
const CHECK_MS = 30_000

let tick: Timer | undefined

async function check($: EngineInterface): Promise<void> {
  const s = await read($, configState)
  if (!s || s.stamp !== (await stampOf($))) await refresh($)
}

// Loads the config when the process starts, and picks up hand edits at each prompt and on a timer. The
// engine takes one hook per event per plugin and the snapshot owns session.start and turn.start, so the
// config rides `classic.SessionStart` (startup) and `prompt.submit`; until either runs, the default applies.
export function registerConfig(on: On): void {
  on('classic.SessionStart', { source: ['startup'] }, async ($, e, next) => {
    try {
      return await next(e)
    } finally {
      await ensureTick($)
      await refresh($).catch(logTo($, 'config load'))
    }
  })

  // After `/reload-plugins` neither of the above runs until the next prompt; the band's first draw starts
  // the timer and checks the files.
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (!tick) {
      await ensureTick($)
      await check($).catch(logTo($, 'config check'))
    }
    return next(e)
  })

  on('prompt.submit', async ($, e, next) => {
    await ensureTick($)
    await check($).catch(logTo($, 'config check'))
    return next(e)
  })
}

async function ensureTick($: EngineInterface) {
  if (tick) return
  tick = $.clock.every(CHECK_MS, () => check($).catch(logTo($, 'config check')))
}
