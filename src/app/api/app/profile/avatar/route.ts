import { assertSameOrigin, handler, HttpError, ok, parseJson, requireApiMember } from '@/lib/http'
import { getPgPool } from '@/lib/db'
import { z } from 'zod'

const avatarSchema = z.object({
  avatarUrl: z.string().nullable().optional(),
  remove: z.boolean().optional(),
})

export const POST = handler(async (req) => {
  assertSameOrigin(req)
  const { member } = await requireApiMember(req)
  const input = await parseJson(req, avatarSchema)

  const pool = getPgPool()
  const newAvatar = input.remove ? null : (input.avatarUrl ?? null)

  await pool.query('UPDATE members SET custom_avatar = $1, updated_at = NOW() WHERE id = $2', [
    newAvatar,
    member.id,
  ])

  return ok({ ok: true, avatarUrl: newAvatar })
})
