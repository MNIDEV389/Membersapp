import { z } from 'zod'
import { assertSameOrigin, handler, HttpError, ok, parseJson, requireApiMember } from '@/lib/http'
import { getPgPool } from '@/lib/db'
import { awardContributorPoints } from '@/lib/points'

const celebrationSchema = z.object({
  toMemberId: z.union([z.number(), z.string()]),
  amountLabel: z.string().trim().min(1).max(80),
  story: z.string().trim().min(1).max(500),
})

export const POST = handler(async (req) => {
  assertSameOrigin(req)
  const { member } = await requireApiMember(req)
  const body = await parseJson(req, celebrationSchema)

  const toMemberId = Number(body.toMemberId)
  const amountLabel = (body.amountLabel ?? '').trim().slice(0, 80)
  const story = (body.story ?? '').trim().slice(0, 500)

  if (!toMemberId || Number.isNaN(toMemberId)) throw new HttpError(400, 'Please select a member')
  if (toMemberId === member.id) throw new HttpError(400, 'Select another MNI member you did business with')
  if (!amountLabel) throw new HttpError(400, 'Enter deal value or milestone (e.g. ₹2,50,000)')
  if (!story) throw new HttpError(400, 'Share a brief story about the deal or collaboration')

  const pool = getPgPool()
  const targetRes = await pool.query(
    `SELECT id, full_name, business_name, avatar_initials, custom_avatar FROM members WHERE id = $1`,
    [toMemberId],
  )
  if (targetRes.rows.length === 0) throw new HttpError(404, 'Selected member not found')
  const t = targetRes.rows[0]

  const insertRes = await pool.query(
    `INSERT INTO closed_business_celebrations (from_member_id, to_member_id, amount_label, story)
     VALUES ($1, $2, $3, $4)
     RETURNING id, created_at`,
    [member.id, toMemberId, amountLabel, story],
  )
  const row = insertRes.rows[0]

  await awardContributorPoints(member.id, 50, 'Shared Closed Business Celebration')

  return ok({
    ok: true,
    celebration: {
      id: row.id,
      amountLabel,
      story,
      createdAt: new Date(row.created_at).toISOString(),
      fromMember: {
        id: member.id,
        fullName: member.fullName,
        avatarInitials: member.avatarInitials || member.fullName.slice(0, 2).toUpperCase(),
        avatarUrl: (member as { custom_avatar?: string | null }).custom_avatar ?? null,
        businessName: member.businessName,
      },
      toMember: {
        id: t.id,
        fullName: t.full_name,
        avatarInitials: t.avatar_initials || t.full_name.slice(0, 2).toUpperCase(),
        avatarUrl: t.custom_avatar ?? null,
        businessName: t.business_name,
      },
    },
  })
})
