import type { Metadata } from 'next'
import { getPayloadClient } from '@/lib/payload'
import { AdminSubmissionsView, type AdminSubmissionRow } from '@/components/admin/AdminSubmissionsView'

export const metadata: Metadata = { title: 'Submissions · MNI Admin' }

export default async function AdminSubmissionsPage() {
  const payload = await getPayloadClient()
  const res = await payload.find({
    collection: 'submissions',
    overrideAccess: true,
    sort: '-createdAt',
    limit: 150,
    depth: 1,
  })

  const submissions: AdminSubmissionRow[] = res.docs.map((s) => {
    const m = typeof s.submittedBy === 'object' ? s.submittedBy : null
    return {
      id: s.id,
      title: s.title,
      category: s.category,
      description: s.description,
      status: s.status ?? 'pending',
      adminFeedback: s.adminFeedback ?? null,
      createdAt: s.createdAt,
      memberName: m?.fullName ?? 'Member',
      businessName: m?.businessName ?? '',
    }
  })

  return <AdminSubmissionsView initialSubmissions={submissions} />
}
