import { z } from 'zod'
import { EDITABLE_PROFILE_FIELDS, PROFILE_UPDATE_CATEGORY } from '@/lib/constants'
import { assertSameOrigin, handler, HttpError, ok, parseJson, requireApiAdmin } from '@/lib/http'

const patchSubmissionSchema = z.object({
  id: z.number(),
  action: z.enum(['approve', 'publish_to_feed', 'changes_requested', 'reject', 'apply_profile']),
  adminFeedback: z.string().trim().max(600).optional(),
})

export const PATCH = handler(async (req) => {
  assertSameOrigin(req)
  const { payload } = await requireApiAdmin(req)
  const { id, action, adminFeedback } = await parseJson(req, patchSubmissionSchema)

  const sub = await payload.findByID({
    collection: 'submissions',
    id,
    overrideAccess: true,
    depth: 1,
  })
  if (!sub) throw new HttpError(404, 'Submission not found')

  const submitterId = typeof sub.submittedBy === 'object' ? sub.submittedBy.id : sub.submittedBy

  if (action === 'apply_profile') {
    if (sub.category !== PROFILE_UPDATE_CATEGORY) {
      throw new HttpError(400, 'Not a profile update submission')
    }
    let proposed: Record<string, string> = {}
    try {
      proposed = JSON.parse(sub.description)
    } catch {
      throw new HttpError(400, 'Invalid profile update payload')
    }

    const safeUpdates: Record<string, string> = {}
    for (const key of EDITABLE_PROFILE_FIELDS) {
      if (typeof proposed[key] === 'string') {
        safeUpdates[key] = proposed[key]
      }
    }

    if (Object.keys(safeUpdates).length > 0) {
      await payload.update({
        collection: 'members',
        id: submitterId,
        overrideAccess: true,
        data: safeUpdates,
      })
    }

    const updated = await payload.update({
      collection: 'submissions',
      id,
      overrideAccess: true,
      data: {
        status: 'approved',
        adminFeedback: adminFeedback || 'Profile changes approved and applied.',
      },
    })
    return ok({ ok: true, submission: updated })
  }

  if (action === 'publish_to_feed') {
    const categoryMap: Record<string, 'Opportunity' | 'Requirement' | 'Announcement' | 'Promotion'> = {
      'Business Requirement': 'Requirement',
      'Vendor / Supplier Needed': 'Requirement',
      'Business Opportunity': 'Opportunity',
      'Offer / Announcement': 'Promotion',
    }
    await payload.create({
      collection: 'posts',
      overrideAccess: true,
      data: {
        title: sub.title,
        category: categoryMap[sub.category] ?? 'Requirement',
        postType: sub.supportingImage ? 'image_text' : 'text_only',
        content: sub.description,
        image: typeof sub.supportingImage === 'object' ? sub.supportingImage?.id : sub.supportingImage ?? undefined,
        taggedMember: submitterId,
        isPublished: true,
        displayOrder: 50,
        publishedAt: new Date().toISOString(),
      },
    })

    const updated = await payload.update({
      collection: 'submissions',
      id,
      overrideAccess: true,
      data: {
        status: 'published',
        adminFeedback: adminFeedback || 'Published to the member timeline!',
      },
    })
    return ok({ ok: true, submission: updated })
  }

  const statusMap = {
    approve: 'approved' as const,
    changes_requested: 'changes_requested' as const,
    reject: 'rejected' as const,
  }

  const updated = await payload.update({
    collection: 'submissions',
    id,
    overrideAccess: true,
    data: {
      status: statusMap[action],
      ...(adminFeedback !== undefined ? { adminFeedback } : {}),
    },
  })

  return ok({ ok: true, submission: updated })
})
