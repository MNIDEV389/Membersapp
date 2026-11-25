'use client'

import { ChevronRight, Coins, Gift, Trophy, Users } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { COINS_PER_REFERRAL, REFERRAL_STATUSES } from '@/lib/constants'
import { api, ApiError } from '@/lib/client-api'
import { formatDate, formatNumber } from '@/lib/format'
import { referralSchema } from '@/lib/schemas'
import type { ReferralVM } from '@/lib/view-models'
import { StatusPill, type Tone } from '../ui/Badges'
import { Button } from '../ui/Button'
import { EmptyState } from '../ui/Feedback'
import { Field, Input, Textarea } from '../ui/Field'
import { SegmentedTabs, TabPanel } from '../ui/Tabs'
import { useToast } from '../ui/Toast'

type TabId = 'refer' | 'how' | 'activity'
const tone: Record<string, Tone> = { pending_review: 'warning', confirmed: 'success', declined: 'neutral', meetup_redeemed: 'brand' }
const label = Object.fromEntries(REFERRAL_STATUSES.map((s) => [s.value, s.label]))
const empty = { candidateName: '', candidatePhone: '', candidateEmail: '', context: '' }

interface Props {
  initialTab: TabId
  coins: number
  rank: number
  referralCode: string | null
  referrals: ReferralVM[]
}

export function ReferView({ initialTab, coins, rank, referrals }: Props) {
  const router = useRouter()
  const toast = useToast()
  const [tab, setTab] = useState<TabId>(initialTab)
  const [form, setForm] = useState(empty)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const pendingCoins = referrals.filter((r) => r.status === 'pending_review').length * COINS_PER_REFERRAL

  const set = (k: keyof typeof empty) => (e: { target: { value: string } }) => {
    setForm((f) => ({ ...f, [k]: e.target.value }))
    if (errors[k]) setErrors(({ [k]: _, ...rest }) => rest)
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setFormError(null)
    const parsed = referralSchema.safeParse(form)
    if (!parsed.success) {
      const errs: Record<string, string> = {}
      for (const i of parsed.error.issues) errs[String(i.path[0])] ??= i.message
      setErrors(errs)
      document.getElementById(`ref-${Object.keys(errs)[0]}`)?.focus()
      return
    }
    setLoading(true)
    try {
      await api('/api/app/referrals', { body: form })
      toast(`${form.candidateName.split(' ')[0]} referred. You’ll earn ${COINS_PER_REFERRAL} coins once MNI confirms them.`)
      setForm(empty)
      setTab('activity')
      router.refresh()
    } catch (err) {
      const apiErr = err as ApiError
      setFormError(apiErr.message)
      setErrors(apiErr.fieldErrors ?? {})
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-title font-bold text-navy">Refer & earn</h1>
        <p className="mt-1 text-body text-muted">Introduce business owners you trust. Earn {COINS_PER_REFERRAL} MNI Coins for every confirmed referral.</p>
      </header>

      <section aria-label="Your coins" className="rounded-[var(--radius-panel)] bg-gradient-to-br from-navy via-[#163874] to-brand p-5 text-white sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-caption font-semibold uppercase tracking-wider text-on-navy-muted">Your balance</p>
            <p className="mt-1 flex items-center gap-2 text-[2rem] font-extrabold leading-none tabular-nums">
              <Coins className="size-7 text-[#f6c453]" aria-hidden="true" />
              {formatNumber(coins)}
            </p>
            {pendingCoins > 0 && <p className="mt-2 text-label text-on-navy-muted">+{formatNumber(pendingCoins)} pending confirmation</p>}
          </div>
          <div className="text-right">
            <p className="text-caption font-semibold uppercase tracking-wider text-on-navy-muted">Rank</p>
            <p className="mt-1 text-[2rem] font-extrabold leading-none tabular-nums">#{rank}</p>
          </div>
        </div>
        <Link href="/rewards" className="mt-5 flex min-h-11 items-center justify-between rounded-[var(--radius-control)] bg-white/12 px-4 text-label font-semibold ring-1 ring-white/20 hover:bg-white/20">
          <span className="flex items-center gap-2"><Trophy className="size-4 text-[#f6c453]" aria-hidden="true" />Leaderboard &amp; Active Points</span>
          <ChevronRight className="size-4" aria-hidden="true" />
        </Link>
      </section>

      <SegmentedTabs<TabId>
        label="Referral sections"
        idPrefix="refer"
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'refer', label: 'Refer' },
          { id: 'how', label: 'How it works' },
          { id: 'activity', label: 'Activity', count: referrals.length },
        ]}
      />

      <TabPanel idPrefix="refer" id={tab}>
        {tab === 'refer' && (
          <form onSubmit={submit} noValidate className="space-y-4 rounded-[var(--radius-card)] border border-line bg-surface p-5 shadow-card sm:p-6">
            <div>
              <h2 className="text-section font-bold text-navy">Introduce a business owner</h2>
              <p className="text-label text-muted">MNI’s membership team will reach out and verify them.</p>
            </div>
            {formError && <p role="alert" className="rounded-xl bg-danger-bg px-4 py-3 text-label text-danger">{formError}</p>}
            <Field label="Full name" required error={errors.candidateName}>
              <Input id="ref-candidateName" autoComplete="off" value={form.candidateName} onChange={set('candidateName')} placeholder="e.g. Vikram Malhotra" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Mobile number" required error={errors.candidatePhone}>
                <Input id="ref-candidatePhone" type="tel" inputMode="tel" value={form.candidatePhone} onChange={set('candidatePhone')} placeholder="+91 98765 43210" />
              </Field>
              <Field label="Work email" required error={errors.candidateEmail}>
                <Input id="ref-candidateEmail" type="email" inputMode="email" value={form.candidateEmail} onChange={set('candidateEmail')} placeholder="name@business.com" />
              </Field>
            </div>
            <Field label="Why are they a good fit for MNI?" optional error={errors.context} counter={{ value: form.context.length, max: 1000 }}>
              <Textarea id="ref-context" rows={3} maxLength={1000} value={form.context} onChange={set('context')} placeholder="Their business, size, and how you know them" />
            </Field>
            <Button type="submit" size="lg" fullWidth loading={loading} loadingText="Sending…" icon={<Gift className="size-[18px]" aria-hidden="true" />}>
              Send referral
            </Button>
            <p className="text-center text-caption text-muted">Only refer people who’ve agreed to be contacted by MNI.</p>
          </form>
        )}

        {tab === 'how' && (
          <ol className="space-y-3">
            {[
              ['Introduce a business owner', 'Share their details using the referral form. Make sure they’re happy to hear from MNI.'],
              ['MNI verifies them', 'Our membership team contacts and verifies your referral.'],
              [`Earn ${COINS_PER_REFERRAL} coins`, 'Coins are added to your balance as soon as the referral is confirmed.'],
              ['Win at the meetup', 'Top coin holders receive prizes and recognition on stage at the MNI meetup.'],
            ].map(([title, body], i) => (
              <li key={title} className="flex gap-4 rounded-[var(--radius-card)] border border-line bg-surface p-4 shadow-card">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-navy text-label font-bold text-white">{i + 1}</span>
                <div>
                  <p className="text-body font-semibold text-navy">{title}</p>
                  <p className="text-label text-muted">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        )}

        {tab === 'activity' &&
          (referrals.length === 0 ? (
            <EmptyState icon={<Users className="size-5" aria-hidden="true" />} title="No referrals yet" action={<Button onClick={() => setTab('refer')}>Refer someone</Button>}>
              Your referrals and their status will show here.
            </EmptyState>
          ) : (
            <ul className="space-y-3">
              {referrals.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-4 shadow-card">
                  <div className="min-w-0">
                    <p className="truncate text-body font-semibold text-navy">{r.candidateName}</p>
                    <p className="truncate text-caption text-muted">{r.candidateEmail} · {formatDate(r.createdAt)}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <StatusPill tone={tone[r.status]}>{label[r.status]}</StatusPill>
                    {r.status === 'confirmed' && <span className="text-caption font-semibold text-success">+{formatNumber(r.coinsAwarded)} coins</span>}
                  </div>
                </li>
              ))}
            </ul>
          ))}
      </TabPanel>
    </div>
  )
}
