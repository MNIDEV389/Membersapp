'use client'

import { Sparkles, Trophy } from 'lucide-react'
import { useState } from 'react'
import { api, ApiError } from '@/lib/client-api'
import type { CelebrationVM, ID } from '@/lib/view-models'
import { Button } from '../ui/Button'
import { Dialog } from '../ui/Dialog'
import { Field, Input, Select, Textarea } from '../ui/Field'
import { useToast } from '../ui/Toast'

interface Props {
  open: boolean
  myId: ID
  members: { id: number; fullName: string; businessName: string }[]
  onClose: () => void
  onCreated: (celebration: CelebrationVM) => void
}

export function CelebrationModal({ open, myId, members, onClose, onCreated }: Props) {
  const toast = useToast()
  const [toMemberId, setToMemberId] = useState('')
  const [amountLabel, setAmountLabel] = useState('')
  const [story, setStory] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const eligibleMembers = members.filter((m) => String(m.id) !== String(myId))

  const submit = async () => {
    setError(null)
    if (!toMemberId) {
      setError('Please select the member you closed business with.')
      return
    }
    if (!amountLabel.trim()) {
      setError('Enter deal value or milestone (e.g. ₹3,50,000 or Annual Retainer).')
      return
    }
    if (!story.trim()) {
      setError('Share a short note on how MNI helped make it happen.')
      return
    }

    setLoading(true)
    try {
      const res = await api<{ ok: boolean; celebration: CelebrationVM }>('/api/app/celebrations', {
        body: {
          toMemberId: Number(toMemberId),
          amountLabel: amountLabel.trim(),
          story: story.trim(),
        },
      })
      onCreated(res.celebration)
      toast('Celebration posted! +50 Active Contributor Points awarded.')
      setToMemberId('')
      setAmountLabel('')
      setStory('')
      onClose()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not post celebration.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      busy={loading}
      title="Celebrate Closed Business"
      description="Recognise an MNI member you did business with and earn +50 Contributor Points."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={submit}
            loading={loading}
            loadingText="Posting…"
            icon={<Trophy className="size-4" aria-hidden="true" />}
          >
            Post celebration
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-2.5 rounded-2xl bg-[#FFFBEB] px-3.5 py-2.5 text-caption font-medium text-[#92400E] ring-1 ring-inset ring-[#FDE68A]">
          <Sparkles className="size-4 shrink-0 text-[#D97706]" />
          <span>Closed deals build trust across the chapter and spotlight active contributors.</span>
        </div>

        <Field label="Member you worked with" error={error && !toMemberId ? error : undefined}>
          <Select value={toMemberId} onChange={(e) => setToMemberId(e.target.value)}>
            <option value="">Select an MNI member…</option>
            {eligibleMembers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.fullName} — {m.businessName}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Deal value or milestone">
          <Input
            value={amountLabel}
            onChange={(e) => setAmountLabel(e.target.value)}
            placeholder="e.g. ₹4,50,000 Annual Contract"
            maxLength={80}
          />
        </Field>

        <Field label="How did it happen?" counter={{ value: story.length, max: 500 }} error={error ?? undefined}>
          <Textarea
            rows={3}
            maxLength={500}
            value={story}
            onChange={(e) => setStory(e.target.value)}
            placeholder="e.g. Connected through MNI timeline and launched our new packaging rollout!"
          />
        </Field>
      </div>
    </Dialog>
  )
}
