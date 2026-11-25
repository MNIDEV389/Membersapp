import { assertSameOrigin, handler, HttpError, ok, requireApiMember } from '@/lib/http'
import { getPgPool } from '@/lib/db'

export const POST = handler(async (req, { params }) => {
  assertSameOrigin(req)
  const { member } = await requireApiMember(req)
  const { id } = await params
  const postId = Number(id)
  if (!postId || isNaN(postId)) throw new HttpError(400, 'Invalid post ID')

  const pool = getPgPool()
  // Upsert view
  await pool.query(
    `INSERT INTO post_views (post_id, member_id, viewed_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (post_id, member_id) DO UPDATE SET viewed_at = NOW()`,
    [postId, member.id],
  )

  const countRes = await pool.query(
    'SELECT COUNT(*)::int AS count FROM post_views WHERE post_id = $1',
    [postId],
  )
  const viewsCount = Number(countRes.rows[0]?.count ?? 0)

  return ok({ ok: true, viewsCount, isViewedByMe: true })
})
