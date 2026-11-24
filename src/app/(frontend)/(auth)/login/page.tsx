import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentMember } from '@/lib/auth'
import { AuthShell } from '../AuthShell'
import { LoginForm } from './LoginForm'

export const metadata: Metadata = { title: 'Sign in' }

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams
  // Only allow same-site relative redirects.
  const safeNext = next && next.startsWith('/') && !next.startsWith('//') ? next : '/'
  if (await getCurrentMember()) redirect(safeNext)
  return (
    <AuthShell>
      <LoginForm next={safeNext} />
    </AuthShell>
  )
}
