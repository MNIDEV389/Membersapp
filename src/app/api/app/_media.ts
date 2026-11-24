import type { BasePayload } from 'payload'
import { HttpError } from '@/lib/http'

/** Ensure a media id (if given) exists and was uploaded by this member. */
export async function ownedMediaId(payload: BasePayload, memberId: number, mediaId: unknown) {
  if (mediaId == null || mediaId === '') return null
  const media = await payload
    .findByID({ collection: 'media', id: Number(mediaId), overrideAccess: true, depth: 0 })
    .catch(() => null)
  const owner = media && (typeof media.uploadedBy === 'object' ? media.uploadedBy?.id : media.uploadedBy)
  if (!media || owner !== memberId) throw new HttpError(422, 'The attached image could not be found. Please upload it again.')
  return media.id
}
