'use client'

import { ArrowRight, Briefcase, CalendarClock, Check, Compass, ExternalLink, MapPin, Sparkles, Target, X } from 'lucide-react'
import type { ReactNode } from 'react'
import type { PublicMember } from '@/lib/view-models'
import { websiteHref } from '@/lib/format'
import { Avatar, TierBadge, VerifiedMark } from '../ui/Badges'
import { Button } from '../ui/Button'
import { Dialog } from '../ui/Dialog'

interface Props {
  member: PublicMember | null
  postTitle?: string
  isRequested: boolean
  isMine: boolean
  onClose: () => void
  onRequest: () => void
}

export function MemberInfoDialog({ member, postTitle, isRequested, isMine, onClose, onRequest }: Props) {
  const site = websiteHref(member?.websiteUrl)
  return (
    <Dialog
      open={Boolean(member)}
      onClose={onClose}
      title={member ? `${member.fullName}, ${member.businessName}` : ''}
      size="lg"
      header={
        member && (
          <div className="relative bg-navy px-5 pb-6 pt-5 text-white sm:px-6">
            <button
              type="button"
              onClick={onClose}
              className="absolute right-3 top-3 grid size-10 place-items-center rounded-full text-white/85 hover:bg-white/10 hover:text-white"
              aria-label="Close"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
            <div className="flex items-center gap-4 pr-10">
              <Avatar initials={member.avatarInitials} src={member.avatarUrl} size="lg" tone="white" />
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-section font-bold">{member.fullName}</p>
                  {member.isVerified && <VerifiedMark className="[&_svg]:text-[#7fd4b8]" />}
                  <TierBadge tier={member.tier} onNavy />
                </div>
                <p className="text-label font-medium text-on-navy-muted">{member.businessName}</p>
                <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-on-navy-muted">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="size-3.5" aria-hidden="true" />
                    {member.city}
                  </span>
                  {member.memberSince && <span>Member since {member.memberSince}</span>}
                </p>
              </div>
            </div>
          </div>
        )
      }
      footer={
        member && !isMine ? (
          isRequested ? (
            <p className="inline-flex h-11 items-center justify-center gap-2 text-label font-semibold text-success">
              <Check className="size-[18px]" aria-hidden="true" /> You’ve requested this introduction
            </p>
          ) : (
            <Button onClick={onRequest} size="lg" className="sm:min-w-56">
              Request {member.fullName.split(' ')[0]}’s contact
              <ArrowRight className="size-[18px]" aria-hidden="true" />
            </Button>
          )
        ) : undefined
      }
    >
      {member && (
        <div className="space-y-4">
          <p className="inline-flex items-center gap-2 rounded-full bg-subtle px-3 py-1 text-caption font-semibold text-muted ring-1 ring-inset ring-line">
            <Briefcase className="size-3.5" aria-hidden="true" />
            {member.businessCategory}
          </p>
          <Section icon={<Compass className="size-4" />} title="What we do">
            {member.whatWeDo || member.bio || 'Profile details coming soon.'}
          </Section>
          {member.keyProductService && (
            <Section icon={<Sparkles className="size-4" />} title="Key product or service">
              {member.keyProductService}
            </Section>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            {member.idealClient && (
              <Section icon={<Target className="size-4" />} title="Ideal client" compact>
                {member.idealClient}
              </Section>
            )}
            {member.opportunityLookingFor && (
              <Section icon={<Briefcase className="size-4" />} title="Looking for" compact highlight>
                {member.opportunityLookingFor}
              </Section>
            )}
          </div>
          {member.targetConnections && (
            <Section title="Would like to meet" compact>
              {member.targetConnections}
            </Section>
          )}
          {(member.preferredCallDay || member.preferredCallTime || site) && (
            <dl className="divide-y divide-line rounded-2xl border border-line">
              {(member.preferredCallDay || member.preferredCallTime) && (
                <Row label="Best time to call" icon={<CalendarClock className="size-4" />}>
                  {[member.preferredCallDay, member.preferredCallTime].filter(Boolean).join(', ')}
                </Row>
              )}
              {site && (
                <Row label="Website" icon={<ExternalLink className="size-4" />}>
                  <a href={site} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand hover:underline">
                    {member.websiteUrl}
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </Row>
              )}
            </dl>
          )}
          {postTitle && <p className="text-caption text-muted">Featured in “{postTitle}”</p>}
        </div>
      )}
    </Dialog>
  )
}

function Section({ icon, title, children, compact, highlight }: { icon?: ReactNode; title: string; children: ReactNode; compact?: boolean; highlight?: boolean }) {
  return (
    <section className={highlight ? 'rounded-2xl bg-pale p-4' : compact ? 'rounded-2xl bg-subtle p-4' : ''}>
      <h3 className="mb-1.5 flex items-center gap-1.5 text-caption font-bold uppercase tracking-wider text-muted">
        {icon && <span className="text-brand" aria-hidden="true">{icon}</span>}
        {title}
      </h3>
      <p className="whitespace-pre-line text-body text-ink/90">{children}</p>
    </section>
  )
}

function Row({ label, icon, children }: { label: string; icon: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <dt className="flex items-center gap-2 text-label text-muted">
        <span className="text-brand" aria-hidden="true">{icon}</span>
        {label}
      </dt>
      <dd className="text-right text-label font-semibold text-navy">{children}</dd>
    </div>
  )
}
