import type { ReactNode } from 'react'
import { LogoMark } from '@/components/layout/Logo'

/** Branded navy canvas shared by the sign-in and request-access screens. */
export function AuthShell({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-[radial-gradient(120%_80%_at_50%_0%,#1a3f86_0%,#102c60_45%,#081733_100%)] text-white">
      <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-0 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-brand/25 blur-3xl" />
      <main id="main" className="relative z-10 mx-auto flex w-full max-w-[440px] flex-1 flex-col justify-center px-5 py-10">
        <div className="mb-8 flex flex-col items-center text-center">
          <LogoMark className="size-16 drop-shadow-[0_10px_30px_rgba(33,92,229,0.45)]" />
          <p className="mt-4 text-caption font-semibold uppercase tracking-[0.2em] text-on-navy-muted">MNI Members</p>
        </div>
        {children}
      </main>
      <footer className="relative z-10 pb-[max(env(safe-area-inset-bottom),1.25rem)] text-center text-caption text-on-navy-muted">
        {footer ?? 'MNI · A curated private business network'}
      </footer>
    </div>
  )
}
