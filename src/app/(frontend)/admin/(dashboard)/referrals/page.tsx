import type { Metadata } from 'next'
import { getPayloadClient } from '@/lib/payload'
import { AdminReferralsView, type AdminReferralRow } from '@/components/admin/AdminReferralsView'

export const metadata: Metadata = { title: 'Referrals & Coins · MNI Admin' }

export default async function AdminReferralsPage() {
  const payload = await getPayloadClient()
  const [refsRes, membersRes] = await Promise.all([
    payload.find({ collection: 'referrals', overrideAccess: true, sort: '-createdAt', limit: 150, depth: 1 }),
    payload.find({ collection: 'members', overrideAccess: true, sort: 'fullName', limit: 200, depth: 0 }),
  ])

  const referrals: AdminReferralRow[] = refsRes.docs.map((r) => {
    const m = typeof r.referrer === 'object' ? r.referrer : null
    return {
      id: r.id,
      candidateName: r.candidateName,
      candidateEmail: r.candidateEmail,
      candidatePhone: r.candidatePhone,
      context: r.context ?? null,
      status: r.status ?? 'pending_review',
      coinsAwarded: r.coinsAwarded ?? 0,
      createdAt: r.createdAt,
      referrerName: m?.fullName ?? 'Member',
      referrerBusiness: m?.businessName ?? '',
    }
  })

  const members = membersRes.docs.map((m) => ({
    id: m.id,
    fullName: m.fullName,
    businessName: m.businessName,
  }))

  return <AdminReferralsView initialReferrals={referrals} members={members} />
}
