import type { Metadata } from 'next'
import { getPayloadClient } from '@/lib/payload'
import { AdminRequestsView, type AdminRequestRow } from '@/components/admin/AdminRequestsView'

export const metadata: Metadata = { title: 'Contact Requests · MNI Admin' }

export default async function AdminRequestsPage() {
  const payload = await getPayloadClient()
  const res = await payload.find({
    collection: 'contact-requests',
    overrideAccess: true,
    sort: '-createdAt',
    limit: 200,
    depth: 1,
  })

  const requests: AdminRequestRow[] = res.docs.map((r) => {
    const reqBy = typeof r.requestedBy === 'object' ? r.requestedBy : null
    const tgt = typeof r.targetMember === 'object' ? r.targetMember : null
    const post = typeof r.post === 'object' ? r.post : null
    return {
      id: r.id,
      status: r.status ?? 'pending',
      agendaNote: r.agendaNote ?? null,
      adminNote: r.adminNote ?? null,
      createdAt: r.createdAt,
      postTitle: post?.title ?? null,
      requester: {
        id: reqBy?.id ?? 0,
        fullName: reqBy?.fullName ?? 'Member',
        businessName: reqBy?.businessName ?? '',
        email: reqBy?.email ?? '',
      },
      target: {
        id: tgt?.id ?? 0,
        fullName: tgt?.fullName ?? 'Member',
        businessName: tgt?.businessName ?? '',
        phone: tgt?.phone ?? '',
        email: tgt?.email ?? '',
      },
      businessGenerated: Boolean(r.followUp?.businessGenerated),
      followUp: r.followUp?.recordedAt
        ? {
            calledContact: Boolean(r.followUp.calledContact),
            conversationTookPlace: Boolean(r.followUp.conversationTookPlace),
            businessGenerated: Boolean(r.followUp.businessGenerated),
            gaveBusiness: (r.followUp.gaveBusiness as 'gave' | 'did_not_give') ?? null,
            remarks: r.followUp.remarks ?? null,
            recordedAt: r.followUp.recordedAt ?? null,
          }
        : null,
    }
  })

  return <AdminRequestsView initialRequests={requests} />
}
