import { z } from 'zod'
import { assertSameOrigin, handler, ok, parseJson, requireApiAdmin } from '@/lib/http'

const bannerSchema = z.object({
  title: z.string().trim().min(2).max(120),
  subtitle: z.string().trim().min(2).max(200),
  category: z.string().trim().min(2).max(60),
  actionLabel: z.string().trim().min(2).max(50).default('Learn more'),
  actionLink: z.string().trim().max(300).optional(),
  sortOrder: z.number().default(10),
  isActive: z.boolean().default(true),
})

export const POST = handler(async (req) => {
  assertSameOrigin(req)
  const { payload } = await requireApiAdmin(req)
  const data = await parseJson(req, bannerSchema)

  const created = await payload.create({
    collection: 'banners',
    overrideAccess: true,
    data: {
      title: data.title,
      subtitle: data.subtitle,
      category: data.category,
      actionLabel: data.actionLabel,
      actionLink: data.actionLink || undefined,
      sortOrder: data.sortOrder,
      isActive: data.isActive,
    },
  })

  return ok({ ok: true, banner: created })
})

export const PATCH = handler(async (req) => {
  assertSameOrigin(req)
  const { payload } = await requireApiAdmin(req)
  const { id, ...rest } = await parseJson(req, bannerSchema.partial().extend({ id: z.number() }))

  const updated = await payload.update({
    collection: 'banners',
    id,
    overrideAccess: true,
    data: rest,
  })
  return ok({ ok: true, banner: updated })
})

export const DELETE = handler(async (req) => {
  assertSameOrigin(req)
  const { payload } = await requireApiAdmin(req)
  const { id } = await parseJson(req, z.object({ id: z.number() }))
  await payload.delete({ collection: 'banners', id, overrideAccess: true })
  return ok({ ok: true })
})
