import 'server-only'
import type { Member } from '@/payload-types'
import { getPgPool } from './db'
import { PROFILE_UPDATE_CATEGORY } from './constants'
import { getPayloadClient } from './payload'
import {
  toBanner,
  toContactRequest,
  toPost,
  toReferral,
  toSubmission,
} from './serializers'
import type { LeaderboardEntry, NotificationVM, PostSeenByMember } from './view-models'

type Me = Member & { collection: 'members' }

export async function getTimeline(me: Me) {
  const payload = await getPayloadClient()
  const [posts, banners, myRequests] = await Promise.all([
    // Read as the member (access control enforces published-only) …
    payload.find({
      collection: 'posts',
      user: me,
      overrideAccess: false,
      sort: ['displayOrder', '-publishedAt'],
      limit: 50,
      depth: 1,
    }),
    payload.find({ collection: 'banners', user: me, overrideAccess: false, sort: 'sortOrder', limit: 3, depth: 1 }),
    payload.find({
      collection: 'contact-requests',
      user: me,
      overrideAccess: false,
      where: { status: { not_equals: 'declined' } },
      limit: 200,
      depth: 0,
    }),
  ])

  // … but tagged members are populated with the member's own read access
  // (self only), so fetch tagged profiles server-side and project public fields.
  const taggedIds = [
    ...new Set(
      posts.docs
        .map((p) => (typeof p.taggedMember === 'object' ? p.taggedMember?.id : p.taggedMember))
        .filter((id): id is number => id != null),
    ),
  ]
  const tagged = taggedIds.length
    ? await payload.find({
        collection: 'members',
        where: { and: [{ id: { in: taggedIds } }, { accountStatus: { not_equals: 'suspended' } }] },
        overrideAccess: true,
        depth: 1,
        limit: taggedIds.length,
      })
    : { docs: [] as Member[] }
  const byId = new Map(tagged.docs.map((m) => [m.id, m]))

  const requestedMemberIds = myRequests.docs.map((r) =>
    typeof r.targetMember === 'object' ? r.targetMember.id : r.targetMember,
  )

  const postIds = posts.docs.map((p) => p.id)
  const likesMap = new Map<number, { count: number; liked: boolean }>()
  const viewsMap = new Map<number, { count: number; viewed: boolean }>()
  const seenByMap = new Map<number, PostSeenByMember[]>()

  if (postIds.length > 0) {
    try {
      const pool = getPgPool()
      const [lRes, vRes, sRes] = await Promise.all([
        pool.query(
          `SELECT post_id, COUNT(*)::int AS count, BOOL_OR(member_id = $1) AS liked
           FROM post_likes
           WHERE post_id = ANY($2::int[])
           GROUP BY post_id`,
          [me.id, postIds],
        ),
        pool.query(
          `SELECT post_id, COUNT(*)::int AS count, BOOL_OR(member_id = $1) AS viewed
           FROM post_views
           WHERE post_id = ANY($2::int[])
           GROUP BY post_id`,
          [me.id, postIds],
        ),
        pool.query(
          `SELECT pv.post_id, m.id, m.full_name, m.business_name, m.avatar_initials, m.custom_avatar, pv.viewed_at
           FROM post_views pv
           JOIN members m ON m.id = pv.member_id
           WHERE pv.post_id = ANY($1::int[])
           ORDER BY pv.viewed_at DESC`,
          [postIds],
        ),
      ])

      for (const row of lRes.rows) {
        likesMap.set(Number(row.post_id), { count: Number(row.count), liked: Boolean(row.liked) })
      }
      for (const row of vRes.rows) {
        viewsMap.set(Number(row.post_id), { count: Number(row.count), viewed: Boolean(row.viewed) })
      }
      for (const row of sRes.rows) {
        const pid = Number(row.post_id)
        const list = seenByMap.get(pid) ?? []
        list.push({
          id: row.id,
          fullName: row.full_name,
          avatarInitials: row.avatar_initials || row.full_name.slice(0, 2).toUpperCase(),
          avatarUrl: row.custom_avatar || null,
          businessName: row.business_name,
          viewedAt: new Date(row.viewed_at).toISOString(),
        })
        seenByMap.set(pid, list)
      }
    } catch (e) {
      console.error('Error fetching post social metrics:', e)
    }
  }

  return {
    posts: posts.docs.map((p) => {
      const id = typeof p.taggedMember === 'object' ? p.taggedMember?.id : p.taggedMember
      const l = likesMap.get(p.id)
      const v = viewsMap.get(p.id)
      const s = seenByMap.get(p.id)
      return toPost(
        { ...p, taggedMember: id != null ? (byId.get(id) ?? null) : null },
        {
          likesCount: l?.count ?? 0,
          isLikedByMe: l?.liked ?? false,
          viewsCount: v?.count ?? 0,
          isViewedByMe: v?.viewed ?? false,
          seenBy: s ?? [],
        },
      )
    }),
    banners: banners.docs.map(toBanner),
    requestedMemberIds,
  }
}

export async function getMyContactRequests(me: Me) {
  const payload = await getPayloadClient()
  // Scoped to the requester explicitly; overrideAccess is needed so the target
  // member's contact fields can be revealed once MNI has shared them.
  const res = await payload.find({
    collection: 'contact-requests',
    where: { requestedBy: { equals: me.id } },
    overrideAccess: true,
    sort: '-createdAt',
    limit: 100,
    depth: 1,
  })
  return res.docs.map(toContactRequest)
}

export async function getMySubmissions(me: Me) {
  const payload = await getPayloadClient()
  const res = await payload.find({
    collection: 'submissions',
    user: me,
    overrideAccess: false,
    where: { category: { not_equals: PROFILE_UPDATE_CATEGORY } },
    sort: '-createdAt',
    limit: 50,
    depth: 1,
  })
  return res.docs.map(toSubmission)
}

export async function getPendingProfileUpdate(me: Me) {
  const payload = await getPayloadClient()
  const res = await payload.find({
    collection: 'submissions',
    user: me,
    overrideAccess: false,
    where: {
      and: [
        { category: { equals: PROFILE_UPDATE_CATEGORY } },
        { status: { in: ['pending', 'changes_requested'] } },
      ],
    },
    sort: '-createdAt',
    limit: 1,
    depth: 0,
  })
  const doc = res.docs[0]
  return doc
    ? {
        id: doc.id,
        status: doc.status,
        adminFeedback: doc.adminFeedback ?? null,
        createdAt: doc.createdAt,
        changes: (doc.profileChanges ?? {}) as Record<string, string>,
      }
    : null
}

export async function getMyReferrals(me: Me) {
  const payload = await getPayloadClient()
  const res = await payload.find({
    collection: 'referrals',
    user: me,
    overrideAccess: false,
    sort: '-createdAt',
    limit: 100,
    depth: 0,
  })
  return res.docs.map(toReferral)
}

export async function getLeaderboard(me: Me, limit = 20) {
  const payload = await getPayloadClient()
  const res = await payload.find({
    collection: 'members',
    where: { accountStatus: { not_equals: 'suspended' } },
    overrideAccess: true,
    sort: ['-mniCoins', 'fullName'],
    limit,
    depth: 0,
    select: { fullName: true, businessName: true, avatarInitials: true, tier: true, mniCoins: true, referralCount: true },
  })
  return res.docs.map<LeaderboardEntry>((m, i) => ({
    rank: i + 1,
    id: m.id,
    fullName: m.fullName,
    businessName: m.businessName,
    avatarInitials: m.avatarInitials || m.fullName.slice(0, 2).toUpperCase(),
    avatarUrl: ((m as any).custom_avatar || (m as any).customAvatar) ?? null,
    tier: (m.tier ?? 'freemium') as LeaderboardEntry['tier'],
    mniCoins: m.mniCoins ?? 0,
    referralCount: m.referralCount ?? 0,
    isYou: m.id === me.id,
  }))
}

/** Competition rank ("1224" style): members with strictly more coins + 1. */
export async function getMyRank(me: Me) {
  const payload = await getPayloadClient()
  const { totalDocs } = await payload.count({
    collection: 'members',
    where: {
      and: [{ mniCoins: { greater_than: me.mniCoins ?? 0 } }, { accountStatus: { not_equals: 'suspended' } }],
    },
    overrideAccess: true,
  })
  return totalDocs + 1
}

/** Member activity feed derived from their own records. */
export async function getNotifications(me: Me): Promise<{ items: NotificationVM[]; unreadCount: number }> {
  const payload = await getPayloadClient()
  const seenAt = me.notificationsSeenAt ? new Date(me.notificationsSeenAt).getTime() : 0
  const [subs, reqs, refs] = await Promise.all([
    payload.find({
      collection: 'submissions',
      where: { and: [{ submittedBy: { equals: me.id } }, { status: { not_equals: 'pending' } }] },
      overrideAccess: true,
      sort: '-updatedAt',
      limit: 15,
      depth: 0,
    }),
    payload.find({
      collection: 'contact-requests',
      where: {
        and: [
          { requestedBy: { equals: me.id } },
          { status: { in: ['contact_received', 'followup_required', 'declined'] } },
        ],
      },
      overrideAccess: true,
      sort: '-updatedAt',
      limit: 15,
      depth: 1,
    }),
    payload.find({
      collection: 'referrals',
      where: { and: [{ referrer: { equals: me.id } }, { status: { not_equals: 'pending_review' } }] },
      overrideAccess: true,
      sort: '-updatedAt',
      limit: 15,
      depth: 0,
    }),
  ])

  const items: NotificationVM[] = []
  for (const s of subs.docs) {
    const isProfile = s.category === PROFILE_UPDATE_CATEGORY
    const verb =
      s.status === 'published'
        ? 'is now live on the timeline'
        : s.status === 'approved'
          ? 'was approved'
          : s.status === 'changes_requested'
            ? 'needs a few changes'
            : 'was not approved'
    items.push({
      id: `s-${s.id}`,
      kind: isProfile ? 'profile' : 'submission',
      title: isProfile ? 'Profile update' : 'Your submission',
      message: isProfile ? `Your profile update ${verb}.` : `“${s.title}” ${verb}.`,
      href: isProfile ? '/profile' : '/submit#my-submissions',
      at: s.updatedAt,
      unread: new Date(s.updatedAt).getTime() > seenAt,
    })
  }
  for (const r of reqs.docs) {
    const name = typeof r.targetMember === 'object' ? r.targetMember.fullName : 'a member'
    items.push({
      id: `c-${r.id}`,
      kind: 'contact',
      title: 'Introduction update',
      message:
        r.status === 'declined'
          ? `${name}'s contact isn't available right now.`
          : r.status === 'followup_required'
            ? `How did it go with ${name}? Add your follow-up.`
            : `MNI shared ${name}'s contact details with you.`,
      href: '/requests',
      at: r.updatedAt,
      unread: new Date(r.updatedAt).getTime() > seenAt,
    })
  }
  for (const r of refs.docs) {
    items.push({
      id: `r-${r.id}`,
      kind: 'referral',
      title: 'Referral update',
      message:
        r.status === 'confirmed'
          ? `${r.candidateName} was confirmed — ${r.coinsAwarded ?? 0} MNI Coins credited.`
          : r.status === 'meetup_redeemed'
            ? `Coins for ${r.candidateName} were redeemed at the meetup.`
            : `${r.candidateName} wasn't eligible for membership this time.`,
      href: '/refer?tab=activity',
      at: r.updatedAt,
      unread: new Date(r.updatedAt).getTime() > seenAt,
    })
  }
  items.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
  const top = items.slice(0, 30)
  return { items: top, unreadCount: top.filter((i) => i.unread).length }
}
