export const GRANT_STATUSES = ['pending', 'active', 'completed', 'archived'] as const
export type GrantStatus = (typeof GRANT_STATUSES)[number]

export const GRANT_AREAS = ['natural-products', 'data-analytics', 'social-innovation'] as const
export type GrantArea = (typeof GRANT_AREAS)[number]

export const GRANT_SOURCES = ['manual', 'excel', 'dynamics365'] as const
export type GrantSource = (typeof GRANT_SOURCES)[number]

type DateInput = string | Date | null | undefined

function toTime(value: DateInput): number | null {
  if (value === null || value === undefined || value === '') return null
  const time = new Date(value).getTime()
  return Number.isNaN(time) ? null : time
}

/** An end date is valid when either date is missing, or it falls after the start date. */
export function isEndAfterStart(startDate: DateInput, endDate: DateInput): boolean {
  const start = toTime(startDate)
  const end = toTime(endDate)
  if (start === null || end === null) return true
  return end > start
}

/**
 * The `completedAt` a grant should have after a change.
 * Set to `now` when the status becomes completed; kept while it stays completed;
 * cleared when it moves to any other status.
 */
export function nextCompletedAt(args: {
  previousStatus: GrantStatus | null | undefined
  nextStatus: GrantStatus | null | undefined
  previousCompletedAt: string | null | undefined
  now: Date
}): string | null {
  const { previousStatus, nextStatus, previousCompletedAt, now } = args
  if (nextStatus !== 'completed') return null
  if (previousStatus === 'completed' && previousCompletedAt) return previousCompletedAt
  return now.toISOString()
}
