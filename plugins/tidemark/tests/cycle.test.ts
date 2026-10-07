// What a press on the model widget steps to: the next effort, the next model of the cycle.
import { expect, test } from 'claude-code/testing'

import { autoCycle, learnEffort, nextEffort, nextModel, parseEfforts, usableEfforts } from '../hooks/model-utils'

test('effort steps low → medium → high → xhigh → max → low; a number or none starts at medium', () => {
  expect(['low', 'medium', 'high', 'xhigh', 'max'].map(e => nextEffort(e))).toEqual(['medium', 'high', 'xhigh', 'max', 'low'])
  expect(nextEffort(null)).toBe('medium')
  expect(nextEffort(12_000)).toBe('medium')
})

test('model: the entry matching family and window is current; a family alone next; none, the first', () => {
  const cycle = ['opus[1m]', 'opus', 'sonnet[1m]', 'haiku']
  expect(nextModel('claude-opus-5-5[1m]', cycle)).toBe('opus')
  expect(nextModel('claude-opus-5-5', cycle)).toBe('sonnet[1m]')
  expect(nextModel('claude-haiku-4-5-20251001', cycle)).toBe('opus[1m]')
  expect(nextModel('claude-sonnet-5-5', ['opus[1m]', 'sonnet[1m]'])).toBe('opus[1m]')
  expect(nextModel('claude-fable-5-1', cycle)).toBe('opus[1m]')
  expect(nextModel(null, cycle)).toBe('opus[1m]')
  expect(nextModel('claude-opus-5-5', [])).toBeUndefined()
})

test('auto cycle: the offered models without default, best and opusplan, on the running window side', () => {
  const offered = ['default', 'sonnet', 'opus', 'haiku', 'fable', 'best', 'sonnet[1m]', 'opus[1m]', 'fable[1m]', 'opusplan']
  expect(autoCycle(offered, 'claude-opus-5-5[1m]')).toEqual(['haiku', 'sonnet[1m]', 'opus[1m]', 'fable[1m]'])
  expect(autoCycle(offered, 'claude-opus-5-5')).toEqual(['sonnet', 'opus', 'haiku', 'fable'])
  expect(autoCycle([], null)).toEqual([])
})

test('effort levels from the /effort usage line; auto and switches dropped; a new level joins the cycle', () => {
  expect(parseEfforts('Usage: /effort <low|medium|high|xhigh|max|auto|ultracode [on|off]>')).toEqual(['low', 'medium', 'high', 'xhigh', 'max'])
  expect(parseEfforts('Usage: /effort <low|medium|high|xhigh|max|ultra|auto>')).toEqual(['low', 'medium', 'high', 'xhigh', 'max', 'ultra'])
  expect(parseEfforts('Invalid argument: x. Valid options are: low, medium, high, xhigh, max, auto, ultracode [on|off]')).toEqual(['low', 'medium', 'high', 'xhigh', 'max'])
  expect(parseEfforts('[low|medium|high|xhigh|max|auto|ultracode [on|off]]')).toEqual(['low', 'medium', 'high', 'xhigh', 'max'])
  expect(parseEfforts('Unknown command')).toEqual([])
  expect(nextEffort('max', ['low', 'medium', 'high', 'xhigh', 'max', 'ultra'])).toBe('ultra')
  expect(nextEffort(null, ['low', 'high', 'max'])).toBe('high')
})

test('effort support: a level sent lower is skipped for that model and version, sent as asked it returns', () => {
  let s = learnEffort(undefined, '2.1.292', 'claude-sonnet-5-5[1m]', 'max', 'high')
  expect(s).toEqual({ version: '2.1.292', skip: { 'claude-sonnet-5-5': ['max'] } })
  expect(usableEfforts(['low', 'medium', 'high', 'xhigh', 'max'], s, '2.1.292', 'claude-sonnet-5-5')).toEqual(['low', 'medium', 'high', 'xhigh'])
  expect(usableEfforts(['low', 'max'], s, '2.1.292', 'claude-opus-5-5')).toEqual(['low', 'max'])
  // Another Claude Code version learns again.
  expect(usableEfforts(['high', 'max'], s, '2.1.300', 'claude-sonnet-5-5')).toEqual(['high', 'max'])
  s = learnEffort(s, '2.1.292', 'claude-sonnet-5-5', 'max', 'max')
  expect(s.skip['claude-sonnet-5-5']).toEqual([])
  // A model without effort, `auto` and a wrong argument teach nothing.
  expect(learnEffort(s, '2.1.292', 'claude-haiku-4-5', 'high', undefined)).toBe(s)
  expect(learnEffort(s, '2.1.292', 'claude-opus-5-5', 'auto', 'medium')).toBe(s)
})
