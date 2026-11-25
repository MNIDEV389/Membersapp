'use client'

import { Coffee } from 'lucide-react'
import { useEffect, useState } from 'react'
import { api, ApiError } from '@/lib/client-api'
import type { CoffeeConnectVM, ID } from '@/lib/view-models'
import { Button } from '../ui/Button'
import { Dialog } from '../ui/Dialog'
import { Field, Input, Select, Textarea } from '../ui/Field'
import { useToast } from '../ui/Toast'
import { cn } from '../ui/cn'

const TIME_SLOTS = ['Tomorrow · 10:30 AM', 'Tomorrow · 4:00 PM', 'This Friday · 11:00 AM', 'Next Monday · 3:00 PM']

export interface CoffeeEligibleMember {
  id: ID
  fullName: string
  businessName: string
  city?: string
}

export function CoffeeInviteDialog({
  open,
  onClose,
  members,
  preselectedMember,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  members: CoffeeEligibleMember[]
  preselectedMember?: CoffeeEligibleMember | null
  onCreated?: (connect: CoffeeConnectVM) => void
}) {
  const toast = useToast()
  const [targetId, setTargetId] = useState('')
  const [proposedTime, setProposedTime] = useState(TIME_SLOTS[0])
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setTargetId(preselectedMember ? String(preselectedMember.id) : '')
      setProposedTime(TIME_SLOTS[0])
      setNote('')
    }
  }, [open, preselectedMember])

  const sendInvite = async () => {
    const finalId = preselectedMember ? preselectedMember.id : targetId
    if (!finalId) {
      toast('Select a member to invite', 'error')
      return
    }
    setSubmitting(true)
    try {
      const res = await api<{ ok: boolean; connect: CoffeeConnectVM }>('/api/app/coffee-connect', {
        body: { targetMemberId: Number(finalId), proposedTime, note },
      })
      onCreated?.(res.connect)
      toast('1-on-1 invite sent! +30 Contributor Points awarded.')
      onClose()
    } catch (err) {
      toast((err as ApiError).message || 'Failed to send invite', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      busy={submitting}
      title={preselectedMember ? `Invite ${preselectedMember.fullName.split(' ')[0]} for 1-on-1` : 'Organise 1-on-1 Meeting'}
      description="Invite a member whose contact you received from MNI Admin (+30 Contributor Points)."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={sendInvite}
            loading={submitting}
            loadingText="Sending…"
            icon={<Coffee className="size-4" aria-hidden="true" />}
          >
            Send 1-on-1 Invite
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {preselectedMember ? (
          <div className="rounded-2xl bg-subtle px-3.5 py-2.5 text-label">
            <p className="font-bold text-navy">{preselectedMember.fullName}</p>
            <p className="text-caption text-muted">{preselectedMember.businessName}</p>
          </div>
        ) : (
          <Field label="Choose received contact">
            <Select value={targetId} onChange={(e) => setTargetId(e.target.value)}>
              <option value="">Select a received contact…</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.fullName} — {m.businessName}
                  {m.city ? ` (${m.city})` : ''}
                </option>
              ))}
            </Select>
          </Field>
        )}

        <Field label="Preferred slot">
          <div>
            <Input
              value={proposedTime}
              onChange={(e) => setProposedTime(e.target.value)}
              placeholder="e.g. Tomorrow · 10:30 AM"
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {TIME_SLOTS.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setProposedTime(slot)}
                  className={cn(
                    'rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors',
                    proposedTime === slot ? 'bg-navy text-white' : 'bg-subtle text-muted hover:text-navy',
                  )}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>
        </Field>

        <Field label="Short agenda" optional>
          <Textarea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Let's catch up for 20 minutes to discuss partnership opportunities."
          />
        </Field>
      </div>
    </Dialog>
  )
}
