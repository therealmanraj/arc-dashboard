import { describe, expect, it } from 'vitest'

import { computeMetrics, DEFAULT_METRIC_SETTINGS, type MetricGrant } from '@/lib/metrics'

// Sample data only. "Now" is a fixed afternoon in Vancouver, inside fiscal year 2026/27.
const NOW = new Date('2026-11-24T21:00:00Z')

let nextId = 1
function grant(overrides: Partial<MetricGrant> = {}): MetricGrant & { id: number } {
  return {
    id: nextId++,
    status: 'active',
    showOnDisplay: true,
    amountCents: 100_000_00,
    funder: 'Funder A',
    area: 'natural-products',
    startDate: '2026-05-01T12:00:00Z',
    endDate: '2028-03-31T12:00:00Z',
    completedAt: null,
    studentsInvolved: 2,
    partner: 'Partner A',
    ...overrides,
  }
}

describe('computeMetrics: active grants', () => {
  it('counts active grants, their funding and students', () => {
    const m = computeMetrics(
      [
        grant({ amountCents: 300_000_00, studentsInvolved: 4 }),
        grant({ amountCents: 150_000_00, studentsInvolved: 1 }),
        grant({ status: 'pending', amountCents: 999_000_00 }),
      ],
      NOW,
    )
    expect(m.glance.activeCount).toBe(2)
    expect(m.glance.activeFundingCents).toBe(450_000_00)
    expect(m.glance.studentsActive).toBe(5)
  })

  it('treats a missing amount or student count as zero', () => {
    const m = computeMetrics([grant({ amountCents: null, studentsInvolved: null })], NOW)
    expect(m.glance.activeFundingCents).toBe(0)
    expect(m.glance.studentsActive).toBe(0)
  })

  it('never counts hidden or archived grants', () => {
    const m = computeMetrics(
      [
        grant({ showOnDisplay: false }),
        grant({ showOnDisplay: null }),
        grant({ status: 'archived' }),
        grant({ status: 'completed', showOnDisplay: false, completedAt: '2026-06-01T20:00:00Z' }),
        grant(),
      ],
      NOW,
    )
    expect(m.glance.activeCount).toBe(1)
    expect(m.glance.completedThisFY).toBe(0)
    expect(m.completed.recent).toHaveLength(0)
  })

  it('groups active funding by funder, largest first', () => {
    const m = computeMetrics(
      [
        grant({ funder: 'Funder B', amountCents: 100 }),
        grant({ funder: 'Funder A', amountCents: 300 }),
        grant({ funder: 'Funder B', amountCents: 250 }),
        grant({ funder: null, amountCents: 50 }),
        grant({ funder: 'Funder C', status: 'completed', amountCents: 9_999 }),
      ],
      NOW,
    )
    expect(m.glance.fundingByFunder).toEqual([
      { funder: 'Funder B', cents: 350 },
      { funder: 'Funder A', cents: 300 },
      { funder: 'Unknown', cents: 50 },
    ])
  })
})

describe('computeMetrics: completed this fiscal year', () => {
  it('counts completions from April 1 onward, using Vancouver dates', () => {
    const m = computeMetrics(
      [
        // Mar 31 late evening in Vancouver (already Apr 1 in UTC): last fiscal year.
        grant({ status: 'completed', completedAt: '2026-04-01T06:30:00Z' }),
        // Apr 1 early morning in Vancouver: this fiscal year.
        grant({ status: 'completed', completedAt: '2026-04-01T08:30:00Z', studentsInvolved: 3, partner: 'Partner X' }),
        grant({ status: 'completed', completedAt: '2026-10-10T18:00:00Z', studentsInvolved: 1, partner: ' partner x ' }),
        grant({ status: 'completed', completedAt: '2026-11-01T18:00:00Z', studentsInvolved: 2, partner: 'Partner Y' }),
        // Completed status without a date can't be placed in a year.
        grant({ status: 'completed', completedAt: null }),
      ],
      NOW,
    )
    expect(m.fiscalYearLabel).toBe('2026/27')
    expect(m.glance.completedThisFY).toBe(3)
    expect(m.completed.countThisFY).toBe(3)
    expect(m.completed.studentsThisFY).toBe(6)
    // "Partner X" and " partner x " are the same partner.
    expect(m.completed.partnersThisFY).toBe(2)
  })

  it('lists the 3 most recent completions, newest first', () => {
    const grants = [
      grant({ status: 'completed', completedAt: '2026-05-01T18:00:00Z' }),
      grant({ status: 'completed', completedAt: '2026-09-01T18:00:00Z' }),
      grant({ status: 'completed', completedAt: '2025-12-01T18:00:00Z' }),
      grant({ status: 'completed', completedAt: '2026-11-01T18:00:00Z' }),
    ]
    const m = computeMetrics(grants, NOW)
    expect(m.completed.recent.map((g) => g.id)).toEqual([grants[3].id, grants[1].id, grants[0].id])
  })
})

describe('computeMetrics: ending in the next 90 days', () => {
  // Today is 2026-11-24 in Vancouver; 90 days on is 2027-02-22.
  it('includes today through 90 days from today', () => {
    const m = computeMetrics(
      [
        grant({ endDate: '2026-11-24T12:00:00Z' }), // today
        grant({ endDate: '2027-02-22T12:00:00Z' }), // day 90
        grant({ endDate: '2027-02-23T12:00:00Z' }), // day 91
        grant({ endDate: '2026-11-23T12:00:00Z' }), // yesterday
        grant({ endDate: null }),
        grant({ status: 'pending', endDate: '2026-12-01T12:00:00Z' }),
      ],
      NOW,
    )
    expect(m.glance.endingIn90Days).toBe(2)
  })
})

describe('computeMetrics: raised since 2016', () => {
  const grants = [
    grant({ amountCents: 100, startDate: '2015-12-31T12:00:00Z' }),
    grant({ amountCents: 200, startDate: '2016-01-01T12:00:00Z' }),
    grant({ amountCents: 400, status: 'completed', startDate: '2026-06-01T12:00:00Z', completedAt: '2026-10-01T18:00:00Z' }),
    grant({ amountCents: 800, status: 'pending', startDate: '2026-07-01T12:00:00Z' }),
  ]

  it('shows the baseline alone while its "as of" date is unknown', () => {
    const m = computeMetrics(grants, NOW, DEFAULT_METRIC_SETTINGS)
    expect(m.glance.raisedSince2016Cents).toBe(1_250_000_000)
  })

  it('adds awarded grants that started after the baseline date', () => {
    const m = computeMetrics(grants, NOW, { ...DEFAULT_METRIC_SETTINGS, baselineAsOf: '2026-05-15T12:00:00Z' })
    expect(m.glance.raisedSince2016Cents).toBe(1_250_000_000 + 400)
  })

  it('sums awarded grants from 2016 on when the baseline is off', () => {
    const m = computeMetrics(grants, NOW, { ...DEFAULT_METRIC_SETTINGS, useBaseline: false })
    expect(m.glance.raisedSince2016Cents).toBe(200 + 400)
  })
})

describe('computeMetrics: funding by area', () => {
  it('lists all three areas with shares that add up to 1', () => {
    const m = computeMetrics(
      [
        grant({ area: 'natural-products', amountCents: 500, funder: 'Funder A' }),
        grant({ area: 'natural-products', amountCents: 200, funder: 'Funder B' }),
        grant({ area: 'natural-products', amountCents: 400, funder: 'Funder B' }),
        grant({ area: 'data-analytics', amountCents: 300, funder: 'Funder C' }),
        grant({ area: 'social-innovation', status: 'completed', amountCents: 1_000 }),
      ],
      NOW,
    )
    expect(m.areas.map((a) => a.area)).toEqual(['natural-products', 'data-analytics', 'social-innovation'])
    expect(m.areas[0]).toMatchObject({ cents: 1_100, activeCount: 3, largestFunder: 'Funder B' })
    expect(m.areas[2]).toMatchObject({ cents: 0, share: 0, activeCount: 0, largestFunder: null })
    expect(m.areas.reduce((s, a) => s + a.share, 0)).toBeCloseTo(1, 10)
  })

  it('reports zero shares when there is no active funding', () => {
    const m = computeMetrics([], NOW)
    expect(m.areas.every((a) => a.share === 0)).toBe(true)
    expect(m.glance.fundingByFunder).toEqual([])
  })
})
