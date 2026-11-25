'use client'

import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { api, ApiError } from '@/lib/client-api'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'

export function AdminLoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!email.trim() || !password) {
      setError('Enter your admin email and password.')
      return
    }
    setLoading(true)
    try {
      await api('/api/admin/auth/login', { body: { email: email.trim(), password } })
      window.location.assign('/admin')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Admin sign-in failed.')
      setLoading(false)
    }
  }

  return (
    <div className="rounded-[var(--radius-panel)] border border-white/15 bg-white/[0.07] p-6 text-white shadow-[0_24px_60px_-20px_rgba(0,0,0,0.65)] backdrop-blur-2xl sm:p-7">
      <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#9fbaff]">
        <ShieldCheck className="size-3.5" aria-hidden="true" />
        MNI Admin Console
      </div>
      <h1 className="mt-3 text-title font-bold">Admin Sign In</h1>
      <p className="mt-1 text-body text-on-navy-muted">Sign in to manage members, introductions, feed, and meetups.</p>

      {error && (
        <div role="alert" className="mt-5 rounded-2xl border border-[#ff9b91]/40 bg-[#ff6b5e]/15 px-4 py-3 text-label text-[#ffd9d5]">
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="admin-email" className="text-label font-semibold">
            Admin Email
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-3.5 size-5 text-on-navy-muted" aria-hidden="true" />
            <input
              id="admin-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@mni.network"
              className="h-12 w-full rounded-[var(--radius-control)] border border-white/20 bg-white/[0.08] pl-11 pr-4 text-body text-white placeholder:text-on-navy-muted/80 outline-none transition-colors focus:border-[#7ea2ff] focus:bg-white/[0.12] focus:ring-4 focus:ring-brand/30"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="admin-password" className="text-label font-semibold">
            Password
          </label>
          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute left-3.5 top-3.5 size-5 text-on-navy-muted" aria-hidden="true" />
            <input
              id="admin-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              className="h-12 w-full rounded-[var(--radius-control)] border border-white/20 bg-white/[0.08] pl-11 pr-12 text-body text-white placeholder:text-on-navy-muted/80 outline-none transition-colors focus:border-[#7ea2ff] focus:bg-white/[0.12] focus:ring-4 focus:ring-brand/30"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-1 top-1 grid size-10 place-items-center rounded-[10px] text-on-navy-muted hover:text-white"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
            </button>
          </div>
        </div>

        <Button type="submit" size="lg" fullWidth disabled={loading} className="mt-2">
          {loading ? <Spinner className="size-5" /> : null}
          {loading ? 'Signing in…' : 'Sign in to Admin'}
          {!loading && <ArrowRight className="size-5" aria-hidden="true" />}
        </Button>
      </form>
    </div>
  )
}
