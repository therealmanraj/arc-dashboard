import type { GrantArea, GrantStatus } from './grants'
import { computeMetrics, DEFAULT_METRIC_SETTINGS, type MetricGrant, type MetricSettings, type Metrics } from './metrics'

/** A grant as the display feed reads it (Payload record with `funder` populated). */
export type FeedSourceGrant = {
  id: number
  title: string
  shortDescription?: string | null
  funder?: { name: string } | number | null
  area: GrantArea
  status: GrantStatus
  showOnDisplay?: boolean | null
  amountCents?: number | null
  startDate?: string | null
  endDate?: string | null
  completedAt?: string | null
  studentsInvolved?: number | null
  partner?: string | null
  hidePartnerOnDisplay?: boolean | null
  outcomeHighlight?: string | null
}

/** A grant as the TV receives it: display-safe fields only. */
export type DisplayGrant = {
  id: number
  title: string
  shortDescription: string | null
  funder: string | null
  area: GrantArea
  endDate: string | null
  /** Null when the grant hides its partner on the TV. */
  partner: string | null
  outcomeHighlight: string | null
  completedAt: string | null
}

export type DisplayFeed = {
  generatedAt: string
  fiscalYearLabel: string
  glance: Metrics<MetricGrant>['glance']
  /** Active grants, ending soonest first. The TV pages them 6 at a time. */
  activeGrants: DisplayGrant[]
}

function funderName(funder: FeedSourceGrant['funder']): string | null {
  return funder && typeof funder === 'object' ? funder.name : null
}

function toDisplayGrant(g: FeedSourceGrant): DisplayGrant {
  return {
    id: g.id,
    title: g.title,
    shortDescription: g.shortDescription || null,
    funder: funderName(g.funder),
    area: g.area,
    endDate: g.endDate ?? null,
    partner: g.hidePartnerOnDisplay ? null : g.partner || null,
    outcomeHighlight: g.outcomeHighlight || null,
    completedAt: g.completedAt ?? null,
  }
}

/** Soonest end date first; grants without one go last; then by title. */
function byEndDate(a: FeedSourceGrant, b: FeedSourceGrant): number {
  if (a.endDate && b.endDate && a.endDate !== b.endDate) return a.endDate < b.endDate ? -1 : 1
  if (a.endDate && !b.endDate) return -1
  if (!a.endDate && b.endDate) return 1
  return a.title.localeCompare(b.title)
}

/**
 * Builds the display feed from grant records. The route already filters in the query;
 * this filters again so a hidden or archived grant can never reach the TV.
 */
export function buildDisplayFeed(
  grants: FeedSourceGrant[],
  now: Date,
  settings: MetricSettings = DEFAULT_METRIC_SETTINGS,
): DisplayFeed {
  const visible = grants.filter((g) => g.showOnDisplay === true && g.status !== 'archived')
  const metrics = computeMetrics(
    visible.map((g) => ({ ...g, funder: funderName(g.funder) })),
    now,
    settings,
  )

  return {
    generatedAt: now.toISOString(),
    fiscalYearLabel: metrics.fiscalYearLabel,
    glance: metrics.glance,
    activeGrants: visible
      .filter((g) => g.status === 'active')
      .sort(byEndDate)
      .map(toDisplayGrant),
  }
}
