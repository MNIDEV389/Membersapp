import { z } from 'zod'
import { getPgPool } from '@/lib/db'
import { assertSameOrigin, handler, HttpError, ok, parseJson, requireApiAdmin } from '@/lib/http'

const createMemberSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  phone: z.string().trim().min(5).max(30),
  whatsapp: z.string().trim().max(30).optional(),
  city: z.string().trim().min(2).max(80),
  businessName: z.string().trim().min(2).max(120),
  businessCategory: z.string().trim().min(2).max(80),
  tier: z.enum(['freemium', 'premium']).default('freemium'),
  isVerified: z.boolean().default(true),
  avatarUrl: z.string().trim().optional().nullable(),
  password: z.string().min(8).max(100),
})

const patchMemberSchema = z.object({
  id: z.number(),
  tier: z.enum(['freemium', 'premium']).optional(),
  isVerified: z.boolean().optional(),
  accountStatus: z.enum(['active', 'suspended']).optional(),
  fullName: z.string().trim().min(2).max(120).optional(),
  phone: z.string().trim().min(5).max(30).optional(),
  whatsapp: z.string().trim().max(30).optional().nullable(),
  city: z.string().trim().min(2).max(80).optional(),
  businessName: z.string().trim().min(2).max(120).optional(),
  businessCategory: z.string().trim().min(2).max(80).optional(),
  websiteUrl: z.string().trim().max(250).optional().nullable(),
  whatWeDo: z.string().trim().max(2000).optional().nullable(),
  bio: z.string().trim().max(2000).optional().nullable(),
  keyProductService: z.string().trim().max(1000).optional().nullable(),
  idealClient: z.string().trim().max(800).optional().nullable(),
  opportunityLookingFor: z.string().trim().max(800).optional().nullable(),
  targetConnections: z.string().trim().max(500).optional().nullable(),
  preferredCallDay: z.string().trim().max(50).optional().nullable(),
  preferredCallTime: z.string().trim().max(80).optional().nullable(),
  additionalNotes: z.string().trim().max(800).optional().nullable(),
  mniCoins: z.number().min(0).optional(),
  avatarUrl: z.string().trim().optional().nullable(),
  password: z.string().min(8).max(100).optional(),
})

export const POST = handler(async (req) => {
  assertSameOrigin(req)
  const { payload } = await requireApiAdmin(req)
  const data = await parseJson(req, createMemberSchema)

  const initials = data.fullName
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? '')
    .join('')
  const randomSuffix = Math.floor(100000 + Math.random() * 900000)
  const memberId = `MNI-${randomSuffix}`

  try {
    const created = await payload.create({
      collection: 'members',
      overrideAccess: true,
      data: {
        email: data.email.toLowerCase(),
        password: data.password,
        fullName: data.fullName,
        phone: data.phone,
        whatsapp: data.whatsapp || data.phone,
        city: data.city,
        businessName: data.businessName,
        businessCategory: data.businessCategory,
        tier: data.tier as never,
        isVerified: data.isVerified,
        accountStatus: 'active',
        memberId,
        avatarInitials: initials,
        mniCoins: 0,
        referralCount: 0,
      },
    })

    if (data.avatarUrl) {
      const pool = getPgPool()
      await pool.query('UPDATE members SET custom_avatar = $1 WHERE id = $2', [data.avatarUrl, created.id])
    }

    return ok({ ok: true, member: created })
  } catch (err) {
    throw new HttpError(400, (err as Error).message || 'Could not create member.')
  }
})

export const PATCH = handler(async (req) => {
  assertSameOrigin(req)
  const { payload } = await requireApiAdmin(req)
  const data = await parseJson(req, patchMemberSchema)
  const { id, avatarUrl, ...updates } = data

  // Keep bio and whatWeDo in sync
  if (updates.whatWeDo !== undefined && updates.bio === undefined) {
    updates.bio = updates.whatWeDo
  }

  const updated = await payload.update({
    collection: 'members',
    id,
    overrideAccess: true,
    data: updates as never,
  })

  if (avatarUrl !== undefined) {
    const pool = getPgPool()
    await pool.query('UPDATE members SET custom_avatar = $1, updated_at = NOW() WHERE id = $2', [
      avatarUrl || null,
      id,
    ])
  }

  return ok({ ok: true, member: updated })
})
