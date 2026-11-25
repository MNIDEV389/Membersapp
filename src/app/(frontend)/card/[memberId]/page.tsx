import { Briefcase, ExternalLink, MapPin, Sparkles, Target } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPgPool } from '@/lib/db'
import { websiteHref } from '@/lib/format'
import { Avatar, TierBadge, VerifiedMark } from '@/components/ui/Badges'
import { SaveContactButton } from '@/components/profile/SaveContactButton'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ memberId: string }> }): Promise<Metadata> {
  const { memberId } = await params
  return { title: `${decodeURIComponent(memberId)} · MNI Card` }
}

export default async function PublicMemberCardPage({ params }: { params: Promise<{ memberId: string }> }) {
  const { memberId } = await params
  const decodedId = decodeURIComponent(memberId).trim()

  const pool = getPgPool()
  const { rows } = await pool.query(
    `SELECT id, full_name, avatar_initials, custom_avatar, business_name, business_category,
            city, member_id, tier, is_verified, what_we_do, key_product_service,
            ideal_client, website_url
     FROM members
     WHERE member_id = $1 AND account_status IS DISTINCT FROM 'suspended'
     LIMIT 1`,
    [decodedId],
  )

  if (rows.length === 0) notFound()
  const m = rows[0]
  const site = websiteHref(m.website_url)
  const cardUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://mni-members-app.vercel.app'}/card/${encodeURIComponent(m.member_id)}`

  return (
    <div className="min-h-dvh bg-[#F4F6FA] px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-md space-y-5">
        {/* Top MNI Brand Strip */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2.5">
            <img src="/brand/mni-logo.webp" alt="MNI" className="size-8 rounded-xl object-cover shadow-sm" />
            <div>
              <p className="text-label font-extrabold leading-none text-navy">MNI</p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">Digital Member Card</p>
            </div>
          </div>
          <Link
            href="/login"
            className="rounded-full bg-white px-3.5 py-1.5 text-caption font-semibold text-navy ring-1 ring-line hover:bg-subtle"
          >
            Member Sign In
          </Link>
        </div>

        {/* Apple Wallet-style Card */}
        <section className="overflow-hidden rounded-[26px] bg-gradient-to-br from-[#0B224E] via-[#102E6A] to-[#163E8C] p-6 text-white shadow-[0_18px_40px_rgba(11,34,78,0.28)]">
          <div className="flex items-center justify-between gap-2">
            <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wider text-white">
              {m.member_id}
            </span>
            <TierBadge tier={m.tier} onNavy />
          </div>

          <div className="mt-5 flex items-center gap-4">
            <Avatar
              initials={m.avatar_initials || m.full_name.slice(0, 2).toUpperCase()}
              src={m.custom_avatar || null}
              size="lg"
              tone="white"
            />
            <div className="min-w-0 flex-1">
              <h1 className="flex items-center gap-1.5 text-[21px] font-bold leading-tight">
                <span className="truncate">{m.full_name}</span>
                {m.is_verified && <VerifiedMark className="[&_svg]:text-[#7fd4b8]" />}
              </h1>
              <p className="truncate text-body font-medium text-on-navy-muted">{m.business_name}</p>
              <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-caption text-on-navy-muted">
                <span className="inline-flex items-center gap-1">
                  <Briefcase className="size-3.5" />
                  {m.business_category}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3.5" />
                  {m.city}
                </span>
              </p>
            </div>
          </div>
        </section>

        {/* Business Details */}
        <section className="space-y-4 rounded-[22px] border border-black/[0.06] bg-white p-5 shadow-sm">
          {m.what_we_do && (
            <div>
              <h2 className="mb-1 text-[11px] font-bold uppercase tracking-wider text-muted">What we do</h2>
              <p className="text-[14px] leading-relaxed text-[#1C1C1E]/90">{m.what_we_do}</p>
            </div>
          )}

          {m.key_product_service && (
            <div>
              <h2 className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted">
                <Sparkles className="size-3.5 text-brand" />
                Key offering
              </h2>
              <p className="text-[14px] leading-relaxed text-[#1C1C1E]/90">{m.key_product_service}</p>
            </div>
          )}

          {m.ideal_client && (
            <div className="rounded-2xl bg-subtle p-3.5">
              <h2 className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted">
                <Target className="size-3.5 text-brand" />
                Ideal client
              </h2>
              <p className="text-[13.5px] text-navy">{m.ideal_client}</p>
            </div>
          )}

          <div className="space-y-2.5 pt-1">
            <SaveContactButton
              fullName={m.full_name}
              businessName={m.business_name}
              businessCategory={m.business_category}
              city={m.city}
              websiteUrl={m.website_url}
              memberId={m.member_id}
              cardUrl={cardUrl}
            />

            {site && (
              <a
                href={site}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-line bg-surface text-label font-semibold text-navy hover:bg-subtle"
              >
                <ExternalLink className="size-4 text-brand" />
                Visit Website
              </a>
            )}
          </div>
        </section>

        <p className="text-center text-caption text-muted">
          Verified Member · MNI Curated Business Network
        </p>
      </div>
    </div>
  )
}
