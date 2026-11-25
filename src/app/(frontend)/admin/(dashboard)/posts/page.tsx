import type { Metadata } from 'next'
import { getPgPool } from '@/lib/db'
import { getPayloadClient } from '@/lib/payload'
import { AdminPostsView, type AdminPostRow } from '@/components/admin/AdminPostsView'

export const metadata: Metadata = { title: 'Posts · MNI Admin' }

export default async function AdminPostsPage() {
  const payload = await getPayloadClient()
  const pool = getPgPool()

  const [postsRes, membersRes, likesRes, viewsRes] = await Promise.all([
    payload.find({ collection: 'posts', overrideAccess: true, sort: ['displayOrder', '-publishedAt'], limit: 100, depth: 1 }),
    payload.find({ collection: 'members', overrideAccess: true, sort: 'fullName', limit: 200, depth: 0 }),
    pool.query(`SELECT post_id, COUNT(*)::int AS count FROM post_likes GROUP BY post_id`),
    pool.query(`SELECT post_id, COUNT(*)::int AS count FROM post_views GROUP BY post_id`),
  ])

  const likesMap = new Map<number, number>(likesRes.rows.map((r) => [Number(r.post_id), Number(r.count)]))
  const viewsMap = new Map<number, number>(viewsRes.rows.map((r) => [Number(r.post_id), Number(r.count)]))

  const posts: AdminPostRow[] = postsRes.docs.map((p) => {
    const m = typeof p.taggedMember === 'object' ? p.taggedMember : null
    const imgObj = typeof p.image === 'object' && p.image ? p.image : null
    const imgUrl = (imgObj?.sizes?.thumb?.url || imgObj?.sizes?.card?.url || imgObj?.url || p.imageUrl) ?? null
    return {
      id: p.id,
      title: p.title,
      category: p.category,
      status: (p.isPublished ? 'published' : 'draft'),
      content: p.content ?? null,
      imageUrl: imgUrl,
      taggedMemberName: m?.fullName ?? null,
      taggedMemberId: m?.id ?? null,
      displayOrder: p.displayOrder ?? 100,
      publishedAt: p.publishedAt ?? null,
      likesCount: likesMap.get(p.id) ?? 0,
      viewsCount: viewsMap.get(p.id) ?? 0,
    }
  })

  const members = membersRes.docs.map((m) => ({
    id: m.id,
    fullName: m.fullName,
    businessName: m.businessName,
  }))

  return <AdminPostsView initialPosts={posts} members={members} />
}
