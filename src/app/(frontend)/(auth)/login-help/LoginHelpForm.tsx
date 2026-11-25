'use client'

import { CheckCircle2, ChevronLeft, Send } from 'lucide-react'
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
      <div className="rounded-[24px] bg-white p-7 text-center text-[#1C1C1E] shadow-[0_20px_50px_rgba(0,0,0,0.22)]">
        <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#E7F5F0] text-[#167C60]">
          <CheckCircle2 className="size-7" aria-hidden="true" />
        </div>
        <h1 className="mt-4 text-[20px] font-bold tracking-tight text-[#102C60]">Request received</h1>
        <p className="mt-2 text-[14px] leading-relaxed text-[#536477]">
          Thanks, {form.fullName.split(' ')[0]}. MNI administration will verify your details and send your login
          information to <span className="font-semibold text-[#1C1C1E]">{form.email}</span> or WhatsApp.
        </p>
        <p className="mt-3 text-[12px] text-[#8E8E93]">This usually takes up to one working day.</p>
        <Link
          href="/login"
          className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#007AFF] font-semibold text-white shadow-[0_4px_14px_rgba(0,122,255,0.32)] transition-all hover:bg-[#0066E0] active:scale-[0.98]"
        >
          Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <div className="flex h-[78dvh] max-h-[620px] min-h-[460px] w-full flex-col overflow-hidden rounded-[24px] bg-white text-[#1C1C1E] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] border border-white/20 sm:h-[640px]">
      {/* Top Header - Apple HIG Navigation Bar */}
      <div className="shrink-0 border-b border-[#F2F2F7] px-5 pt-4 pb-3 sm:px-6">
        <Link href="/login" className="-ml-1.5 inline-flex items-center gap-0.5 text-[15px] font-medium text-[#007AFF] hover:opacity-75 transition-opacity">
          <ChevronLeft className="size-5" strokeWidth={2.4} aria-hidden="true" />
          <span>Sign in</span>
        </Link>
        <h1 className="mt-1.5 text-[22px] sm:text-[24px] font-bold tracking-tight text-[#1C1C1E]">Request login details</h1>
        <p className="mt-0.5 text-[13px] leading-snug text-[#8E8E93]">
          MNI is invite-only. Share your details to verify your membership and get login access.
        </p>
      </div>

      <form onSubmit={onSubmit} noValidate className="flex flex-1 flex-col overflow-hidden">
        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 sm:px-6">
          {formError && <p role="alert" className="rounded-xl bg-[#FDECEA] px-3.5 py-2.5 text-[13px] text-[#FF3B30]">{formError}</p>}

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

          {/* Apple iOS Switch Toggle */}
          <div className="flex items-center justify-between rounded-xl bg-[#F4F5F8] px-3.5 py-3 border border-black/[0.06]">
            <div className="space-y-0.5 pr-3">
              <p className="text-[14px] font-medium text-[#1C1C1E]">WhatsApp number is same</p>
              <p className="text-[12px] text-[#8E8E93]">Use mobile number for WhatsApp verification</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={sameWhatsapp}
              onClick={() => setSameWhatsapp(!sameWhatsapp)}
              className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                sameWhatsapp ? 'bg-[#007AFF]' : 'bg-[#D1D1D6]'
              }`}
            >
              <span
                className={`pointer-events-none inline-block size-6 transform rounded-full bg-white shadow-[0_2px_4px_rgba(0,0,0,0.2)] ring-0 transition duration-200 ease-in-out ${
                  sameWhatsapp ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

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

          {/* Honeypot */}
          <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
            <label>
              Website
              <input tabIndex={-1} autoComplete="off" value={form.website} onChange={set('website')} />
            </label>
          </div>
        </div>

        {/* Static Bottom Action Bar - Apple HIG style */}
        <div className="shrink-0 border-t border-[#F2F2F7] bg-white/95 px-5 py-3.5 backdrop-blur-md sm:px-6">
          <Button
            type="submit"
            size="lg"
            fullWidth
            loading={loading}
            loadingText="Sending…"
            className="h-12 rounded-xl bg-[#007AFF] hover:bg-[#0066E0] active:scale-[0.98] text-[16px] font-semibold tracking-tight text-white shadow-[0_4px_14px_rgba(0,122,255,0.32)] transition-all duration-150"
            icon={<Send className="size-4" strokeWidth={2.2} aria-hidden="true" />}
          >
            Send request
          </Button>
          <p className="mt-1.5 text-center text-[12px] text-[#8E8E93]">Your details are only shared with MNI administration.</p>
        </div>
      </form>
    </div>
  )
}
