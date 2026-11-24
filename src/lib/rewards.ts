// Meetup rewards programme. Static configuration for now; when the MNI Admin
// app ships, move this into a Payload global so admins can edit it.

export interface MeetupPrize {
  id: string
  title: string
  minCoins: number
  badge: string
  description: string
  eligibility: string
}

export const MEETUP_PRIZES: MeetupPrize[] = [
  {
    id: 'grand-champion',
    title: 'Grand Champion trophy & keynote spotlight',
    minCoins: 3000,
    badge: 'Rank #1',
    description:
      'A 15-minute mainstage spotlight to present your business to 400+ attendees, plus a lifetime VIP meetup pass.',
    eligibility: 'Member with the most MNI Coins at the meetup cut-off.',
  },
  {
    id: 'spotlight-exhibition',
    title: 'Executive exhibition suite & priority showcase',
    minCoins: 2000,
    badge: 'Top 3',
    description:
      'A dedicated branded networking kiosk at the chapter meetup and a feature interview in the MNI Network Bulletin.',
    eligibility: 'Members holding 2,000+ MNI Coins.',
  },
  {
    id: 'silver-partner',
    title: 'Executive gift box & founders roundtable',
    minCoins: 1000,
    badge: 'Top 5',
    description: 'A curated artisanal hamper and access to the closed-door Founders Roundtable before the main mixer.',
    eligibility: 'Members holding 1,000+ MNI Coins.',
  },
]

export const NEXT_MEETUP = {
  title: 'MNI November Annual Meetup',
  /** ISO date (local, Asia/Kolkata). */
  date: '2026-11-21',
  venue: 'The Grand Ballroom, The Leela Palace, Bengaluru',
}

export function daysUntil(isoDate: string, now = new Date()) {
  const target = new Date(`${isoDate}T00:00:00+05:30`).getTime()
  const today = new Date(now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }) + 'T00:00:00+05:30').getTime()
  return Math.round((target - today) / 86_400_000)
}
