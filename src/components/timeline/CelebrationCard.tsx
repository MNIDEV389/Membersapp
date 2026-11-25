'use client'

import { ArrowRight, Trophy } from 'lucide-react'
import { useState } from 'react'
import type { CelebrationVM } from '@/lib/view-models'
import { timeAgo } from '@/lib/format'
import { Avatar } from '../ui/Badges'
import { cn } from '../ui/cn'

const CONFETTI_PIECES = [
  { tx: '-34px', ty: '-52px', rot: '-42deg', color: '#F59E0B', w: 10, h: 4 },
  { tx: '-18px', ty: '-66px', rot: '28deg', color: '#EF4444', w: 4, h: 12 },
  { tx: '4px', ty: '-72px', rot: '-18deg', color: '#3B82F6', w: 11, h: 4 },
  { tx: '24px', ty: '-62px', rot: '54deg', color: '#10B981', w: 4, h: 11 },
  { tx: '42px', ty: '-46px', rot: '72deg', color: '#8B5CF6', w: 10, h: 4 },
  { tx: '-46px', ty: '-30px', rot: '-65deg', color: '#EC4899', w: 4, h: 10 },
  { tx: '48px', ty: '-26px', rot: '38deg', color: '#F97316', w: 9, h: 4 },
  { tx: '-8px', ty: '-48px', rot: '15deg', color: '#14B8A6', w: 4, h: 10 },
  { tx: '16px', ty: '-44px', rot: '-35deg', color: '#EAB308', w: 10, h: 4 },
]

export function CelebrationCard({
  item,
  onClap,
}: {
  item: CelebrationVM
  onClap?: (item: CelebrationVM) => void
}) {
  const [burstKey, setBurstKey] = useState(0)

  const handleClapClick = () => {
    if (!item.isClappedByMe) {
      setBurstKey((k) => k + 1)
    }
    onClap?.(item)
  }

  return (
    <article className="relative overflow-hidden rounded-[var(--radius-card)] border border-[#FDE68A] bg-gradient-to-br from-[#FFFDF7] via-white to-[#FFFBEB] p-4 shadow-[0_4px_16px_rgba(217,119,6,0.08)]">
      <style>{`
        @keyframes mni-confetti-burst {
          0% {
            opacity: 1;
            transform: translate(0, 0) rotate(0deg) scale(0.5);
          }
          65% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translate(var(--tx), var(--ty)) rotate(var(--rot)) scale(1.1);
          }
        }
      `}</style>

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
        <div className="relative inline-flex items-center">
          {burstKey > 0 && (
            <div key={burstKey} aria-hidden="true" className="pointer-events-none absolute left-6 top-1/2 z-20">
              {CONFETTI_PIECES.map((p, idx) => (
                <span
                  key={idx}
                  style={
                    {
                      width: `${p.w}px`,
                      height: `${p.h}px`,
                      backgroundColor: p.color,
                      borderRadius: '2px',
                      position: 'absolute',
                      '--tx': p.tx,
                      '--ty': p.ty,
                      '--rot': p.rot,
                      animation: 'mni-confetti-burst 850ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
                    } as React.CSSProperties
                  }
                />
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={handleClapClick}
            className={cn(
              'relative z-10 inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-semibold transition-all active:scale-95',
              item.isClappedByMe
                ? 'bg-[#FEF3C7] text-[#92400E] ring-1 ring-inset ring-[#F59E0B]/40'
                : 'bg-black/[0.04] text-[#6E6E73] hover:bg-[#FEF3C7]/70 hover:text-[#92400E]',
            )}
            aria-pressed={item.isClappedByMe}
          >
            <span
              className={cn(
                'text-[15px] leading-none transition-transform duration-200',
                item.isClappedByMe && 'scale-125',
              )}
              aria-hidden="true"
            >
              {item.isClappedByMe ? '🎉' : '👏'}
            </span>
            <span>{item.isClappedByMe ? 'Clapped' : 'Clap'}</span>
            {item.clapsCount > 0 && <span className="font-bold">· {item.clapsCount}</span>}
          </button>
        </div>
      </div>
    </article>
  )
}
