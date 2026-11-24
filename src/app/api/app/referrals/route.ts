import { assertSameOrigin, handler, HttpError, ok, parseJson, requireApiMember } from '@/lib/http'
import { rateLimit } from '@/lib/rate-limit'
import { referralSchema } from '@/lib/schemas'

/** Introduce a candidate. Coins are credited only after MNI confirms them. */
export const POST = handler(async (req) => {
  assertSameOrigin(req)
  const { payload, member } = await requireApiMember(req)
  rateLimit(`referral:${member.id}`, 15, 60 * 60 * 1000)
  const input = await parseJson(req, referralSchema)

  if (input.candidateEmail === member.email) throw new HttpError(422, 'You can’t refer yourself.', { candidateEmail: 'Use the candidate’s email' })

  const [alreadyReferred, alreadyMember] = await Promise.all([
    payload.count({ collection: 'referrals', where: { candidateEmail: { equals: input.candidateEmail } }, overrideAccess: true }),
    payload.count({ collection: 'members', where: { email: { equals: input.candidateEmail } }, overrideAccess: true }),
  ])
  if (alreadyMember.totalDocs > 0) {
    throw new HttpError(409, 'This person is already an MNI member.', { candidateEmail: 'Already an MNI member' })
  }
  if (alreadyReferred.totalDocs > 0) {
    throw new HttpError(409, 'This person has already been referred to MNI.', { candidateEmail: 'Already referred' })
  }

  const doc = await payload.create({
    collection: 'referrals',
    user: member,
    overrideAccess: false,
    data: { ...input, referrer: member.id, status: 'pending_review' },
  })
  return ok({ id: doc.id }, { status: 201 })
})
