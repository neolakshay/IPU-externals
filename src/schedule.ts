import datesheet from './datesheet.json'

export interface Exam {
  course: string
  date: string
  slot: string
  venue: string | null
}

interface Group {
  branch: string
  exams: Exam[]
}

export const groups: Record<string, Group> = datesheet.groups
export const groupCodes = Object.keys(groups).sort(
  new Intl.Collator('en', { numeric: true, ignorePunctuation: true }).compare,
)
export const courses: Record<string, { name: string; code: string }> = datesheet.courses
export const weekdays: Record<string, string> = datesheet.dates
export const slots: Record<string, { start: string; end: string }> = datesheet.slots
export const sharedGroup = 'EE4/ME4'
export const source = datesheet.source
export const sourceUrl = import.meta.env.BASE_URL + source.file

const dateFormat = new Intl.DateTimeFormat('en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' })
const timeFormat = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' })

export function normaliseGroup(value: string) {
  return value.replace(/\s/g, '').toUpperCase()
}

export function knownGroup(code: string) {
  return Object.hasOwn(groups, code)
}

export function formatMonthYear(date: string) {
  return dateFormat.format(new Date(date + 'T00:00Z'))
}

export function formatTime(slot: string) {
  const time = slots[slot]
  if (!time) return 'Not specified'
  const start = timeFormat.format(new Date('2000-01-01T' + time.start + 'Z'))
  const end = timeFormat.format(new Date('2000-01-01T' + time.end + 'Z'))
  return start + ' – ' + end
}
