import { BadgeCheck, Sparkles, Star } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from './cn'

export type Tone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'navy'

const tones: Record<Tone, string> = {
  neutral: 'bg-[#eef1f5] text-[#3d4b5c] ring-[#dbe1e8]',
  brand: 'bg-pale text-brand-strong ring-[#cfdcf8]',
  success: 'bg-success-bg text-success ring-[#c5e6db]',
  warning: 'bg-warning-bg text-warning ring-[#f3d9b5]',
  danger: 'bg-danger-bg text-danger ring-[#f6c9c4]',
  navy: 'bg-navy text-white ring-navy',
}

export function StatusPill({ tone = 'neutral', children, icon, className }: { tone?: Tone; children: ReactNode; icon?: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex h-6 shrink-0 items-center gap-1 rounded-full px-2.5 text-caption font-semibold ring-1 ring-inset',
        tones[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  )
}

export function TierBadge({ tier, onNavy }: { tier?: string | null; onNavy?: boolean }) {
  if (tier !== 'premium') return null
  return (
    <span
      className={cn(
        'inline-flex h-5 items-center gap-1 rounded-full px-2 text-[10.5px] font-extrabold uppercase tracking-wider shadow-sm',
        onNavy
          ? 'bg-gradient-to-r from-[#FFE066] to-[#F59E0B] text-[#78350F]'
          : 'bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white',
      )}
    >
      <Star className="size-3 fill-current" aria-hidden="true" />
      Premium
    </span>
  )
}

export function VerifiedMark({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center', className)} title="Verified MNI member">
      <BadgeCheck className="size-4 text-success" aria-hidden="true" />
      <span className="sr-only">Verified member</span>
    </span>
  )
}

export function Avatar({
  initials,
  src,
  size = 'md',
  tone = 'navy',
  className,
}: {
  initials: string
  src?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
  tone?: 'navy' | 'white'
  className?: string
}) {
  const sizes = { sm: 'size-9 text-caption rounded-[10px]', md: 'size-11 text-label rounded-[12px]', lg: 'size-16 text-xl rounded-[18px]', xl: 'size-20 text-2xl rounded-[22px]' }
  return (
    <span
      aria-hidden="true"
      className={cn(
        'grid shrink-0 place-items-center overflow-hidden font-bold tracking-tight',
        tone === 'navy' ? 'bg-navy text-white' : 'bg-white text-navy',
        sizes[size],
        className,
      )}
    >
      {src ? <img src={src} alt="" className="size-full object-cover" /> : initials}
    </span>
  )
}
