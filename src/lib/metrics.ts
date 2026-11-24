import { addDays, fiscalYearOf, isInFiscalYear, toDateKey, type DateKey } from './fiscalYear'
import { GRANT_AREAS, type GrantArea, type GrantStatus } from './grants'

/** The grant fields metrics need. The feed maps Payload records to this shape. */
export type MetricGrant = {
  status: GrantStatus
  showOnDisplay?: boolean | null
  amountCents?: number | null
  /** Funder name. */
  funder?: string | null
  area: GrantArea
  startDate?: string | null
  endDate?: string | null
  completedAt?: string | null
  studentsInvolved?: number | null
  partner?: string | null
}

export type MetricSettings = {
  fiscalYearStartMonth: number
  raisedSince2016BaselineCents: number
  /** When the baseline figure was reported. Unknown for now (open question in the spec). */
  baselineAsOf: string | null
  useBaseline: boolean
}

/** Defaults from docs/data-model.md, until the app-settings global exists. */
export const DEFAULT_METRIC_SETTINGS: MetricSettings = {
  fiscalYearStartMonth: 4,
  raisedSince2016BaselineCents: 1_250_000_000,
  baselineAsOf: null,
  useBaseline: true,
}

export type FunderTotal = { funder: string; cents: number }

export type AreaMetric = {
  area: GrantArea
  cents: number
  /** Share of active funding, 0 to 1. */
  share: number
  activeCount: number
  largestFunder: string | null
}

export type Metrics<G extends MetricGrant> = {
  fiscalYearLabel: string
  glance: {
    activeCount: number
    activeFundingCents: number
    completedThisFY: number
    studentsActive: number
    fundingByFunder: FunderTotal[]
    raisedSince2016Cents: number
    endingIn90Days: number
  }
  completed: {
    countThisFY: number
    studentsThisFY: number
    partnersThisFY: number
    /** The 3 most recently completed grants, newest first. */
    recent: G[]
  }
  areas: AreaMetric[]
}

const UNKNOWN_FUNDER = 'Unknown'
const RAISED_SINCE: DateKey = '2016-01-01'
const ENDING_SOON_DAYS = 90

const cents = (g: MetricGrant) => g.amountCents ?? 0
const sum = (values: number[]) => values.reduce((a, b) => a + b, 0)

/** Totals per funder, largest first (ties by name). */
function totalsByFunder(grants: MetricGrant[]): FunderTotal[] {
  const totals = new Map<string, number>()
  for (const g of grants) {
    const funder = g.funder || UNKNOWN_FUNDER
    totals.set(funder, (totals.get(funder) ?? 0) + cents(g))
  }
  return [...totals]
    .map(([funder, c]) => ({ funder, cents: c }))
    .sort((a, b) => b.cents - a.cents || a.funder.localeCompare(b.funder))
}

/**
 * Every number on the TV, calculated from grant records (CLAUDE.md: grants are the source of truth).
 * Only grants with `showOnDisplay` set and not archived are counted.
 */
export function computeMetrics<G extends MetricGrant>(
  allGrants: G[],
  now: Date,
  settings: MetricSettings = DEFAULT_METRIC_SETTINGS,
): Metrics<G> {
  const grants = allGrants.filter((g) => g.showOnDisplay === true && g.status !== 'archived')
  const fy = fiscalYearOf(now, settings.fiscalYearStartMonth)
  const today = toDateKey(now)
  const soon = addDays(today, ENDING_SOON_DAYS)

  const active = grants.filter((g) => g.status === 'active')
  const completedThisFY = grants.filter(
    (g) => g.status === 'completed' && g.completedAt && isInFiscalYear(toDateKey(g.completedAt), fy),
  )
  const activeFundingCents = sum(active.map(cents))

  const endingIn90Days = active.filter((g) => {
    if (!g.endDate) return false
    const end = toDateKey(g.endDate)
    return end >= today && end <= soon
  }).length

  // Money raised: awarded grants only (active or completed), never pending ones.
  const awarded = grants.filter((g) => g.status === 'active' || g.status === 'completed')
  let raisedSince2016Cents: number
  if (settings.useBaseline) {
    const asOf = settings.baselineAsOf ? toDateKey(settings.baselineAsOf) : null
    // Until we know when the baseline was reported, nothing is added to it.
    const added = asOf
      ? awarded.filter((g) => g.startDate && toDateKey(g.startDate) > asOf)
      : []
    raisedSince2016Cents = settings.raisedSince2016BaselineCents + sum(added.map(cents))
  } else {
    raisedSince2016Cents = sum(
      awarded.filter((g) => g.startDate && toDateKey(g.startDate) >= RAISED_SINCE).map(cents),
    )
  }

  const areas: AreaMetric[] = GRANT_AREAS.map((area) => {
    const inArea = active.filter((g) => g.area === area)
    const areaCents = sum(inArea.map(cents))
    return {
      area,
      cents: areaCents,
      share: activeFundingCents > 0 ? areaCents / activeFundingCents : 0,
      activeCount: inArea.length,
      largestFunder: totalsByFunder(inArea)[0]?.funder ?? null,
    }
  })

  const partners = new Set(
    completedThisFY.map((g) => g.partner?.trim().toLowerCase()).filter((p): p is string => Boolean(p)),
  )

  const recent = grants
    .filter((g) => g.status === 'completed' && g.completedAt)
    .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())
    .slice(0, 3)

  return {
    fiscalYearLabel: fy.label,
    glance: {
      activeCount: active.length,
      activeFundingCents,
      completedThisFY: completedThisFY.length,
      studentsActive: sum(active.map((g) => g.studentsInvolved ?? 0)),
      fundingByFunder: totalsByFunder(active),
      raisedSince2016Cents,
      endingIn90Days,
    },
    completed: {
      countThisFY: completedThisFY.length,
      studentsThisFY: sum(completedThisFY.map((g) => g.studentsInvolved ?? 0)),
      partnersThisFY: partners.size,
      recent,
    },
    areas,
  }
}
