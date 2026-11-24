'use client'

import { TIMELINE_FILTERS } from '@/lib/constants'
import { cn } from '../ui/cn'

export function FilterChips({ value, onChange, counts }: { value: string; onChange: (id: string) => void; counts: Record<string, number> }) {
  return (
    <div role="group" aria-label="Filter timeline" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:-mx-6 sm:px-6">
      {TIMELINE_FILTERS.filter((f) => f.id === 'all' || counts[f.id] > 0).map((f) => {
        const active = f.id === value
        return (
          <button
            key={f.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(f.id)}
            className={cn(
              'inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full px-4 text-label font-semibold transition-colors',
              active ? 'bg-navy text-white' : 'bg-surface text-ink ring-1 ring-inset ring-line hover:ring-line-strong',
            )}
          >
            {f.label}
            <span className={cn('text-caption tabular-nums', active ? 'text-on-navy-muted' : 'text-muted')}>{counts[f.id] ?? 0}</span>
          </button>
        )
      })}
    </div>
  )
}
