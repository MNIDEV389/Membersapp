'use client'

import { useRef, type KeyboardEvent } from 'react'
import { cn } from './cn'

interface Tab<T extends string> {
  id: T
  label: string
  count?: number
}

/** Segmented tab list with roving focus + arrow-key navigation (WAI-ARIA tabs). */
export function SegmentedTabs<T extends string>({
  tabs,
  value,
  onChange,
  label,
  idPrefix,
}: {
  tabs: Tab<T>[]
  value: T
  onChange: (id: T) => void
  label: string
  idPrefix: string
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])

  const onKeyDown = (e: KeyboardEvent, index: number) => {
    const last = tabs.length - 1
    const next =
      e.key === 'ArrowRight' ? (index === last ? 0 : index + 1)
      : e.key === 'ArrowLeft' ? (index === 0 ? last : index - 1)
      : e.key === 'Home' ? 0
      : e.key === 'End' ? last
      : null
    if (next === null) return
    e.preventDefault()
    refs.current[next]?.focus()
    onChange(tabs[next].id)
  }

  return (
    <div role="tablist" aria-label={label} className="flex gap-1 rounded-[14px] bg-[#e4e9ef] p-1">
      {tabs.map((tab, i) => {
        const selected = tab.id === value
        return (
          <button
            key={tab.id}
            ref={(el) => {
              refs.current[i] = el
            }}
            role="tab"
            type="button"
            id={`${idPrefix}-tab-${tab.id}`}
            aria-selected={selected}
            aria-controls={`${idPrefix}-panel-${tab.id}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(
              'flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-[10px] px-2 text-label font-semibold transition-all',
              selected ? 'bg-surface text-navy shadow-card' : 'text-muted hover:text-navy',
            )}
          >
            <span className="truncate">{tab.label}</span>
            {typeof tab.count === 'number' && (
              <span
                className={cn(
                  'min-w-5 rounded-full px-1.5 text-caption tabular-nums',
                  selected ? 'bg-pale text-brand' : 'bg-white/60 text-muted',
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

export function TabPanel({ idPrefix, id, children }: { idPrefix: string; id: string; children: React.ReactNode }) {
  return (
    <div role="tabpanel" id={`${idPrefix}-panel-${id}`} aria-labelledby={`${idPrefix}-tab-${id}`} tabIndex={0} className="focus-visible:outline-offset-4">
      {children}
    </div>
  )
}
