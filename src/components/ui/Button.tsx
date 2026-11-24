import Link from 'next/link'
import { forwardRef, type ButtonHTMLAttributes, type ComponentProps, type ReactNode } from 'react'
import { cn } from './cn'
import { Spinner } from './Spinner'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'on-navy'
type Size = 'sm' | 'md' | 'lg'

const base =
  'inline-flex items-center justify-center gap-2 font-semibold whitespace-nowrap rounded-[var(--radius-control)] transition-[background-color,color,box-shadow,transform] duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-55 select-none'

const variants: Record<Variant, string> = {
  primary: 'bg-brand text-white shadow-[0_6px_16px_-6px_rgb(33_92_229/0.55)] hover:bg-brand-strong',
  secondary: 'bg-pale text-navy hover:bg-[#dde7fb]',
  ghost: 'bg-transparent text-navy hover:bg-navy/5',
  danger: 'bg-danger text-white hover:bg-[#9a1d14]',
  'on-navy': 'bg-white/12 text-white ring-1 ring-white/20 hover:bg-white/20',
}

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3 text-label',
  md: 'h-11 px-4 text-body',
  lg: 'h-12 px-5 text-body',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  loadingText?: string
  icon?: ReactNode
  fullWidth?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading, loadingText, icon, fullWidth, className, children, disabled, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(base, variants[variant], sizes[size], fullWidth && 'w-full', className)}
      {...rest}
    >
      {loading ? <Spinner className="size-4" /> : icon}
      <span className="inline-flex items-center gap-2">{loading && loadingText ? loadingText : children}</span>
    </button>
  )
})

export function ButtonLink({
  variant = 'primary',
  size = 'md',
  icon,
  fullWidth,
  className,
  children,
  ...rest
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size; icon?: ReactNode; fullWidth?: boolean }) {
  return (
    <Link className={cn(base, variants[variant], sizes[size], fullWidth && 'w-full', className)} {...rest}>
      {icon}
      <span className="inline-flex items-center gap-2">{children}</span>
    </Link>
  )
}
