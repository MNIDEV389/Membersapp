import 'server-only'
import type { Member } from '@/payload-types'
import { getPgPool } from './db'
import { PROFILE_UPDATE_CATEGORY } from './constants'
import { getPayloadClient } from './payload'
import {
  toBanner,
  toContactRequest,
  toPost,
  toPublicMember,
  toReferral,
  toSubmission,
} from './serializers'
import type {
  CelebrationVM,
  CoffeeConnectVM,
  DirectoryMemberVM,
  LeaderboardEntry,
  MeetupVM,
  NotificationVM,
  PostSeenByMember,
  PublicMember,
} from './view-models'

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
  const pool = getPgPool()
  const payload = await getPayloadClient()
  const [res, ptsRes] = await Promise.all([
    payload.find({
      collection: 'members',
      where: { accountStatus: { not_equals: 'suspended' } },
      overrideAccess: true,
      sort: ['-mniCoins', 'fullName'],
      limit,
      depth: 0,
      select: { fullName: true, businessName: true, avatarInitials: true, tier: true, mniCoins: true, referralCount: true },
    }),
    pool.query(
      `SELECT m.id, m.custom_avatar, COALESCE(SUM(p.points), 0)::int AS activity_points
       FROM members m
       LEFT JOIN member_activity_points p ON p.member_id = m.id
       GROUP BY m.id, m.custom_avatar`,
    ),
  ])

  const extraMap = new Map<number, { avatarUrl: string | null; activityPoints: number }>()
  for (const r of ptsRes.rows) {
    extraMap.set(Number(r.id), {
      avatarUrl: r.custom_avatar ?? null,
      activityPoints: Number(r.activity_points ?? 0),
    })
  }

  const entries = res.docs.map((m) => {
    const extra = extraMap.get(m.id)
    const totalPoints = (m.mniCoins ?? 0) + (extra?.activityPoints ?? 0)
    return {
      rank: 0,
      id: m.id,
      fullName: m.fullName,
      businessName: m.businessName,
      avatarInitials: m.avatarInitials || m.fullName.slice(0, 2).toUpperCase(),
      avatarUrl: extra?.avatarUrl ?? null,
      tier: (m.tier ?? 'freemium') as LeaderboardEntry['tier'],
      mniCoins: totalPoints,
      referralCount: m.referralCount ?? 0,
      isYou: m.id === me.id,
    }
  })

  entries.sort((a, b) => b.mniCoins - a.mniCoins || a.fullName.localeCompare(b.fullName))
  return entries.map((e, i) => ({ ...e, rank: i + 1 }))
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

/** Closed Business Celebrations for the Feed & Engagement showcase. */
export async function getCelebrations(): Promise<{
  celebrations: CelebrationVM[]
  membersForPicker: { id: number; fullName: string; businessName: string }[]
}> {
  const pool = getPgPool()
  const [celRes, memRes] = await Promise.all([
    pool.query(
      `SELECT c.id, c.amount_label, c.story, c.created_at,
              f.id AS f_id, f.full_name AS f_name, f.avatar_initials AS f_init, f.custom_avatar AS f_av, f.business_name AS f_biz,
              t.id AS t_id, t.full_name AS t_name, t.avatar_initials AS t_init, t.custom_avatar AS t_av, t.business_name AS t_biz
       FROM closed_business_celebrations c
       JOIN members f ON f.id = c.from_member_id
       JOIN members t ON t.id = c.to_member_id
       ORDER BY c.created_at DESC
       LIMIT 30`,
    ),
    pool.query(
      `SELECT id, full_name, business_name FROM members WHERE account_status IS DISTINCT FROM 'suspended' ORDER BY full_name ASC`,
    ),
  ])

  return {
    celebrations: celRes.rows.map((r) => ({
      id: r.id,
      amountLabel: r.amount_label,
      story: r.story,
      createdAt: new Date(r.created_at).toISOString(),
      fromMember: {
        id: r.f_id,
        fullName: r.f_name,
        avatarInitials: r.f_init || r.f_name.slice(0, 2).toUpperCase(),
        avatarUrl: r.f_av || null,
        businessName: r.f_biz,
      },
      toMember: {
        id: r.t_id,
        fullName: r.t_name,
        avatarInitials: r.t_init || r.t_name.slice(0, 2).toUpperCase(),
        avatarUrl: r.t_av || null,
        businessName: r.t_biz,
      },
    })),
    membersForPicker: memRes.rows.map((m) => ({
      id: Number(m.id),
      fullName: m.full_name,
      businessName: m.business_name,
    })),
  }
}

/** Full searchable Member Directory with Ideal Client Matchmaking & request status. */
export async function getDirectoryMembers(me: Me): Promise<DirectoryMemberVM[]> {
  const payload = await getPayloadClient()
  const [membersRes, myRequests] = await Promise.all([
    payload.find({
      collection: 'members',
      where: { accountStatus: { not_equals: 'suspended' } },
      overrideAccess: true,
      sort: 'fullName',
      limit: 200,
      depth: 1,
    }),
    payload.find({
      collection: 'contact-requests',
      user: me,
      overrideAccess: false,
      where: { status: { not_equals: 'declined' } },
      limit: 200,
      depth: 0,
    }),
  ])

  const requestedIds = new Set(
    myRequests.docs.map((r) => String(typeof r.targetMember === 'object' ? r.targetMember.id : r.targetMember)),
  )

  const myKeywords = [
    me.businessCategory,
    me.whatWeDo,
    me.keyProductService,
    me.idealClient,
    me.opportunityLookingFor,
    me.targetConnections,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 4)

  const myKeywordSet = new Set(myKeywords)

  return membersRes.docs.map((doc) => {
    const pub = toPublicMember(doc)
    const targetText = [pub.idealClient, pub.opportunityLookingFor, pub.targetConnections, pub.businessCategory]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    let matchReason: string | null = null
    if (doc.id !== me.id) {
      if (pub.city && me.city && pub.city.toLowerCase() === me.city.toLowerCase()) {
        matchReason = `Same chapter (${pub.city})`
      }
      const matchedWord = [...myKeywordSet].find((w) => targetText.includes(w))
      if (matchedWord) {
        matchReason = `Matches "${matchedWord}" in ideal client / needs`
      }
    }

    return {
      ...pub,
      isMatch: Boolean(matchReason),
      matchReason,
      isRequested: requestedIds.has(String(doc.id)),
      isMine: doc.id === me.id,
    }
  })
}

/** Chapter Meetups with RSVP status + 1-on-1 Coffee Connects. */
export async function getMeetupsAndConnects(me: Me): Promise<{
  meetups: MeetupVM[]
  connects: CoffeeConnectVM[]
  members: PublicMember[]
}> {
  const pool = getPgPool()
  const payload = await getPayloadClient()

  const [meetupsRes, rsvpsRes, connectsRes, membersRes] = await Promise.all([
    pool.query(`SELECT id, title, description, city, venue, starts_at, host_name FROM meetups ORDER BY starts_at ASC`),
    pool.query(
      `SELECT r.meetup_id, m.id, m.full_name, m.avatar_initials, m.custom_avatar, m.business_name, m.city
       FROM meetup_rsvps r
       JOIN members m ON m.id = r.member_id
       ORDER BY r.created_at DESC`,
    ),
    pool.query(
      `SELECT c.id, c.requester_id, c.target_member_id, c.proposed_time, c.note, c.status, c.created_at,
              req.full_name AS req_name, req.avatar_initials AS req_init, req.custom_avatar AS req_av, req.business_name AS req_biz, req.city AS req_city,
              tgt.full_name AS tgt_name, tgt.avatar_initials AS tgt_init, tgt.custom_avatar AS tgt_av, tgt.business_name AS tgt_biz, tgt.city AS tgt_city
       FROM coffee_connects c
       JOIN members req ON req.id = c.requester_id
       JOIN members tgt ON tgt.id = c.target_member_id
       WHERE c.requester_id = $1 OR c.target_member_id = $1
       ORDER BY c.created_at DESC
       LIMIT 30`,
      [me.id],
    ),
    payload.find({
      collection: 'members',
      where: { and: [{ id: { not_equals: me.id } }, { accountStatus: { not_equals: 'suspended' } }] },
      overrideAccess: true,
      sort: 'fullName',
      limit: 100,
      depth: 1,
    }),
  ])

  const attendeesByMeetup = new Map<number, MeetupVM['attendees']>()
  for (const r of rsvpsRes.rows) {
    const mid = Number(r.meetup_id)
    const list = attendeesByMeetup.get(mid) ?? []
    list.push({
      id: r.id,
      fullName: r.full_name,
      avatarInitials: r.avatar_initials || r.full_name.slice(0, 2).toUpperCase(),
      avatarUrl: r.custom_avatar || null,
      businessName: r.business_name,
      city: r.city,
    })
    attendeesByMeetup.set(mid, list)
  }

  const meetups: MeetupVM[] = meetupsRes.rows.map((m) => {
    const attendees = attendeesByMeetup.get(Number(m.id)) ?? []
    return {
      id: m.id,
      title: m.title,
      description: m.description,
      city: m.city,
      venue: m.venue,
      startsAt: new Date(m.starts_at).toISOString(),
      hostName: m.host_name,
      isGoing: attendees.some((a) => Number(a.id) === me.id),
      attendeesCount: attendees.length,
      attendees,
    }
  })

  const connects: CoffeeConnectVM[] = connectsRes.rows.map((c) => {
    const isOutgoing = Number(c.requester_id) === me.id
    return {
      id: c.id,
      direction: isOutgoing ? 'outgoing' : 'incoming',
      otherMember: isOutgoing
        ? {
            id: c.target_member_id,
            fullName: c.tgt_name,
            avatarInitials: c.tgt_init || c.tgt_name.slice(0, 2).toUpperCase(),
            avatarUrl: c.tgt_av || null,
            businessName: c.tgt_biz,
            city: c.tgt_city,
          }
        : {
            id: c.requester_id,
            fullName: c.req_name,
            avatarInitials: c.req_init || c.req_name.slice(0, 2).toUpperCase(),
            avatarUrl: c.req_av || null,
            businessName: c.req_biz,
            city: c.req_city,
          },
      proposedTime: c.proposed_time,
      note: c.note,
      status: c.status,
      createdAt: new Date(c.created_at).toISOString(),
    }
  })

  return {
    meetups,
    connects,
    members: membersRes.docs.map(toPublicMember),
  }
}
