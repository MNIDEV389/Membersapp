import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentAdmin } from '@/lib/admin-auth'
import { AuthShell } from '../../(auth)/AuthShell'
import { AdminLoginForm } from '@/components/admin/AdminLoginForm'

export const metadata: Metadata = { title: 'Admin Sign In · MNI' }

export default async function AdminLoginPage() {
  if (await getCurrentAdmin()) redirect('/admin')
  return (
    <AuthShell footer="MNI Admin Console · Restricted Internal Access">
      <AdminLoginForm />
    </AuthShell>
  )
}
