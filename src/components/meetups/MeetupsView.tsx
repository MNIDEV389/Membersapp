'use client'

import { ArrowLeft, Calendar, Check, Clock, Coffee, MapPin, Plus, Users, X } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { api, ApiError } from '@/lib/client-api'
import { formatDate, timeAgo } from '@/lib/format'
import type { CoffeeConnectVM, MeetupAttendeeVM, MeetupVM, PublicMember } from '@/lib/view-models'
import { Avatar } from '../ui/Badges'
import { Dialog } from '../ui/Dialog'
import { EmptyState } from '../ui/Feedback'
import { useToast } from '../ui/Toast'
import { cn } from '../ui/cn'
import { CoffeeInviteDialog } from './CoffeeInviteDialog'

export function MeetupsView({
  initialMeetups,
  initialConnects,
  members,
}: {
  initialMeetups: MeetupVM[]
  initialConnects: CoffeeConnectVM[]
  members: PublicMember[]
}) {
  const toast = useToast()
  const [meetups, setMeetups] = useState<MeetupVM[]>(initialMeetups)
  const [connects, setConnects] = useState<CoffeeConnectVM[]>(initialConnects)
  const [attendeesModal, setAttendeesModal] = useState<MeetupVM | null>(null)
  const [coffeeModalOpen, setCoffeeModalOpen] = useState(false)
  const [busyRsvp, setBusyRsvp] = useState<number | string | null>(null)

  const toggleRsvp = async (meetup: MeetupVM) => {
    setBusyRsvp(meetup.id)
    try {
      const res = await api<{
        ok: boolean
        isGoing: boolean
        attendeesCount: number
        attendees: MeetupAttendeeVM[]
      }>(`/api/app/meetups/${meetup.id}/rsvp`, { body: {} })

      setMeetups((prev) =>
        prev.map((m) =>
          m.id === meetup.id
            ? { ...m, isGoing: res.isGoing, attendeesCount: res.attendeesCount, attendees: res.attendees }
            : m,
        ),
      )
      toast(res.isGoing ? 'RSVP confirmed! +30 Contributor Points awarded.' : 'RSVP cancelled.')
    } catch (err) {
      toast((err as ApiError).message || 'Could not update RSVP', 'error')
    } finally {
      setBusyRsvp(null)
    }
  }

  const respondConnect = async (id: number | string, status: 'accepted' | 'declined') => {
    try {
      await api('/api/app/coffee-connect', { method: 'PATCH', body: { id, status } })
      setConnects((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)))
      toast(status === 'accepted' ? 'Coffee Connect accepted! +30 Points awarded.' : 'Invite declined.')
    } catch (err) {
      toast((err as ApiError).message || 'Failed to update invite', 'error')
    }
  }

  return (
    <div className="space-y-6 pb-20">
      <header className="flex items-center gap-3">
        <Link
          href="/"
          className="grid size-11 shrink-0 place-items-center rounded-full bg-surface text-navy ring-1 ring-line transition-colors hover:bg-subtle active:scale-95"
          aria-label="Back to Home"
        >
          <ArrowLeft className="size-5" aria-hidden="true" />
        </Link>
        <div>
          <h1 className="text-title font-bold text-navy">Meetups &amp; 1-on-1</h1>
          <p className="text-label text-muted">RSVP to MNI Organised Events or invite received contacts for 1-on-1.</p>
        </div>
      </header>

      {/* MNI Organised Meetups */}
      <section className="space-y-3">
        <h2 className="text-section font-bold text-navy">MNI Organised Meetups</h2>
        {meetups.length === 0 ? (
          <EmptyState icon={<Calendar className="size-5" />} title="No upcoming meetups">
            Check back soon for new MNI Organised Events.
          </EmptyState>
        ) : (
          <div className="space-y-3.5">
            {meetups.map((m) => (
              <article
                key={m.id}
                className="rounded-[var(--radius-card)] border border-black/[0.06] bg-surface p-4 shadow-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-pale px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-brand-strong">
                    <MapPin className="size-3" />
                    MNI Organised · {m.city}
                  </span>
                  <time className="text-caption font-semibold text-muted">{formatDate(m.startsAt)}</time>
                </div>

                <h3 className="mt-2.5 text-[16.5px] font-bold text-navy">{m.title}</h3>
                {m.description && <p className="mt-1 text-[13.5px] leading-relaxed text-[#1C1C1E]/85">{m.description}</p>}

                <p className="mt-2.5 flex items-center gap-1.5 text-caption font-medium text-muted">
                  <MapPin className="size-3.5 text-brand" />
                  {m.venue}
                </p>

                <div className="mt-3.5 flex items-center justify-between gap-3 border-t border-black/[0.05] pt-3">
                  <button
                    type="button"
                    onClick={() => setAttendeesModal(m)}
                    className="inline-flex items-center gap-2 text-caption font-semibold text-navy hover:text-brand"
                  >
                    <Users className="size-4 text-brand" />
                    <span>
                      {m.attendeesCount} {m.attendeesCount === 1 ? 'member' : 'members'} going
                    </span>
                  </button>

                  <button
                    type="button"
                    disabled={busyRsvp === m.id}
                    onClick={() => toggleRsvp(m)}
                    className={cn(
                      'inline-flex h-8 items-center gap-1.5 rounded-full px-4 text-[12.5px] font-semibold transition-all active:scale-95',
                      m.isGoing
                        ? 'bg-success-bg text-success ring-1 ring-inset ring-success/30'
                        : 'bg-[#007AFF] text-white shadow-sm hover:bg-[#0066E0]',
                    )}
                  >
                    {m.isGoing ? (
                      <>
                        <Check className="size-3.5" />
                        Going
                      </>
                    ) : (
                      'RSVP Going'
                    )}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* 1-on-1 Coffee Connect */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-section font-bold text-navy">1-on-1 Coffee Connect</h2>
            <p className="text-caption text-muted">Only available with contacts you requested &amp; received from Admin.</p>
          </div>
          {members.length > 0 && (
            <button
              type="button"
              onClick={() => setCoffeeModalOpen(true)}
              className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-navy px-3.5 text-[12.5px] font-semibold text-white transition-all hover:bg-navy/90 active:scale-95"
            >
              <Plus className="size-3.5" />
              Invite
            </button>
          )}
        </div>

        {connects.length === 0 ? (
          <EmptyState
            icon={<Coffee className="size-5" />}
            title="No 1-on-1 coffee connects yet"
            action={
              members.length === 0 ? (
                <Link
                  href="/directory"
                  className="inline-flex h-9 items-center rounded-full bg-[#007AFF] px-4 text-caption font-semibold text-white"
                >
                  Request Contacts in Directory
                </Link>
              ) : undefined
            }
          >
            {members.length > 0
              ? 'Tap Invite above or open your Requests console to invite a received contact.'
              : 'Request a member contact from Admin first. Once received, you can invite them for a 1-on-1.'}
          </EmptyState>
        ) : (
          <div className="space-y-3">
            {connects.map((c) => (
              <div
                key={c.id}
                className="rounded-2xl border border-black/[0.06] bg-surface p-3.5 shadow-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar initials={c.otherMember.avatarInitials} src={c.otherMember.avatarUrl} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-label font-bold text-navy">{c.otherMember.fullName}</p>
                      <p className="truncate text-caption text-muted">
                        {c.otherMember.businessName} · {c.otherMember.city}
                      </p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      'shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider',
                      c.status === 'accepted'
                        ? 'bg-success-bg text-success'
                        : c.status === 'declined'
                          ? 'bg-danger-bg text-danger'
                          : 'bg-warning-bg text-warning',
                    )}
                  >
                    {c.status}
                  </span>
                </div>

                <div className="mt-2.5 flex items-center gap-1.5 text-caption font-semibold text-brand-strong">
                  <Clock className="size-3.5" />
                  {c.proposedTime}
                  <span className="text-muted font-normal">· {timeAgo(c.createdAt)}</span>
                </div>
                {c.note && <p className="mt-1.5 text-[13px] text-[#1C1C1E]/85">{c.note}</p>}

                {c.direction === 'incoming' && c.status === 'pending' && (
                  <div className="mt-3 flex justify-end gap-2 border-t border-black/[0.05] pt-2.5">
                    <button
                      type="button"
                      onClick={() => respondConnect(c.id, 'declined')}
                      className="inline-flex h-8 items-center gap-1 rounded-full bg-[#F2F4F7] px-3 text-[12px] font-semibold text-muted hover:text-navy"
                    >
                      <X className="size-3.5" />
                      Decline
                    </button>
                    <button
                      type="button"
                      onClick={() => respondConnect(c.id, 'accepted')}
                      className="inline-flex h-8 items-center gap-1 rounded-full bg-success px-3.5 text-[12px] font-semibold text-white"
                    >
                      <Check className="size-3.5" />
                      Accept
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Who is Attending Modal */}
      <Dialog
        open={Boolean(attendeesModal)}
        onClose={() => setAttendeesModal(null)}
        title={`Attending · ${attendeesModal?.title ?? ''}`}
        description={`${attendeesModal?.attendeesCount ?? 0} members confirmed`}
        size="sm"
      >
        {attendeesModal && attendeesModal.attendees.length === 0 ? (
          <EmptyState icon={<Users className="size-5" />} title="Be the first to RSVP">
            Tap RSVP Going to join this chapter meetup.
          </EmptyState>
        ) : (
          <ul className="divide-y divide-black/[0.05]">
            {attendeesModal?.attendees.map((a) => (
              <li key={a.id} className="flex items-center gap-3 py-3">
                <Avatar initials={a.avatarInitials} src={a.avatarUrl} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-label font-bold text-navy">{a.fullName}</p>
                  <p className="truncate text-caption text-muted">
                    {a.businessName} · {a.city}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Dialog>

      {/* Schedule 1-on-1 Coffee Connect Modal */}
      <CoffeeInviteDialog
        open={coffeeModalOpen}
        onClose={() => setCoffeeModalOpen(false)}
        members={members}
        onCreated={(c) => setConnects((prev) => [c, ...prev])}
      />
    </div>
  )
}
