import { z } from 'zod'
import { assertSameOrigin, handler, ok, parseJson, requireApiAdmin } from '@/lib/http'

export const PATCH = handler(async (req) => {
  assertSameOrigin(req)
  const { payload } = await requireApiAdmin(req)
  const { id, status } = await parseJson(
    req,
    z.object({
      id: z.number(),
      status: z.enum(['pending', 'in_progress', 'resolved']),
    }),
  )

  const updated = await payload.update({
    collection: 'login-help-requests',
    id,
    overrideAccess: true,
    data: { status },
  })

  return ok({ ok: true, ticket: updated })
})

export const DELETE = handler(async (req) => {
  assertSameOrigin(req)
  const { payload } = await requireApiAdmin(req)
  const { id } = await parseJson(req, z.object({ id: z.number() }))

  await payload.delete({
    collection: 'login-help-requests',
    id,
    overrideAccess: true,
  })

  return ok({ ok: true })
})
