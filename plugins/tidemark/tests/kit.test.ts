// Shared widget helpers: number and time formats, bars, labels, options, and the spinner frames.
import { expect, test } from 'claude-code/testing'

import { FRAMES, SPINNERS, spinnerSvg } from '../hooks/draw-spinner'
import { bar, cut, dur, kshort, ktok, labelled, opt, pctTier, widget } from '../hooks/widgets/kit'
import type { WidgetInput } from '../hooks/widgets/kit'

const MIN = 60_000
const HOUR = 60 * MIN

test('dur floors to d/h, h/m or m and never goes negative', () => {
  expect(dur(-5_000)).toBe('0m')
  expect(dur(59_999)).toBe('0m')
  expect(dur(HOUR - 1)).toBe('59m')
  expect(dur(2 * HOUR + 34 * MIN + 59_999)).toBe('2h34m')
  expect(dur(24 * HOUR - 1)).toBe('23h59m')
  expect(dur(55 * HOUR)).toBe('2d7h')
})

test('ktok floors to whole k or M; kshort rounds to one decimal', () => {
  expect(ktok(999.9)).toBe('999')
  expect(ktok(271_999)).toBe('271k')
  expect(ktok(1_999_999)).toBe('1M')
  expect(kshort(3_449)).toBe('3.4k')
  expect(kshort(3_450)).toBe('3.5k')
  expect(kshort(40_000)).toBe('40k')
  expect(kshort(1_250_000)).toBe('1.3M')
  expect(kshort(950)).toBe('950')
  expect(kshort(999_960)).toBe('1M')
})

test('bar rounds to the nearest cell and clamps out-of-range percentages', () => {
  expect(bar(4, 10)).toBe('□□□□□□□□□□')
  expect(bar(5, 10)).toBe('■□□□□□□□□□')
  expect(bar(27, 10)).toBe('■■■□□□□□□□')
  expect(bar(150, 5)).toBe('■■■■■')
  expect(bar(-20, 5)).toBe('□□□□□')
  expect(bar(50, 0)).toBe('')
})

test('pctTier is 2 below 30%, one per 10% after, 9 from 90%', () => {
  expect([0, 29, 30, 55, 89, 90, 120].map(pctTier)).toEqual([2, 2, 3, 5, 8, 9, 9])
})

test('cut keeps short text and ends cut text with an ellipsis', () => {
  expect(cut('main', 4)).toBe('main')
  expect(cut('feature/x', 5)).toBe('feat…')
  expect(cut('abc', 0)).toBe('…')
})

const DEF = widget('context', { title: 'Context', labels: { text: 'ctx', nerd: 'N' }, render: () => [] })
const input = (over: Partial<WidgetInput> = {}) => ({ label: undefined, icons: 'text', ...over }) as WidgetInput

test('widget takes its options from the schema; opt falls back to the default', () => {
  expect(DEF.defaultPriority).toBe(20)
  expect(opt<number>(DEF, {}, 'barWidth')).toBe(10)
  expect(opt<number>(DEF, { options: { barWidth: 6 } }, 'barWidth')).toBe(6)
  expect(opt<boolean>(DEF, { options: { showTokens: false } }, 'showTokens')).toBe(false)
  expect(opt(DEF, {}, 'missing')).toBe(undefined)
})

test('labelled puts the label first, glued or spaced, and null hides it', () => {
  const spans = [{ text: '27%' }, { text: ' 271k' }]
  expect(labelled(DEF, input(), spans).map(s => s.text)).toEqual(['ctx', ' 27%', ' 271k'])
  expect(labelled(DEF, input({ icons: 'nerd' }), spans, true)[1]!.text).toBe('27%')
  expect(labelled(DEF, input({ label: 'C' }), spans)[0]).toEqual({ text: 'C', role: 'label' })
  expect(labelled(DEF, input({ label: null }), spans)).toEqual(spans)
  expect(labelled(DEF, input(), [])).toEqual([])
})

test('spinner: eight distinct frames of five dots; the svg draws at most three', () => {
  expect(new Set(FRAMES).size).toBe(8)
  for (const f of FRAMES) expect((f.charCodeAt(0) - 0x2800).toString(2).split('1').length - 1).toBe(5)
  const svg = spinnerSvg(5, { dark: '#fff', light: '#000' })
  expect(svg.width).toBe(SPINNERS * 10 - 2)
  expect(svg.alt).toBe('5 running agents')
  expect(svg.source.match(/<circle/g)!.length).toBe(SPINNERS * 8 * 2)
})
