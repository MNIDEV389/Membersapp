import type { Metadata } from 'next'
import { getPgPool } from '@/lib/db'
import { getPayloadClient } from '@/lib/payload'
import { AdminMembersView, type AdminMemberRow } from '@/components/admin/AdminMembersView'

export const metadata: Metadata = { title: 'Members · MNI Admin' }

export default async function AdminMembersPage() {
  const payload = await getPayloadClient()
  const pool = getPgPool()

  const [res, avatarsRes] = await Promise.all([
    payload.find({
      collection: 'members',
      overrideAccess: true,
      sort: '-createdAt',
      limit: 200,
      depth: 0,
    }),
    pool.query(`SELECT id, custom_avatar FROM members`),
  ])

  const avatarMap = new Map<number, string | null>()
  for (const r of avatarsRes.rows) avatarMap.set(Number(r.id), r.custom_avatar ?? null)

  const members: AdminMemberRow[] = res.docs.map((m) => ({
    id: m.id,
    fullName: m.fullName,
    email: m.email,
    phone: m.phone,
    city: m.city,
    businessName: m.businessName,
    businessCategory: m.businessCategory,
    memberId: m.memberId,
    tier: (m.tier === 'premium' ? 'premium' : 'freemium'),
    isVerified: Boolean(m.isVerified),
    accountStatus: (m.accountStatus === 'suspended' ? 'suspended' : 'active'),
    avatarInitials: m.avatarInitials || m.fullName.slice(0, 2).toUpperCase(),
    avatarUrl: avatarMap.get(m.id) ?? null,
    mniCoins: m.mniCoins ?? 0,
    referralCount: m.referralCount ?? 0,
  }))

  return <AdminMembersView initialMembers={members} />
}
