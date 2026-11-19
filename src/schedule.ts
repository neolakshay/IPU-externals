import datesheet from './datesheet.json'
import semesterThree from './datesheet-semester-3.json'
import semesterFive from './datesheet-semester-5.json'

export interface Exam {
  course: string
  date: string
  slot: string
  venue: string | null
  sourceRow?: number
}

interface Group {
  branch: string
  exams: Exam[]
}

export interface Datesheet {
  groups: Record<string, Group>
  courses: Record<string, { name: string; code: string }>
  dates: Record<string, string>
  slots: Record<string, { start: string; end: string }>
  aliases?: Record<string, string>
  source: { file: string; page?: number; instruction?: string }
}

export const semesters = ['1', '3', '5'] as const
export type Semester = typeof semesters[number]
export const schedules: Record<Semester, Datesheet> = {
  '1': datesheet,
  '3': semesterThree,
  '5': semesterFive,
}

export function knownSemester(value: string): value is Semester {
  return Object.hasOwn(schedules, value)
}

export function groupCodesFor(semester: Semester) {
  return Object.keys(schedules[semester].groups).sort(
    new Intl.Collator('en', { numeric: true, ignorePunctuation: true }).compare,
  )
}

export const sharedGroup = 'EE4/ME4'

export function sourceUrlFor(semester: Semester) {
  const source = schedules[semester].source
  const page = source.page ? '#page=' + source.page : ''
  return import.meta.env.BASE_URL + source.file + page
}

const dateFormat = new Intl.DateTimeFormat('en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' })
const timeFormat = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' })

export function normaliseGroup(value: string, semester: Semester = '1') {
  const code = value.replace(/\s/g, '').toUpperCase()
  return schedules[semester].aliases?.[code] ?? code
}

export function knownGroup(code: string, semester: Semester = '1') {
  return Object.hasOwn(schedules[semester].groups, code)
}

export function formatMonthYear(date: string) {
  return dateFormat.format(new Date(date + 'T00:00Z'))
}

export function formatTime(slot: string, semester: Semester = '1') {
  const time = schedules[semester].slots[slot]
  if (!time) return 'Not specified'
  const start = timeFormat.format(new Date('2000-01-01T' + time.start + 'Z'))
  const end = timeFormat.format(new Date('2000-01-01T' + time.end + 'Z'))
  return start + ' – ' + end
}
