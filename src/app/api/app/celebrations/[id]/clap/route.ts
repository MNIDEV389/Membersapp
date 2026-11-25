import { assertSameOrigin, handler, HttpError, ok, requireApiMember } from '@/lib/http'
import { getPgPool } from '@/lib/db'

export const POST = handler(async (req, { params }) => {
  assertSameOrigin(req)
  const { member } = await requireApiMember(req)
  const { id } = await params
  const celebrationId = Number(id)
  if (!celebrationId || Number.isNaN(celebrationId)) throw new HttpError(400, 'Invalid celebration ID')

  const pool = getPgPool()
  const existing = await pool.query(
    `SELECT id FROM celebration_claps WHERE celebration_id = $1 AND member_id = $2`,
    [celebrationId, member.id],
  )

  let isClappedByMe = false
  if (existing.rows.length > 0) {
    await pool.query(`DELETE FROM celebration_claps WHERE celebration_id = $1 AND member_id = $2`, [
      celebrationId,
      member.id,
    ])
    isClappedByMe = false
  } else {
    await pool.query(
      `INSERT INTO celebration_claps (celebration_id, member_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [celebrationId, member.id],
    )
    isClappedByMe = true
  }

  const countRes = await pool.query(
    `SELECT COUNT(*)::int AS count FROM celebration_claps WHERE celebration_id = $1`,
    [celebrationId],
  )

  return ok({ ok: true, clapsCount: Number(countRes.rows[0]?.count ?? 0), isClappedByMe })
})
