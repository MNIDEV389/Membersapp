import type { Metadata } from 'next'
import { requireMember } from '@/lib/auth'
import { getMeetupsAndConnects } from '@/lib/data'
import { MeetupsView } from '@/components/meetups/MeetupsView'

export const metadata: Metadata = { title: 'Meetups & 1-on-1' }

export default async function MeetupsPage() {
  const me = await requireMember()
  const { meetups, connects, members } = await getMeetupsAndConnects(me)
  return <MeetupsView initialMeetups={meetups} initialConnects={connects} members={members} />
}
