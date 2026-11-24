import type { CollectionAfterChangeHook, CollectionBeforeChangeHook } from 'payload'
import { EDITABLE_PROFILE_FIELDS, PROFILE_UPDATE_CATEGORY } from '@/lib/constants'

const relId = (value: unknown): string | number | undefined => {
  if (value && typeof value === 'object' && 'id' in value) return (value as { id: string | number }).id
  return (value as string | number | undefined) ?? undefined
}

/**
 * When an admin approves a Profile Update, apply the allow-listed fields to the
 * member. Runs *before* the submission is saved: if the member update fails
 * validation, the approval is rejected too, so the two never drift apart.
 */
export const applyApprovedProfileUpdate: CollectionBeforeChangeHook = async ({ data, originalDoc, req, operation }) => {
  if (operation !== 'update') return data
  const doc = { ...originalDoc, ...data }
  if (doc.category !== PROFILE_UPDATE_CATEGORY) return data
  if (doc.status !== 'approved' || originalDoc?.status === 'approved') return data

  const memberId = relId(doc.submittedBy)
  const proposed = (doc.profileChanges ?? {}) as Record<string, unknown>
  if (!memberId || typeof proposed !== 'object') return data

  const changes: Record<string, unknown> = {}
  for (const key of EDITABLE_PROFILE_FIELDS) {
    if (!(key in proposed)) continue
    const value = proposed[key]
    // Empty strings mean "cleared"; selects reject '' so store null instead.
    changes[key] = value === '' ? null : value
  }
  if (Object.keys(changes).length === 0) return data

  await req.payload.update({ collection: 'members', id: memberId, data: changes, overrideAccess: true, req })
  return data
}

/** When an admin marks a requirement as Published, create the timeline post once. */
export const publishApprovedSubmission: CollectionAfterChangeHook = async ({ doc, previousDoc, req, operation }) => {
  if (operation !== 'update') return doc
  if (doc.category === PROFILE_UPDATE_CATEGORY) return doc
  if (doc.status !== 'published' || previousDoc?.status === 'published' || doc.associatedPost) return doc

  const imageId = relId(doc.supportingImage)
  const post = await req.payload.create({
    collection: 'posts',
    overrideAccess: true,
    req,
    data: {
      title: doc.title,
      postType: imageId ? 'image_text' : 'text_only',
      category: doc.category === 'Business Opportunity' ? 'Opportunity' : doc.category === 'Offer / Announcement' ? 'Announcement' : 'Requirement',
      badgeText: 'Member requirement',
      content: doc.description,
      image: imageId as never,
      taggedMember: relId(doc.submittedBy) as never,
      sourceSubmission: doc.id,
      isPublished: true,
      publishedAt: new Date().toISOString(),
    },
  })

  await req.payload.update({
    collection: 'submissions',
    id: doc.id,
    data: { associatedPost: post.id },
    overrideAccess: true,
    req,
    context: { skipHooks: true },
  })
  return { ...doc, associatedPost: post.id }
}
