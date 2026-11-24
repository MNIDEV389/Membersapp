'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { CALL_DAYS, CALL_TIME_SLOTS } from '@/lib/constants'
import { api, ApiError } from '@/lib/client-api'
import { profileChangeSchema, type ProfileChangeInput } from '@/lib/schemas'
import type { SelfProfile } from '@/lib/view-models'
import { Button } from '../ui/Button'
import { Dialog } from '../ui/Dialog'
import { Alert } from '../ui/Feedback'
import { Field, Input, Select, Textarea } from '../ui/Field'
import { useToast } from '../ui/Toast'

type FormState = Record<keyof ProfileChangeInput, string>

const fromProfile = (p: SelfProfile, pending: Record<string, string> | null): FormState => {
  const base: FormState = {
    fullName: p.fullName,
    phone: p.phone,
    city: p.city,
    businessName: p.businessName,
    businessCategory: p.businessCategory,
    websiteUrl: p.websiteUrl ?? '',
    whatWeDo: p.whatWeDo ?? p.bio ?? '',
    keyProductService: p.keyProductService ?? '',
    idealClient: p.idealClient ?? '',
    opportunityLookingFor: p.opportunityLookingFor ?? '',
    targetConnections: p.targetConnections ?? '',
    preferredCallDay: p.preferredCallDay ?? '',
    preferredCallTime: p.preferredCallTime ?? '',
    additionalNotes: p.additionalNotes ?? '',
  }
  return { ...base, ...(pending ?? {}) }
}

export function EditProfileDialog({ open, onClose, profile, pendingChanges }: { open: boolean; onClose: () => void; profile: SelfProfile; pendingChanges: Record<string, string> | null }) {
  const router = useRouter()
  const toast = useToast()
  const [form, setForm] = useState<FormState>(() => fromProfile(profile, pendingChanges))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(fromProfile(profile, pendingChanges))
      setErrors({})
      setFormError(null)
    }
  }, [open, profile, pendingChanges])

  const set = (k: keyof FormState) => (e: { target: { value: string } }) => {
    setForm((f) => ({ ...f, [k]: e.target.value }))
    if (errors[k]) setErrors(({ [k]: _, ...rest }) => rest)
  }

  const save = async () => {
    setFormError(null)
    const parsed = profileChangeSchema.safeParse(form)
    if (!parsed.success) {
      const errs: Record<string, string> = {}
      for (const i of parsed.error.issues) errs[String(i.path[0])] ??= i.message
      setErrors(errs)
      setFormError('Please fix the highlighted fields.')
      document.getElementById(`pf-${Object.keys(errs)[0]}`)?.focus()
      return
    }
    setSaving(true)
    try {
      await api('/api/app/profile-change', { body: parsed.data })
      toast('Sent for review. Your profile updates once MNI approves.')
      onClose()
      router.refresh()
    } catch (err) {
      const apiErr = err as ApiError
      setFormError(apiErr.message)
      setErrors(apiErr.fieldErrors ?? {})
    } finally {
      setSaving(false)
    }
  }

  const count = (k: keyof FormState, max: number) => ({ value: form[k].length, max })

  return (
    <Dialog
      open={open}
      onClose={onClose}
      busy={saving}
      size="lg"
      title="Edit profile"
      description="Changes are reviewed by MNI before other members see them."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={save} loading={saving} loadingText="Sending…">Send for review</Button>
        </>
      }
    >
      <div className="space-y-6">
        {formError && <Alert tone="danger">{formError}</Alert>}

        <fieldset className="space-y-4">
          <legend className="mb-1 text-caption font-bold uppercase tracking-wider text-muted">Basics</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" required error={errors.fullName}><Input id="pf-fullName" autoComplete="name" value={form.fullName} onChange={set('fullName')} /></Field>
            <Field label="Phone" required error={errors.phone}><Input id="pf-phone" type="tel" inputMode="tel" autoComplete="tel" value={form.phone} onChange={set('phone')} /></Field>
            <Field label="Business name" required error={errors.businessName}><Input id="pf-businessName" autoComplete="organization" value={form.businessName} onChange={set('businessName')} /></Field>
            <Field label="Business category" required error={errors.businessCategory}><Input id="pf-businessCategory" value={form.businessCategory} onChange={set('businessCategory')} placeholder="e.g. Commercial print & packaging" /></Field>
            <Field label="Chapter city" required error={errors.city}><Input id="pf-city" autoComplete="address-level2" value={form.city} onChange={set('city')} /></Field>
            <Field label="Website" optional error={errors.websiteUrl}><Input id="pf-websiteUrl" type="url" inputMode="url" value={form.websiteUrl} onChange={set('websiteUrl')} placeholder="www.yourcompany.com" /></Field>
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="mb-1 text-caption font-bold uppercase tracking-wider text-muted">Your business</legend>
          <Field label="What do you do?" required error={errors.whatWeDo} hint="Your expertise and what you offer, in a few sentences." counter={count('whatWeDo', 1500)}>
            <Textarea id="pf-whatWeDo" rows={4} maxLength={1500} value={form.whatWeDo} onChange={set('whatWeDo')} />
          </Field>
          <Field label="Key product or service" optional error={errors.keyProductService} counter={count('keyProductService', 800)}>
            <Textarea id="pf-keyProductService" rows={2} maxLength={800} value={form.keyProductService} onChange={set('keyProductService')} />
          </Field>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="mb-1 text-caption font-bold uppercase tracking-wider text-muted">Networking</legend>
          <Field label="Ideal client" optional error={errors.idealClient} counter={count('idealClient', 500)}>
            <Textarea id="pf-idealClient" rows={2} maxLength={500} value={form.idealClient} onChange={set('idealClient')} placeholder="Who should members introduce you to?" />
          </Field>
          <Field label="Opportunity you’re looking for right now" optional error={errors.opportunityLookingFor} counter={count('opportunityLookingFor', 500)}>
            <Textarea id="pf-opportunityLookingFor" rows={2} maxLength={500} value={form.opportunityLookingFor} onChange={set('opportunityLookingFor')} />
          </Field>
          <Field label="People you’d like to meet" optional error={errors.targetConnections} counter={count('targetConnections', 300)}>
            <Input id="pf-targetConnections" maxLength={300} value={form.targetConnections} onChange={set('targetConnections')} placeholder="e.g. Procurement heads at FMCG companies" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Best day to call" optional>
              <Select id="pf-preferredCallDay" value={form.preferredCallDay} onChange={set('preferredCallDay')}>
                <option value="">No preference</option>
                {CALL_DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
              </Select>
            </Field>
            <Field label="Best time to call" optional>
              <Select id="pf-preferredCallTime" value={form.preferredCallTime} onChange={set('preferredCallTime')}>
                <option value="">No preference</option>
                {CALL_TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
              </Select>
            </Field>
          </div>
          <Field label="Anything else members should know?" optional error={errors.additionalNotes} counter={count('additionalNotes', 500)}>
            <Textarea id="pf-additionalNotes" rows={2} maxLength={500} value={form.additionalNotes} onChange={set('additionalNotes')} />
          </Field>
        </fieldset>
      </div>
    </Dialog>
  )
}
