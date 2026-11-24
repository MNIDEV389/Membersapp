import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from './cn'

type AlertTone = 'info' | 'success' | 'warning' | 'danger'
const alertStyles: Record<AlertTone, { box: string; Icon: typeof Info }> = {
  info: { box: 'bg-pale text-navy ring-[#cfdcf8]', Icon: Info },
  success: { box: 'bg-success-bg text-[#0f5c47] ring-[#c5e6db]', Icon: CheckCircle2 },
  warning: { box: 'bg-warning-bg text-[#7a3a05] ring-[#f3d9b5]', Icon: AlertTriangle },
  danger: { box: 'bg-danger-bg text-[#8f1c13] ring-[#f6c9c4]', Icon: XCircle },
}

export function Alert({ tone = 'info', title, children, action, className }: { tone?: AlertTone; title?: ReactNode; children?: ReactNode; action?: ReactNode; className?: string }) {
  const { box, Icon } = alertStyles[tone]
  return (
    <div role={tone === 'danger' ? 'alert' : 'status'} className={cn('flex gap-3 rounded-[16px] p-4 text-label ring-1 ring-inset', box, className)}>
      <Icon className="mt-0.5 size-[18px] shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1 space-y-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className="leading-5 opacity-95">{children}</div>}
        {action && <div className="pt-1.5">{action}</div>}
      </div>
    </div>
  )
}

export function EmptyState({ icon, title, children, action }: { icon: ReactNode; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-dashed border-line-strong bg-surface px-6 py-10 text-center">
      <div className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl bg-pale text-brand">{icon}</div>
      <h3 className="text-body font-semibold text-navy">{title}</h3>
      {children && <p className="mx-auto mt-1 max-w-sm text-label text-muted">{children}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn('animate-pulse rounded-xl bg-[#e3e8ee]', className)} />
}

export function Card({ className, children, as: Tag = 'div' }: { className?: string; children: ReactNode; as?: 'div' | 'section' | 'article' | 'li' }) {
  return <Tag className={cn('rounded-[var(--radius-card)] border border-line bg-surface shadow-card', className)}>{children}</Tag>
}
