// The config editor's pure draft edits: moves across lines, removal limits, option parsing, sections.
import { expect, test } from 'claude-code/testing'

import type { TidemarkConfig } from '../types'
import { DEFAULT_CONFIG, MAX_LINES } from '../hooks/config-model'
import {
  addItem, moveItem, optionText, raiseSection, removeItem, setAlert, setLabel, setOption, setPriority, toInt, toggleItem,
} from '../hooks/editor-model'
import type { Edit } from '../hooks/editor-model'

const cfg = (...lines: string[][]): TidemarkConfig =>
  ({ ...DEFAULT_CONFIG, lines: lines.map(l => l.map(widget => ({ widget }))) } as TidemarkConfig)
const ids = (e: Edit) => ('config' in e ? e.config.lines.map(l => l.map(i => i.widget)) : e)
const ok = (e: Edit) => {
  if ('error' in e) throw new Error(e.error)
  return e
}

test('left and right move within the line and stop at its ends', () => {
  const c = cfg(['context', 'cache', 'git'])
  const r = moveItem(c, { line: 0, index: 1 }, 'right')
  expect(ids(r)).toEqual([['context', 'git', 'cache']])
  expect(ok(r).selected).toEqual({ line: 0, index: 2 })
  expect(moveItem(c, { line: 0, index: 0 }, 'left')).toEqual({ config: c, selected: { line: 0, index: 0 } })
  expect(moveItem(c, { line: 0, index: 5 }, 'left')).toEqual({ error: 'no widget selected' })
})

test('down starts a new line, but not for the only widget of the last line', () => {
  const r = moveItem(cfg(['context', 'cache']), { line: 0, index: 0 }, 'down')
  expect(ids(r)).toEqual([['cache'], ['context']])
  expect(ok(r).selected).toEqual({ line: 1, index: 0 })
  const lone = cfg(['context'], ['cache'])
  expect(moveItem(lone, { line: 1, index: 0 }, 'down')).toEqual({ config: lone, selected: { line: 1, index: 0 } })
})

test('down stops at the line limit', () => {
  const full = cfg(...Array.from({ length: MAX_LINES }, () => ['context', 'cache']))
  const s = { line: MAX_LINES - 1, index: 0 }
  expect(moveItem(full, s, 'down')).toEqual({ config: full, selected: s })
})

test('up drops the emptied line and selects the moved widget at the end of the line above', () => {
  const r = moveItem(cfg(['context'], ['cache'], ['git']), { line: 1, index: 0 }, 'up')
  expect(ids(r)).toEqual([['context', 'cache'], ['git']])
  expect(ok(r).selected).toEqual({ line: 0, index: 1 })
  // The moved widget's new line shifts up when the source line above it empties.
  const d = moveItem(cfg(['context'], ['cache']), { line: 0, index: 0 }, 'down')
  expect(ids(d)).toEqual([['cache', 'context']])
  expect(ok(d).selected).toEqual({ line: 0, index: 1 })
})

test('remove refuses the last widget and drops an emptied line', () => {
  expect(removeItem(cfg(['context']), { line: 0, index: 0 })).toEqual({ error: 'the band needs one widget' })
  const r = removeItem(cfg(['context'], ['cache']), { line: 0, index: 0 })
  expect(ids(r)).toEqual([['cache']])
  expect(ok(r).selected).toBe(null)
})

test('add clamps the line and rejects an unknown widget', () => {
  const c = cfg(['context'], ['cache'])
  expect(ok(addItem(c, 'git', 9)).selected).toEqual({ line: 1, index: 1 })
  expect(ids(addItem(c, 'git', -3))).toEqual([['context', 'git'], ['cache']])
  expect(addItem(c, 'nope' as never, 0)).toEqual({ error: 'unknown widget nope' })
})

test('toggle disables and re-enables by dropping the key', () => {
  const c = cfg(['context'])
  const off = ok(toggleItem(c, { line: 0, index: 0 })).config
  expect(off.lines[0]![0]).toEqual({ widget: 'context', enabled: false })
  expect(ok(toggleItem(off, { line: 0, index: 0 })).config.lines[0]![0]).toEqual({ widget: 'context' })
})

test('toInt takes trimmed whole numbers within bounds only', () => {
  expect(toInt(' 42 ', 0, 100)).toBe(42)
  expect(toInt('100', 0, 100)).toBe(100)
  for (const t of ['101', '-1', '4.5', '1e2', '', 'abc', '99999999999999999999']) {
    expect(toInt(t, 0, 100)).toEqual({ error: 'a whole number from 0 to 100' })
  }
})

test('priority and label: empty or undefined restore the default, null keeps no label', () => {
  const s = { line: 0, index: 0 }
  const p = ok(setPriority(cfg(['context']), s, '7')).config
  expect(p.lines[0]![0]!.priority).toBe(7)
  expect(ok(setPriority(p, s, '  ')).config.lines[0]![0]).toEqual({ widget: 'context' })
  expect(setPriority(p, s, '1001')).toEqual({ error: 'a whole number from 0 to 1000' })
  const none = ok(setLabel(p, s, null)).config.lines[0]![0]!
  expect(none.label).toBe(null)
  expect('label' in ok(setLabel({ ...p, lines: [[none]] }, s, undefined)).config.lines[0]![0]!).toBe(false)
})

test('options are checked by kind and a default value is dropped', () => {
  const s = { line: 0, index: 0 }
  const c = cfg(['context'])
  expect(setOption(c, s, 'showTokens', 'yes')).toEqual({ error: 'on or off' })
  expect(setOption(c, s, 'mode', 'half')).toEqual({ error: 'one of used, left' })
  expect(setOption(c, s, 'barWidth', '3')).toEqual({ error: 'a whole number from 4 to 20' })
  expect(setOption(c, s, 'toString', 'x')).toEqual({ error: 'unknown option toString' })
  const set = ok(setOption(c, s, 'showTokens', 'off')).config
  expect(set.lines[0]![0]!.options).toEqual({ showTokens: false })
  expect(ok(setOption(set, s, 'showTokens', 'on')).config.lines[0]![0]).toEqual({ widget: 'context' })
})

test('a list option splits on commas and drops blanks; its field joins them back', () => {
  const s = { line: 0, index: 0 }
  const item = ok(setOption(cfg(['gitPr']), s, 'githubHosts', ' a.example, ,b.example ,')).config.lines[0]![0]!
  expect(item.options).toEqual({ githubHosts: ['a.example', 'b.example'] })
  expect(ok(setOption(cfg(['gitPr']), s, 'githubHosts', ' , ')).config.lines[0]![0]).toEqual({ widget: 'gitPr' })
  expect(optionText({ kind: 'strings', default: [] }, item.options!.githubHosts)).toBe('a.example, b.example')
  expect(optionText({ kind: 'bool', default: true }, undefined)).toBe('on')
})

test('raising the first section moves it last; alerts are bounded per key', () => {
  const r = ok(raiseSection(DEFAULT_CONFIG, 'context')).config.pane.sections.map(s => s.id)
  expect(r).toEqual(['cacheQuota', 'agents', 'context'])
  expect(ok(raiseSection(DEFAULT_CONFIG, 'agents')).config.pane.sections.map(s => s.id)).toEqual(['context', 'agents', 'cacheQuota'])
  expect(raiseSection(DEFAULT_CONFIG, 'nope')).toEqual({ error: 'unknown section nope' })
  expect(ok(setAlert(DEFAULT_CONFIG, 'cacheSeconds', '3600')).config.alerts.cacheSeconds).toBe(3600)
  expect(setAlert(DEFAULT_CONFIG, 'context', '101')).toEqual({ error: 'a whole number from 0 to 100' })
})
