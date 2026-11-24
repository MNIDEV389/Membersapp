import type { Metadata } from 'next'
import { requireMember } from '@/lib/auth'
import { getMyRank, getPendingProfileUpdate } from '@/lib/data'
import { toSelfProfile } from '@/lib/serializers'
import { ProfileView } from '@/components/profile/ProfileView'

export const metadata: Metadata = { title: 'Profile' }

export default async function ProfilePage() {
  const me = await requireMember()
  const [rank, pending] = await Promise.all([getMyRank(me), getPendingProfileUpdate(me)])
  return <ProfileView profile={toSelfProfile(me)} rank={rank} pending={pending} />
}
