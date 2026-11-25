'use client'

import { ArrowRight, Trophy } from 'lucide-react'
import type { CelebrationVM } from '@/lib/view-models'
import { timeAgo } from '@/lib/format'
import { Avatar } from '../ui/Badges'
import { cn } from '../ui/cn'

export function CelebrationCard({
  item,
  onClap,
}: {
  item: CelebrationVM
  onClap?: (item: CelebrationVM) => void
}) {
  return (
    <article className="relative overflow-hidden rounded-[var(--radius-card)] border border-[#FDE68A] bg-gradient-to-br from-[#FFFDF7] via-white to-[#FFFBEB] p-4 shadow-[0_4px_16px_rgba(217,119,6,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-[#FEF3C7] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#92400E]">
          <Trophy className="size-3.5 text-[#D97706]" aria-hidden="true" />
          Closed Business
        </div>
        <time dateTime={item.createdAt} className="text-[11px] font-medium text-muted">
          {timeAgo(item.createdAt)}
        </time>
      </div>

      <div className="mt-3 flex items-center gap-2.5">
        <Avatar initials={item.fromMember.avatarInitials} src={item.fromMember.avatarUrl} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-1.5 text-label font-bold text-navy">
            <span className="truncate">{item.fromMember.fullName}</span>
            <ArrowRight className="size-3.5 shrink-0 text-[#D97706]" aria-hidden="true" />
            <span className="truncate">{item.toMember.fullName}</span>
          </p>
          <p className="truncate text-caption text-muted">
            {item.fromMember.businessName} · {item.toMember.businessName}
          </p>
        </div>
      </div>

      <div className="mt-3 inline-flex items-center rounded-xl bg-[#0B224E] px-3 py-1.5 text-[13px] font-extrabold text-[#FFE066]">
        {item.amountLabel}
      </div>

      <p className="mt-2.5 text-[14px] leading-relaxed text-[#1C1C1E]/90">{item.story}</p>

      <div className="mt-3.5 flex items-center justify-between border-t border-[#FDE68A]/60 pt-2.5">
        <button
          type="button"
          onClick={() => onClap?.(item)}
          className={cn(
            'inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-semibold transition-all active:scale-95',
            item.isClappedByMe
              ? 'bg-[#FEF3C7] text-[#92400E] ring-1 ring-inset ring-[#F59E0B]/40'
              : 'bg-black/[0.04] text-[#6E6E73] hover:bg-[#FEF3C7]/70 hover:text-[#92400E]',
          )}
          aria-pressed={item.isClappedByMe}
        >
          <span className={cn('text-[15px] leading-none transition-transform', item.isClappedByMe && 'scale-110')} aria-hidden="true">
            👏
          </span>
          <span>{item.isClappedByMe ? 'Clapped' : 'Clap'}</span>
          {item.clapsCount > 0 && <span className="font-bold">· {item.clapsCount}</span>}
        </button>
      </div>
    </article>
  )
}
