'use client'

import {
  ArrowRight,
  Check,
  CheckSquare,
  Clock,
  MessageSquareText,
  Phone,
  Trash2,
  Users,
  X,
} from 'lucide-react'
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
  followUp?: {
    calledContact: boolean
    conversationTookPlace: boolean
    businessGenerated: boolean
    gaveBusiness: 'gave' | 'did_not_give' | null
    remarks: string | null
    recordedAt: string | null
  } | null
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
  const [filter, setFilter] = useState<'pending' | 'checklist_done' | 'shared' | 'all'>('pending')
  const [modalReq, setModalReq] = useState<{ row: AdminRequestRow; action: 'share' | 'decline' } | null>(null)
  const [deleteReq, setDeleteReq] = useState<AdminRequestRow | null>(null)
  const [adminNote, setAdminNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const counts = useMemo(
    () => ({
      pending: requests.filter((r) => r.status === 'pending').length,
      checklist_done: requests.filter((r) => Boolean(r.followUp?.recordedAt)).length,
      shared: requests.filter((r) => r.status !== 'pending' && r.status !== 'declined').length,
      all: requests.length,
    }),
    [requests],
  )

  const visible = useMemo(() => {
    if (filter === 'pending') return requests.filter((r) => r.status === 'pending')
    if (filter === 'checklist_done') return requests.filter((r) => Boolean(r.followUp?.recordedAt))
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
          ? 'Contact shared! Requester can now view contact details & complete the follow-up checklist.'
          : 'Request marked as declined.',
      )
      setModalReq(null)
    } catch (err) {
      toast((err as ApiError).message || 'Action failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteReq) return
    setDeleting(true)
    try {
      await api(`/api/admin/requests?id=${deleteReq.id}`, { method: 'DELETE' })
      setRequests((prev) => prev.filter((r) => r.id !== deleteReq.id))
      toast('Request deleted successfully.')
      setDeleteReq(null)
    } catch (err) {
      toast((err as ApiError).message || 'Delete failed', 'error')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-bold tracking-tight text-navy">Contact Requests &amp; Checklists</h1>
          <p className="text-label text-muted">
            Approve introductions and track member interaction responses (calls, meetings, deals).
          </p>
        </div>
      </header>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-1 rounded-xl bg-[#E9EDF4] p-1 w-fit">
        {[
          { id: 'pending', label: `Pending Approval (${counts.pending})` },
          { id: 'checklist_done', label: `Checklist Received (${counts.checklist_done})` },
          { id: 'shared', label: `Contact Shared (${counts.shared})` },
          { id: 'all', label: `All Requests (${counts.all})` },
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
        <div className="rounded-2xl border border-line bg-surface p-12 text-center text-label text-muted space-y-2">
          <Users className="mx-auto size-8 text-muted/60" />
          <p className="font-semibold text-navy">No requests in this view</p>
          <p className="text-caption">
            {filter === 'checklist_done'
              ? 'When members submit their post-contact checklist responses, they will appear here.'
              : 'There are no contact requests currently in this section.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {visible.map((r) => (
            <div key={r.id} className="rounded-2xl border border-black/[0.08] bg-surface p-4 sm:p-5 shadow-sm space-y-3.5">
              {/* Header Row: Requester -> Target */}
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-[15px] font-bold text-navy">
                    <span className="rounded-md bg-pale px-2 py-0.5 text-brand">{r.requester.fullName}</span>
                    <ArrowRight className="size-4 text-muted shrink-0" />
                    <span className="rounded-md bg-subtle px-2 py-0.5 text-navy">{r.target.fullName}</span>
                  </div>
                  <p className="mt-1 text-caption text-muted">
                    <span className="font-medium text-ink/80">{r.requester.businessName}</span> requested contact of{' '}
                    <span className="font-medium text-ink/80">{r.target.businessName}</span> · {formatDate(r.createdAt)}
                    {r.postTitle ? ` (from “${r.postTitle}”)` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusPill tone={TONE[r.status]}>{r.status.replace(/_/g, ' ')}</StatusPill>
                  <button
                    type="button"
                    title="Delete Request"
                    onClick={() => setDeleteReq(r)}
                    className="flex size-7 items-center justify-center rounded-lg text-muted/70 hover:bg-danger-bg hover:text-danger transition-colors"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>

              {/* Agenda Note */}
              {r.agendaNote && (
                <div className="rounded-xl bg-subtle/80 p-3 text-label text-ink/90">
                  <span className="font-semibold text-navy">Requester Agenda: </span>
                  {r.agendaNote}
                </div>
              )}

              {/* Admin Note */}
              {r.adminNote && (
                <p className="flex items-start gap-1.5 text-caption font-medium text-navy">
                  <MessageSquareText className="mt-0.5 size-3.5 text-brand shrink-0" />
                  <span>Admin Note: {r.adminNote}</span>
                </p>
              )}

              {/* Follow-up Checklist Responses (If submitted by member) */}
              {r.followUp?.recordedAt ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="flex size-5 items-center justify-center rounded-full bg-emerald-600 text-white text-[11px] font-bold">
                        ✓
                      </span>
                      <span className="text-[13px] font-bold text-emerald-950">
                        Member Follow-up Checklist Responses
                      </span>
                    </div>
                    <span className="text-[11.5px] font-medium text-emerald-800">
                      Recorded: {formatDate(r.followUp.recordedAt)}
                    </span>
                  </div>

                  {/* 4 Responses Grid */}
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <div className="rounded-lg border border-emerald-100 bg-white p-2.5 text-center">
                      <p className="text-[10.5px] font-semibold uppercase tracking-wider text-muted">1. Contacted?</p>
                      <p className={cn('text-[13px] font-bold mt-0.5', r.followUp.calledContact ? 'text-emerald-700' : 'text-amber-700')}>
                        {r.followUp.calledContact ? '✓ Called / Reached' : '✕ Not called'}
                      </p>
                    </div>
                    <div className="rounded-lg border border-emerald-100 bg-white p-2.5 text-center">
                      <p className="text-[10.5px] font-semibold uppercase tracking-wider text-muted">2. Spoke / Meeting?</p>
                      <p className={cn('text-[13px] font-bold mt-0.5', r.followUp.conversationTookPlace ? 'text-emerald-700' : 'text-amber-700')}>
                        {r.followUp.conversationTookPlace ? '✓ Conversation held' : '✕ No discussion'}
                      </p>
                    </div>
                    <div className="rounded-lg border border-emerald-100 bg-white p-2.5 text-center">
                      <p className="text-[10.5px] font-semibold uppercase tracking-wider text-muted">3. Business Generated?</p>
                      <p className={cn('text-[13px] font-bold mt-0.5', r.followUp.businessGenerated ? 'text-emerald-700' : 'text-muted')}>
                        {r.followUp.businessGenerated ? '✓ Business generated' : 'No business yet'}
                      </p>
                    </div>
                    <div className="rounded-lg border border-emerald-100 bg-white p-2.5 text-center">
                      <p className="text-[10.5px] font-semibold uppercase tracking-wider text-muted">4. Gave Business?</p>
                      <p className={cn('text-[13px] font-bold mt-0.5', r.followUp.gaveBusiness === 'gave' ? 'text-brand' : 'text-muted')}>
                        {r.followUp.gaveBusiness === 'gave' ? '✓ Gave business' : 'Not yet'}
                      </p>
                    </div>
                  </div>

                  {/* Member Remarks */}
                  {r.followUp.remarks && (
                    <div className="rounded-lg border border-emerald-100 bg-white p-2.5">
                      <p className="text-[10.5px] font-semibold uppercase tracking-wider text-muted">Requester Feedback / Notes</p>
                      <p className="text-[13px] text-navy font-medium mt-0.5 whitespace-pre-wrap">
                        “{r.followUp.remarks}”
                      </p>
                    </div>
                  )}
                </div>
              ) : r.status !== 'pending' && r.status !== 'declined' ? (
                /* Awaiting checklist */
                <div className="rounded-xl border border-amber-200/90 bg-amber-50/60 p-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
                    <p className="text-[12.5px] font-semibold text-amber-900">
                      Awaiting Follow-up Checklist from {r.requester.fullName}
                    </p>
                  </div>
                  <span className="text-[11.5px] text-amber-800 font-medium">
                    Contact shared · Pending member feedback
                  </span>
                </div>
              ) : null}

              {/* Footer: Contact info and Approval Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
                <p className="text-caption text-muted">
                  Target Member Contact:{' '}
                  <span className="font-semibold text-navy">{r.target.phone || 'Phone not set'}</span> · {r.target.email}
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
                      Approve &amp; Share Contact
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Approve / Decline Modal */}
      <Dialog
        open={Boolean(modalReq)}
        onClose={() => setModalReq(null)}
        busy={saving}
        title={modalReq?.action === 'share' ? 'Approve & Share Contact' : 'Decline Request'}
        description={
          modalReq
            ? `${modalReq.row.requester.fullName} (${modalReq.row.requester.businessName}) requested ${modalReq.row.target.fullName}’s contact.`
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

      {/* Delete Confirmation Modal */}
      <Dialog
        open={Boolean(deleteReq)}
        onClose={() => setDeleteReq(null)}
        busy={deleting}
        title="Delete Contact Request"
        description={
          deleteReq
            ? `Are you sure you want to delete the introduction request from ${deleteReq.requester.fullName} to ${deleteReq.target.fullName}?`
            : undefined
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteReq(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button onClick={handleDelete} loading={deleting} className="bg-danger text-white hover:bg-danger/90">
              Delete Request
            </Button>
          </>
        }
      >
        <p className="text-label text-muted">This will permanently remove this record from the database.</p>
      </Dialog>
    </div>
  )
}
