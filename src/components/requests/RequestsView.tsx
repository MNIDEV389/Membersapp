'use client'

import { CheckCircle2, CheckSquare, Clock, Coffee, Mail, MessageSquareText, Phone, Users } from 'lucide-react'
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

                {/* Follow-up Checklist Section */}
                {r.contact && !r.followUp && (
                  <div className="mt-3.5 rounded-2xl border border-amber-200/90 bg-amber-50/70 p-3.5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-800">
                          <CheckSquare className="size-3.5" />
                        </div>
                        <div>
                          <p className="text-label font-bold text-navy">Follow-up Checklist Required</p>
                          <p className="text-caption text-muted">
                            Did you contact {r.target.fullName}? Update your interaction checklist to keep MNI in the loop.
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => setFollowUp(r)}
                        icon={<CheckSquare className="size-3.5" />}
                      >
                        Fill Checklist
                      </Button>
                    </div>
                    <div className="mt-2.5 flex flex-wrap gap-2 text-[12px] text-amber-900/80">
                      <span className="rounded-md bg-white/80 px-2 py-0.5 border border-amber-200/60 font-medium">1. Contacted?</span>
                      <span className="rounded-md bg-white/80 px-2 py-0.5 border border-amber-200/60 font-medium">2. Had a talk?</span>
                      <span className="rounded-md bg-white/80 px-2 py-0.5 border border-amber-200/60 font-medium">3. Business explored?</span>
                      <span className="rounded-md bg-white/80 px-2 py-0.5 border border-amber-200/60 font-medium">4. Referral given?</span>
                    </div>
                  </div>
                )}

                {r.followUp && (
                  <div className="mt-3.5 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="flex size-5 items-center justify-center rounded-full bg-emerald-600 text-white text-[11px] font-bold">
                          ✓
                        </span>
                        <p className="text-label font-bold text-emerald-950">Follow-up Checklist Completed</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFollowUp(r)}
                        className="text-caption font-semibold text-brand hover:underline"
                      >
                        Update Checklist
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <div className="rounded-xl border border-emerald-100/70 bg-white p-2 text-center">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Contacted</p>
                        <p className={r.followUp.calledContact ? "text-label font-bold mt-0.5 text-emerald-700" : "text-label font-bold mt-0.5 text-muted"}>
                          {r.followUp.calledContact ? "✓ Yes" : "✕ No"}
                        </p>
                      </div>
                      <div className="rounded-xl border border-emerald-100/70 bg-white p-2 text-center">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Spoke</p>
                        <p className={r.followUp.conversationTookPlace ? "text-label font-bold mt-0.5 text-emerald-700" : "text-label font-bold mt-0.5 text-muted"}>
                          {r.followUp.conversationTookPlace ? "✓ Yes" : "✕ No"}
                        </p>
                      </div>
                      <div className="rounded-xl border border-emerald-100/70 bg-white p-2 text-center">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Business</p>
                        <p className={r.followUp.businessGenerated ? "text-label font-bold mt-0.5 text-emerald-700" : "text-label font-bold mt-0.5 text-muted"}>
                          {r.followUp.businessGenerated ? "✓ Generated" : "Not yet"}
                        </p>
                      </div>
                      <div className="rounded-xl border border-emerald-100/70 bg-white p-2 text-center">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Gave Business</p>
                        <p className={r.followUp.gaveBusiness === 'gave' ? "text-label font-bold mt-0.5 text-brand" : "text-label font-bold mt-0.5 text-muted"}>
                          {r.followUp.gaveBusiness === 'gave' ? "✓ Yes" : "Not yet"}
                        </p>
                      </div>
                    </div>

                    {r.followUp.remarks && (
                      <p className="rounded-xl border border-emerald-100/70 bg-white p-2.5 text-label text-ink/90">
                        <span className="font-semibold text-navy">Remarks: </span>
                        {r.followUp.remarks}
                      </p>
                    )}
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
                      <p className="text-label text-muted">
                        {r.followUp ? 'Checklist recorded' : 'Please complete the checklist'}
                      </p>
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
                        <Button
                          size="sm"
                          variant={r.followUp ? 'secondary' : 'primary'}
                          icon={<CheckSquare className="size-3.5" />}
                          onClick={() => setFollowUp(r)}
                        >
                          {r.followUp ? 'Edit checklist' : 'Update checklist'}
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
