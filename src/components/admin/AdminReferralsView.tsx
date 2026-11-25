'use client'

import { Check, Coins, Plus, X } from 'lucide-react'
import { useState } from 'react'
import { api, ApiError } from '@/lib/client-api'
import { formatDate } from '@/lib/format'
import { StatusPill, type Tone } from '@/components/ui/Badges'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Field, Input, Select } from '@/components/ui/Field'
import { useToast } from '@/components/ui/Toast'

export interface AdminReferralRow {
  id: number
  candidateName: string
  candidateEmail: string
  candidatePhone: string
  context: string | null
  status: 'pending_review' | 'confirmed' | 'declined' | 'meetup_redeemed'
  coinsAwarded: number
  createdAt: string
  referrerName: string
  referrerBusiness: string
}

const TONE: Record<AdminReferralRow['status'], Tone> = {
  pending_review: 'warning',
  confirmed: 'success',
  declined: 'neutral',
  meetup_redeemed: 'brand',
}

export function AdminReferralsView({
  initialReferrals,
  members,
}: {
  initialReferrals: AdminReferralRow[]
  members: { id: number; fullName: string; businessName: string }[]
}) {
  const toast = useToast()
  const [referrals, setReferrals] = useState<AdminReferralRow[]>(initialReferrals)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [pointsModal, setPointsModal] = useState(false)
  const [memberId, setMemberId] = useState('')
  const [points, setPoints] = useState('50')
  const [reason, setReason] = useState('Special contribution bonus')
  const [savingPts, setSavingPts] = useState(false)

  const updateStatus = async (id: number, status: AdminReferralRow['status']) => {
    setBusyId(id)
    try {
      const res = await api<{ ok: boolean; referral: { coinsAwarded: number } }>('/api/admin/referrals', {
        method: 'PATCH',
        body: { id, status },
      })
      setReferrals((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status, coinsAwarded: res.referral.coinsAwarded ?? r.coinsAwarded } : r)),
      )
      toast(status === 'confirmed' ? 'Referral confirmed & +500 MNI Coins credited!' : `Referral marked ${status}`)
    } catch (err) {
      toast((err as ApiError).message || 'Action failed', 'error')
    } finally {
      setBusyId(null)
    }
  }

  const awardPoints = async () => {
    if (!memberId) {
      toast('Select a member', 'error')
      return
    }
    setSavingPts(true)
    try {
      await api('/api/admin/referrals', {
        body: { memberId: Number(memberId), points: Number(points) || 50, reason },
      })
      toast(`+${points} Active Contributor Points awarded!`)
      setPointsModal(false)
    } catch (err) {
      toast((err as ApiError).message || 'Failed to award points', 'error')
    } finally {
      setSavingPts(false)
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-bold tracking-tight text-navy">Referrals &amp; Coins</h1>
          <p className="text-label text-muted">Confirm member referrals (+500 MNI Coins) or award bonus activity points.</p>
        </div>
        <Button onClick={() => setPointsModal(true)} icon={<Plus className="size-4" />}>
          Award Activity Points
        </Button>
      </header>

      {referrals.length === 0 ? (
        <div className="rounded-2xl border border-line bg-surface p-10 text-center text-label text-muted">
          No referrals submitted yet.
        </div>
      ) : (
        <div className="space-y-3">
          {referrals.map((r) => (
            <div key={r.id} className="rounded-2xl border border-black/[0.06] bg-surface p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-[15.5px] font-bold text-navy">{r.candidateName}</p>
                  <p className="text-caption text-muted">
                    {r.candidateEmail} · {r.candidatePhone}
                  </p>
                  <p className="mt-1 text-caption font-semibold text-navy">
                    Referred by {r.referrerName} ({r.referrerBusiness}) · {formatDate(r.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {r.coinsAwarded > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-caption font-bold text-amber-900">
                      <Coins className="size-3.5 text-coin" />
                      {r.coinsAwarded}
                    </span>
                  )}
                  <StatusPill tone={TONE[r.status]}>{r.status.replace('_', ' ')}</StatusPill>
                </div>
              </div>

              {r.context && <p className="mt-2.5 rounded-xl bg-subtle p-3 text-label text-ink/90">{r.context}</p>}

              {r.status === 'pending_review' && (
                <div className="mt-3 flex justify-end gap-2 border-t border-line pt-3">
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={<X className="size-3.5" />}
                    disabled={busyId === r.id}
                    onClick={() => updateStatus(r.id, 'declined')}
                  >
                    Decline
                  </Button>
                  <Button
                    size="sm"
                    icon={<Check className="size-3.5" />}
                    loading={busyId === r.id}
                    onClick={() => updateStatus(r.id, 'confirmed')}
                  >
                    Confirm &amp; Credit 500 Coins
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog
        open={pointsModal}
        onClose={() => setPointsModal(false)}
        busy={savingPts}
        title="Award Active Contributor Points"
        footer={
          <>
            <Button variant="ghost" onClick={() => setPointsModal(false)} disabled={savingPts}>
              Cancel
            </Button>
            <Button onClick={awardPoints} loading={savingPts}>
              Credit Points
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Member">
            <Select value={memberId} onChange={(e) => setMemberId(e.target.value)}>
              <option value="">Select member…</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.fullName} — {m.businessName}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Points">
            <Input type="number" value={points} onChange={(e) => setPoints(e.target.value)} />
          </Field>
          <Field label="Reason">
            <Input value={reason} onChange={(e) => setReason(e.target.value)} />
          </Field>
        </div>
      </Dialog>
    </div>
  )
}
