'use client'

import { ArrowRight, Eye, EyeOff, KeyRound, LockKeyhole, UserRound } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { api, ApiError } from '@/lib/client-api'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { cn } from '@/components/ui/cn'

const inputCls =
  'h-12 w-full rounded-[var(--radius-control)] border bg-white/[0.08] pl-11 pr-4 text-body text-white placeholder:text-on-navy-muted/80 outline-none transition-colors focus:bg-white/[0.12] focus:ring-4'

export function LoginForm({ next }: { next: string }) {
  const router = useRouter()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    const errs: Record<string, string> = {}
    if (!identifier.trim()) errs.identifier = 'Enter your email or Member ID'
    if (!password) errs.password = 'Enter your password'
    setFieldErrors(errs)
    if (Object.keys(errs).length) return

    setLoading(true)
    try {
      await api('/api/app/auth/login', { body: { identifier: identifier.trim(), password } })
      router.replace(next)
      router.refresh()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Sign-in failed. Please try again.')
      setFieldErrors(err instanceof ApiError ? err.fieldErrors : {})
      setLoading(false)
    }
  }

  const invalid = (k: string) => Boolean(fieldErrors[k])
  const ring = (k: string) =>
    invalid(k) ? 'border-[#ff9b91] focus:ring-[#ff9b91]/25' : 'border-white/20 focus:border-[#7ea2ff] focus:ring-brand/30'

  return (
    <div className="rounded-[var(--radius-panel)] border border-white/15 bg-white/[0.06] p-6 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.6)] backdrop-blur-2xl sm:p-7">
      <h1 className="text-title font-bold">Welcome back</h1>
      <p className="mt-1 text-body text-on-navy-muted">Sign in with the details MNI shared with you.</p>

      {error && (
        <div role="alert" className="mt-5 rounded-2xl border border-[#ff9b91]/40 bg-[#ff6b5e]/15 px-4 py-3 text-label text-[#ffd9d5]">
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="identifier" className="text-label font-semibold">
            Email or Member ID
          </label>
          <div className="relative">
            <UserRound className="pointer-events-none absolute left-3.5 top-3.5 size-5 text-on-navy-muted" aria-hidden="true" />
            <input
              id="identifier"
              name="username"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              inputMode="email"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="you@company.com or MNI-002184"
              aria-invalid={invalid('identifier') || undefined}
              aria-describedby={invalid('identifier') ? 'identifier-error' : undefined}
              className={cn(inputCls, ring('identifier'))}
            />
          </div>
          {fieldErrors.identifier && (
            <p id="identifier-error" className="text-label text-[#ffb4ab]">
              {fieldErrors.identifier}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-label font-semibold">
              Password
            </label>
            <Link href="/login-help?reason=forgot_password" className="text-label font-semibold text-[#9fbaff] hover:text-white">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute left-3.5 top-3.5 size-5 text-on-navy-muted" aria-hidden="true" />
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              aria-invalid={invalid('password') || undefined}
              aria-describedby={invalid('password') ? 'password-error' : undefined}
              className={cn(inputCls, 'pr-12', ring('password'))}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-1 top-1 grid size-10 place-items-center rounded-[10px] text-on-navy-muted hover:text-white"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
            >
              {showPassword ? <EyeOff className="size-5" aria-hidden="true" /> : <Eye className="size-5" aria-hidden="true" />}
            </button>
          </div>
          {fieldErrors.password && (
            <p id="password-error" className="text-label text-[#ffb4ab]">
              {fieldErrors.password}
            </p>
          )}
        </div>

        <Button type="submit" size="lg" fullWidth disabled={loading} className="mt-2">
          {loading ? <Spinner className="size-5" /> : null}
          {loading ? 'Signing in…' : 'Sign in'}
          {!loading && <ArrowRight className="size-5" aria-hidden="true" />}
        </Button>
      </form>

      <div className="mt-6 border-t border-white/10 pt-5 text-center">
        <p className="text-label text-on-navy-muted">New to MNI or don’t have login details?</p>
        <Link
          href="/login-help"
          className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-control)] border border-white/20 bg-white/[0.08] text-body font-semibold transition-colors hover:bg-white/15"
        >
          <KeyRound className="size-[18px] text-[#9fbaff]" aria-hidden="true" />
          Request login details
        </Link>
      </div>
    </div>
  )
}
