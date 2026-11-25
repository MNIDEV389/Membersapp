'use client'

import { ArrowLeft, Briefcase, Check, Info, MapPin, Search, Target, UserPlus, Users } from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import type { DirectoryMemberVM } from '@/lib/view-models'
import { ContactRequestDialog } from '../modals/ContactRequestDialog'
import { MemberInfoDialog } from '../modals/MemberInfoDialog'
import { Avatar, TierBadge, VerifiedMark } from '../ui/Badges'
import { EmptyState } from '../ui/Feedback'
import { cn } from '../ui/cn'

type SubTab = 'category' | 'city' | 'matchmaking'

export function DirectoryView({
  initialMembers,
  myCity,
}: {
  initialMembers: DirectoryMemberVM[]
  myCity: string
}) {
  const [subTab, setSubTab] = useState<SubTab>('category')
  const [query, setQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedCity, setSelectedCity] = useState(myCity || 'All')
  const [requestedIds, setRequestedIds] = useState<Set<string>>(
    () => new Set(initialMembers.filter((m) => m.isRequested).map((m) => String(m.id))),
  )
  const [infoMember, setInfoMember] = useState<DirectoryMemberVM | null>(null)
  const [requestMember, setRequestMember] = useState<DirectoryMemberVM | null>(null)

  const categories = useMemo(() => {
    const set = new Set(initialMembers.map((m) => m.businessCategory).filter(Boolean))
    return ['All', ...Array.from(set).sort()]
  }, [initialMembers])

  const cities = useMemo(() => {
    const set = new Set(initialMembers.map((m) => m.city).filter(Boolean))
    return ['All', ...Array.from(set).sort()]
  }, [initialMembers])

  const visibleMembers = useMemo(() => {
    const q = query.trim().toLowerCase()
    return initialMembers.filter((m) => {
      if (m.isMine) return false
      if (subTab === 'category') {
        const catOk = selectedCategory === 'All' || m.businessCategory === selectedCategory
        const qOk =
          !q ||
          m.fullName.toLowerCase().includes(q) ||
          m.businessName.toLowerCase().includes(q) ||
          m.businessCategory.toLowerCase().includes(q) ||
          (m.keyProductService ?? '').toLowerCase().includes(q)
        return catOk && qOk
      }
      if (subTab === 'city') {
        return selectedCity === 'All' || m.city.toLowerCase() === selectedCity.toLowerCase()
      }
      // matchmaking
      return m.isMatch
    })
  }, [initialMembers, subTab, query, selectedCategory, selectedCity])

  const isRequested = (m: DirectoryMemberVM | null) => Boolean(m && requestedIds.has(String(m.id)))

  return (
    <div className="space-y-5 pb-20">
      <header className="flex items-center gap-3">
        <Link
          href="/"
          className="grid size-11 shrink-0 place-items-center rounded-full bg-surface text-navy ring-1 ring-line transition-colors hover:bg-subtle active:scale-95"
          aria-label="Back to Home"
        >
          <ArrowLeft className="size-5" aria-hidden="true" />
        </Link>
        <div>
          <h1 className="text-title font-bold text-navy">Member Directory</h1>
          <p className="text-label text-muted">Browse members and request admin introductions.</p>
        </div>
      </header>

      {/* 3 Sub-categories */}
      <div className="grid grid-cols-3 gap-1 rounded-2xl bg-[#EEF1F5] p-1">
        {[
          { id: 'category', label: 'Category Search' },
          { id: 'city', label: 'City Chapter' },
          { id: 'matchmaking', label: 'Ideal Match' },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setSubTab(t.id as SubTab)}
            className={cn(
              'h-9 rounded-xl px-2 text-[12px] font-semibold transition-all',
              subTab === t.id ? 'bg-white text-navy shadow-sm' : 'text-muted hover:text-navy',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Sub-category controls */}
      {subTab === 'category' && (
        <div className="space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-3.5 size-4 text-muted" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, company, service, category…"
              className="h-11 w-full rounded-2xl border border-line bg-surface pl-10 pr-4 text-body text-navy outline-none transition-colors focus:border-brand focus:ring-4 focus:ring-brand/15"
            />
          </div>
          <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setSelectedCategory(c)}
                className={cn(
                  'shrink-0 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors',
                  selectedCategory === c
                    ? 'bg-navy text-white'
                    : 'bg-surface text-muted ring-1 ring-inset ring-line hover:text-navy',
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      {subTab === 'city' && (
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          {cities.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setSelectedCity(c)}
              className={cn(
                'inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors',
                selectedCity === c
                  ? 'bg-navy text-white'
                  : 'bg-surface text-muted ring-1 ring-inset ring-line hover:text-navy',
              )}
            >
              <MapPin className="size-3.5" aria-hidden="true" />
              {c}
            </button>
          ))}
        </div>
      )}

      {subTab === 'matchmaking' && (
        <div className="flex items-center gap-2.5 rounded-2xl bg-pale/70 px-4 py-3 text-caption font-medium text-navy ring-1 ring-inset ring-brand/20">
          <Target className="size-4 shrink-0 text-brand" aria-hidden="true" />
          <span>Members matched by your city, category, and ideal-client profile keywords.</span>
        </div>
      )}

      {/* Results list */}
      {visibleMembers.length === 0 ? (
        <EmptyState icon={<Users className="size-5" aria-hidden="true" />} title="No matching members found">
          Try clearing your search or switching sub-categories.
        </EmptyState>
      ) : (
        <div className="space-y-3">
          {visibleMembers.map((m) => {
            const req = isRequested(m)
            return (
              <article
                key={m.id}
                className="rounded-[var(--radius-card)] border border-black/[0.06] bg-surface p-4 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <Avatar initials={m.avatarInitials} src={m.avatarUrl} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <h2 className="truncate text-[15.5px] font-bold text-navy">{m.fullName}</h2>
                      {m.isVerified && <VerifiedMark />}
                      <TierBadge tier={m.tier} />
                    </div>
                    <p className="truncate text-label font-medium text-[#1C1C1E]/85">{m.businessName}</p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-caption text-muted">
                      <span className="inline-flex items-center gap-1">
                        <Briefcase className="size-3" aria-hidden="true" />
                        {m.businessCategory}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="size-3" aria-hidden="true" />
                        {m.city}
                      </span>
                    </p>
                  </div>
                </div>

                {m.matchReason && (
                  <p className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-pale px-2.5 py-1 text-[11.5px] font-semibold text-brand-strong">
                    <Target className="size-3" aria-hidden="true" />
                    {m.matchReason}
                  </p>
                )}

                {m.whatWeDo && (
                  <p className="mt-2.5 line-clamp-2 text-[13.5px] leading-relaxed text-[#1C1C1E]/85">{m.whatWeDo}</p>
                )}

                <div className="mt-3.5 flex items-center justify-end gap-2 border-t border-black/[0.05] pt-3">
                  <button
                    type="button"
                    onClick={() => setInfoMember(m)}
                    className="inline-flex h-8 items-center gap-1.5 rounded-full border border-black/10 bg-[#F2F4F7] px-3 text-[12.5px] font-semibold text-[#1C1C1E] transition-colors hover:bg-[#E5E7EB]"
                  >
                    <Info className="size-3.5" aria-hidden="true" />
                    Info
                  </button>
                  {req ? (
                    <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-success-bg px-3 text-[12.5px] font-semibold text-success">
                      <Check className="size-3.5" aria-hidden="true" />
                      Requested
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setRequestMember(m)}
                      className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[#007AFF] px-3.5 text-[12.5px] font-semibold text-white shadow-sm transition-all hover:bg-[#0066E0] active:scale-95"
                    >
                      <UserPlus className="size-3.5" aria-hidden="true" />
                      Request Contact
                    </button>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}

      <MemberInfoDialog
        member={infoMember}
        isRequested={isRequested(infoMember)}
        isMine={false}
        onClose={() => setInfoMember(null)}
        onRequest={() => {
          const target = infoMember
          setInfoMember(null)
          setRequestMember(target)
        }}
      />

      <ContactRequestDialog
        member={requestMember}
        onClose={() => setRequestMember(null)}
        onRequested={(id) => setRequestedIds((prev) => new Set(prev).add(String(id)))}
      />
    </div>
  )
}
