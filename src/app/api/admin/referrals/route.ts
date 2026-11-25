import { z } from 'zod'
import { COINS_PER_REFERRAL } from '@/lib/constants'
import { assertSameOrigin, handler, HttpError, ok, parseJson, requireApiAdmin } from '@/lib/http'
import { awardContributorPoints } from '@/lib/points'

const patchReferralSchema = z.object({
  id: z.number(),
  status: z.enum(['pending_review', 'confirmed', 'declined', 'meetup_redeemed']),
})

const awardPointsSchema = z.object({
  memberId: z.number(),
  points: z.number().min(1).max(5000),
  reason: z.string().trim().min(2).max(160),
})

export const PATCH = handler(async (req) => {
  assertSameOrigin(req)
  const { payload } = await requireApiAdmin(req)
  const { id, status } = await parseJson(req, patchReferralSchema)

  const existing = await payload.findByID({ collection: 'referrals', id, overrideAccess: true, depth: 0 })
  if (!existing) throw new HttpError(404, 'Referral not found')

  const wasConfirmed = existing.status === 'confirmed'
  const coinsAwarded = status === 'confirmed' ? COINS_PER_REFERRAL : (existing.coinsAwarded ?? 0)

  const updated = await payload.update({
    collection: 'referrals',
    id,
    overrideAccess: true,
    data: { status, coinsAwarded },
  })

  if (status === 'confirmed' && !wasConfirmed) {
    const referrerId = typeof existing.referrer === 'object' ? existing.referrer.id : existing.referrer
    const member = await payload.findByID({ collection: 'members', id: referrerId, overrideAccess: true, depth: 0 })
    if (member) {
      await payload.update({
        collection: 'members',
        id: referrerId,
        overrideAccess: true,
        data: {
          mniCoins: (member.mniCoins ?? 0) + COINS_PER_REFERRAL,
          referralCount: (member.referralCount ?? 0) + 1,
        },
      })
    }
  }

  return ok({ ok: true, referral: updated })
})

export const POST = handler(async (req) => {
  assertSameOrigin(req)
  await requireApiAdmin(req)
  const { memberId, points, reason } = await parseJson(req, awardPointsSchema)
  await awardContributorPoints(memberId, points, reason)
  return ok({ ok: true })
})
