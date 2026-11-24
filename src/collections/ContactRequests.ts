import type { CollectionConfig } from 'payload'
import { adminFieldOnly, adminsOnly, adminsOrMembers, adminsOrOwner, isMemberUser } from '@/access'
import { CONTACT_REQUEST_STATUSES } from '@/lib/constants'

/**
 * Consent-based introductions. A member asks for a tagged member's contact;
 * MNI admin facilitates and moves the status to `contact_received`. Contact
 * details are only revealed to the requester after that point (server-side).
 */
export const ContactRequests: CollectionConfig = {
  slug: 'contact-requests',
  admin: { defaultColumns: ['requestedBy', 'targetMember', 'status', 'createdAt'] },
  access: {
    read: adminsOrOwner('requestedBy'),
    create: adminsOrMembers,
    update: adminsOnly, // member follow-ups go through /api/app/contact-requests/[id]/follow-up
    delete: adminsOnly,
  },
  defaultSort: '-createdAt',
  hooks: {
    beforeChange: [
      ({ req, data, operation }) => {
        if (operation === 'create' && isMemberUser(req) && req.user) {
          data.requestedBy = req.user.id
          data.status = 'pending'
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'requestedBy',
      type: 'relationship',
      relationTo: 'members',
      required: true,
      index: true,
      access: { update: adminFieldOnly },
    },
    { name: 'targetMember', type: 'relationship', relationTo: 'members', required: true, index: true },
    { name: 'post', type: 'relationship', relationTo: 'posts' },
    { name: 'agendaNote', type: 'textarea', maxLength: 1000 },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      index: true,
      options: CONTACT_REQUEST_STATUSES.map((s) => ({ label: s.label, value: s.value })),
      access: { create: adminFieldOnly, update: adminFieldOnly },
    },
    {
      name: 'adminNote',
      type: 'textarea',
      maxLength: 600,
      admin: { description: 'Optional message shown to the requesting member.' },
      access: { create: adminFieldOnly, update: adminFieldOnly },
    },
    {
      name: 'followUp',
      type: 'group',
      access: { create: adminFieldOnly, update: adminFieldOnly },
      fields: [
        { name: 'calledContact', type: 'checkbox' },
        { name: 'conversationTookPlace', type: 'checkbox' },
        { name: 'businessGenerated', type: 'checkbox' },
        {
          name: 'gaveBusiness',
          type: 'select',
          options: [
            { label: 'Gave business', value: 'gave' },
            { label: 'Did not give business', value: 'did_not_give' },
          ],
        },
        { name: 'remarks', type: 'textarea', maxLength: 1000 },
        { name: 'recordedAt', type: 'date' },
      ],
    },
  ],
}
