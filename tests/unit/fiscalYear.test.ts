import { describe, expect, it } from 'vitest'

import { addDays, fiscalYearOf, isInFiscalYear, toDateKey } from '@/lib/fiscalYear'

// Instants chosen to fall on the same Vancouver day at UTC-7 or UTC-8.
const LATE_MARCH_31 = new Date('2027-04-01T06:30:00Z') // Mar 31, 10:30-11:30 p.m. in Vancouver
const EARLY_APRIL_1 = new Date('2027-04-01T08:30:00Z') // Apr 1, 12:30-1:30 a.m. in Vancouver

describe('toDateKey', () => {
  it('uses the Vancouver calendar day, not the UTC one', () => {
    expect(toDateKey(LATE_MARCH_31)).toBe('2027-03-31')
    expect(toDateKey(EARLY_APRIL_1)).toBe('2027-04-01')
  })
})

describe('addDays', () => {
  it('crosses month and year ends', () => {
    expect(addDays('2026-12-25', 10)).toBe('2027-01-04')
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
  })
})

describe('fiscalYearOf', () => {
  it('runs April 1 to March 31', () => {
    expect(fiscalYearOf(new Date('2026-11-24T20:00:00Z'))).toEqual({
      startYear: 2026,
      start: '2026-04-01',
      end: '2027-04-01',
      label: '2026/27',
    })
  })

  it('keeps late on March 31 in Vancouver in the old fiscal year', () => {
    expect(fiscalYearOf(LATE_MARCH_31).label).toBe('2026/27')
  })

  it('starts the new fiscal year just after midnight on April 1 in Vancouver', () => {
    expect(fiscalYearOf(EARLY_APRIL_1).label).toBe('2027/28')
  })

  it('treats January to March as the second half of the fiscal year', () => {
    expect(fiscalYearOf(new Date('2027-02-15T20:00:00Z')).startYear).toBe(2026)
  })

  it('supports another start month', () => {
    expect(fiscalYearOf(new Date('2026-11-24T20:00:00Z'), 1).label).toBe('2026')
    expect(fiscalYearOf(new Date('2026-08-24T20:00:00Z'), 9).label).toBe('2025/26')
  })
})

describe('isInFiscalYear', () => {
  const fy = fiscalYearOf(new Date('2026-11-24T20:00:00Z'))
  it('includes the first and last days and excludes the next', () => {
    expect(isInFiscalYear('2026-04-01', fy)).toBe(true)
    expect(isInFiscalYear('2027-03-31', fy)).toBe(true)
    expect(isInFiscalYear('2027-04-01', fy)).toBe(false)
    expect(isInFiscalYear('2026-03-31', fy)).toBe(false)
  })
})
