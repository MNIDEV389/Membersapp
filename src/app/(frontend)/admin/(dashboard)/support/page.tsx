import type { Metadata } from 'next'
import { getPayloadClient } from '@/lib/payload'
import { AdminSupportView, type AdminSupportRow } from '@/components/admin/AdminSupportView'

export const metadata: Metadata = { title: 'Support Queue · MNI Admin' }

export default async function AdminSupportPage() {
  const payload = await getPayloadClient()
  const res = await payload.find({
    collection: 'login-help-requests',
    overrideAccess: true,
    sort: '-createdAt',
    limit: 100,
    depth: 0,
  })

  const tickets: AdminSupportRow[] = res.docs.map((t) => ({
    id: t.id,
    reason: t.issueType,
    fullName: t.fullName,
    email: t.email,
    phone: t.phone,
    businessName: t.businessName ?? null,
    message: t.details ?? null,
    status: (t.status as AdminSupportRow['status']) ?? 'pending',
    createdAt: t.createdAt,
  }))

  return <AdminSupportView initialTickets={tickets} />
}
