'use client'

import { ArrowLeft, CheckCircle2, Send } from 'lucide-react'
import Link from 'next/link'
import { useState, type FormEvent } from 'react'
import { api, ApiError } from '@/lib/client-api'
import { loginHelpSchema } from '@/lib/schemas'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'

type Reason = 'new_credentials' | 'forgot_password' | 'verification_status' | 'account_locked' | 'other'

const reasons: { value: Reason; label: string }[] = [
  { value: 'new_credentials', label: 'I’m a member and need my login details' },
  { value: 'forgot_password', label: 'I forgot my password' },
  { value: 'account_locked', label: 'My account is locked or inactive' },
  { value: 'verification_status', label: 'Check my membership verification' },
  { value: 'other', label: 'Something else' },
]

export function LoginHelpForm({ initialReason }: { initialReason: Reason }) {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    whatsapp: '',
    businessName: '',
    issueType: initialReason,
    details: '',
    website: '',
  })
  const [sameWhatsapp, setSameWhatsapp] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => {
    setForm((f) => ({ ...f, [k]: e.target.value }))
    if (errors[k]) setErrors(({ [k]: _, ...rest }) => rest)
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setFormError(null)
    const payload = { ...form, whatsapp: sameWhatsapp ? '' : form.whatsapp }
    const parsed = loginHelpSchema.safeParse(payload)
    if (!parsed.success) {
      const errs: Record<string, string> = {}
      for (const i of parsed.error.issues) errs[String(i.path[0])] ??= i.message
      setErrors(errs)
      document.getElementById(`lh-${Object.keys(errs)[0]}`)?.focus()
      return
    }
    setLoading(true)
    try {
      await api('/api/app/auth/login-help', { body: payload })
      setDone(true)
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Could not send your request.')
      if (err instanceof ApiError) setErrors(err.fieldErrors)
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="rounded-[var(--radius-panel)] bg-surface p-7 text-center text-ink shadow-raised">
        <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-success-bg text-success">
          <CheckCircle2 className="size-7" aria-hidden="true" />
        </div>
        <h1 className="mt-4 text-section font-bold text-navy">Request received</h1>
        <p className="mt-2 text-body text-muted">
          Thanks, {form.fullName.split(' ')[0]}. MNI administration will verify your details and send your login
          information to <span className="font-semibold text-ink">{form.email}</span> or WhatsApp.
        </p>
        <p className="mt-3 text-label text-muted">This usually takes up to one working day.</p>
        <Link
          href="/login"
          className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-[var(--radius-control)] bg-brand font-semibold text-white hover:bg-brand-strong"
        >
          Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <div className="flex h-[78dvh] max-h-[620px] min-h-[460px] w-full flex-col overflow-hidden rounded-[var(--radius-panel)] bg-surface text-ink shadow-raised sm:h-[640px]">
      {/* Top Header - Fixed inside card */}
      <div className="shrink-0 border-b border-black/[0.06] px-5 pt-4 pb-3 sm:px-6">
        <Link href="/login" className="-ml-1 inline-flex items-center gap-1.5 rounded-lg px-1 text-label font-semibold text-muted hover:text-navy">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to sign in
        </Link>
        <h1 className="mt-1.5 text-title font-bold text-navy">Request login details</h1>
        <p className="mt-0.5 text-caption text-muted">
          MNI is invite-only. Share your details to verify your membership and get login access.
        </p>
      </div>

      <form onSubmit={onSubmit} noValidate className="flex flex-1 flex-col overflow-hidden">
        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 sm:px-6">
          {formError && <p role="alert" className="rounded-xl bg-danger-bg px-4 py-3 text-label text-danger">{formError}</p>}

          <Field label="What do you need help with?" required>
            <Select value={form.issueType} onChange={set('issueType')} id="lh-issueType">
              {reasons.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Full name" required error={errors.fullName}>
            <Input id="lh-fullName" autoComplete="name" value={form.fullName} onChange={set('fullName')} placeholder="e.g. Vikram Malhotra" />
          </Field>
          <Field label="Work email" required error={errors.email}>
            <Input id="lh-email" type="email" autoComplete="email" inputMode="email" value={form.email} onChange={set('email')} placeholder="name@business.com" />
          </Field>
          <Field label="Mobile number" required error={errors.phone} hint="Include the country code.">
            <Input id="lh-phone" type="tel" autoComplete="tel" inputMode="tel" value={form.phone} onChange={set('phone')} placeholder="+91 98765 43210" />
          </Field>

          <label className="flex min-h-11 cursor-pointer items-center gap-3 text-label text-ink">
            <input type="checkbox" checked={sameWhatsapp} onChange={(e) => setSameWhatsapp(e.target.checked)} className="size-5 rounded accent-brand" />
            My WhatsApp number is the same
          </label>
          {!sameWhatsapp && (
            <Field label="WhatsApp number" error={errors.whatsapp}>
              <Input id="lh-whatsapp" type="tel" inputMode="tel" value={form.whatsapp} onChange={set('whatsapp')} placeholder="+91 98765 43210" />
            </Field>
          )}

          <Field label="Business name" optional error={errors.businessName}>
            <Input id="lh-businessName" autoComplete="organization" value={form.businessName} onChange={set('businessName')} placeholder="e.g. Malhotra Precision Tooling" />
          </Field>
          <Field label="Anything else we should know?" optional error={errors.details} counter={{ value: form.details.length, max: 1000 }}>
            <Textarea id="lh-details" rows={3} value={form.details} onChange={set('details')} placeholder="Your chapter, who introduced you, or details about the issue" />
          </Field>

          {/* Honeypot (hidden from people and assistive tech) */}
          <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
            <label>
              Website
              <input tabIndex={-1} autoComplete="off" value={form.website} onChange={set('website')} />
            </label>
          </div>
        </div>

        {/* Static Bottom Action Bar - Fixed at bottom of card */}
        <div className="shrink-0 border-t border-black/[0.06] bg-surface/95 px-5 py-3.5 backdrop-blur-sm sm:px-6">
          <Button type="submit" size="lg" fullWidth loading={loading} loadingText="Sending…" icon={<Send className="size-[18px]" aria-hidden="true" />}>
            Send request
          </Button>
          <p className="mt-1.5 text-center text-caption text-muted">Your details are only shared with MNI administration.</p>
        </div>
      </form>
    </div>
  )
}
