'use client'

import { Check, CheckCircle2, PhoneCall, Handshake, MessageSquare, Briefcase } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useId, useState } from 'react'
import { api } from '@/lib/client-api'
import type { ContactRequestVM } from '@/lib/view-models'
import { Button } from '../ui/Button'
import { Dialog } from '../ui/Dialog'
import { Field, Textarea } from '../ui/Field'
import { useToast } from '../ui/Toast'
import { cn } from '../ui/cn'

type Answers = {
  calledContact: boolean
  conversationTookPlace: boolean
  businessGenerated: boolean
  gaveBusiness: 'gave' | 'did_not_give'
  remarks: string
}

export function FollowUpDialog({
  request,
  onClose,
}: {
  request: ContactRequestVM | null
  onClose: () => void
}) {
  const router = useRouter()
  const toast = useToast()
  const [a, setA] = useState<Answers>({
    calledContact: true,
    conversationTookPlace: true,
    businessGenerated: false,
    gaveBusiness: 'did_not_give',
    remarks: '',
  })
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
      toast('Follow-up checklist saved. Thanks for keeping MNI in the loop!')
      onClose()
      router.refresh()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  // Calculate checklist progress
  const answeredSteps = [
    a.calledContact !== undefined,
    a.conversationTookPlace !== undefined,
    a.businessGenerated !== undefined,
    Boolean(a.gaveBusiness),
  ].filter(Boolean).length

  return (
    <Dialog
      open={Boolean(request)}
      onClose={onClose}
      busy={saving}
      title="Introduction Follow-up Checklist"
      description={
        request
          ? `Check off your interaction progress with ${request.target.fullName} (${request.target.businessName})`
          : undefined
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={save} loading={saving} loadingText="Saving checklist…">
            Submit Checklist
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && (
          <p role="alert" className="rounded-xl bg-danger-bg px-4 py-3 text-label text-danger">
            {error}
          </p>
        )}

        <div className="rounded-xl bg-pale/70 p-3 flex items-center justify-between text-caption text-navy">
          <span className="font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="size-4 text-brand" /> Checklist Items (4 Questions)
          </span>
          <span className="text-muted font-medium">Recorded in MNI Network</span>
        </div>

        {/* Item 1: Contacted */}
        <div className="rounded-2xl border border-line bg-surface p-3.5 space-y-2">
          <div className="flex items-start gap-2.5">
            <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-brand">
              <PhoneCall className="size-3.5" />
            </div>
            <div className="flex-1">
              <p className="text-label font-bold text-navy">1. Did you call or message the contact?</p>
              <p className="text-caption text-muted">Did you reach out via phone, WhatsApp, or email?</p>
            </div>
          </div>
          <YesNo
            legend=""
            value={a.calledContact}
            onChange={(v) =>
              setA((s) => ({
                ...s,
                calledContact: v,
                conversationTookPlace: v ? s.conversationTookPlace : false,
                businessGenerated: v ? s.businessGenerated : false,
              }))
            }
          />
        </div>

        {/* Item 2: Conversation */}
        {a.calledContact && (
          <div className="rounded-2xl border border-line bg-surface p-3.5 space-y-2">
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-700">
                <MessageSquare className="size-3.5" />
              </div>
              <div className="flex-1">
                <p className="text-label font-bold text-navy">2. Did a conversation or meeting take place?</p>
                <p className="text-caption text-muted">Did you speak, meet in person, or hold a virtual connect?</p>
              </div>
            </div>
            <YesNo
              legend=""
              value={a.conversationTookPlace}
              onChange={(v) =>
                setA((s) => ({
                  ...s,
                  conversationTookPlace: v,
                  businessGenerated: v ? s.businessGenerated : false,
                }))
              }
            />
          </div>
        )}

        {/* Item 3: Business Generated */}
        {a.calledContact && a.conversationTookPlace && (
          <div className="rounded-2xl border border-line bg-surface p-3.5 space-y-2">
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <Briefcase className="size-3.5" />
              </div>
              <div className="flex-1">
                <p className="text-label font-bold text-navy">3. Was business or deal opportunity generated?</p>
                <p className="text-caption text-muted">Did you explore a client requirement or commercial deal?</p>
              </div>
            </div>
            <YesNo
              legend=""
              value={a.businessGenerated}
              onChange={(v) => setA((s) => ({ ...s, businessGenerated: v }))}
            />
          </div>
        )}

        {/* Item 4: Gave Business / Referral */}
        <div className="rounded-2xl border border-line bg-surface p-3.5 space-y-2">
          <div className="flex items-start gap-2.5">
            <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <Handshake className="size-3.5" />
            </div>
            <div className="flex-1">
              <p className="text-label font-bold text-navy">4. Did you give business or a referral to them?</p>
              <p className="text-caption text-muted">Did you hire them or pass a relevant referral?</p>
            </div>
          </div>
          <Choice
            legend=""
            value={a.gaveBusiness}
            options={[
              { value: 'gave', label: '✓ Yes, gave business / referral' },
              { value: 'did_not_give', label: 'Not yet / In talks' },
            ]}
            onChange={(v) => setA((s) => ({ ...s, gaveBusiness: v as Answers['gaveBusiness'] }))}
          />
        </div>

        {/* Item 5: Notes & Remarks */}
        <Field label="Checklist Notes & Next Steps" optional counter={{ value: a.remarks.length, max: 1000 }}>
          <Textarea
            rows={3}
            maxLength={1000}
            value={a.remarks}
            onChange={(e) => setA((s) => ({ ...s, remarks: e.target.value }))}
            placeholder="E.g., Spoke for 20 mins, shared proposal. Follow-up meeting scheduled next week."
          />
        </Field>
      </div>
    </Dialog>
  )
}

function YesNo({
  legend,
  value,
  onChange,
}: {
  legend?: string
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <Choice
      legend={legend}
      value={value ? 'yes' : 'no'}
      options={[
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: 'No' },
      ]}
      onChange={(v) => onChange(v === 'yes')}
    />
  )
}

function Choice({
  legend,
  value,
  options,
  onChange,
}: {
  legend?: string
  value: string
  options: { value: string; label: string }[]
  onChange: (v: string) => void
}) {
  const name = useId()
  return (
    <fieldset>
      {legend && <legend className="mb-2 text-label font-semibold text-ink">{legend}</legend>}
      <div className="grid grid-cols-2 gap-2">
        {options.map((o) => (
          <label
            key={o.value}
            className={cn(
              'flex min-h-11 cursor-pointer items-center justify-center rounded-[var(--radius-control)] px-3 text-center text-label font-semibold ring-1 ring-inset transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand',
              value === o.value
                ? 'bg-brand text-white ring-brand shadow-sm'
                : 'bg-surface text-ink ring-line-strong hover:bg-subtle',
            )}
          >
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={value === o.value}
              onChange={() => onChange(o.value)}
              className="sr-only"
            />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
