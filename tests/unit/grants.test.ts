import { describe, expect, it } from 'vitest'

import { isEndAfterStart, nextCompletedAt } from '@/lib/grants'

describe('isEndAfterStart', () => {
  it('accepts an end date after the start date', () => {
    expect(isEndAfterStart('2026-04-01', '2027-03-31')).toBe(true)
  })

  it('rejects an end date on or before the start date', () => {
    expect(isEndAfterStart('2026-04-01', '2026-04-01')).toBe(false)
    expect(isEndAfterStart('2026-04-01', '2026-03-31')).toBe(false)
  })

  it('accepts a missing date on either side', () => {
    expect(isEndAfterStart(null, '2026-04-01')).toBe(true)
    expect(isEndAfterStart('2026-04-01', undefined)).toBe(true)
    expect(isEndAfterStart('', '')).toBe(true)
  })
})

describe('nextCompletedAt', () => {
  const now = new Date('2026-11-24T20:00:00Z')

  it('sets the time when a grant becomes completed', () => {
    expect(
      nextCompletedAt({ previousStatus: 'active', nextStatus: 'completed', previousCompletedAt: null, now }),
    ).toBe('2026-11-24T20:00:00.000Z')
  })

  it('sets the time for a grant created as completed', () => {
    expect(
      nextCompletedAt({ previousStatus: undefined, nextStatus: 'completed', previousCompletedAt: undefined, now }),
    ).toBe('2026-11-24T20:00:00.000Z')
  })

  it('keeps the original time while a grant stays completed', () => {
    expect(
      nextCompletedAt({
        previousStatus: 'completed',
        nextStatus: 'completed',
        previousCompletedAt: '2026-05-01T17:00:00.000Z',
        now,
      }),
    ).toBe('2026-05-01T17:00:00.000Z')
  })

  it('clears the time when a grant moves out of completed', () => {
    expect(
      nextCompletedAt({
        previousStatus: 'completed',
        nextStatus: 'active',
        previousCompletedAt: '2026-05-01T17:00:00.000Z',
        now,
      }),
    ).toBeNull()
    expect(
      nextCompletedAt({ previousStatus: 'completed', nextStatus: 'archived', previousCompletedAt: '2026-05-01T17:00:00.000Z', now }),
    ).toBeNull()
  })
})
