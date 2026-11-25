import { z } from 'zod'
import { assertSameOrigin, handler, HttpError, ok, parseJson, requireApiMember } from '@/lib/http'
import { getPgPool } from '@/lib/db'
import { awardContributorPoints } from '@/lib/points'

const createSchema = z.object({
  targetMemberId: z.union([z.number(), z.string()]),
  proposedTime: z.string().trim().min(1).max(100),
  note: z.string().trim().max(400).optional(),
})

const patchSchema = z.object({
  id: z.union([z.number(), z.string()]),
  status: z.enum(['accepted', 'declined']),
})

export const POST = handler(async (req) => {
  assertSameOrigin(req)
  const { member } = await requireApiMember(req)
  const body = await parseJson(req, createSchema)

  const targetId = Number(body.targetMemberId)
  const proposedTime = (body.proposedTime ?? '').trim().slice(0, 100)
  const note = (body.note ?? '').trim().slice(0, 400) || null

  if (!targetId || Number.isNaN(targetId)) throw new HttpError(400, 'Select a member for Coffee Connect')
  if (targetId === member.id) throw new HttpError(400, 'Cannot schedule a Coffee Connect with yourself')
  if (!proposedTime) throw new HttpError(400, 'Choose or enter a preferred time slot')

  const pool = getPgPool()

  // Enforce: user can only invite members whose contact they requested from Admin AND received
  const receivedRes = await pool.query(
    `SELECT id FROM contact_requests
     WHERE requested_by_id = $1 AND target_member_id = $2
       AND status IN ('contact_received', 'followup_required', 'outcome_recorded')
     LIMIT 1`,
    [member.id, targetId],
  )
  if (receivedRes.rows.length === 0) {
    throw new HttpError(403, 'You can only invite members whose contact you have requested and received from Admin.')
  }

  const targetRes = await pool.query(
    `SELECT id, full_name, avatar_initials, custom_avatar, business_name, city FROM members WHERE id = $1`,
    [targetId],
  )
  if (targetRes.rows.length === 0) throw new HttpError(404, 'Member not found')
  const t = targetRes.rows[0]

  const res = await pool.query(
    `INSERT INTO coffee_connects (requester_id, target_member_id, proposed_time, note, status)
     VALUES ($1, $2, $3, $4, 'pending')
     RETURNING id, created_at`,
    [member.id, targetId, proposedTime, note],
  )

  await awardContributorPoints(member.id, 30, '1-on-1 Coffee Connect Invite')

  return ok({
    ok: true,
    connect: {
      id: res.rows[0].id,
      direction: 'outgoing' as const,
      otherMember: {
        id: t.id,
        fullName: t.full_name,
        avatarInitials: t.avatar_initials || t.full_name.slice(0, 2).toUpperCase(),
        avatarUrl: t.custom_avatar || null,
        businessName: t.business_name,
        city: t.city,
      },
      proposedTime,
      note,
      status: 'pending' as const,
      createdAt: new Date(res.rows[0].created_at).toISOString(),
    },
  })
})

export const PATCH = handler(async (req) => {
  assertSameOrigin(req)
  const { member } = await requireApiMember(req)
  const body = await parseJson(req, patchSchema)

  const connectId = Number(body.id)
  if (!connectId || (body.status !== 'accepted' && body.status !== 'declined')) {
    throw new HttpError(400, 'Invalid request')
  }

  const pool = getPgPool()
  const res = await pool.query(
    `UPDATE coffee_connects SET status = $1 WHERE id = $2 AND target_member_id = $3 RETURNING id`,
    [body.status, connectId, member.id],
  )
  if (res.rows.length === 0) throw new HttpError(404, 'Coffee Connect request not found')

  if (body.status === 'accepted') {
    await awardContributorPoints(member.id, 30, 'Accepted 1-on-1 Coffee Connect')
  }

  return ok({ ok: true, status: body.status })
})
