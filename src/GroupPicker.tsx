import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { ChevronDown, Search, X } from 'lucide-react'
import { groupCodesFor, schedules, knownGroup, normaliseGroup, sharedGroup } from './schedule'
import type { Semester } from './schedule'

export function GroupPicker({ semester, selected, onSelect }: { semester: Semester; selected: string; onSelect: (code: string) => void }) {
  const [input, setInput] = useState(selected)
  const [expanded, setExpanded] = useState(false)
  const [active, setActive] = useState(-1)
  const [filter, setFilter] = useState(false)
  const field = useRef<HTMLInputElement>(null)

  const groups = schedules[semester].groups
  const groupCodes = groupCodesFor(semester)
  const query = filter ? normaliseGroup(input, semester) : ''
  const options = groupCodes.filter(code => code.includes(query))
  const activeOption = active === -1 ? undefined : options[active]
  const optionId = (code: string) => 'group-option-' + code

  useEffect(() => {
    setInput(selected)
  }, [selected])

  useEffect(() => {
    if (expanded && activeOption) {
      document.getElementById(optionId(activeOption))?.scrollIntoView({ block: 'nearest' })
    }
  }, [activeOption, expanded])

  function close() {
    setExpanded(false)
    setActive(-1)
    setFilter(false)
  }

  function select(code: string) {
    setInput(code)
    close()
    onSelect(code)
    field.current?.focus()
  }

  function handleKey(event: KeyboardEvent<HTMLInputElement>) {
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        event.preventDefault()
        const step = event.key === 'ArrowDown' ? 1 : -1
        const initial = step === 1 ? 0 : options.length - 1
        setExpanded(true)
        setActive(options.length === 0 ? -1 : !expanded || active === -1 ? initial :
          Math.max(0, Math.min(active + step, options.length - 1)))
        break
      }
      case 'Escape':
        if (expanded) {
          event.preventDefault()
          setInput(selected)
          close()
        }
        break
      case 'Enter': {
        event.preventDefault()
        const code = activeOption ?? normaliseGroup(input, semester)
        if (knownGroup(code, semester)) select(code)
        else {
          setFilter(true)
          setExpanded(true)
        }
        break
      }
    }
  }

  return (
    <div className="picker" onBlur={event => {
      if (!event.currentTarget.contains(event.relatedTarget)) {
        setInput(selected)
        close()
      }
    }}>
      <label className="picker-label" htmlFor="group-search">Group code</label>
      <div className="picker-field">
        <Search size={19} aria-hidden="true" />
        <input
          ref={field}
          id="group-search"
          role="combobox"
          type="text"
          aria-autocomplete="list"
          aria-expanded={expanded}
          aria-controls={expanded ? 'group-options' : undefined}
          aria-activedescendant={expanded && activeOption ? optionId(activeOption) : undefined}
          aria-describedby="group-hint"
          value={input}
          placeholder="Select your group"
          spellCheck={false}
          autoComplete="off"
          autoCapitalize="characters"
          onClick={() => {
            setExpanded(true)
            if (!filter) setActive(options.indexOf(selected))
          }}
          onFocus={event => event.target.select()}
          onChange={event => {
            setInput(event.target.value)
            setFilter(true)
            setActive(-1)
            setExpanded(true)
          }}
          onKeyDown={handleKey}
        />
        {(input || selected) && (
          <button type="button" className="icon-button picker-button" aria-label="Clear group"
            onClick={() => select('')}>
            <X size={17} aria-hidden="true" />
          </button>
        )}
        <button
          type="button"
          className="icon-button picker-button disclosure"
          tabIndex={-1}
          aria-label={expanded ? 'Hide groups' : 'Show groups'}
          onClick={() => {
            field.current?.focus()
            if (expanded) close()
            else {
              setExpanded(true)
              setActive(options.indexOf(selected))
            }
          }}
        >
          <ChevronDown size={19} aria-hidden="true" />
        </button>
      </div>
      {expanded && (
        <div className="picker-menu">
          <ul id="group-options" role="listbox" aria-label="Group codes">
            {options.map((code, index) => (
              <li key={code} id={optionId(code)} role="option" aria-selected={code === selected}
                className={index === active ? 'active-option' : undefined}
                onMouseDown={event => event.preventDefault()} onClick={() => select(code)}>
                <span>{code}</span>
                <small>{code === sharedGroup ? 'Shared slot' : groups[code].branch}</small>
              </li>
            ))}
          </ul>
          {options.length === 0 && <p role="status">No matching group. Check the code and try again.</p>}
        </div>
      )}
      <p id="group-hint">Use the group code assigned by MAIT.</p>
    </div>
  )
}
