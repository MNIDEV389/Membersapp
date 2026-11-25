import type { ReactNode } from 'react'
import { AppHeader } from '@/components/layout/AppHeader'
import { BottomNav } from '@/components/layout/BottomNav'
import { requireMember } from '@/lib/auth'
import { getNotifications } from '@/lib/data'

// Every member page is personalised and must never be cached across users.
export const dynamic = 'force-dynamic'

export default async function MemberLayout({ children }: { children: ReactNode }) {
  const me = await requireMember()
  const { unreadCount } = await getNotifications(me)
  return (
    <div className="min-h-dvh pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
      <AppHeader initialUnread={unreadCount} />
      <main id="main" tabIndex={-1} className="mx-auto max-w-xl px-4 pt-5 pb-10 outline-none sm:px-6">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
