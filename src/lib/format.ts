export const DISPLAY_TIME_ZONE = 'America/Vancouver'
const LOCALE = 'en-CA'

const dateFormat = new Intl.DateTimeFormat(LOCALE, {
  timeZone: DISPLAY_TIME_ZONE,
  weekday: 'long',
  month: 'long',
  day: 'numeric',
})

const timeFormat = new Intl.DateTimeFormat(LOCALE, {
  timeZone: DISPLAY_TIME_ZONE,
  hour: 'numeric',
  minute: '2-digit',
})

/** TV footer date and time in Vancouver, e.g. "Thursday, November 19 · 3:24 p.m." */
export function formatDisplayDateTime(date: Date): string {
  return `${dateFormat.format(date)} · ${timeFormat.format(date)}`
}
