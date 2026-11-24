import type { CollectionConfig } from 'payload'
import { adminFieldOnly, adminsOnly, adminsOrMembers, adminsOrOwner, isMemberUser } from '@/access'
import { PROFILE_UPDATE_CATEGORY, SUBMISSION_CATEGORIES, SUBMISSION_STATUSES } from '@/lib/constants'
import { applyApprovedProfileUpdate, publishApprovedSubmission } from '@/hooks/submissions'

/**
 * Member → MNI submissions. Two kinds:
 *  1. Business requirements / opportunities — admin may publish them as a post.
 *  2. Profile updates — proposed profile changes, applied only on admin approval.
 *
 * Members can create and read their own; only admins change status.
 */
export const Submissions: CollectionConfig = {
  slug: 'submissions',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'status', 'submittedBy', 'createdAt'],
  },
  access: {
    read: adminsOrOwner('submittedBy'),
    create: adminsOrMembers,
    update: adminsOnly, // member revisions go through /api/app/submissions/[id]
    delete: adminsOnly,
  },
  defaultSort: '-createdAt',
  hooks: {
    beforeChange: [
      ({ req, data, operation }) => {
        if (operation === 'create' && isMemberUser(req) && req.user) {
          data.submittedBy = req.user.id
          data.status = 'pending'
        }
        return data
      },
      applyApprovedProfileUpdate,
    ],
    afterChange: [publishApprovedSubmission],
  },
  fields: [
    { name: 'title', type: 'text', required: true, minLength: 5, maxLength: 160 },
    {
      name: 'category',
      type: 'select',
      required: true,
      defaultValue: 'Business Requirement',
      options: [...SUBMISSION_CATEGORIES, PROFILE_UPDATE_CATEGORY].map((c) => ({ label: c, value: c })),
      index: true,
    },
    { name: 'description', type: 'textarea', required: true, minLength: 20, maxLength: 4000 },
    {
      name: 'profileChanges',
      type: 'json',
      admin: {
        description: 'Proposed profile values (Profile Update only). Applied to the member on approval.',
        condition: (data) => data?.category === PROFILE_UPDATE_CATEGORY,
      },
    },
    { name: 'supportingImage', type: 'upload', relationTo: 'media' },
    {
      name: 'submittedBy',
      type: 'relationship',
      relationTo: 'members',
      required: true,
      index: true,
      access: { update: adminFieldOnly },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      index: true,
      options: SUBMISSION_STATUSES.map((s) => ({ label: s.label, value: s.value })),
      access: { create: adminFieldOnly, update: adminFieldOnly },
    },
    {
      name: 'adminFeedback',
      type: 'textarea',
      maxLength: 1000,
      access: { create: adminFieldOnly, update: adminFieldOnly },
    },
    {
      name: 'associatedPost',
      type: 'relationship',
      relationTo: 'posts',
      access: { create: adminFieldOnly, update: adminFieldOnly },
    },
    {
      name: 'revision',
      type: 'number',
      defaultValue: 1,
      admin: { readOnly: true },
      access: { create: adminFieldOnly, update: adminFieldOnly },
    },
  ],
}
