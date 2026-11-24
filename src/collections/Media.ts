import type { CollectionConfig } from 'payload'
import { adminsOnly, adminsOrMembers, isAdminUser } from '@/access'
import { ACCEPTED_IMAGE_TYPES } from '@/lib/constants'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    // Network content is private: only signed-in members/admins can load files.
    read: adminsOrMembers,
    // Members may upload a supporting image for their own submissions.
    create: adminsOrMembers,
    update: adminsOnly,
    delete: adminsOnly,
  },
  hooks: {
    beforeChange: [
      ({ req, data, operation }) => {
        if (operation === 'create' && req.user && !isAdminUser(req)) {
          data.uploadedBy = req.user.id
        }
        return data
      },
    ],
  },
  upload: {
    mimeTypes: [...ACCEPTED_IMAGE_TYPES],
    imageSizes: [
      { name: 'card', width: 960, withoutEnlargement: true },
      { name: 'thumb', width: 240, height: 240, position: 'centre' },
    ],
    adminThumbnail: 'thumb',
    filesRequiredOnCreate: true,
  },
  fields: [
    { name: 'alt', type: 'text', required: true, maxLength: 200 },
    {
      name: 'uploadedBy',
      type: 'relationship',
      relationTo: 'members',
      admin: { readOnly: true },
      access: { update: () => false },
    },
  ],
}
