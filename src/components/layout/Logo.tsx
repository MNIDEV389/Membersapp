import { cn } from '../ui/cn'

/**
 * Official MNI monogram artwork.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'relative inline-block overflow-hidden rounded-2xl shrink-0 shadow-[0_8px_24px_rgba(0,43,102,0.35)]',
        className,
      )}
    >
      <img
        src="/brand/mni-logo.webp"
        alt="MNI"
        width={80}
        height={80}
        className="size-full object-cover"
        loading="eager"
      />
    </span>
  )
}

export function Wordmark({ onNavy, className }: { onNavy?: boolean; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark className="size-9 rounded-xl shadow-none" />
      <span className="leading-none">
        <span className={cn('block text-[17px] font-extrabold tracking-tight', onNavy ? 'text-white' : 'text-navy')}>MNI</span>
        <span className={cn('block text-[10px] font-semibold uppercase tracking-[0.16em]', onNavy ? 'text-on-navy-muted' : 'text-muted')}>
          Members
        </span>
      </span>
    </span>
  )
}
