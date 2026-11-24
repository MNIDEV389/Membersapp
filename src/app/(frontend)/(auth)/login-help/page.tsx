import type { Metadata } from 'next'
import { AuthShell } from '../AuthShell'
import { LoginHelpForm } from './LoginHelpForm'

export const metadata: Metadata = { title: 'Request login details' }

const REASONS = ['new_credentials', 'forgot_password', 'verification_status', 'account_locked', 'other'] as const

export default async function LoginHelpPage({ searchParams }: { searchParams: Promise<{ reason?: string }> }) {
  const { reason } = await searchParams
  const initialReason = (REASONS as readonly string[]).includes(reason ?? '') ? (reason as (typeof REASONS)[number]) : 'new_credentials'
  return (
    <AuthShell>
      <LoginHelpForm initialReason={initialReason} />
    </AuthShell>
  )
}
