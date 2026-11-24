/**
 * Seed a local/staging database with an admin, demo members and timeline
 * content. Refuses to run against production.
 *
 *   pnpm seed
 */
import config from '@payload-config'
import { getPayload } from 'payload'

if (process.env.NODE_ENV === 'production' && process.env.ALLOW_PROD_SEED !== 'true') {
  throw new Error('Refusing to seed in production.')
}
const adminEmail = process.env.SEED_ADMIN_EMAIL
const adminPassword = process.env.SEED_ADMIN_PASSWORD
const memberPassword = process.env.SEED_MEMBER_PASSWORD
if (!adminEmail || !adminPassword || !memberPassword) {
  throw new Error('Set SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD and SEED_MEMBER_PASSWORD.')
}

const payload = await getPayload({ config })

const upsert = async <T extends Record<string, unknown>>(collection: 'members' | 'admins', email: string, data: T) => {
  const found = await payload.find({ collection, where: { email: { equals: email } }, limit: 1, overrideAccess: true })
  if (found.docs[0]) return found.docs[0]
  return payload.create({ collection, data: data as never, overrideAccess: true })
}

await upsert('admins', adminEmail, { email: adminEmail, password: adminPassword, fullName: 'MNI Admin' })

const members = [
  {
    email: 'nishant@anotherworldindia.com', fullName: 'Nishant Dhiman', phone: '+91 98100 88990', city: 'New Delhi', memberId: 'MNI-002450',
    memberSince: 'October 2024', businessName: 'Another World India Pvt Ltd', businessCategory: 'Luxury boutique destination & travel management',
    tier: 'premium', mniCoins: 2000, referralCount: 4,
    whatWeDo: 'A luxury boutique destination and travel management company creating personalised, memorable travel experiences across the Indian subcontinent and worldwide — cultural, natural, architectural and adventure journeys.',
    keyProductService: 'Bespoke luxury itineraries, corporate offsites and incentive travel.',
    idealClient: 'Business and leisure travellers within India and overseas.', opportunityLookingFor: 'B2B and B2C travel partnerships.',
    preferredCallDay: 'Wednesday', preferredCallTime: '11:00 AM - 1:00 PM', websiteUrl: 'www.anotherworldindia.com',
  },
  {
    email: 'shivani@example.com', fullName: 'Shivani Dwivedi', phone: '+91 98765 01234', city: 'Bengaluru', memberId: 'MNI-002184',
    memberSince: 'October 2024', businessName: 'Dwivedi Advisory & Operations', businessCategory: 'Business operations & strategic sourcing',
    tier: 'pro', mniCoins: 1500, referralCount: 3,
    whatWeDo: 'Strategic advisory helping SMEs streamline vendor management, contract negotiation and multi-tier supply chain integrity across Southeast Asia.',
    keyProductService: 'Vendor audits, contract optimisation and executive procurement alignment.',
    idealClient: 'Mid-to-large industrial enterprises and regional manufacturers.', opportunityLookingFor: 'Cross-border manufacturing audits and logistics supplier connections.',
    targetConnections: 'COOs, procurement heads and factory owners.', preferredCallDay: 'Tuesday', preferredCallTime: '3:00 PM - 5:00 PM', websiteUrl: 'www.dwivediadvisory.com',
  },
  {
    email: 'ananya.mehta@example.com', fullName: 'Ananya Mehta', phone: '+91 98450 11223', city: 'Bengaluru', memberId: 'MNI-001924',
    memberSince: 'March 2023', businessName: 'Mehta Business Alliances', businessCategory: 'Business networking & member events', tier: 'premium', mniCoins: 3200, referralCount: 6,
    whatWeDo: 'Designs and runs curated founder events and business alliances for growing companies in South India.',
    opportunityLookingFor: 'Venue and hospitality partners for 2027 chapter events.',
  },
  {
    email: 'rohan.shah@example.com', fullName: 'Rohan Shah', phone: '+91 98765 43210', city: 'Bengaluru', memberId: 'MNI-002045',
    memberSince: 'January 2024', businessName: 'Studio RS Design & Branding', businessCategory: 'Brand & design partnership', tier: 'pro', mniCoins: 1000, referralCount: 2,
    whatWeDo: 'Award-winning creative studio specialising in brand identity, packaging design and launch campaigns for consumer brands.',
    keyProductService: 'Brand identity systems and packaging design.', idealClient: 'D2C and FMCG founders preparing a launch or rebrand.',
  },
  {
    email: 'priya.kapoor@example.com', fullName: 'Priya Kapoor', phone: '+91 98112 76543', city: 'Mumbai', memberId: 'MNI-001880',
    memberSince: 'June 2022', businessName: 'Kapoor Luxury Print & Packaging Labs', businessCategory: 'Commercial print & packaging', tier: 'premium', mniCoins: 2500, referralCount: 5,
    whatWeDo: 'Fourteen years of high-finish, sustainable print and packaging for premium consumer and corporate brands.',
    keyProductService: 'Rigid boxes, foil and emboss finishes, sustainable substrates.', opportunityLookingFor: 'Brand studios and D2C founders needing premium packaging.',
  },
]

const created = []
for (const m of members) created.push(await upsert('members', m.email, { ...m, password: memberPassword, isVerified: true, accountStatus: 'active' }))
const byEmail = Object.fromEntries(created.map((m) => [m.email, m]))

const { totalDocs: postCount } = await payload.count({ collection: 'posts', overrideAccess: true })
if (postCount === 0) {
  const posts = [
    {
      title: 'Looking for a premium packaging partner for a D2C launch', postType: 'image_text', category: 'Requirement', badgeText: 'Member requirement',
      content: 'A Bengaluru D2C skincare brand needs rigid-box packaging with foil finishing — around 5,000 units a month from January. Sustainable materials preferred.',
      imageUrl: 'https://images.unsplash.com/photo-1607083206968-13611e3d76db?auto=format&fit=crop&w=1200&q=80', imageAlt: 'Stacked premium gift boxes',
      taggedMember: byEmail['rohan.shah@example.com'].id, displayOrder: 0,
    },
    {
      title: 'Member spotlight: Kapoor Luxury Print & Packaging Labs', postType: 'text_only', category: 'Member Spotlight', badgeText: 'Built by members',
      content: 'Priya Kapoor has spent fourteen years building one of Mumbai’s most trusted premium print houses. Her team helps brands move to sustainable substrates without losing the luxury finish. Tap Info to see what Priya is looking for.',
      taggedMember: byEmail['priya.kapoor@example.com'].id, displayOrder: 1,
    },
    {
      title: 'MNI November meetup — The Leela Palace, Bengaluru', postType: 'image_only', category: 'Community Meetup', badgeText: 'MNI meetups',
      imageUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80', imageAlt: 'Business guests networking at an evening event',
      taggedMember: byEmail['ananya.mehta@example.com'].id, displayOrder: 2,
    },
    {
      title: 'Corporate offsite partners wanted for Q1', postType: 'text_only', category: 'Opportunity', badgeText: 'Opportunity',
      content: 'Another World India is curating three corporate offsites in Rajasthan and Kerala for Q1 and is looking for event production and AV partners.',
      taggedMember: byEmail['nishant@anotherworldindia.com'].id, displayOrder: 3,
    },
    {
      title: 'New: request introductions straight from the timeline', postType: 'text_only', category: 'Announcement', badgeText: 'From MNI',
      content: 'Tap “Request” on any post that features a member. MNI will confirm with them and share their details in your Requests tab.', displayOrder: 4,
    },
  ]
  for (const p of posts) await payload.create({ collection: 'posts', data: { ...p, isPublished: true } as never, overrideAccess: true })

  const banners = [
    { title: 'November Annual Meetup', subtitle: 'Join 400+ founders at The Leela Palace, Bengaluru.', category: 'Community meetup', actionLabel: 'See prizes', actionLink: '/rewards', sortOrder: 0, imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1400&q=80' },
    { title: 'Refer a founder, earn 500 coins', subtitle: 'Top coin holders win stage time at the meetup.', category: 'Rewards', actionLabel: 'Refer now', actionLink: '/refer', sortOrder: 1, imageUrl: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1400&q=80' },
  ]
  for (const b of banners) await payload.create({ collection: 'banners', data: { ...b, isActive: true } as never, overrideAccess: true })
}

payload.logger.info(`Seed complete: ${created.length} members.`)
process.exit(0)
