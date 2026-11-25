import { ArrowLeft, Award, Coins, Sparkles, Trophy, Users } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { requireMember } from '@/lib/auth'
import { getLeaderboard, getMyRank } from '@/lib/data'
import { formatNumber } from '@/lib/format'
import { Avatar, TierBadge } from '@/components/ui/Badges'
import { ButtonLink } from '@/components/ui/Button'
import { cn } from '@/components/ui/cn'

export const metadata: Metadata = { title: 'Leaderboard' }

export default async function RewardsPage() {
  const me = await requireMember()
  const [leaderboard, myRank] = await Promise.all([getLeaderboard(me), getMyRank(me)])
  const myCoins = me.mniCoins ?? 0
  const myReferrals = me.referralCount ?? 0
  const inBoard = leaderboard.some((e) => e.isYou)

  const top1 = leaderboard[0]
  const top2 = leaderboard[1]
  const top3 = leaderboard[2]

  return (
    <div className="space-y-6 pb-20">
      <header className="flex items-center gap-3">
        <Link
          href="/refer"
          className="grid size-11 shrink-0 place-items-center rounded-full bg-surface text-navy ring-1 ring-line transition-colors hover:bg-subtle active:scale-95"
          aria-label="Back to Refer & earn"
        >
          <ArrowLeft className="size-5" aria-hidden="true" />
        </Link>
        <div>
          <h1 className="text-title font-bold text-navy">Leaderboard</h1>
          <p className="text-label text-muted">Live rankings by MNI Coins and verified referrals.</p>
        </div>
      </header>

      {/* Your Standing Hero Card */}
      <section
        aria-label="Your standing"
        className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[#0B224E] via-[#0E2A66] to-[#123680] p-5 text-white shadow-[0_8px_30px_rgba(11,34,78,0.25)] sm:p-6"
      >
        <div className="relative z-10 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <Avatar initials={me.avatarInitials || me.fullName.slice(0, 2).toUpperCase()} src={(me as any).custom_avatar || null} size="lg" tone="white" />
            <div className="min-w-0">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white backdrop-blur">
                <Sparkles className="size-3 text-[#FFE066]" />
                Your Rank
              </span>
              <p className="text-[22px] font-extrabold leading-tight">#{myRank}</p>
              <p className="truncate text-caption text-on-navy-muted">{me.fullName}</p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-caption font-semibold uppercase tracking-wider text-on-navy-muted">Coins</p>
            <p className="flex items-center justify-end gap-1.5 text-[22px] font-extrabold text-[#FFE066]">
              <Coins className="size-5 text-[#FFE066]" />
              {formatNumber(myCoins)}
            </p>
            <p className="text-caption text-on-navy-muted">{myReferrals} referral{myReferrals === 1 ? '' : 's'}</p>
          </div>
        </div>

        <div className="relative z-10 mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-[13px] text-on-navy-muted">
          <span>{myRank <= 3 ? '🏆 You are in the Top 3 Network Leaders!' : 'Climb ranks by making verified member referrals.'}</span>
          <Link href="/refer" className="shrink-0 font-bold text-white hover:underline">
            Earn coins →
          </Link>
        </div>
      </section>

      {/* Monthly Top Referrer Spotlight */}
      {top1 && (
        <section
          aria-label="Monthly Top Referrer Spotlight"
          className="relative overflow-hidden rounded-[22px] border border-[#FDE68A] bg-gradient-to-r from-[#FFFDF5] via-[#FFFBEB] to-[#FEF3C7] p-4 shadow-sm"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative">
                <Avatar initials={top1.avatarInitials} src={top1.avatarUrl} size="md" />
                <span className="absolute -bottom-1 -right-1 grid size-5 place-items-center rounded-full bg-[#F59E0B] text-[10px] font-bold text-white shadow">
                  ★
                </span>
              </div>
              <div className="min-w-0">
                <span className="inline-flex items-center gap-1 text-[10.5px] font-extrabold uppercase tracking-wider text-[#B45309]">
                  <Trophy className="size-3" />
                  Monthly Top Referrer Spotlight
                </span>
                <p className="truncate text-[16px] font-bold text-navy">{top1.fullName}</p>
                <p className="truncate text-caption text-[#78350F]/80">
                  {top1.businessName} · {top1.referralCount} referrals
                </p>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[11px] font-bold uppercase text-[#B45309]">Active Pts</p>
              <p className="text-[18px] font-extrabold text-[#92400E]">{formatNumber(top1.mniCoins)}</p>
            </div>
          </div>
          <p className="mt-2.5 border-t border-[#FDE68A]/80 pt-2 text-[11.5px] font-medium text-[#92400E]">
            Earn Active Contributor Points: +500 Confirmed Referral · +50 Closed Deal · +30 Meetup RSVP / 1-on-1
          </p>
        </section>
      )}

      {/* Top 3 Podium Highlights */}
      {leaderboard.length >= 3 && (
        <section aria-label="Top 3 members" className="space-y-3">
          <h2 className="text-section font-bold text-navy">Top Performers</h2>
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
            {/* Rank 2 */}
            {top2 && (
              <div className="flex flex-col items-center rounded-2xl border border-black/[0.08] bg-white p-3.5 text-center shadow-sm">
                <div className="relative mb-2">
                  <Avatar initials={top2.avatarInitials} src={top2.avatarUrl} size="md" />
                  <span className="absolute -bottom-1 -right-1 grid size-5 place-items-center rounded-full bg-gradient-to-br from-[#E2E8F0] to-[#94A3B8] text-[11px] font-bold text-[#1E293B] shadow">
                    2
                  </span>
                </div>
                <p className="line-clamp-1 w-full text-label font-bold text-navy">{top2.fullName}</p>
                <p className="line-clamp-1 text-[11px] text-muted">{top2.businessName}</p>
                <p className="mt-2 flex items-center gap-1 text-[13px] font-extrabold text-navy">
                  <Coins className="size-3.5 text-coin" />
                  {formatNumber(top2.mniCoins)}
                </p>
              </div>
            )}

            {/* Rank 1 (Elevated) */}
            {top1 && (
              <div className="relative -mt-2 flex flex-col items-center rounded-2xl border-2 border-[#F59E0B]/40 bg-gradient-to-b from-[#FFFDF0] to-white p-3.5 text-center shadow-md">
                <div className="absolute -top-3 rounded-full bg-gradient-to-r from-[#F59E0B] to-[#D97706] px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-sm">
                  1st Place
                </div>
                <div className="relative mb-2 mt-1">
                  <Avatar initials={top1.avatarInitials} src={top1.avatarUrl} size="md" />
                  <span className="absolute -bottom-1 -right-1 grid size-5 place-items-center rounded-full bg-gradient-to-br from-[#FFE066] to-[#F59E0B] text-[11px] font-bold text-[#78350F] shadow">
                    <Trophy className="size-3" />
                  </span>
                </div>
                <p className="line-clamp-1 w-full text-label font-bold text-navy">{top1.fullName}</p>
                <p className="line-clamp-1 text-[11px] text-muted">{top1.businessName}</p>
                <p className="mt-2 flex items-center gap-1 text-[13px] font-extrabold text-[#B45309]">
                  <Coins className="size-3.5 text-[#F59E0B]" />
                  {formatNumber(top1.mniCoins)}
                </p>
              </div>
            )}

            {/* Rank 3 */}
            {top3 && (
              <div className="flex flex-col items-center rounded-2xl border border-black/[0.08] bg-white p-3.5 text-center shadow-sm">
                <div className="relative mb-2">
                  <Avatar initials={top3.avatarInitials} src={top3.avatarUrl} size="md" />
                  <span className="absolute -bottom-1 -right-1 grid size-5 place-items-center rounded-full bg-gradient-to-br from-[#FDBA74] to-[#C2410C] text-[11px] font-bold text-[#7C2D12] shadow">
                    3
                  </span>
                </div>
                <p className="line-clamp-1 w-full text-label font-bold text-navy">{top3.fullName}</p>
                <p className="line-clamp-1 text-[11px] text-muted">{top3.businessName}</p>
                <p className="mt-2 flex items-center gap-1 text-[13px] font-extrabold text-navy">
                  <Coins className="size-3.5 text-coin" />
                  {formatNumber(top3.mniCoins)}
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Full Leaderboard List */}
      <section aria-labelledby="board-heading" className="space-y-3">
        <div className="flex items-end justify-between">
          <h2 id="board-heading" className="text-section font-bold text-navy">All Rankings</h2>
          <p className="text-label text-muted">Showing top {leaderboard.length}</p>
        </div>

        <ol className="divide-y divide-black/[0.06] overflow-hidden rounded-[20px] border border-black/[0.08] bg-white shadow-sm">
          {leaderboard.map((e) => (
            <li
              key={e.id}
              className={cn(
                'flex items-center gap-3.5 px-4 py-3.5 transition-colors',
                e.isYou && 'bg-[#007AFF]/[0.06]',
              )}
              aria-current={e.isYou ? 'true' : undefined}
            >
              <span
                className={cn(
                  'grid size-8 shrink-0 place-items-center rounded-full text-label font-extrabold tabular-nums',
                  e.rank === 1
                    ? 'bg-gradient-to-br from-[#FFE066] to-[#F59E0B] text-[#78350F] shadow-sm'
                    : e.rank === 2
                      ? 'bg-gradient-to-br from-[#E2E8F0] to-[#94A3B8] text-[#1E293B] shadow-sm'
                      : e.rank === 3
                        ? 'bg-gradient-to-br from-[#FDBA74] to-[#C2410C] text-[#7C2D12] shadow-sm'
                        : 'bg-[#F2F4F7] text-[#475467]',
                )}
              >
                {e.rank === 1 ? <Trophy className="size-4" aria-label="1st place" /> : e.rank}
              </span>

              <Avatar initials={e.avatarInitials} src={e.avatarUrl} size="sm" />

              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 truncate text-label font-bold text-navy">
                  <span className="truncate">{e.fullName}</span>
                  {e.isYou && (
                    <span className="shrink-0 rounded-full bg-[#007AFF] px-2 py-0.5 text-[10px] font-bold text-white">
                      You
                    </span>
                  )}
                  <TierBadge tier={e.tier} />
                </p>
                <p className="truncate text-caption text-muted">{e.businessName}</p>
              </div>

              <div className="text-right">
                <p className="flex items-center justify-end gap-1 text-[15px] font-extrabold tabular-nums text-navy">
                  <Coins className="size-4 text-coin" aria-hidden="true" />
                  {formatNumber(e.mniCoins)}
                </p>
                <p className="text-[11px] text-muted">{e.referralCount} referral{e.referralCount === 1 ? '' : 's'}</p>
              </div>
            </li>
          ))}
        </ol>

        {!inBoard && (
          <div className="rounded-xl bg-[#F2F4F7] p-3 text-center text-label text-muted">
            You are ranked <strong className="text-navy">#{myRank}</strong> with{' '}
            <strong className="text-navy">{formatNumber(myCoins)} coins</strong>.
          </div>
        )}
      </section>

      <ButtonLink href="/refer" size="lg" fullWidth className="h-12 rounded-xl text-[15px] font-semibold shadow-sm">
        Refer a business & climb the leaderboard
      </ButtonLink>
    </div>
  )
}
