import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const data = JSON.parse(readFileSync(new URL('../src/datesheet.json', import.meta.url), 'utf8'))
const range = (prefix, count) => Array.from({ length: count }, (_, index) => prefix + (index + 1))
const poolA = [...range('C', 21), ...range('I', 15), ...range('E', 6)]
const poolB = [
  ...range('CST', 9), ...range('C(AIML)', 9), ...range('E(VLSI)', 3), ...range('EE', 4),
  ...range('ME', 4), 'EE4/ME4',
]
const slotOrder = ['FN', 'N', 'AN']

test('every code in the group legend and the shared table label is represented', () => {
  assert.equal(poolA.length + poolB.length, 72)
  assert.deepEqual(Object.keys(data.groups).sort(), [...poolA, ...poolB].sort())
  for (const code of poolA) {
    assert.deepEqual(data.groups[code].exams.map(exam => exam.course).sort(),
      ['electrical', 'environmental', 'graphics', 'physics', 'problem-solving'])
  }
  for (const code of poolB) {
    assert.deepEqual(data.groups[code].exams.map(exam => exam.course).sort(),
      ['applied-physics', 'environmental', 'graphics', 'programming-c'])
  }
})

test('all 330 cells match the verified first-semester workbook schedule', () => {
  const rows = Object.entries(data.groups).flatMap(([code, { exams }]) =>
    exams.map(({ course, date, slot, venue }) => [code, course, date, slot, venue].join('|')),
  )
  assert.equal(rows.length, 330)
  assert.equal(new Set(rows).size, 330)
  // Canonical group|course|date|slot|venue rows verified against C8:Z28 and the merged room cells.
  const fingerprint = createHash('sha256').update(rows.sort().join('\n')).digest('hex')
  assert.equal(fingerprint, '2b6ce17dfc69403cf6a05d203457726660a7f5859b1ac704534b8fd9f5fc6bab')
})

test('printed times, title and course codes are preserved verbatim', () => {
  assert.deepEqual(data.slots, {
    FN: { start: '09:00', end: '11:30' },
    N: { start: '11:30', end: '14:00' },
    AN: { start: '14:00', end: '16:30' },
  })
  assert.equal(data.source.reportingTime, null)
  assert.match(data.source.title, /Final Date Sheet/)
  assert.equal(data.source.sheet, 'ETP Datesheet 1st sem ')
  assert.equal(data.source.range, 'A1:AA36')
  assert.deepEqual(Object.values(data.courses).map(({ name, code }) => `${name} (${code})`), [
    'Engineering Physics Lab (ICT-111P)',
    'Applied Physics Lab (BS-151)',
    'Engineering Graphics-I Lab (ICT-123P/ES-157)',
    'Basics of Electrical Engineering Lab (ICT-103P)',
    'Programming of Problem Solving Lab (ICT-101P)',
    'Programming in "C" Lab (ES-153)',
    'Environmental Studies Lab (ICT117P/BS-161)',
  ])
})

test('all dates, weekdays and printed slot totals agree and groups are sorted', () => {
  const weekday = new Intl.DateTimeFormat('en-GB', { weekday: 'long', timeZone: 'UTC' })
  const dates = [
    '2026-11-26', '2026-11-27', '2026-11-30', '2026-12-01',
    '2026-12-02', '2026-12-03', '2026-12-04', '2026-12-05',
  ]
  assert.deepEqual(Object.keys(data.dates), dates)
  const allExams = Object.values(data.groups).flatMap(group => group.exams)
  const expectedTotals = [15, 15, 15, 15, 14, 12, 12, 12]
  for (const [index, date] of dates.entries()) {
    assert.equal(data.dates[date], weekday.format(new Date(date + 'T00:00Z')))
    for (const slot of slotOrder) {
      assert.equal(allExams.filter(exam => exam.date === date && exam.slot === slot).length, expectedTotals[index])
    }
  }
  for (const { exams } of Object.values(data.groups)) {
    const sequence = exams.map(exam => exam.date + slotOrder.indexOf(exam.slot))
    assert.deepEqual(sequence, [...sequence].sort())
  }
})

test('the only overlapping cells are the three conflicts in the final workbook', () => {
  const overlaps = []
  for (const [code, { exams }] of Object.entries(data.groups)) {
    for (let index = 1; index < exams.length; index++) {
      const before = exams[index - 1]
      const after = exams[index]
      if (before.date === after.date && before.slot === after.slot) {
        overlaps.push([code, before.date, before.slot, [before.course, after.course].sort()])
      }
    }
  }
  assert.deepEqual(overlaps, slotOrder.map((slot, index) =>
    ['E' + (index + 1), '2026-12-04', slot, ['graphics', 'physics']],
  ))
})

test('similar group codes and the three EE4/ME4 variants have distinct slots', () => {
  assert.deepEqual(data.groups.C12.exams[0], {
    course: 'graphics', date: '2026-11-26', slot: 'AN', venue: '312',
  })
  assert.deepEqual(data.groups.I12.exams[0], {
    course: 'electrical', date: '2026-11-26', slot: 'AN', venue: '524',
  })
  for (const [group, slot] of [['EE4', 'FN'], ['EE4/ME4', 'N'], ['ME4', 'AN']]) {
    assert.deepEqual(data.groups[group].exams.map(exam => exam.slot), Array(4).fill(slot))
  }
})

test('the linked PDF contains the verified first-semester workbook rendering', () => {
  const pdf = readFileSync(new URL('../public/' + data.source.file, import.meta.url))
  assert.equal(pdf.subarray(0, 5).toString(), '%PDF-')
  assert.equal(createHash('sha256').update(pdf).digest('hex'),
    'f823dce86296591d52cf71f80705ddd288ce9da5ceafc6c47707feaa413c177b')
})
