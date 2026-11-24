import { ArrowLeft, CalendarDays, Coins, MapPin, Trophy } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { requireMember } from '@/lib/auth'
import { getLeaderboard, getMyRank } from '@/lib/data'
import { formatNumber } from '@/lib/format'
import { daysUntil, MEETUP_PRIZES, NEXT_MEETUP } from '@/lib/rewards'
import { Avatar, StatusPill, TierBadge } from '@/components/ui/Badges'
import { ButtonLink } from '@/components/ui/Button'
import { cn } from '@/components/ui/cn'

export const metadata: Metadata = { title: 'Rewards & leaderboard' }

export default async function RewardsPage() {
  const me = await requireMember()
  const [leaderboard, myRank] = await Promise.all([getLeaderboard(me), getMyRank(me)])
  const myCoins = me.mniCoins ?? 0
  const days = daysUntil(NEXT_MEETUP.date)
  const meetupDate = new Date(`${NEXT_MEETUP.date}T00:00:00+05:30`).toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata',
  })
  const inBoard = leaderboard.some((e) => e.isYou)

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <Link href="/refer" className="grid size-11 shrink-0 place-items-center rounded-full bg-surface text-navy ring-1 ring-line hover:bg-subtle" aria-label="Back to Refer & earn">
          <ArrowLeft className="size-5" aria-hidden="true" />
        </Link>
        <div>
          <h1 className="text-title font-bold text-navy">Rewards</h1>
          <p className="text-label text-muted">Meetup prizes and the live coin leaderboard.</p>
        </div>
      </header>

      {days >= 0 && (
        <section aria-labelledby="meetup-heading" className="rounded-[var(--radius-panel)] bg-navy p-5 text-white sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <p className="text-caption font-semibold uppercase tracking-wider text-on-navy-muted">Next meetup</p>
            <StatusPill tone="warning" className="bg-[#fdf3e6]">{days === 0 ? 'Today' : `${days} day${days === 1 ? '' : 's'} to go`}</StatusPill>
          </div>
          <h2 id="meetup-heading" className="mt-2 text-section font-bold">{NEXT_MEETUP.title}</h2>
          <div className="mt-2 space-y-1 text-label text-on-navy-muted">
            <p className="flex items-center gap-2"><CalendarDays className="size-4" aria-hidden="true" />{meetupDate}</p>
            <p className="flex items-center gap-2"><MapPin className="size-4" aria-hidden="true" />{NEXT_MEETUP.venue}</p>
          </div>
          <p className="mt-4 border-t border-white/15 pt-3 text-label text-on-navy-muted">Top coin holders receive their prizes on stage at the meetup.</p>
        </section>
      )}

      <section aria-labelledby="prizes-heading" className="space-y-3">
        <h2 id="prizes-heading" className="text-section font-bold text-navy">Prizes</h2>
        <ul className="space-y-3">
          {MEETUP_PRIZES.map((p) => {
            const progress = Math.min(100, Math.round((myCoins / p.minCoins) * 100))
            const unlocked = myCoins >= p.minCoins
            return (
              <li key={p.id} className="rounded-[var(--radius-card)] border border-line bg-surface p-4 shadow-card">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-caption font-semibold uppercase tracking-wider text-brand">{p.badge}</p>
                    <p className="text-body font-semibold text-navy">{p.title}</p>
                  </div>
                  <StatusPill tone={unlocked ? 'success' : 'neutral'} icon={<Coins className="size-3.5" aria-hidden="true" />}>
                    {formatNumber(p.minCoins)}+
                  </StatusPill>
                </div>
                <p className="mt-2 text-label text-ink/85">{p.description}</p>
                <div className="mt-3">
                  <div className="h-2 overflow-hidden rounded-full bg-[#e4e9ef]" role="progressbar" aria-valuemin={0} aria-valuemax={p.minCoins} aria-valuenow={Math.min(myCoins, p.minCoins)} aria-label={`Progress towards ${p.title}`}>
                    <div className={cn('h-full rounded-full', unlocked ? 'bg-success' : 'bg-brand')} style={{ width: `${progress}%` }} />
                  </div>
                  <p className="mt-1.5 text-caption text-muted">
                    {unlocked ? 'You qualify. ' : `${formatNumber(p.minCoins - myCoins)} more coins to qualify. `}
                    {p.eligibility}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      </section>

      <section aria-labelledby="board-heading" className="space-y-3">
        <div className="flex items-end justify-between">
          <h2 id="board-heading" className="text-section font-bold text-navy">Leaderboard</h2>
          <p className="text-label text-muted">You’re #{myRank}</p>
        </div>
        <ol className="divide-y divide-line overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface shadow-card">
          {leaderboard.map((e) => (
            <li key={e.id} className={cn('flex items-center gap-3 px-4 py-3', e.isYou && 'bg-pale/70')} aria-current={e.isYou ? 'true' : undefined}>
              <span
                className={cn(
                  'grid size-8 shrink-0 place-items-center rounded-full text-label font-bold tabular-nums',
                  e.rank === 1 ? 'bg-[#f6c453] text-[#5c3b00]' : e.rank === 2 ? 'bg-[#d5dbe3] text-[#2c3846]' : e.rank === 3 ? 'bg-[#e8c3a0] text-[#5a3414]' : 'bg-subtle text-muted',
                )}
              >
                {e.rank === 1 ? <Trophy className="size-4" aria-label="1st" /> : e.rank}
              </span>
              <Avatar initials={e.avatarInitials} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 truncate text-label font-semibold text-navy">
                  <span className="truncate">{e.fullName}{e.isYou && ' (you)'}</span>
                  <TierBadge tier={e.tier} />
                </p>
                <p className="truncate text-caption text-muted">{e.businessName}</p>
              </div>
              <div className="text-right">
                <p className="flex items-center justify-end gap-1 text-body font-bold tabular-nums text-navy">
                  <Coins className="size-4 text-coin" aria-hidden="true" />
                  {formatNumber(e.mniCoins)}
                </p>
                <p className="text-caption text-muted">{e.referralCount} referral{e.referralCount === 1 ? '' : 's'}</p>
              </div>
            </li>
          ))}
        </ol>
        {!inBoard && <p className="text-center text-label text-muted">You’re #{myRank} with {formatNumber(myCoins)} coins.</p>}
      </section>

      <ButtonLink href="/refer" size="lg" fullWidth>Refer someone and earn coins</ButtonLink>
    </div>
  )
}
