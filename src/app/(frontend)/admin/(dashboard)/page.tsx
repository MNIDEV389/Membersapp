import { ArrowRight, Calendar, FileCheck2, Gift, HelpCircle, Newspaper, Trophy, UserCheck, Users } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getPgPool } from '@/lib/db'
import { getPayloadClient } from '@/lib/payload'

export const metadata: Metadata = { title: 'Overview · MNI Admin' }

export default async function AdminOverviewPage() {
  const payload = await getPayloadClient()
  const pool = getPgPool()

  const [
    membersTotal,
    premiumMembers,
    pendingRequests,
    pendingSubmissions,
    pendingReferrals,
    openSupport,
    publishedPosts,
    pgStats,
  ] = await Promise.all([
    payload.count({ collection: 'members', overrideAccess: true }),
    payload.count({ collection: 'members', where: { tier: { equals: 'premium' } }, overrideAccess: true }),
    payload.count({ collection: 'contact-requests', where: { status: { equals: 'pending' } }, overrideAccess: true }),
    payload.count({ collection: 'submissions', where: { status: { equals: 'pending' } }, overrideAccess: true }),
    payload.count({ collection: 'referrals', where: { status: { equals: 'pending_review' } }, overrideAccess: true }),
    payload.count({ collection: 'login-help-requests', where: { status: { equals: 'pending' } }, overrideAccess: true }),
    payload.count({ collection: 'posts', where: { isPublished: { equals: true } }, overrideAccess: true }),
    pool.query(`
      SELECT
        (SELECT COUNT(*)::int FROM meetups) AS meetups_count,
        (SELECT COUNT(*)::int FROM closed_business_celebrations) AS wins_count
    `),
  ])

  const meetupsCount = Number(pgStats.rows[0]?.meetups_count ?? 0)
  const winsCount = Number(pgStats.rows[0]?.wins_count ?? 0)

  const kpis = [
    {
      label: 'Total Members',
      value: membersTotal.totalDocs,
      sub: `${premiumMembers.totalDocs} Premium · ${membersTotal.totalDocs - premiumMembers.totalDocs} Freemium`,
      href: '/admin/members',
      icon: Users,
      tone: 'bg-pale text-brand',
    },
    {
      label: 'Pending Intros',
      value: pendingRequests.totalDocs,
      sub: 'Contact requests awaiting sharing',
      href: '/admin/requests',
      icon: UserCheck,
      tone: pendingRequests.totalDocs > 0 ? 'bg-warning-bg text-warning' : 'bg-subtle text-muted',
    },
    {
      label: 'Pending Submissions',
      value: pendingSubmissions.totalDocs,
      sub: 'Requirements & profile edits',
      href: '/admin/submissions',
      icon: FileCheck2,
      tone: pendingSubmissions.totalDocs > 0 ? 'bg-warning-bg text-warning' : 'bg-subtle text-muted',
    },
    {
      label: 'Pending Referrals',
      value: pendingReferrals.totalDocs,
      sub: 'Awaiting confirmation (+500 coins)',
      href: '/admin/referrals',
      icon: Gift,
      tone: pendingReferrals.totalDocs > 0 ? 'bg-warning-bg text-warning' : 'bg-subtle text-muted',
    },
    {
      label: 'Published Posts',
      value: publishedPosts.totalDocs,
      sub: 'Live on member timeline',
      href: '/admin/posts',
      icon: Newspaper,
      tone: 'bg-pale text-brand',
    },
    {
      label: 'MNI Meetups & Wins',
      value: `${meetupsCount} / ${winsCount}`,
      sub: `${meetupsCount} events · ${winsCount} closed deals`,
      href: '/admin/meetups',
      icon: Calendar,
      tone: 'bg-success-bg text-success',
    },
  ]

  const attentionQueue = [
    {
      title: 'Contact Introduction Requests',
      count: pendingRequests.totalDocs,
      desc: 'Members waiting for requested contact details.',
      href: '/admin/requests',
      icon: UserCheck,
    },
    {
      title: 'Member Submissions & Profile Edits',
      count: pendingSubmissions.totalDocs,
      desc: 'Approve requirements to feed or apply profile updates.',
      href: '/admin/submissions',
      icon: FileCheck2,
    },
    {
      title: 'Business Owner Referrals',
      count: pendingReferrals.totalDocs,
      desc: 'Verify referrals and credit +500 MNI Coins.',
      href: '/admin/referrals',
      icon: Gift,
    },
    {
      title: 'Open Login & Access Help',
      count: openSupport.totalDocs,
      desc: 'Members requesting password reset or access details.',
      href: '/admin/support',
      icon: HelpCircle,
    },
  ]

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-bold tracking-tight text-navy">Admin Overview</h1>
          <p className="text-label text-muted">Live operations control center for MNI Members Network.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/posts"
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-navy px-4 text-label font-semibold text-white hover:bg-navy/90"
          >
            <Newspaper className="size-4" />
            New Post
          </Link>
          <Link
            href="/admin/members"
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-line bg-surface px-4 text-label font-semibold text-navy hover:bg-subtle"
          >
            <Users className="size-4" />
            Manage Members
          </Link>
        </div>
      </header>

      {/* KPI Grid */}
      <section aria-label="Key metrics" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kpis.map(({ label, value, sub, href, icon: Icon, tone }) => (
          <Link
            key={label}
            href={href}
            className="group rounded-2xl border border-black/[0.06] bg-surface p-5 shadow-sm transition-all hover:border-brand/30 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-caption font-semibold uppercase tracking-wider text-muted">{label}</p>
                <p className="mt-1.5 text-[28px] font-extrabold leading-none text-navy tabular-nums">{value}</p>
              </div>
              <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${tone}`}>
                <Icon className="size-5" aria-hidden="true" />
              </span>
            </div>
            <p className="mt-3 text-caption text-muted group-hover:text-navy">{sub}</p>
          </Link>
        ))}
      </section>

      {/* Needs Attention Queue */}
      <section aria-label="Needs attention today" className="space-y-3">
        <div className="flex items-center gap-2">
          <Trophy className="size-4 text-brand" />
          <h2 className="text-section font-bold text-navy">Needs Attention Today</h2>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {attentionQueue.map(({ title, count, desc, href, icon: Icon }) => (
            <Link
              key={title}
              href={href}
              className="flex items-center justify-between gap-4 rounded-2xl border border-black/[0.06] bg-surface p-4 shadow-sm transition-all hover:border-brand/30"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-subtle text-navy">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-label font-bold text-navy">{title}</p>
                    {count > 0 && (
                      <span className="rounded-full bg-warning-bg px-2 py-0.5 text-[11px] font-extrabold text-warning">
                        {count}
                      </span>
                    )}
                  </div>
                  <p className="truncate text-caption text-muted">{desc}</p>
                </div>
              </div>
              <ArrowRight className="size-4 shrink-0 text-muted" aria-hidden="true" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
