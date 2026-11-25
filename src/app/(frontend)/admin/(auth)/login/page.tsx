import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentAdmin } from '@/lib/admin-auth'
import { AdminLoginForm } from '@/components/admin/AdminLoginForm'
import { LogoMark } from '@/components/layout/Logo'

export const metadata: Metadata = { title: 'Admin Sign In · MNI' }

export default async function AdminLoginPage() {
  if (await getCurrentAdmin()) redirect('/admin')
  return (
    <div className="relative flex min-h-dvh flex-col overflow-x-hidden bg-[radial-gradient(120%_80%_at_50%_0%,#1a3f86_0%,#102c60_45%,#081733_100%)] text-white">
      <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-0 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-brand/25 blur-3xl" />
      <main id="main" className="relative z-10 mx-auto flex w-full max-w-[440px] flex-1 flex-col justify-center px-4 py-3 sm:px-5 sm:py-6">
        <div className="mb-6 flex flex-col items-center text-center sm:mb-8">
          <LogoMark className="size-14 drop-shadow-[0_10px_30px_rgba(33,92,229,0.45)] sm:size-16" />
          <p className="mt-2 text-caption font-semibold uppercase tracking-[0.2em] text-on-navy-muted">MNI Admin</p>
        </div>
        <AdminLoginForm />
      </main>
      <footer className="relative z-10 pb-[max(env(safe-area-inset-bottom),0.75rem)] text-center text-caption text-on-navy-muted">
        MNI Admin Console · Restricted Internal Access
      </footer>
    </div>
  )
}
