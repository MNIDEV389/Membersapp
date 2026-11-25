import { z } from 'zod'
import { assertSameOrigin, handler, ok, parseJson, requireApiMember } from '@/lib/http'
import { getPgPool } from '@/lib/db'

const pushSchema = z.object({
  enabled: z.boolean(),
})

export const GET = handler(async (req) => {
  const { member } = await requireApiMember(req)
  const pool = getPgPool()
  const { rows } = await pool.query(`SELECT enabled FROM push_subscriptions WHERE member_id = $1`, [member.id])
  return ok({ enabled: Boolean(rows[0]?.enabled ?? false) })
})

export const POST = handler(async (req) => {
  assertSameOrigin(req)
  const { member } = await requireApiMember(req)
  const body = await parseJson(req, pushSchema)
  const enabled = Boolean(body.enabled)

  const pool = getPgPool()
  await pool.query(
    `INSERT INTO push_subscriptions (member_id, enabled, updated_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (member_id) DO UPDATE SET enabled = EXCLUDED.enabled, updated_at = NOW()`,
    [member.id, enabled],
  )

  return ok({ ok: true, enabled })
})
