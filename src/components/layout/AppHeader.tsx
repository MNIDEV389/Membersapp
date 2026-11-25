'use client'

import { Bell, Calendar, CheckCheck, ChevronRight, FileText, Gift, UserRound, Users } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { api } from '@/lib/client-api'
import type { NotificationVM } from '@/lib/view-models'
import { Button } from '../ui/Button'
import { Dialog } from '../ui/Dialog'
import { EmptyState, Skeleton } from '../ui/Feedback'
import { cn } from '../ui/cn'
import { Wordmark } from './Logo'
import { timeAgo } from '@/lib/format'

const kindIcon = { submission: FileText, contact: Users, referral: Gift, profile: UserRound }

export function AppHeader({ initialUnread = 0 }: { initialUnread?: number }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [unread, setUnread] = useState(initialUnread)
  const [items, setItems] = useState<NotificationVM[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const data = await api<{ items: NotificationVM[]; unreadCount: number }>('/api/app/notifications')
      setItems(data.items)
      setUnread(data.unreadCount)
    } catch (e) {
      setError((e as Error).message)
    }
  }, [])

  useEffect(() => {
    // Fetch unread badge in background so SSR page switches are never blocked
    api<{ items: NotificationVM[]; unreadCount: number }>('/api/app/notifications')
      .then((data) => {
        setItems(data.items)
        setUnread(data.unreadCount)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (open) load()
  }, [open, load])

  const markSeen = async () => {
    setUnread(0)
    setItems((all) => all?.map((i) => ({ ...i, unread: false })) ?? null)
    await api('/api/app/notifications', { method: 'POST', body: {} }).catch(() => {})
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line/80 bg-surface/90 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-xl items-center justify-between px-4 sm:px-6">
          <Link href="/" aria-label="MNI Members — Home" className="rounded-xl">
            <Wordmark />
          </Link>
          <div className="flex items-center gap-1">
            <Link
              href="/directory"
              aria-label="Member Directory"
              title="Member Directory"
              className={cn(
                'grid size-10 place-items-center rounded-full transition-colors',
                pathname.startsWith('/directory') ? 'bg-pale text-brand' : 'text-navy hover:bg-navy/5',
              )}
            >
              <Users className="size-[20px]" aria-hidden="true" />
            </Link>
            <Link
              href="/meetups"
              aria-label="Meetups & 1-on-1"
              title="Meetups & 1-on-1"
              className={cn(
                'grid size-10 place-items-center rounded-full transition-colors',
                pathname.startsWith('/meetups') ? 'bg-pale text-brand' : 'text-navy hover:bg-navy/5',
              )}
            >
              <Calendar className="size-[20px]" aria-hidden="true" />
            </Link>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="relative grid size-10 place-items-center rounded-full text-navy transition-colors hover:bg-navy/5"
              aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
            >
              <Bell className={cn("size-[20px] transition-colors", unread > 0 ? "fill-brand text-brand" : "text-navy")} aria-hidden="true" />
              {unread > 0 && (
                <span className="absolute right-1.5 top-1.5 size-2.5 rounded-full bg-brand ring-2 ring-surface" aria-label="Unread notifications" />
              )}
            </button>
          </div>
        </div>
      </header>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Notifications"
        description="Updates on your submissions, introductions and referrals."
        footer={
          <Button variant="ghost" onClick={markSeen} disabled={!unread} icon={<CheckCheck className="size-4" aria-hidden="true" />}>
            Mark all as read
          </Button>
        }
      >
        {error ? (
          <p className="text-label text-danger">{error}</p>
        ) : items === null ? (
          <div className="space-y-3" aria-label="Loading notifications">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState icon={<Bell className="size-5" aria-hidden="true" />} title="You’re all caught up">
            We’ll let you know when MNI reviews a submission, shares a contact or confirms a referral.
          </EmptyState>
        ) : (
          <ul className="-mx-2 space-y-1">
            {items.map((n) => {
              const Icon = kindIcon[n.kind]
              return (
                <li key={n.id}>
                  <Link
                    href={n.href}
                    onClick={() => setOpen(false)}
                    className={cn('flex items-start gap-3 rounded-2xl p-3 transition-colors hover:bg-subtle', n.unread && 'bg-pale/60')}
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-pale text-brand">
                      <Icon className="size-[18px]" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="text-label font-semibold text-navy">{n.title}</span>
                        <time className="text-caption text-muted" dateTime={n.at}>
                          {timeAgo(n.at)}
                        </time>
                      </span>
                      <span className="mt-0.5 block text-label text-ink/85">{n.message}</span>
                    </span>
                    {n.unread ? (
                      <span className="mt-2 size-2 shrink-0 rounded-full bg-brand" aria-label="Unread" />
                    ) : (
                      <ChevronRight className="mt-2.5 size-4 shrink-0 text-muted" aria-hidden="true" />
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </Dialog>
    </>
  )
}

