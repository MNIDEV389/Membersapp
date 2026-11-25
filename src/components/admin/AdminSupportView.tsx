'use client'

import { CheckCircle2 } from 'lucide-react'
import { useState } from 'react'
import { api, ApiError } from '@/lib/client-api'
import { formatDate } from '@/lib/format'
import { StatusPill, type Tone } from '@/components/ui/Badges'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'

export interface AdminSupportRow {
  id: number
  reason: string
  fullName: string
  email: string
  phone: string
  businessName: string | null
  message: string | null
  status: 'pending' | 'in_progress' | 'resolved'
  createdAt: string
}

const TONE: Record<AdminSupportRow['status'], Tone> = {
  pending: 'warning',
  in_progress: 'brand',
  resolved: 'success',
}

export function AdminSupportView({ initialTickets }: { initialTickets: AdminSupportRow[] }) {
  const toast = useToast()
  const [tickets, setTickets] = useState<AdminSupportRow[]>(initialTickets)
  const [busyId, setBusyId] = useState<number | null>(null)

  const resolveTicket = async (id: number) => {
    setBusyId(id)
    try {
      await api('/api/admin/support', { method: 'PATCH', body: { id, status: 'resolved' } })
      setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, status: 'resolved' } : t)))
      toast('Support ticket marked resolved!')
    } catch (err) {
      toast((err as ApiError).message || 'Failed to update ticket', 'error')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-[24px] font-bold tracking-tight text-navy">Support &amp; Access Help</h1>
        <p className="text-label text-muted">Review forgot-password and new-member access requests.</p>
      </header>

      {tickets.length === 0 ? (
        <div className="rounded-2xl border border-line bg-surface p-10 text-center text-label text-muted">
          No login help or support requests yet.
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => (
            <div key={t.id} className="rounded-2xl border border-black/[0.06] bg-surface p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-[15.5px] font-bold text-navy">{t.fullName}</p>
                  <p className="text-caption text-muted">
                    {t.email} · {t.phone} {t.businessName ? `· ${t.businessName}` : ''} · {formatDate(t.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusPill tone="neutral">{t.reason.replace('_', ' ')}</StatusPill>
                  <StatusPill tone={TONE[t.status]}>{t.status.replace('_', ' ')}</StatusPill>
                </div>
              </div>

              {t.message && <p className="mt-2.5 rounded-xl bg-subtle p-3 text-label text-ink/90">{t.message}</p>}

              {t.status !== 'resolved' && (
                <div className="mt-3 flex justify-end border-t border-line pt-3">
                  <Button
                    size="sm"
                    icon={<CheckCircle2 className="size-3.5" />}
                    loading={busyId === t.id}
                    onClick={() => resolveTicket(t.id)}
                  >
                    Mark Resolved
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
