import { handler, HttpError, ok, requireApiMember } from '@/lib/http'
import { getPgPool } from '@/lib/db'
import type { PostSeenByMember } from '@/lib/view-models'

export const GET = handler(async (req, { params }) => {
  await requireApiMember(req)
  const { id } = await params
  const postId = Number(id)
  if (!postId || isNaN(postId)) throw new HttpError(400, 'Invalid post ID')

  const pool = getPgPool()
  const res = await pool.query(
    `SELECT m.id, m.full_name, m.business_name, m.avatar_initials, m.custom_avatar, pv.viewed_at
     FROM post_views pv
     JOIN members m ON m.id = pv.member_id
     WHERE pv.post_id = $1
     ORDER BY pv.viewed_at DESC`,
    [postId],
  )

  const seenBy: PostSeenByMember[] = res.rows.map((row) => ({
    id: row.id,
    fullName: row.full_name,
    avatarInitials: row.avatar_initials || row.full_name.slice(0, 2).toUpperCase(),
    avatarUrl: row.custom_avatar || null,
    businessName: row.business_name,
    viewedAt: new Date(row.viewed_at).toISOString(),
  }))

  return ok({ seenBy })
})
