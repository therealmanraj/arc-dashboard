import { describe, expect, it } from 'vitest'

import { buildDisplayFeed, type FeedSourceGrant } from '@/lib/displayFeed'

// Sample data only.
const NOW = new Date('2026-11-24T21:00:00Z')

let nextId = 1
function grant(overrides: Partial<FeedSourceGrant> = {}): FeedSourceGrant {
  return {
    id: nextId++,
    title: 'Sample grant',
    shortDescription: 'A sample description.',
    funder: { name: 'Funder A' },
    area: 'data-analytics',
    status: 'active',
    showOnDisplay: true,
    amountCents: 1_000,
    startDate: '2026-05-01T12:00:00Z',
    endDate: '2027-06-30T12:00:00Z',
    completedAt: null,
    studentsInvolved: 1,
    partner: 'Partner A',
    hidePartnerOnDisplay: false,
    outcomeHighlight: null,
    ...overrides,
  }
}

describe('buildDisplayFeed', () => {
  it('never includes hidden or archived grants, even if the query let them through', () => {
    const feed = buildDisplayFeed(
      [
        grant({ title: 'Shown' }),
        grant({ title: 'Hidden', showOnDisplay: false }),
        grant({ title: 'Blank flag', showOnDisplay: null }),
        grant({ title: 'Archived', status: 'archived' }),
      ],
      NOW,
    )
    expect(feed.activeGrants.map((g) => g.title)).toEqual(['Shown'])
    expect(feed.glance.activeCount).toBe(1)
    expect(JSON.stringify(feed)).not.toMatch(/Hidden|Blank flag|Archived/)
  })

  it('drops the partner name when the grant hides it', () => {
    const feed = buildDisplayFeed(
      [grant({ partner: 'Secret Partner', hidePartnerOnDisplay: true }), grant({ partner: 'Open Partner' })],
      NOW,
    )
    expect(feed.activeGrants.map((g) => g.partner)).toEqual([null, 'Open Partner'])
    expect(JSON.stringify(feed)).not.toContain('Secret Partner')
  })

  it('sends only display-safe fields', () => {
    const [g] = buildDisplayFeed([grant({ amountCents: 123_456 })], NOW).activeGrants
    expect(Object.keys(g).sort()).toEqual(
      ['area', 'completedAt', 'endDate', 'funder', 'id', 'outcomeHighlight', 'partner', 'shortDescription', 'title'].sort(),
    )
  })

  it('lists only active grants, ending soonest first, undated last', () => {
    const feed = buildDisplayFeed(
      [
        grant({ title: 'Later', endDate: '2028-01-01T12:00:00Z' }),
        grant({ title: 'No end date', endDate: null }),
        grant({ title: 'Sooner', endDate: '2027-01-15T12:00:00Z' }),
        grant({ title: 'Done', status: 'completed', completedAt: '2026-10-01T18:00:00Z' }),
      ],
      NOW,
    )
    expect(feed.activeGrants.map((g) => g.title)).toEqual(['Sooner', 'Later', 'No end date'])
  })

  it('uses the populated funder name, and copes with an unpopulated one', () => {
    const feed = buildDisplayFeed([grant({ funder: { name: 'Funder Z' } }), grant({ funder: 42 })], NOW)
    expect(feed.activeGrants.map((g) => g.funder)).toEqual(['Funder Z', null])
    expect(feed.glance.fundingByFunder.map((f) => f.funder)).toEqual(['Funder Z', 'Unknown'])
  })

  it('stamps the time and fiscal year', () => {
    const feed = buildDisplayFeed([], NOW)
    expect(feed.generatedAt).toBe('2026-11-24T21:00:00.000Z')
    expect(feed.fiscalYearLabel).toBe('2026/27')
    expect(feed.activeGrants).toEqual([])
  })
})
