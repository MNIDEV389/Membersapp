import { z } from 'zod'
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
  password: z.string().min(8).max(100),
})

const patchMemberSchema = z.object({
  id: z.number(),
  tier: z.enum(['freemium', 'premium']).optional(),
  isVerified: z.boolean().optional(),
  accountStatus: z.enum(['active', 'suspended']).optional(),
  fullName: z.string().trim().min(2).max(120).optional(),
  phone: z.string().trim().min(5).max(30).optional(),
  city: z.string().trim().min(2).max(80).optional(),
  businessName: z.string().trim().min(2).max(120).optional(),
  businessCategory: z.string().trim().min(2).max(80).optional(),
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
    return ok({ ok: true, member: created })
  } catch (err) {
    throw new HttpError(400, (err as Error).message || 'Could not create member.')
  }
})

export const PATCH = handler(async (req) => {
  assertSameOrigin(req)
  const { payload } = await requireApiAdmin(req)
  const data = await parseJson(req, patchMemberSchema)
  const { id, ...updates } = data

  const updated = await payload.update({
    collection: 'members',
    id,
    overrideAccess: true,
    data: updates as never,
  })

  return ok({ ok: true, member: updated })
})
