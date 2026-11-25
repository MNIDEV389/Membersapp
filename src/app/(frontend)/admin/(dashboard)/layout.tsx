import type { ReactNode } from 'react'
import { requireAdmin } from '@/lib/admin-auth'
import { AdminShell } from '@/components/admin/AdminShell'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardLayout({ children }: { children: ReactNode }) {
  const admin = await requireAdmin()
  return (
    <AdminShell adminName={admin.fullName || 'MNI Admin'} adminEmail={admin.email}>
      {children}
    </AdminShell>
  )
}
