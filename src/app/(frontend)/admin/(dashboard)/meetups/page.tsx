import type { Metadata } from 'next'
import { requireAdmin } from '@/lib/admin-auth'
import { getCelebrations } from '@/lib/data'
import { getPgPool } from '@/lib/db'
import type { MeetupVM } from '@/lib/view-models'
import { AdminMeetupsView } from '@/components/admin/AdminMeetupsView'

export const metadata: Metadata = { title: 'Meetups & Wins · MNI Admin' }

export default async function AdminMeetupsPage() {
  await requireAdmin()
  const pool = getPgPool()

  const [meetupsRes, rsvpsRes, celData] = await Promise.all([
    pool.query(`SELECT id, title, description, city, venue, starts_at, host_name FROM meetups ORDER BY starts_at ASC`),
    pool.query(
      `SELECT r.meetup_id, m.id, m.full_name, m.avatar_initials, m.custom_avatar, m.business_name, m.city
       FROM meetup_rsvps r
       JOIN members m ON m.id = r.member_id`,
    ),
    getCelebrations(),
  ])

  const attMap = new Map<number, MeetupVM['attendees']>()
  for (const r of rsvpsRes.rows) {
    const mid = Number(r.meetup_id)
    const list = attMap.get(mid) ?? []
    list.push({
      id: r.id,
      fullName: r.full_name,
      avatarInitials: r.avatar_initials || r.full_name.slice(0, 2).toUpperCase(),
      avatarUrl: r.custom_avatar || null,
      businessName: r.business_name,
      city: r.city,
    })
    attMap.set(mid, list)
  }

  const meetups: MeetupVM[] = meetupsRes.rows.map((m) => {
    const attendees = attMap.get(Number(m.id)) ?? []
    return {
      id: m.id,
      title: m.title,
      description: m.description,
      city: m.city,
      venue: m.venue,
      startsAt: new Date(m.starts_at).toISOString(),
      hostName: m.host_name,
      isGoing: false,
      attendeesCount: attendees.length,
      attendees,
    }
  })

  return <AdminMeetupsView initialMeetups={meetups} initialCelebrations={celData.celebrations} />
}
