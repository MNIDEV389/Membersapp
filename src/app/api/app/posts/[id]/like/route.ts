import { assertSameOrigin, handler, HttpError, ok, requireApiMember } from '@/lib/http'
import { getPgPool } from '@/lib/db'

export const POST = handler(async (req, { params }) => {
  assertSameOrigin(req)
  const { member } = await requireApiMember(req)
  const { id } = await params
  const postId = Number(id)
  if (!postId || isNaN(postId)) throw new HttpError(400, 'Invalid post ID')

  const pool = getPgPool()
  // Check if already liked
  const check = await pool.query(
    'SELECT id FROM post_likes WHERE post_id = $1 AND member_id = $2',
    [postId, member.id],
  )

  let isLikedByMe = false
  if (check.rows.length > 0) {
    // Unlike
    await pool.query('DELETE FROM post_likes WHERE post_id = $1 AND member_id = $2', [postId, member.id])
    isLikedByMe = false
  } else {
    // Like
    await pool.query(
      'INSERT INTO post_likes (post_id, member_id, created_at) VALUES ($1, $2, NOW()) ON CONFLICT DO NOTHING',
      [postId, member.id],
    )
    isLikedByMe = true
  }

  const countRes = await pool.query(
    'SELECT COUNT(*)::int AS count FROM post_likes WHERE post_id = $1',
    [postId],
  )
  const likesCount = Number(countRes.rows[0]?.count ?? 0)

  return ok({ ok: true, likesCount, isLikedByMe })
})
