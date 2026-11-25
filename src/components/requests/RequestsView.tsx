'use client'

import { Clock, Coffee, Mail, MessageSquareText, Phone, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { CONTACT_REQUEST_STATUSES } from '@/lib/constants'
import { formatDate } from '@/lib/format'
import type { ContactRequestVM } from '@/lib/view-models'
import { CoffeeInviteDialog, type CoffeeEligibleMember } from '../meetups/CoffeeInviteDialog'
import { Avatar, StatusPill, type Tone } from '../ui/Badges'
import { Button, ButtonLink } from '../ui/Button'
import { EmptyState } from '../ui/Feedback'
import { SegmentedTabs, TabPanel } from '../ui/Tabs'
import { FollowUpDialog } from './FollowUpDialog'

type TabId = 'all' | 'pending' | 'shared'
const statusTone: Record<string, Tone> = {
  pending: 'warning',
  contact_received: 'brand',
  followup_required: 'warning',
  outcome_recorded: 'success',
  declined: 'neutral',
}
const statusLabel = Object.fromEntries(CONTACT_REQUEST_STATUSES.map((s) => [s.value, s.label]))

export function RequestsView({ requests }: { requests: ContactRequestVM[] }) {
  const [tab, setTab] = useState<TabId>('all')
  const [followUp, setFollowUp] = useState<ContactRequestVM | null>(null)
  const [inviteTarget, setInviteTarget] = useState<CoffeeEligibleMember | null>(null)

  const groups = useMemo(
    () => ({
      all: requests,
      pending: requests.filter((r) => r.status === 'pending'),
      shared: requests.filter((r) => r.contact),
    }),
    [requests],
  )
  const list = groups[tab]

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-title font-bold text-navy">Requests</h1>
        <p className="mt-1 text-body text-muted">Track the introductions you’ve asked MNI for, and record how they went.</p>
      </header>

      <SegmentedTabs<TabId>
        label="Filter requests"
        idPrefix="requests"
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'all', label: 'All', count: groups.all.length },
          { id: 'pending', label: 'Pending', count: groups.pending.length },
          { id: 'shared', label: 'Shared', count: groups.shared.length },
        ]}
      />

      <TabPanel idPrefix="requests" id={tab}>
        {list.length === 0 ? (
          <EmptyState
            icon={<Users className="size-5" aria-hidden="true" />}
            title={tab === 'all' ? 'No introductions yet' : tab === 'pending' ? 'Nothing pending' : 'No contacts shared yet'}
            action={tab === 'all' ? <ButtonLink href="/">Browse the timeline</ButtonLink> : undefined}
          >
            {tab === 'all'
              ? 'Tap “Request contact” on any timeline post featuring a member.'
              : tab === 'pending'
                ? 'All your requests have been handled.'
                : 'Contacts appear here once MNI shares them with you.'}
          </EmptyState>
        ) : (
          <ul className="space-y-3">
            {list.map((r) => (
              <li key={r.id} className="rounded-[var(--radius-card)] border border-line bg-surface p-4 shadow-card">
                <div className="flex items-start gap-3">
                  <Avatar initials={r.target.avatarInitials} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate text-body font-semibold text-navy">{r.target.fullName}</p>
                      <StatusPill tone={statusTone[r.status]}>{statusLabel[r.status]}</StatusPill>
                    </div>
                    <p className="truncate text-label text-muted">{r.target.businessName}</p>
                    <p className="mt-0.5 text-caption text-muted">
                      Requested {formatDate(r.createdAt)}
                      {r.postTitle ? ` · from “${r.postTitle}”` : ''}
                    </p>
                  </div>
                </div>

                {r.agendaNote && (
                  <div className="mt-3 rounded-2xl bg-subtle p-3">
                    <p className="text-caption font-semibold uppercase tracking-wider text-muted">Your agenda</p>
                    <p className="mt-0.5 text-label text-ink/90">{r.agendaNote}</p>
                  </div>
                )}

                {r.adminNote && (
                  <p className="mt-3 flex items-start gap-2 text-label text-navy">
                    <MessageSquareText className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden="true" />
                    {r.adminNote}
                  </p>
                )}

                {r.contact && (
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <a href={`tel:${r.contact.phone.replace(/\s/g, '')}`} className="flex min-h-11 items-center gap-2 rounded-xl bg-pale px-3 text-label font-semibold text-navy hover:bg-[#dde7fb]">
                      <Phone className="size-4 text-brand" aria-hidden="true" />
                      {r.contact.phone}
                    </a>
                    <a href={`mailto:${r.contact.email}`} className="flex min-h-11 min-w-0 items-center gap-2 rounded-xl bg-pale px-3 text-label font-semibold text-navy hover:bg-[#dde7fb]">
                      <Mail className="size-4 shrink-0 text-brand" aria-hidden="true" />
                      <span className="truncate">{r.contact.email}</span>
                    </a>
                  </div>
                )}

                {r.followUp && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <StatusPill tone={r.followUp.calledContact ? 'success' : 'neutral'}>{r.followUp.calledContact ? 'Called' : 'Not called'}</StatusPill>
                    {r.followUp.calledContact && (
                      <StatusPill tone={r.followUp.conversationTookPlace ? 'success' : 'neutral'}>
                        {r.followUp.conversationTookPlace ? 'Spoke' : 'No conversation'}
                      </StatusPill>
                    )}
                    {r.followUp.conversationTookPlace && (
                      <StatusPill tone={r.followUp.businessGenerated ? 'success' : 'neutral'}>
                        {r.followUp.businessGenerated ? 'Business generated' : 'No business yet'}
                      </StatusPill>
                    )}
                    {r.followUp.gaveBusiness === 'gave' && <StatusPill tone="brand">Gave business</StatusPill>}
                    {r.followUp.remarks && <p className="mt-1 w-full text-label text-muted">“{r.followUp.remarks}”</p>}
                  </div>
                )}

                <div className="mt-3 flex items-center justify-between gap-3 border-t border-line pt-3">
                  {r.status === 'pending' ? (
                    <p className="flex items-center gap-1.5 text-label text-muted">
                      <Clock className="size-4" aria-hidden="true" /> MNI is arranging this introduction
                    </p>
                  ) : r.status === 'declined' ? (
                    <p className="text-label text-muted">This member isn’t available for introductions right now.</p>
                  ) : (
                    <>
                      <p className="text-label text-muted">{r.followUp ? 'Outcome recorded' : 'How did it go?'}</p>
                      <div className="flex items-center gap-2">
                        {r.contact && (
                          <Button
                            size="sm"
                            variant="secondary"
                            icon={<Coffee className="size-3.5" aria-hidden="true" />}
                            onClick={() =>
                              setInviteTarget({
                                id: r.target.id,
                                fullName: r.target.fullName,
                                businessName: r.target.businessName,
                              })
                            }
                          >
                            Invite 1-on-1
                          </Button>
                        )}
                        <Button size="sm" variant={r.followUp ? 'secondary' : 'primary'} onClick={() => setFollowUp(r)}>
                          {r.followUp ? 'Edit outcome' : 'Add follow-up'}
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </TabPanel>

      <FollowUpDialog request={followUp} onClose={() => setFollowUp(null)} />
      <CoffeeInviteDialog
        open={Boolean(inviteTarget)}
        onClose={() => setInviteTarget(null)}
        members={inviteTarget ? [inviteTarget] : []}
        preselectedMember={inviteTarget}
      />
    </div>
  )
}
