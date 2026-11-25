'use client'

import { ArrowRight, Check, MessageSquareText, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { api, ApiError } from '@/lib/client-api'
import { formatDate } from '@/lib/format'
import { StatusPill, type Tone } from '@/components/ui/Badges'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Field, Textarea } from '@/components/ui/Field'
import { useToast } from '@/components/ui/Toast'
import { cn } from '@/components/ui/cn'

export interface AdminRequestRow {
  id: number
  status: 'pending' | 'contact_received' | 'followup_required' | 'outcome_recorded' | 'declined'
  agendaNote: string | null
  adminNote: string | null
  createdAt: string
  postTitle: string | null
  requester: { id: number; fullName: string; businessName: string; email: string }
  target: { id: number; fullName: string; businessName: string; phone: string; email: string }
  businessGenerated?: boolean
}

const TONE: Record<AdminRequestRow['status'], Tone> = {
  pending: 'warning',
  contact_received: 'brand',
  followup_required: 'warning',
  outcome_recorded: 'success',
  declined: 'neutral',
}

export function AdminRequestsView({ initialRequests }: { initialRequests: AdminRequestRow[] }) {
  const toast = useToast()
  const [requests, setRequests] = useState<AdminRequestRow[]>(initialRequests)
  const [filter, setFilter] = useState<'all' | 'pending' | 'shared'>('pending')
  const [modalReq, setModalReq] = useState<{ row: AdminRequestRow; action: 'share' | 'decline' } | null>(null)
  const [adminNote, setAdminNote] = useState('')
  const [saving, setSaving] = useState(false)

  const visible = useMemo(() => {
    if (filter === 'pending') return requests.filter((r) => r.status === 'pending')
    if (filter === 'shared') return requests.filter((r) => r.status !== 'pending' && r.status !== 'declined')
    return requests
  }, [requests, filter])

  const openModal = (row: AdminRequestRow, action: 'share' | 'decline') => {
    setModalReq({ row, action })
    setAdminNote(row.adminNote ?? (action === 'share' ? 'Spoke with member — happy to connect!' : ''))
  }

  const submitAction = async () => {
    if (!modalReq) return
    setSaving(true)
    const nextStatus = modalReq.action === 'share' ? 'contact_received' : 'declined'
    try {
      await api('/api/admin/requests', {
        method: 'PATCH',
        body: { id: modalReq.row.id, status: nextStatus, adminNote },
      })
      setRequests((prev) =>
        prev.map((r) => (r.id === modalReq.row.id ? { ...r, status: nextStatus, adminNote } : r)),
      )
      toast(
        modalReq.action === 'share'
          ? 'Contact shared! Requester can now view contact details & invite for 1-on-1.'
          : 'Request marked as declined.',
      )
      setModalReq(null)
    } catch (err) {
      toast((err as ApiError).message || 'Action failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-[24px] font-bold tracking-tight text-navy">Contact Requests</h1>
        <p className="text-label text-muted">Approve introductions to reveal member contact details &amp; unlock 1-on-1 invites.</p>
      </header>

      <div className="flex gap-1 rounded-xl bg-[#E9EDF4] p-1 w-fit">
        {[
          { id: 'pending', label: `Pending (${requests.filter((r) => r.status === 'pending').length})` },
          { id: 'shared', label: `Shared (${requests.filter((r) => r.status !== 'pending' && r.status !== 'declined').length})` },
          { id: 'all', label: `All (${requests.length})` },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setFilter(t.id as typeof filter)}
            className={cn(
              'h-8 rounded-lg px-3.5 text-[12.5px] font-semibold transition-colors',
              filter === t.id ? 'bg-white text-navy shadow-sm' : 'text-muted hover:text-navy',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-line bg-surface p-10 text-center text-label text-muted">
          No contact requests in this view.
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((r) => (
            <div key={r.id} className="rounded-2xl border border-black/[0.06] bg-surface p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="flex flex-wrap items-center gap-1.5 text-[15px] font-bold text-navy">
                    <span>{r.requester.fullName}</span>
                    <ArrowRight className="size-4 text-brand" />
                    <span>{r.target.fullName}</span>
                  </p>
                  <p className="text-caption text-muted">
                    {r.requester.businessName} → {r.target.businessName} · {formatDate(r.createdAt)}
                  </p>
                </div>
                <StatusPill tone={TONE[r.status]}>{r.status.replace('_', ' ')}</StatusPill>
              </div>

              {r.agendaNote && (
                <p className="mt-2.5 rounded-xl bg-subtle p-3 text-label text-ink/90">
                  <span className="font-semibold text-navy">Agenda: </span>
                  {r.agendaNote}
                </p>
              )}

              {r.adminNote && (
                <p className="mt-2 flex items-center gap-1.5 text-caption font-medium text-navy">
                  <MessageSquareText className="size-3.5 text-brand" />
                  Admin note: {r.adminNote}
                </p>
              )}

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
                <p className="text-caption text-muted">
                  Target contact: <span className="font-semibold text-navy">{r.target.phone}</span> · {r.target.email}
                </p>
                {r.status === 'pending' && (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      icon={<X className="size-3.5" />}
                      onClick={() => openModal(r, 'decline')}
                    >
                      Decline
                    </Button>
                    <Button
                      size="sm"
                      icon={<Check className="size-3.5" />}
                      onClick={() => openModal(r, 'share')}
                    >
                      Share Contact
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog
        open={Boolean(modalReq)}
        onClose={() => setModalReq(null)}
        busy={saving}
        title={modalReq?.action === 'share' ? 'Share Contact with Requester' : 'Decline Request'}
        description={
          modalReq
            ? `${modalReq.row.requester.fullName} requested ${modalReq.row.target.fullName}’s contact.`
            : undefined
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalReq(null)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={submitAction} loading={saving}>
              {modalReq?.action === 'share' ? 'Confirm & Share Contact' : 'Confirm Decline'}
            </Button>
          </>
        }
      >
        <Field label="Admin note to requester" optional>
          <Textarea
            rows={3}
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
            placeholder="Add context or instructions for the introduction…"
          />
        </Field>
      </Dialog>
    </div>
  )
}
