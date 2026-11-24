import { cn } from '../ui/cn'

/**
 * MNI monogram. Placeholder vector mark — replace with the official artwork
 * by dropping `public/brand/mni-logo.svg` (or .png) and swapping the <svg>
 * below for an <img>.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={cn('shrink-0', className)} role="img" aria-label="MNI">
      <defs>
        <linearGradient id="mni-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#b8c7e6" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="11" fill="#0B224E" />
      <path d="M9 29V11l11 11 11-11v18" fill="none" stroke="url(#mni-g)" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 22v7" stroke="#215CE5" strokeWidth="3.4" strokeLinecap="round" />
    </svg>
  )
}

export function Wordmark({ onNavy, className }: { onNavy?: boolean; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark className="size-9" />
      <span className="leading-none">
        <span className={cn('block text-[17px] font-extrabold tracking-tight', onNavy ? 'text-white' : 'text-navy')}>MNI</span>
        <span className={cn('block text-[10px] font-semibold uppercase tracking-[0.16em]', onNavy ? 'text-on-navy-muted' : 'text-muted')}>
          Members
        </span>
      </span>
    </span>
  )
}
