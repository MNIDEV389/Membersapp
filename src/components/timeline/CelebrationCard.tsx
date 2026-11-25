'use client'

import confetti from 'canvas-confetti'
import { ArrowRight, Trophy } from 'lucide-react'
import { useRef } from 'react'
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
  const btnRef = useRef<HTMLButtonElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const myConfettiRef = useRef<confetti.CreateTypes | null>(null)

  const firePartyPopper = () => {
    if (!myConfettiRef.current && canvasRef.current) {
      myConfettiRef.current = confetti.create(canvasRef.current, {
        resize: true,
        useWorker: false,
      })
    }
    const fire = myConfettiRef.current ?? confetti

    const rect = btnRef.current?.getBoundingClientRect()
    const origin = rect
      ? {
          x: (rect.left + rect.width / 2) / window.innerWidth,
          y: (rect.top + rect.height / 2) / window.innerHeight,
        }
      : { x: 0.5, y: 0.6 }

    const colors = ['#F59E0B', '#FFE066', '#215CE5', '#10B981', '#EC4899', '#0B224E']

    // Stage 1: Tight fast upward pop
    fire({
      particleCount: 35,
      spread: 60,
      startVelocity: 38,
      decay: 0.91,
      scalar: 0.95,
      ticks: 160,
      origin,
      colors,
    })

    // Stage 2: Wide shimmering confetti shower
    setTimeout(() => {
      fire({
        particleCount: 55,
        spread: 95,
        startVelocity: 46,
        decay: 0.92,
        scalar: 1.05,
        gravity: 0.95,
        drift: 0.1,
        ticks: 200,
        origin,
        colors,
      })
    }, 90)
  }

  const handleClapClick = () => {
    if (!item.isClappedByMe) {
      firePartyPopper()
    }
    onClap?.(item)
  }

  return (
    <article className="relative overflow-hidden rounded-[var(--radius-card)] border border-[#FDE68A] bg-gradient-to-br from-[#FFFDF7] via-white to-[#FFFBEB] p-4 shadow-[0_4px_16px_rgba(217,119,6,0.08)]">
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[9999] size-full"
      />
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
          ref={btnRef}
          type="button"
          onClick={handleClapClick}
          className={cn(
            'inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-semibold transition-all active:scale-95',
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
    </article>
  )
}
