import type { CollectionConfig } from 'payload'
import { adminsOnly, adminsOrPublished } from '@/access'
import { POST_CATEGORIES, POST_TYPES } from '@/lib/constants'

/** Admin-published timeline items. Members can read; never create. */
export const Posts: CollectionConfig = {
  slug: 'posts',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'postType', 'category', 'isPublished', 'publishedAt'],
  },
  access: {
    read: adminsOrPublished,
    create: adminsOnly,
    update: adminsOnly,
    delete: adminsOnly,
  },
  defaultSort: '-publishedAt',
  hooks: {
    beforeChange: [
      ({ data }) => {
        if (data.isPublished && !data.publishedAt) data.publishedAt = new Date().toISOString()
        return data
      },
    ],
  },
  fields: [
    { name: 'title', type: 'text', required: true, maxLength: 160 },
    {
      name: 'postType',
      type: 'select',
      required: true,
      defaultValue: 'image_text',
      options: POST_TYPES.map((t) => ({ label: t.label, value: t.value })),
    },
    {
      name: 'category',
      type: 'select',
      required: true,
      defaultValue: 'Opportunity',
      options: POST_CATEGORIES.map((c) => ({ label: c, value: c })),
    },
    { name: 'badgeText', type: 'text', maxLength: 40 },
    { name: 'content', type: 'textarea', maxLength: 4000 },
    { name: 'image', type: 'upload', relationTo: 'media' },
    {
      name: 'imageUrl',
      type: 'text',
      admin: { description: 'Optional external https image (used when no upload is set).' },
      validate: (value: string | null | undefined) =>
        !value || /^(https?:\/\/|data:image\/)/i.test(value) || 'Image URL must start with https:// or be an uploaded image',
    },
    { name: 'imageAlt', type: 'text', maxLength: 200 },
    { name: 'taggedMember', type: 'relationship', relationTo: 'members' },
    { name: 'sourceSubmission', type: 'relationship', relationTo: 'submissions', admin: { readOnly: true } },
    { name: 'publishedAt', type: 'date', index: true, admin: { date: { pickerAppearance: 'dayAndTime' } } },
    { name: 'isPublished', type: 'checkbox', defaultValue: true, index: true },
    { name: 'isArchived', type: 'checkbox', defaultValue: false, index: true },
    { name: 'displayOrder', type: 'number', defaultValue: 0 },
  ],
}
