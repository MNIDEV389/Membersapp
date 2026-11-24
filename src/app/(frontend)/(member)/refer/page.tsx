import type { Metadata } from 'next'
import { requireMember } from '@/lib/auth'
import { getMyRank, getMyReferrals } from '@/lib/data'
import { ReferView } from '@/components/refer/ReferView'

export const metadata: Metadata = { title: 'Refer & earn' }

export default async function ReferPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const me = await requireMember()
  const [{ tab }, referrals, rank] = await Promise.all([searchParams, getMyReferrals(me), getMyRank(me)])
  return (
    <ReferView
      initialTab={tab === 'activity' ? 'activity' : tab === 'how' ? 'how' : 'refer'}
      coins={me.mniCoins ?? 0}
      rank={rank}
      referralCode={me.referralCode ?? null}
      referrals={referrals}
    />
  )
}
