'use client'

import { Send, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { api, ApiError } from '@/lib/client-api'
import type { ID, PublicMember } from '@/lib/view-models'
import { Avatar, TierBadge } from '../ui/Badges'
import { Button } from '../ui/Button'
import { Dialog } from '../ui/Dialog'
import { Field, Textarea } from '../ui/Field'
import { useToast } from '../ui/Toast'

interface Props {
  member: PublicMember | null
  postId?: ID
  onClose: () => void
  onRequested: (memberId: ID) => void
}

export function ContactRequestDialog({ member, postId, onClose, onRequested }: Props) {
  const toast = useToast()
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (member) {
      setNote('')
      setError(null)
    }
  }, [member])

  const submit = async () => {
    if (!member) return
    setLoading(true)
    setError(null)
    try {
      await api('/api/app/contact-requests', { body: { targetMemberId: member.id, postId: postId ?? null, agendaNote: note } })
      onRequested(member.id)
      toast(`Request sent. We’ll let you know when ${member.fullName.split(' ')[0]}’s contact is shared.`)
      onClose()
    } catch (err) {
      const e = err as ApiError
      if (e.status === 409) {
        onRequested(member.id)
        onClose()
        toast(e.message)
        return
      }
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog
      open={Boolean(member)}
      onClose={onClose}
      busy={loading}
      title="Request an introduction"
      description="MNI will check with the member and share their contact with you."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={submit} loading={loading} loadingText="Sending…" icon={<Send className="size-[18px]" aria-hidden="true" />}>
            Send request
          </Button>
        </>
      }
    >
      {member && (
        <div className="space-y-5">
          <div className="flex items-center gap-3 rounded-2xl bg-subtle p-3 ring-1 ring-inset ring-line">
            <Avatar initials={member.avatarInitials} src={member.avatarUrl} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-body font-semibold text-navy">{member.fullName}</p>
              <p className="truncate text-label text-muted">{member.businessName}</p>
            </div>
            <TierBadge tier={member.tier} />
          </div>
          <Field
            label="What would you like to discuss?"
            optional
            hint="A clear agenda helps MNI make a better introduction."
            error={error ?? undefined}
            counter={{ value: note.length, max: 1000 }}
          >
            <Textarea
              rows={4}
              maxLength={1000}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Exploring a packaging partnership for 5,000 units a month from January."
            />
          </Field>
          <p className="flex items-start gap-2 text-caption text-muted">
            <ShieldCheck className="mt-px size-4 shrink-0 text-success" aria-hidden="true" />
            Introductions are consent-based. Contact details are shared only through MNI.
          </p>
        </div>
      )}
    </Dialog>
  )
}
