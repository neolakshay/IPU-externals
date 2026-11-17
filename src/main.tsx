import { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  ArrowUpRight, CalendarCheck, CalendarDays, Check, Clock3, FileText, Info, Link2, MapPin, Moon, Sun,
} from 'lucide-react'
import '@fontsource-variable/dm-sans/wght.css'
import { GroupPicker } from './GroupPicker'
import {
  courses, formatMonthYear, formatTime, groups, knownGroup, normaliseGroup, relatedGroups,
  sharedGroup, sourceUrl, weekdays,
} from './schedule'
import type { Exam } from './schedule'
import './style.css'

const groupKey = 'external-lookup:group'
const themeKey = 'external-lookup:theme'
const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
const announcements = 'https://www.mait.ac.in/'
const reportIssueUrl = 'https://github.com/neolakshay/externals-lookup/issues/new'
type Theme = 'light' | 'dark'

function stored(key: string) {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function remember(key: string, value: string) {
  try {
    if (value) window.localStorage.setItem(key, value)
    else window.localStorage.removeItem(key)
  } catch {
    // The lookup remains usable when storage is unavailable.
  }
}

function currentGroup(useSaved = false) {
  const query = new URLSearchParams(window.location.search).get('group')
  const code = normaliseGroup(query ?? (useSaved ? stored(groupKey) ?? '' : ''))
  if (knownGroup(code)) return { code, invalid: false }
  return { code: '', invalid: query !== null }
}

function initialTheme(): Theme {
  const preferred = stored(themeKey)
  if (preferred === 'dark' || preferred === 'light') return preferred
  return systemTheme.matches ? 'dark' : 'light'
}

function groupUrl(code: string) {
  const url = new URL(window.location.href)
  if (code) url.searchParams.set('group', code)
  else url.searchParams.delete('group')
  return url
}

function ExamCard({ exam, shared }: { exam: Exam; shared?: Exam }) {
  const course = courses[exam.course]
  const fullDate = `${weekdays[exam.date]}, ${Number(exam.date.slice(-2))} ${formatMonthYear(exam.date)}`
  return (
    <li className="exam-card">
      <time className="date-tile" dateTime={exam.date}>
        <span className="sr-only">{fullDate}</span>
        <span aria-hidden="true" className="date-day">{exam.date.slice(-2)}</span>
        <span aria-hidden="true" className="date-month">{formatMonthYear(exam.date)}</span>
      </time>
      <div className="exam-details">
        <p className="exam-weekday">{weekdays[exam.date]}</p>
        <h3>{course.name}</h3>
        <div className="exam-meta">
          <span><Clock3 size={15} aria-hidden="true" /> <span>{formatTime(exam.slot)}</span></span>
          <span><MapPin size={15} aria-hidden="true" /> <span>{exam.venue ? `Room ${exam.venue}` : 'Room not specified'}</span></span>
        </div>
        {shared && (
          <p className="shared-time">
            Also listed as <strong>{sharedGroup}</strong> at {formatTime(shared.slot)}
          </p>
        )}
      </div>
      <span className="course-code" aria-label={`Course code ${course.code}`}>{course.code}</span>
    </li>
  )
}

function App() {
  const [selection, setSelection] = useState(() => currentGroup(true))
  const [theme, setTheme] = useState(initialTheme)
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'manual'>('idle')
  const code = selection.code
  const group = code ? groups[code] : undefined
  const sharedExams = relatedGroups.includes(code) ? groups[sharedGroup].exams : []
  const clash = group?.exams.find((exam, index, exams) => {
    const next = exams[index + 1]
    return next?.date === exam.date && next.slot === exam.slot
  })

  useEffect(() => {
    const initial = currentGroup(true)
    if (initial.code) {
      remember(groupKey, initial.code)
      if (!new URLSearchParams(window.location.search).has('group')) {
        window.history.replaceState(null, '', groupUrl(initial.code))
      }
    }

    function followHistory() {
      const next = currentGroup()
      if (!next.invalid) remember(groupKey, next.code)
      setSelection(next)
      setCopyStatus('idle')
    }

    window.addEventListener('popstate', followHistory)
    return () => window.removeEventListener('popstate', followHistory)
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  useEffect(() => {
    function followSystem() {
      if (!stored(themeKey)) setTheme(initialTheme())
    }

    systemTheme.addEventListener('change', followSystem)
    return () => systemTheme.removeEventListener('change', followSystem)
  }, [])

  function select(next: string) {
    setSelection({ code: next, invalid: false })
    setCopyStatus('idle')
    remember(groupKey, next)
    const url = groupUrl(next)
    if (url.href !== window.location.href) window.history.pushState(null, '', url)
  }

  function toggleTheme() {
    const next = theme === 'light' ? 'dark' : 'light'
    remember(themeKey, next)
    setTheme(next)
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(groupUrl(code).href)
      setCopyStatus('copied')
    } catch {
      setCopyStatus('manual')
    }
  }

  return (
    <>
      <header className="top-bar">
        <div className="container top-bar-inner">
          <div className="brand">
            <span className="brand-icon"><CalendarCheck size={21} aria-hidden="true" /></span>
            <span>MAIT <span className="brand-divider" aria-hidden="true">/</span> <span className="university">GGSIPU</span></span>
          </div>
          <button className="theme-button" type="button" onClick={toggleTheme}>
            {theme === 'light' ? <Moon size={17} aria-hidden="true" /> : <Sun size={17} aria-hidden="true" />}
            <span>{theme === 'light' ? 'Dark mode' : 'Light mode'}</span>
          </button>
        </div>
      </header>

      <main className="container">
        <div className="hero">
          <div>
            <p className="kicker">B.Tech first semester <span aria-hidden="true">·</span> 2026–27</p>
            <h1>External Practical Lookup</h1>
            <p className="subtitle">Find your end-term practical exam dates, times and rooms by group.</p>
          </div>
          <div className="exam-period">
            <CalendarDays size={19} aria-hidden="true" />
            <span>26 Nov – 5 Dec 2026</span>
          </div>
        </div>

        <div className="layout">
          <aside className="lookup" aria-label="Group lookup">
            <div className="picker-card">
              <GroupPicker selected={code} onSelect={select} />
            </div>
            <p className="notice draft-notice">
              <Info size={19} aria-hidden="true" />
              <span><strong>Draft datesheet.</strong> MAIT may update these exam dates, times, and rooms.</span>
            </p>
            <div className="lookup-links">
              <a className="source-link" href={sourceUrl} target="_blank" rel="noreferrer">
                <FileText size={17} aria-hidden="true" /> View datesheet PDF <ArrowUpRight size={14} aria-hidden="true" />
              </a>
            </div>
          </aside>

          <section className="schedule" aria-labelledby="schedule-heading">
            <div className="schedule-heading">
              <div>
                <h2 id="schedule-heading">{code ? `Group ${code}` : 'Practical schedule'}</h2>
                {group && (
                  <p>{group.branch} <span aria-hidden="true">·</span>{' '}
                    {group.branch === 'CSE-II' && <>2nd shift <span aria-hidden="true">·</span>{' '}</>}
                    {group.exams.length} practicals</p>
                )}
              </div>
              {group && (
                <button className="copy-button" type="button" onClick={copyLink}>
                  {copyStatus === 'copied' ? <Check size={17} aria-hidden="true" /> : <Link2 size={17} aria-hidden="true" />}
                  {copyStatus === 'copied' ? 'Link copied' : 'Copy link'}
                </button>
              )}
            </div>
            <div className="sr-only" role="status">
              {group ? `Showing ${group.exams.length} practicals for group ${code}.` : ''}
              {copyStatus === 'copied' ? ' Group link copied.' : ''}
            </div>
            {copyStatus === 'manual' && group && (
              <label className="manual-share">
                Copy this group link
                <input type="text" readOnly value={groupUrl(code).href} onFocus={event => event.target.select()} />
              </label>
            )}
            {group ? (
              <>
                {(sharedExams.length > 0 || code === sharedGroup) && (
                  <p className="notice">
                    <Info size={19} aria-hidden="true" />
                    <span>MAIT lists separate EE4 and ME4 slots and a shared EE4/ME4 slot. Confirm your slot with MAIT.</span>
                  </p>
                )}
                {clash && (
                  <p className="notice">
                    <Info size={19} aria-hidden="true" />
                    <span>
                      <strong>Unconfirmed exam times on {Number(clash.date.slice(-2))} {formatMonthYear(clash.date)}.</strong>{' '}
                      MAIT’s draft lists both labs at {formatTime(clash.slot)}. Confirm your times with MAIT.
                    </span>
                  </p>
                )}
                <ul className="exam-list">
                  {group.exams.map(exam => (
                    <ExamCard key={exam.course} exam={exam} shared={sharedExams.find(other => other.course === exam.course)} />
                  ))}
                </ul>
              </>
            ) : (
              <div className="empty-state">
                <div className="empty-icon"><CalendarDays size={27} aria-hidden="true" /></div>
                {selection.invalid ? (
                  <p role="status"><strong>Group not found.</strong> Select a valid group above to view its schedule.</p>
                ) : (
                  <p>Select your group above to view your external practical examination schedule.</p>
                )}
              </div>
            )}
          </section>
        </div>
      </main>

      <footer className="container footer">
        <span>MAIT draft datesheet · Academic session 2026–27</span>
        <a href={announcements} target="_blank" rel="noreferrer">
          Check MAIT announcements for changes <ArrowUpRight size={15} aria-hidden="true" />
        </a>
        <a href={reportIssueUrl} target="_blank" rel="noreferrer">Report an issue on GitHub</a>
      </footer>
    </>
  )
}

createRoot(document.getElementById('root')!).render(<App />)
