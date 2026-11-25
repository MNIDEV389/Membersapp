import { assertSameOrigin, handler, ok, parseJson, requireApiMember } from '@/lib/http'
import { rateLimit } from '@/lib/rate-limit'
import { z } from 'zod'

const schema = z.object({
  bannerId: z.union([z.string(), z.number()]),
  bannerTitle: z.string().min(1),
  note: z.string().optional().default(''),
})

export const POST = handler(async (req) => {
  assertSameOrigin(req)
  const { payload, member } = await requireApiMember(req)
  rateLimit(`interest:${member.id}`, 20, 60 * 60 * 1000)
  const input = await parseJson(req, schema)

  const doc = await payload.create({
    collection: 'submissions',
    user: member,
    overrideAccess: true,
    data: {
      title: `Event Interest — ${input.bannerTitle}`,
      category: 'Business Opportunity',
      description: `Member ${member.fullName} (${member.email}, ${member.phone}) registered interest in "${input.bannerTitle}".\n${input.note ? `Note: ${input.note}` : ''}`,
      submittedBy: member.id,
      status: 'pending',
    },
  })

  return ok({ id: doc.id, success: true }, { status: 201 })
})
