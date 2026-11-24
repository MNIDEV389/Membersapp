'use client'

import { FileText, ShieldCheck } from 'lucide-react'
import { useRef, useState } from 'react'
import { SUBMISSION_STATUSES } from '@/lib/constants'
import { formatDate } from '@/lib/format'
import type { SubmissionVM } from '@/lib/view-models'
import { StatusPill, type Tone } from '../ui/Badges'
import { Button } from '../ui/Button'
import { Alert, EmptyState } from '../ui/Feedback'
import { SubmissionForm } from './SubmissionForm'

const tone: Record<string, Tone> = { pending: 'warning', changes_requested: 'danger', approved: 'success', published: 'success', rejected: 'neutral' }
const label = Object.fromEntries(SUBMISSION_STATUSES.map((s) => [s.value, s.label]))

export function SubmitView({ submissions }: { submissions: SubmissionVM[] }) {
  const [editing, setEditing] = useState<SubmissionVM | null>(null)
  const formRef = useRef<HTMLDivElement>(null)

  const startRevision = (s: SubmissionVM) => {
    setEditing(s)
    requestAnimationFrame(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-title font-bold text-navy">Submit to MNI</h1>
        <p className="mt-1 text-body text-muted">Share a business need, vendor request or opportunity. MNI reviews every submission before anything is shared.</p>
      </header>

      <Alert tone="info" title="Reviewed before it reaches the network">
        Only MNI publishes to the timeline. We may edit your post for clarity, ask for more detail, or decline it.
      </Alert>

      <div ref={formRef} className="scroll-mt-24">
        <SubmissionForm key={editing?.id ?? 'new'} editing={editing} onDone={() => setEditing(null)} />
      </div>

      <section id="my-submissions" aria-labelledby="mine-heading" className="scroll-mt-24 space-y-3">
        <h2 id="mine-heading" className="text-section font-bold text-navy">Your submissions</h2>
        {submissions.length === 0 ? (
          <EmptyState icon={<FileText className="size-5" aria-hidden="true" />} title="No submissions yet">
            Your submissions and their review status will appear here.
          </EmptyState>
        ) : (
          <ul className="space-y-3">
            {submissions.map((s) => (
              <li key={s.id} className="rounded-[var(--radius-card)] border border-line bg-surface p-4 shadow-card">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-body font-semibold text-navy">{s.title}</p>
                    <p className="text-caption text-muted">
                      {s.category} · {formatDate(s.createdAt)}
                      {s.revision > 1 ? ` · revision ${s.revision}` : ''}
                    </p>
                  </div>
                  <StatusPill tone={tone[s.status]}>{label[s.status]}</StatusPill>
                </div>
                <p className="mt-2 line-clamp-3 text-label text-ink/85">{s.description}</p>
                {s.adminFeedback && (
                  <div className="mt-3 rounded-2xl bg-subtle p-3">
                    <p className="flex items-center gap-1.5 text-caption font-semibold uppercase tracking-wider text-muted">
                      <ShieldCheck className="size-3.5 text-brand" aria-hidden="true" /> Note from MNI
                    </p>
                    <p className="mt-0.5 text-label text-ink/90">{s.adminFeedback}</p>
                  </div>
                )}
                {s.status === 'changes_requested' && (
                  <div className="mt-3 flex justify-end border-t border-line pt-3">
                    <Button size="sm" onClick={() => startRevision(s)} disabled={editing?.id === s.id}>
                      {editing?.id === s.id ? 'Editing above' : 'Revise & resubmit'}
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
