import { assertSameOrigin, handler, HttpError, ok, requireApiMember } from '@/lib/http'
import { getPgPool } from '@/lib/db'
import { awardContributorPoints } from '@/lib/points'

export const POST = handler(async (req, { params }) => {
  assertSameOrigin(req)
  const { member } = await requireApiMember(req)
  const { id } = await params
  const meetupId = Number(id)
  if (!meetupId || Number.isNaN(meetupId)) throw new HttpError(400, 'Invalid meetup ID')

  const pool = getPgPool()
  const existing = await pool.query(
    `SELECT id FROM meetup_rsvps WHERE meetup_id = $1 AND member_id = $2`,
    [meetupId, member.id],
  )

  let isGoing = false
  if (existing.rows.length > 0) {
    await pool.query(`DELETE FROM meetup_rsvps WHERE meetup_id = $1 AND member_id = $2`, [meetupId, member.id])
    isGoing = false
  } else {
    await pool.query(
      `INSERT INTO meetup_rsvps (meetup_id, member_id, status) VALUES ($1, $2, 'going') ON CONFLICT DO NOTHING`,
      [meetupId, member.id],
    )
    isGoing = true
    await awardContributorPoints(member.id, 30, 'Meetup RSVP')
  }

  const attendeesRes = await pool.query(
    `SELECT m.id, m.full_name, m.avatar_initials, m.custom_avatar, m.business_name, m.city
     FROM meetup_rsvps r
     JOIN members m ON m.id = r.member_id
     WHERE r.meetup_id = $1
     ORDER BY r.created_at DESC`,
    [meetupId],
  )

  const attendees = attendeesRes.rows.map((r) => ({
    id: r.id,
    fullName: r.full_name,
    avatarInitials: r.avatar_initials || r.full_name.slice(0, 2).toUpperCase(),
    avatarUrl: r.custom_avatar || null,
    businessName: r.business_name,
    city: r.city,
  }))

  return ok({ ok: true, isGoing, attendeesCount: attendees.length, attendees })
})
