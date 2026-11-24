'use client'

import { ArrowLeft, Eye, EyeOff, LockKeyhole, Save } from 'lucide-react'
import Link from 'next/link'
import { useState, type FormEvent } from 'react'
import { api, ApiError } from '@/lib/client-api'
import { Button } from '@/components/ui/Button'
import { cn } from '@/components/ui/cn'
import { useToast } from '@/components/ui/Toast'

const inputCls =
  'h-12 w-full rounded-[var(--radius-control)] border border-line bg-surface pl-11 pr-12 text-body text-ink placeholder:text-muted outline-none transition-colors focus:border-brand focus:ring-4 focus:ring-brand/20'

export default function ChangePasswordPage() {
  const toast = useToast()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [done, setDone] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    const errs: Record<string, string> = {}
    if (!currentPassword) errs.currentPassword = 'Enter your current password'
    if (!newPassword || newPassword.length < 8) errs.newPassword = 'Password must be at least 8 characters'
    if (newPassword !== confirmPassword) errs.confirmPassword = 'Passwords do not match'
    setFieldErrors(errs)
    if (Object.keys(errs).length) return

    setLoading(true)
    try {
      await api('/api/app/auth/change-password', {
        body: { currentPassword, newPassword },
      })
      setDone(true)
      toast('Password changed successfully!')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not change password. Please try again.')
      if (err instanceof ApiError) setFieldErrors(err.fieldErrors)
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="space-y-5">
        <Link href="/profile" className="-ml-1 inline-flex items-center gap-1.5 text-label font-semibold text-muted hover:text-navy">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to profile
        </Link>
        <div className="rounded-[var(--radius-panel)] bg-surface p-7 text-center shadow-card">
          <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-success-bg text-success">
            <Save className="size-7" aria-hidden="true" />
          </div>
          <h1 className="mt-4 text-section font-bold text-navy">Password updated</h1>
          <p className="mt-2 text-body text-muted">Your new password is now active. Use it the next time you sign in.</p>
          <Link
            href="/profile"
            className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-[var(--radius-control)] bg-brand font-semibold text-white hover:bg-brand-strong"
          >
            Back to profile
          </Link>
        </div>
      </div>
    )
  }

  const invalid = (k: string) => Boolean(fieldErrors[k])

  return (
    <div className="space-y-5">
      <Link href="/profile" className="-ml-1 inline-flex items-center gap-1.5 text-label font-semibold text-muted hover:text-navy">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to profile
      </Link>

      <div className="rounded-[var(--radius-panel)] bg-surface p-6 shadow-card sm:p-7">
        <h1 className="text-title font-bold text-navy">Change password</h1>
        <p className="mt-1 text-body text-muted">Enter your current password and choose a new one.</p>

        {error && (
          <div role="alert" className="mt-5 rounded-2xl border border-danger/40 bg-danger-bg px-4 py-3 text-label text-danger">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="currentPassword" className="text-label font-semibold text-navy">Current password</label>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-3.5 top-3.5 size-5 text-muted" aria-hidden="true" />
              <input id="currentPassword" type={showCurrent ? 'text' : 'password'} autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Enter current password" aria-invalid={invalid('currentPassword') || undefined} className={cn(inputCls, invalid('currentPassword') ? 'border-danger focus:ring-danger/25' : '')} />
              <button type="button" onClick={() => setShowCurrent((v) => !v)} className="absolute right-1 top-1 grid size-10 place-items-center rounded-[10px] text-muted hover:text-navy" aria-label={showCurrent ? 'Hide' : 'Show'}>
                {showCurrent ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
              </button>
            </div>
            {fieldErrors.currentPassword && <p className="text-label text-danger">{fieldErrors.currentPassword}</p>}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="newPassword" className="text-label font-semibold text-navy">New password</label>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-3.5 top-3.5 size-5 text-muted" aria-hidden="true" />
              <input id="newPassword" type={showNew ? 'text' : 'password'} autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="At least 8 characters" aria-invalid={invalid('newPassword') || undefined} className={cn(inputCls, invalid('newPassword') ? 'border-danger focus:ring-danger/25' : '')} />
              <button type="button" onClick={() => setShowNew((v) => !v)} className="absolute right-1 top-1 grid size-10 place-items-center rounded-[10px] text-muted hover:text-navy" aria-label={showNew ? 'Hide' : 'Show'}>
                {showNew ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
              </button>
            </div>
            {fieldErrors.newPassword && <p className="text-label text-danger">{fieldErrors.newPassword}</p>}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="confirmPassword" className="text-label font-semibold text-navy">Confirm new password</label>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-3.5 top-3.5 size-5 text-muted" aria-hidden="true" />
              <input id="confirmPassword" type={showNew ? 'text' : 'password'} autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter new password" aria-invalid={invalid('confirmPassword') || undefined} className={cn(inputCls, invalid('confirmPassword') ? 'border-danger focus:ring-danger/25' : '')} />
            </div>
            {fieldErrors.confirmPassword && <p className="text-label text-danger">{fieldErrors.confirmPassword}</p>}
          </div>

          <Button type="submit" size="lg" fullWidth loading={loading} loadingText="Saving…" icon={<Save className="size-[18px]" aria-hidden="true" />}>
            Change password
          </Button>
        </form>
      </div>
    </div>
  )
}
