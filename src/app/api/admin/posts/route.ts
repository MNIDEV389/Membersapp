import { z } from 'zod'
import { POST_CATEGORIES } from '@/lib/constants'
import { assertSameOrigin, handler, ok, parseJson, requireApiAdmin } from '@/lib/http'

const postSchema = z.object({
  title: z.string().trim().min(2).max(160),
  category: z.enum(POST_CATEGORIES),
  postType: z.enum(['image_only', 'text_only', 'image_text']).default('text_only'),
  badgeText: z.string().trim().max(60).optional(),
  content: z.string().trim().max(5000).optional(),
  taggedMemberId: z.number().nullable().optional(),
  status: z.enum(['draft', 'published']).default('published'),
  displayOrder: z.number().default(100),
})

const patchPostSchema = postSchema.partial().extend({ id: z.number() })

export const POST = handler(async (req) => {
  assertSameOrigin(req)
  const { payload } = await requireApiAdmin(req)
  const data = await parseJson(req, postSchema)

  const created = await payload.create({
    collection: 'posts',
    overrideAccess: true,
    data: {
      title: data.title,
      category: data.category,
      postType: data.postType,
      badgeText: data.badgeText || undefined,
      content: data.content || undefined,
      taggedMember: data.taggedMemberId || undefined,
      isPublished: data.status === 'published',
      displayOrder: data.displayOrder,
      publishedAt: data.status === 'published' ? new Date().toISOString() : undefined,
    } as never,
  })

  return ok({ ok: true, post: created })
})

export const PATCH = handler(async (req) => {
  assertSameOrigin(req)
  const { payload } = await requireApiAdmin(req)
  const { id, taggedMemberId, status, ...rest } = await parseJson(req, patchPostSchema)

  const updated = await payload.update({
    collection: 'posts',
    id,
    overrideAccess: true,
    data: {
      ...rest,
      ...(status !== undefined ? { isPublished: status === 'published' } : {}),
      ...(taggedMemberId !== undefined ? { taggedMember: taggedMemberId || null } : {}),
      ...(status === 'published' ? { publishedAt: new Date().toISOString() } : {}),
    },
  })

  return ok({ ok: true, post: updated })
})

export const DELETE = handler(async (req) => {
  assertSameOrigin(req)
  const { payload } = await requireApiAdmin(req)
  const { id } = await parseJson(req, z.object({ id: z.number() }))
  await payload.delete({ collection: 'posts', id, overrideAccess: true })
  return ok({ ok: true })
})
