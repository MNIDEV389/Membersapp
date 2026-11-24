import { assertSameOrigin, handler, ok, parseJson, requireApiMember } from '@/lib/http'
import { rateLimit } from '@/lib/rate-limit'
import { submissionSchema } from '@/lib/schemas'
import { ownedMediaId } from '../_media'

/** Send a business requirement to MNI for review. Never publishes directly. */
export const POST = handler(async (req) => {
  assertSameOrigin(req)
  const { payload, member } = await requireApiMember(req)
  rateLimit(`submission:${member.id}`, 10, 60 * 60 * 1000)
  const input = await parseJson(req, submissionSchema)
  const imageId = await ownedMediaId(payload, member.id, input.supportingImageId)

  const doc = await payload.create({
    collection: 'submissions',
    user: member,
    overrideAccess: false,
    data: {
      title: input.title,
      category: input.category,
      description: input.description,
      supportingImage: imageId ?? undefined,
      submittedBy: member.id,
      status: 'pending',
    },
  })
  return ok({ id: doc.id }, { status: 201 })
})
