import type { Metadata } from 'next'
import { requireMember } from '@/lib/auth'
import { getTimeline } from '@/lib/data'
import { HomeFeed } from '@/components/timeline/HomeFeed'

export const metadata: Metadata = { title: 'Home' }

export default async function HomePage() {
  const me = await requireMember()
  const { posts, banners, requestedMemberIds } = await getTimeline(me)
  const firstName = me.fullName.split(' ')[0]

  return (
    <HomeFeed
      firstName={firstName}
      myId={me.id}
      posts={posts}
      banners={banners}
      requestedMemberIds={requestedMemberIds.map(String)}
    />
  )
}
