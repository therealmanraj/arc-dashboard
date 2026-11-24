import { DISPLAY_TIME_ZONE } from './format'

/**
 * A calendar day as "YYYY-MM-DD". Keys compare correctly as strings, so date logic
 * works on Vancouver calendar days instead of UTC instants.
 */
export type DateKey = string

const keyFormatters = new Map<string, Intl.DateTimeFormat>()

function keyFormatter(timeZone: string): Intl.DateTimeFormat {
  let formatter = keyFormatters.get(timeZone)
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
    keyFormatters.set(timeZone, formatter)
  }
  return formatter
}

/** The calendar day an instant falls on in the given time zone (Vancouver by default). */
export function toDateKey(value: Date | string, timeZone: string = DISPLAY_TIME_ZONE): DateKey {
  const parts = keyFormatter(timeZone).formatToParts(new Date(value))
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? ''
  return `${get('year')}-${get('month')}-${get('day')}`
}

/** The day `days` after (or before, if negative) a date key. */
export function addDays(key: DateKey, days: number): DateKey {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10)
}

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

export type FiscalYear = {
  /** Calendar year the fiscal year starts in, e.g. 2026 for April 2026 to March 2027. */
  startYear: number
  /** First day, inclusive. */
  start: DateKey
  /** First day of the next fiscal year, exclusive. */
  end: DateKey
  /** "2026/27" */
  label: string
}

/**
 * The fiscal year containing `now`, in Vancouver time. Langara's runs April 1 to March 31,
 * so `startMonth` defaults to 4.
 */
export function fiscalYearOf(
  now: Date,
  startMonth = 4,
  timeZone: string = DISPLAY_TIME_ZONE,
): FiscalYear {
  const today = toDateKey(now, timeZone)
  const year = Number(today.slice(0, 4))
  const month = Number(today.slice(5, 7))
  const startYear = month >= startMonth ? year : year - 1
  const start = `${startYear}-${pad2(startMonth)}-01`
  const end = `${startYear + 1}-${pad2(startMonth)}-01`
  const label =
    startMonth === 1 ? String(startYear) : `${startYear}/${String(startYear + 1).slice(-2)}`
  return { startYear, start, end, label }
}

/** True when the day falls inside the fiscal year. */
export function isInFiscalYear(key: DateKey, fy: FiscalYear): boolean {
  return key >= fy.start && key < fy.end
}
