import { assertSameOrigin, handler, HttpError, ok, parseJson, requireApiMember } from '@/lib/http'
import { rateLimit } from '@/lib/rate-limit'
import { contactRequestSchema } from '@/lib/schemas'

/** Request an MNI-facilitated introduction to a tagged member. */
export const POST = handler(async (req) => {
  assertSameOrigin(req)
  const { payload, member } = await requireApiMember(req)
  rateLimit(`contact:${member.id}`, 20, 60 * 60 * 1000)
  const input = await parseJson(req, contactRequestSchema)
  const targetId = Number(input.targetMemberId)

  if (targetId === member.id) throw new HttpError(400, 'You can’t request your own contact.')

  const target = await payload
    .findByID({ collection: 'members', id: targetId, overrideAccess: true, depth: 0 })
    .catch(() => null)
  if (!target || target.accountStatus === 'suspended') throw new HttpError(404, 'This member is no longer available.')

  const existing = await payload.find({
    collection: 'contact-requests',
    where: {
      and: [
        { requestedBy: { equals: member.id } },
        { targetMember: { equals: targetId } },
        { status: { not_equals: 'declined' } },
      ],
    },
    overrideAccess: true,
    limit: 1,
    depth: 0,
  })
  if (existing.docs[0]) {
    throw new HttpError(409, `You’ve already requested ${target.fullName}’s contact. Track it in Requests.`)
  }

  const doc = await payload.create({
    collection: 'contact-requests',
    user: member,
    overrideAccess: false,
    data: {
      requestedBy: member.id,
      targetMember: targetId,
      post: input.postId ? Number(input.postId) : undefined,
      agendaNote: input.agendaNote,
      status: 'pending',
    },
  })
  return ok({ id: doc.id }, { status: 201 })
})
