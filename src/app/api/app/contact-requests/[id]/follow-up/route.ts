import { assertSameOrigin, handler, HttpError, ok, parseJson, requireApiMember } from '@/lib/http'
import { followUpSchema } from '@/lib/schemas'

/** Record the business outcome of an introduction (requester only, after contact is shared). */
export const POST = handler(async (req, { params }) => {
  assertSameOrigin(req)
  const { payload, member } = await requireApiMember(req)
  const { id } = await params
  const input = await parseJson(req, followUpSchema)

  const request = await payload
    .findByID({ collection: 'contact-requests', id: Number(id), overrideAccess: true, depth: 0 })
    .catch(() => null)
  const owner = request && (typeof request.requestedBy === 'object' ? request.requestedBy.id : request.requestedBy)
  if (!request || owner !== member.id) throw new HttpError(404, 'Request not found.')
  if (request.status === 'pending' || request.status === 'declined') {
    throw new HttpError(409, 'You can add a follow-up once MNI has shared the contact.')
  }

  // Answers are dependent: no call → no conversation → no business.
  const conversation = input.calledContact && input.conversationTookPlace
  await payload.update({
    collection: 'contact-requests',
    id: request.id,
    overrideAccess: true,
    data: {
      status: 'outcome_recorded',
      followUp: {
        calledContact: input.calledContact,
        conversationTookPlace: conversation,
        businessGenerated: conversation && input.businessGenerated,
        gaveBusiness: input.gaveBusiness,
        remarks: input.remarks,
        recordedAt: new Date().toISOString(),
      },
    },
  })
  return ok({ ok: true })
})
