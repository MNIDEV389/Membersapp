import { z } from 'zod'
import { assertSameOrigin, handler, ok, parseJson, requireApiAdmin } from '@/lib/http'

const patchRequestSchema = z.object({
  id: z.number(),
  status: z.enum(['pending', 'contact_received', 'followup_required', 'outcome_recorded', 'declined']),
  adminNote: z.string().trim().max(500).optional(),
})

export const PATCH = handler(async (req) => {
  assertSameOrigin(req)
  const { payload } = await requireApiAdmin(req)
  const { id, status, adminNote } = await parseJson(req, patchRequestSchema)

  const updated = await payload.update({
    collection: 'contact-requests',
    id,
    overrideAccess: true,
    data: {
      status,
      ...(adminNote !== undefined ? { adminNote } : {}),
    },
  })

  return ok({ ok: true, request: updated })
})
