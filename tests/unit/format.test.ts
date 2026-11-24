import { describe, expect, it } from 'vitest'

import { formatDisplayDateTime } from '@/lib/format'

describe('formatDisplayDateTime', () => {
  it('shows the date and time in Vancouver, not UTC', () => {
    // 2026-07-15 19:05 UTC is 12:05 p.m. in Vancouver (summer, UTC-7).
    expect(formatDisplayDateTime(new Date('2026-07-15T19:05:00Z'))).toBe(
      'Wednesday, July 15 · 12:05 p.m.',
    )
  })

  it('uses the Vancouver date when UTC has already rolled over', () => {
    // 2026-07-16 03:30 UTC is still the evening of July 15 in Vancouver.
    expect(formatDisplayDateTime(new Date('2026-07-16T03:30:00Z'))).toBe(
      'Wednesday, July 15 · 8:30 p.m.',
    )
  })
})
