import { assertSameOrigin, handler, HttpError, ok, parseJson, requireApiMember } from '@/lib/http'
import { PROFILE_UPDATE_CATEGORY } from '@/lib/constants'
import { submissionSchema } from '@/lib/schemas'
import { ownedMediaId } from '../../_media'

/** Revise & resubmit — only allowed when MNI has requested changes. */
export const PATCH = handler(async (req, { params }) => {
  assertSameOrigin(req)
  const { payload, member } = await requireApiMember(req)
  const { id } = await params
  const input = await parseJson(req, submissionSchema)

  const existing = await payload
    .findByID({ collection: 'submissions', id: Number(id), overrideAccess: true, depth: 0 })
    .catch(() => null)
  const owner = existing && (typeof existing.submittedBy === 'object' ? existing.submittedBy.id : existing.submittedBy)
  if (!existing || owner !== member.id || existing.category === PROFILE_UPDATE_CATEGORY) {
    throw new HttpError(404, 'Submission not found.')
  }
  if (existing.status !== 'changes_requested') {
    throw new HttpError(409, 'This submission can only be edited when MNI has requested changes.')
  }
  const imageId = await ownedMediaId(payload, member.id, input.supportingImageId)

  await payload.update({
    collection: 'submissions',
    id: existing.id,
    overrideAccess: true,
    data: {
      title: input.title,
      category: input.category,
      description: input.description,
      // undefined = keep the current image; null = remove it
      supportingImage: input.supportingImageId === undefined ? existing.supportingImage : imageId,
      status: 'pending',
      revision: (existing.revision ?? 1) + 1,
    },
  })
  return ok({ ok: true })
})
