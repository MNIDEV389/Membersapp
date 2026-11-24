'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useId, useState } from 'react'
import { api } from '@/lib/client-api'
import type { ContactRequestVM } from '@/lib/view-models'
import { Button } from '../ui/Button'
import { Dialog } from '../ui/Dialog'
import { Field, Textarea } from '../ui/Field'
import { useToast } from '../ui/Toast'
import { cn } from '../ui/cn'

type Answers = { calledContact: boolean; conversationTookPlace: boolean; businessGenerated: boolean; gaveBusiness: 'gave' | 'did_not_give'; remarks: string }

export function FollowUpDialog({ request, onClose }: { request: ContactRequestVM | null; onClose: () => void }) {
  const router = useRouter()
  const toast = useToast()
  const [a, setA] = useState<Answers>({ calledContact: true, conversationTookPlace: true, businessGenerated: false, gaveBusiness: 'did_not_give', remarks: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!request) return
    const f = request.followUp
    setError(null)
    setA({
      calledContact: f?.calledContact ?? true,
      conversationTookPlace: f?.conversationTookPlace ?? true,
      businessGenerated: f?.businessGenerated ?? false,
      gaveBusiness: f?.gaveBusiness ?? 'did_not_give',
      remarks: f?.remarks ?? '',
    })
  }, [request])

  const save = async () => {
    if (!request) return
    setSaving(true)
    setError(null)
    try {
      await api(`/api/app/contact-requests/${request.id}/follow-up`, { body: a })
      toast('Follow-up saved. Thanks for keeping MNI in the loop.')
      onClose()
      router.refresh()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      open={Boolean(request)}
      onClose={onClose}
      busy={saving}
      title="Record the outcome"
      description={request ? `Your introduction to ${request.target.fullName}` : undefined}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={save} loading={saving} loadingText="Saving…">Save outcome</Button>
        </>
      }
    >
      <div className="space-y-5">
        {error && <p role="alert" className="rounded-xl bg-danger-bg px-4 py-3 text-label text-danger">{error}</p>}
        <YesNo legend="Did you call the contact?" value={a.calledContact} onChange={(v) => setA((s) => ({ ...s, calledContact: v }))} />
        {a.calledContact && (
          <YesNo legend="Did a conversation take place?" value={a.conversationTookPlace} onChange={(v) => setA((s) => ({ ...s, conversationTookPlace: v }))} />
        )}
        {a.calledContact && a.conversationTookPlace && (
          <YesNo legend="Was business generated for you?" value={a.businessGenerated} onChange={(v) => setA((s) => ({ ...s, businessGenerated: v }))} />
        )}
        <Choice
          legend="Did you give business to them?"
          value={a.gaveBusiness}
          options={[{ value: 'gave', label: 'Yes, I gave business' }, { value: 'did_not_give', label: 'Not yet' }]}
          onChange={(v) => setA((s) => ({ ...s, gaveBusiness: v as Answers['gaveBusiness'] }))}
        />
        <Field label="Notes" optional counter={{ value: a.remarks.length, max: 1000 }}>
          <Textarea rows={3} maxLength={1000} value={a.remarks} onChange={(e) => setA((s) => ({ ...s, remarks: e.target.value }))} placeholder="What was agreed, next steps, deal size…" />
        </Field>
      </div>
    </Dialog>
  )
}

function YesNo({ legend, value, onChange }: { legend: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <Choice legend={legend} value={value ? 'yes' : 'no'} options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]} onChange={(v) => onChange(v === 'yes')} />
  )
}

function Choice({ legend, value, options, onChange }: { legend: string; value: string; options: { value: string; label: string }[]; onChange: (v: string) => void }) {
  const name = useId()
  return (
    <fieldset>
      <legend className="mb-2 text-label font-semibold text-ink">{legend}</legend>
      <div className="grid grid-cols-2 gap-2">
        {options.map((o) => (
          <label
            key={o.value}
            className={cn(
              'flex min-h-11 cursor-pointer items-center justify-center rounded-[var(--radius-control)] px-3 text-center text-label font-semibold ring-1 ring-inset transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand',
              value === o.value ? 'bg-brand text-white ring-brand' : 'bg-surface text-ink ring-line-strong hover:bg-subtle',
            )}
          >
            <input type="radio" name={name} value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} className="sr-only" />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
