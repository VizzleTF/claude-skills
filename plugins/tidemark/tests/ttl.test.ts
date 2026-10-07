// The prompt-cache lifetime: what a pause proves, and what Claude Code asks for when nothing is proved.
import { expect, test } from 'claude-code/testing'

import { LONG_TTL_MS, SHORT_TTL_MS, defaultTtl, effectiveTtl, inferTtl } from '../hooks/model-utils'

const MIN = 60_000
const SUB = [{ kind: 'five_hour', percentUsed: 42 }, { kind: 'seven_day', percentUsed: 63 }]

test('default: the environment, then the setting, then the account', () => {
  expect(defaultTtl({}, undefined, [])).toBe(SHORT_TTL_MS)
  expect(defaultTtl({}, undefined, SUB)).toBe(LONG_TTL_MS)
  // A spent window: requests draw on usage credits, five minutes.
  expect(defaultTtl({}, undefined, [{ kind: 'five_hour', percentUsed: 100 }])).toBe(SHORT_TTL_MS)
  expect(defaultTtl({ enable1h: '1' }, undefined, [])).toBe(LONG_TTL_MS)
  expect(defaultTtl({ enable1h: '1' }, '5m', [])).toBe(SHORT_TTL_MS)
  expect(defaultTtl({ ttl: '1h' }, '5m', [])).toBe(LONG_TTL_MS)
  expect(defaultTtl({ force5m: '1', ttl: '1h' }, '1h', SUB)).toBe(SHORT_TTL_MS)
  // Off-values and junk are ignored.
  expect(defaultTtl({ force5m: '0', enable1h: 'false', ttl: '2h' }, 'soon', [])).toBe(SHORT_TTL_MS)
})

test('a pause proves the lifetime; a short one or the first request after a compaction proves nothing', () => {
  expect(inferTtl(4 * MIN, 50_000, 50_000, 0)).toBe(null)
  expect(inferTtl(20 * MIN, 0, 0, 50_000)).toBe(null)
  expect(inferTtl(20 * MIN, 50_000, 50_000, 1_000)).toBe(LONG_TTL_MS)
  expect(inferTtl(20 * MIN, 50_000, 0, 51_000)).toBe(SHORT_TTL_MS)
  expect(inferTtl(90 * MIN, 50_000, 0, 51_000)).toBe(null)
})

test('a pinned ttl option wins over everything the session knows', () => {
  expect(effectiveTtl(LONG_TTL_MS, '5m')).toBe(SHORT_TTL_MS)
  expect(effectiveTtl(SHORT_TTL_MS, '1h')).toBe(LONG_TTL_MS)
  expect(effectiveTtl(null, 'auto')).toBe(null)
})
