import { assertSameOrigin, handler, HttpError, ok, parseJson, requireApiMember } from '@/lib/http'
import { EDITABLE_PROFILE_FIELDS, PROFILE_UPDATE_CATEGORY } from '@/lib/constants'
import { rateLimit } from '@/lib/rate-limit'
import { profileChangeSchema } from '@/lib/schemas'

const LABELS: Record<string, string> = {
  fullName: 'Full name', phone: 'Phone', city: 'City', businessName: 'Business name',
  businessCategory: 'Business category', websiteUrl: 'Website', whatWeDo: 'What we do',
  keyProductService: 'Key product or service', idealClient: 'Ideal client',
  opportunityLookingFor: 'Opportunity looking for', targetConnections: 'Target connections',
  preferredCallDay: 'Preferred call day', preferredCallTime: 'Preferred call time', additionalNotes: 'Additional notes',
}

/**
 * Propose profile changes. Nothing changes on the live profile until an MNI
 * admin approves — then `hooks/submissions.ts` applies the allow-listed fields.
 * A new proposal replaces any earlier one still awaiting review.
 */
export const POST = handler(async (req) => {
  assertSameOrigin(req)
  const { payload, member } = await requireApiMember(req)
  rateLimit(`profile:${member.id}`, 10, 60 * 60 * 1000)
  const input = await parseJson(req, profileChangeSchema)

  const changes: Record<string, string> = {}
  for (const key of EDITABLE_PROFILE_FIELDS) {
    const next = (input[key] ?? '') as string
    const current = ((member as unknown as Record<string, unknown>)[key] ?? '') as string
    if (next !== current) changes[key] = next // '' = clear the field (stored as null on approval)
  }
  if (Object.keys(changes).length === 0) throw new HttpError(422, 'You haven’t changed anything yet.')

  const description = Object.entries(changes)
    .map(([k, v]) => `• ${LABELS[k] ?? k}: ${v || '(cleared)'}`)
    .join('\n')
    .padEnd(20, ' ')

  const pending = await payload.find({
    collection: 'submissions',
    where: {
      and: [
        { submittedBy: { equals: member.id } },
        { category: { equals: PROFILE_UPDATE_CATEGORY } },
        { status: { in: ['pending', 'changes_requested'] } },
      ],
    },
    overrideAccess: true,
    limit: 1,
    depth: 0,
  })

  if (pending.docs[0]) {
    await payload.update({
      collection: 'submissions',
      id: pending.docs[0].id,
      overrideAccess: true,
      data: { description, profileChanges: changes, status: 'pending', revision: (pending.docs[0].revision ?? 1) + 1 },
    })
    return ok({ id: pending.docs[0].id, replaced: true })
  }

  const doc = await payload.create({
    collection: 'submissions',
    overrideAccess: true,
    data: {
      title: `Profile update — ${member.fullName}`,
      category: PROFILE_UPDATE_CATEGORY,
      description,
      profileChanges: changes,
      submittedBy: member.id,
      status: 'pending',
    },
  })
  return ok({ id: doc.id }, { status: 201 })
})

/** Withdraw a profile update that hasn't been reviewed yet. */
export const DELETE = handler(async (req) => {
  assertSameOrigin(req)
  const { payload, member } = await requireApiMember(req)
  await payload.delete({
    collection: 'submissions',
    where: {
      and: [
        { submittedBy: { equals: member.id } },
        { category: { equals: PROFILE_UPDATE_CATEGORY } },
        { status: { in: ['pending', 'changes_requested'] } },
      ],
    },
    overrideAccess: true,
  })
  return ok({ ok: true })
})
