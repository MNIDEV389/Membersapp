'use client'

import { Check, MessageSquare, Rocket, X } from 'lucide-react'
import { useState } from 'react'
import { PROFILE_UPDATE_CATEGORY } from '@/lib/constants'
import { api, ApiError } from '@/lib/client-api'
import { formatDate } from '@/lib/format'
import { StatusPill, type Tone } from '@/components/ui/Badges'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Field, Textarea } from '@/components/ui/Field'
import { useToast } from '@/components/ui/Toast'

export interface AdminSubmissionRow {
  id: number
  title: string
  category: string
  description: string
  status: 'pending' | 'changes_requested' | 'approved' | 'published' | 'rejected'
  adminFeedback: string | null
  createdAt: string
  memberName: string
  businessName: string
}

const TONE: Record<AdminSubmissionRow['status'], Tone> = {
  pending: 'warning',
  changes_requested: 'warning',
  approved: 'success',
  published: 'brand',
  rejected: 'danger',
}

export function AdminSubmissionsView({ initialSubmissions }: { initialSubmissions: AdminSubmissionRow[] }) {
  const toast = useToast()
  const [items, setItems] = useState<AdminSubmissionRow[]>(initialSubmissions)
  const [feedbackModal, setFeedbackModal] = useState<{ row: AdminSubmissionRow; action: 'changes_requested' | 'reject' } | null>(null)
  const [feedback, setFeedback] = useState('')
  const [busyId, setBusyId] = useState<number | null>(null)

  const handleAction = async (
    row: AdminSubmissionRow,
    action: 'approve' | 'publish_to_feed' | 'changes_requested' | 'reject' | 'apply_profile',
    adminFeedback?: string,
  ) => {
    setBusyId(row.id)
    try {
      const res = await api<{ ok: boolean; submission: { status: AdminSubmissionRow['status']; adminFeedback?: string } }>(
        '/api/admin/submissions',
        { method: 'PATCH', body: { id: row.id, action, adminFeedback } },
      )
      setItems((prev) =>
        prev.map((x) =>
          x.id === row.id
            ? { ...x, status: res.submission.status, adminFeedback: res.submission.adminFeedback ?? adminFeedback ?? x.adminFeedback }
            : x,
        ),
      )
      toast(
        action === 'publish_to_feed'
          ? 'Published to Timeline!'
          : action === 'apply_profile'
            ? 'Profile changes applied to member account!'
            : 'Submission updated.',
      )
      setFeedbackModal(null)
    } catch (err) {
      toast((err as ApiError).message || 'Action failed', 'error')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-[24px] font-bold tracking-tight text-navy">Submissions &amp; Profile Reviews</h1>
        <p className="text-label text-muted">Publish member requirements to the feed or apply proposed profile changes.</p>
      </header>

      <div className="space-y-3">
        {items.map((s) => {
          const isProfile = s.category === PROFILE_UPDATE_CATEGORY
          let parsedChanges: Record<string, string> | null = null
          if (isProfile) {
            try {
              parsedChanges = JSON.parse(s.description)
            } catch {
              parsedChanges = null
            }
          }

          return (
            <div key={s.id} className="rounded-2xl border border-black/[0.06] bg-surface p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill tone={TONE[s.status]}>{s.status.replace('_', ' ')}</StatusPill>
                    <StatusPill tone={isProfile ? 'navy' : 'brand'}>{s.category}</StatusPill>
                  </div>
                  <h2 className="mt-2 text-[15.5px] font-bold text-navy">{s.title}</h2>
                  <p className="text-caption text-muted">
                    By {s.memberName} ({s.businessName}) · {formatDate(s.createdAt)}
                  </p>
                </div>
              </div>

              {parsedChanges ? (
                <dl className="mt-3 grid gap-2 rounded-xl bg-subtle p-3 sm:grid-cols-2">
                  {Object.entries(parsedChanges).map(([k, v]) => (
                    <div key={k}>
                      <dt className="text-[11px] font-bold uppercase text-muted">{k}</dt>
                      <dd className="text-label text-navy">{v}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="mt-2.5 whitespace-pre-line text-label text-ink/90">{s.description}</p>
              )}

              {s.status === 'pending' && (
                <div className="mt-3 flex flex-wrap items-center justify-end gap-2 border-t border-line pt-3">
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={<X className="size-3.5" />}
                    disabled={busyId === s.id}
                    onClick={() => {
                      setFeedback('')
                      setFeedbackModal({ row: s, action: 'reject' })
                    }}
                  >
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={<MessageSquare className="size-3.5" />}
                    disabled={busyId === s.id}
                    onClick={() => {
                      setFeedback('')
                      setFeedbackModal({ row: s, action: 'changes_requested' })
                    }}
                  >
                    Request Changes
                  </Button>
                  {isProfile ? (
                    <Button
                      size="sm"
                      icon={<Check className="size-3.5" />}
                      loading={busyId === s.id}
                      onClick={() => handleAction(s, 'apply_profile')}
                    >
                      Approve &amp; Apply Profile
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      icon={<Rocket className="size-3.5" />}
                      loading={busyId === s.id}
                      onClick={() => handleAction(s, 'publish_to_feed')}
                    >
                      Approve &amp; Publish to Feed
                    </Button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <Dialog
        open={Boolean(feedbackModal)}
        onClose={() => setFeedbackModal(null)}
        title={feedbackModal?.action === 'reject' ? 'Reject Submission' : 'Request Changes'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setFeedbackModal(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => feedbackModal && handleAction(feedbackModal.row, feedbackModal.action, feedback)}
              loading={Boolean(feedbackModal && busyId === feedbackModal.row.id)}
            >
              Submit Feedback
            </Button>
          </>
        }
      >
        <Field label="Feedback for member">
          <Textarea rows={3} value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Explain what needs updating…" />
        </Field>
      </Dialog>
    </div>
  )
}
